import * as core from 'core-js';
import * as LogManager from 'aurelia-logging';
import {Origin} from 'aurelia-metadata';
import {Loader,TemplateRegistryEntry} from 'aurelia-loader';
import {Container} from 'aurelia-dependency-injection';
import {ViewCompiler} from './view-compiler';
import {ViewResources} from './view-resources';
import {ModuleAnalyzer, ResourceDescription} from './module-analyzer';
import {ViewFactory} from './view-factory';
import {ResourceLoadContext, ViewCompileInstruction} from './instructions';

var logger = LogManager.getLogger('templating');

function ensureRegistryEntry(loader, urlOrRegistryEntry){
  if(urlOrRegistryEntry instanceof TemplateRegistryEntry){
    return Promise.resolve(urlOrRegistryEntry);
  }

  return loader.loadTemplate(urlOrRegistryEntry);
}

class ProxyViewFactory {
  constructor(promise){
    promise.then(x => this.absorb(x));
  }

  absorb(factory){
    this.create = factory.create.bind(factory);
  }
}

export class ViewEngine {
  static inject() { return [Loader, Container, ViewCompiler, ModuleAnalyzer, ViewResources]; }
  constructor(loader:Loader, container:Container, viewCompiler:ViewCompiler, moduleAnalyzer:ModuleAnalyzer, appResources:ViewResources){
    this.loader = loader;
    this.container = container;
    this.viewCompiler = viewCompiler;
    this.moduleAnalyzer = moduleAnalyzer;
    this.appResources = appResources;
    this._pluginMap = {};
  }

  addResourcePlugin(extension: string, implementation: string){
     let name = extension.replace('.', '') + '-resource-plugin';
     this._pluginMap[extension] = name;
     this.loader.addPlugin(name, implementation);
  }

  enhance(container:Container, element:Element, resources:ViewResources, bindingContext?:Object):View{
    let instructions = {};
    this.viewCompiler.compileNode(element, resources, instructions, element.parentNode, 'root', true);

    let factory = new ViewFactory(element, instructions, resources);
    return factory.create(container, bindingContext, { enhance:true });
  }

  loadViewFactory(urlOrRegistryEntry:string|TemplateRegistryEntry, compileInstruction?:ViewCompileInstruction, loadContext?:ResourceLoadContext):Promise<ViewFactory>{
    loadContext = loadContext || new ResourceLoadContext();

    return ensureRegistryEntry(this.loader, urlOrRegistryEntry).then(viewRegistryEntry => {
      if(viewRegistryEntry.onReady){
        if(loadContext.doesNotHaveDependency(urlOrRegistryEntry)){
          loadContext.addDependency(urlOrRegistryEntry);
          return viewRegistryEntry.onReady;
        }

        return Promise.resolve(new ProxyViewFactory(viewRegistryEntry.onReady));
      }

      loadContext.addDependency(urlOrRegistryEntry);

      return viewRegistryEntry.onReady = this.loadTemplateResources(viewRegistryEntry, compileInstruction, loadContext).then(resources => {
        viewRegistryEntry.setResources(resources);
        var viewFactory = this.viewCompiler.compile(viewRegistryEntry.template, resources, compileInstruction);
        viewRegistryEntry.setFactory(viewFactory);
        return viewFactory;
      });
    });
  }

  loadTemplateResources(viewRegistryEntry:TemplateRegistryEntry, compileInstruction?:ViewCompileInstruction, loadContext?:ResourceLoadContext):Promise<ViewResources>{
    var resources = new ViewResources(this.appResources, viewRegistryEntry.address),
        dependencies = viewRegistryEntry.dependencies,
        importIds, names;

    compileInstruction = compileInstruction || ViewCompileInstruction.normal;

    if(dependencies.length === 0 && !compileInstruction.associatedModuleId){
      return Promise.resolve(resources);
    }

    importIds = dependencies.map(x => x.src);
    names = dependencies.map(x => x.name);
    logger.debug(`importing resources for ${viewRegistryEntry.address}`, importIds);

    return this.importViewResources(importIds, names, resources, compileInstruction, loadContext);
  }

  importViewModelResource(moduleImport:string, moduleMember:string):Promise<ResourceDescription>{
    return this.loader.loadModule(moduleImport).then(viewModelModule => {
      var normalizedId = Origin.get(viewModelModule).moduleId,
          resourceModule = this.moduleAnalyzer.analyze(normalizedId, viewModelModule, moduleMember);

      if(!resourceModule.mainResource){
        throw new Error(`No view model found in module "${moduleImport}".`);
      }

      resourceModule.analyze(this.container);

      return resourceModule.mainResource;
    });
  }

  importViewResources(moduleIds:string[], names:string[], resources:ViewResources, compileInstruction?:ViewCompileInstruction, loadContext?:ResourceLoadContext):Promise<ViewResources>{
    loadContext = loadContext || new ResourceLoadContext();
    compileInstruction = compileInstruction || ViewCompileInstruction.normal;

    moduleIds = moduleIds.map(x => this._applyLoaderPlugin(x));

    return this.loader.loadAllModules(moduleIds).then(imports => {
      var i, ii, analysis, normalizedId, current, associatedModule,
          container = this.container,
          moduleAnalyzer = this.moduleAnalyzer,
          allAnalysis = new Array(imports.length);

      //analyze and register all resources first
      //this enables circular references for global refs
      //and enables order independence
      for(i = 0, ii = imports.length; i < ii; ++i){
        current = imports[i];
        normalizedId = Origin.get(current).moduleId;

        analysis = moduleAnalyzer.analyze(normalizedId, current);
        analysis.analyze(container);
        analysis.register(resources, names[i]);

        allAnalysis[i] = analysis;
      }

      if(compileInstruction.associatedModuleId){
        associatedModule = moduleAnalyzer.getAnalysis(compileInstruction.associatedModuleId);

        if(associatedModule){
          associatedModule.register(resources);
        }
      }

      //cause compile/load of any associated views second
      //as a result all globals have access to all other globals during compilation
      for(i = 0, ii = allAnalysis.length; i < ii; ++i){
        allAnalysis[i] = allAnalysis[i].load(container, loadContext);
      }

      return Promise.all(allAnalysis).then(() => resources);
    });
  }

  _applyLoaderPlugin(id){
    let index = id.lastIndexOf('.');
    if(index !== -1){
      let ext = id.substring(index);
      let pluginName = this._pluginMap[ext];

      if(pluginName === undefined){
        return id;
      }

      return this.loader.applyPluginToUrl(id, pluginName);
    }

    return id;
  }
}
