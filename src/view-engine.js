import core from 'core-js';
import * as LogManager from 'aurelia-logging';
import {Origin} from 'aurelia-metadata';
import {Loader,TemplateRegistryEntry} from 'aurelia-loader';
import {Container} from 'aurelia-dependency-injection';
import {ViewCompiler} from './view-compiler';
import {ResourceRegistry, ViewResources} from './resource-registry';
import {ModuleAnalyzer, ResourceDescription} from './module-analyzer';
import {ViewFactory} from './view-factory';

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
  static inject() { return [Loader, Container, ViewCompiler, ModuleAnalyzer, ResourceRegistry]; }
  constructor(loader:Loader, container:Container, viewCompiler:ViewCompiler, moduleAnalyzer:ModuleAnalyzer, appResources:ResourceRegistry){
    this.loader = loader;
    this.container = container;
    this.viewCompiler = viewCompiler;
    this.moduleAnalyzer = moduleAnalyzer;
    this.appResources = appResources;
  }

  loadViewFactory(urlOrRegistryEntry:string|TemplateRegistryEntry, compileOptions?:Object, associatedModuleId?:string, loadContext?:string[]):Promise<ViewFactory>{
    loadContext = loadContext || [];

    return ensureRegistryEntry(this.loader, urlOrRegistryEntry).then(viewRegistryEntry => {
      if(viewRegistryEntry.onReady){
        if(loadContext.indexOf(urlOrRegistryEntry) === -1){
          loadContext.push(urlOrRegistryEntry);
          return viewRegistryEntry.onReady;
        }

        return Promise.resolve(new ProxyViewFactory(viewRegistryEntry.onReady));
      }

      loadContext.push(urlOrRegistryEntry);

      return viewRegistryEntry.onReady = this.loadTemplateResources(viewRegistryEntry, associatedModuleId, loadContext).then(resources => {
        viewRegistryEntry.setResources(resources);
        var viewFactory = this.viewCompiler.compile(viewRegistryEntry.template, resources, compileOptions);
        viewRegistryEntry.setFactory(viewFactory);
        return viewFactory;
      });
    });
  }

  loadTemplateResources(viewRegistryEntry:TemplateRegistryEntry, associatedModuleId?:string, loadContext?:string[]):Promise<ResourceRegistry>{
    var resources = new ViewResources(this.appResources, viewRegistryEntry.id),
        dependencies = viewRegistryEntry.dependencies,
        importIds, names;

    if(dependencies.length === 0 && !associatedModuleId){
      return Promise.resolve(resources);
    }

    importIds = dependencies.map(x => x.src);
    names = dependencies.map(x => x.name);
    logger.debug(`importing resources for ${viewRegistryEntry.id}`, importIds);

    return this.importViewResources(importIds, names, resources, associatedModuleId, loadContext);
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

  importViewResources(moduleIds:string[], names:string[], resources:ResourceRegistry, associatedModuleId?:string, loadContext?:string[]):Promise<ResourceRegistry>{
    loadContext = loadContext || [];

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

      if(associatedModuleId){
        associatedModule = moduleAnalyzer.getAnalysis(associatedModuleId);

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
}
