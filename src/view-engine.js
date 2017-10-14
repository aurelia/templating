import * as LogManager from 'aurelia-logging';
import {Origin, metadata} from 'aurelia-metadata';
import {Loader, TemplateRegistryEntry} from 'aurelia-loader';
import {Container, inject} from 'aurelia-dependency-injection';
import {ViewCompiler} from './view-compiler';
import {ViewResources} from './view-resources';
import {ModuleAnalyzer, ResourceDescription} from './module-analyzer';
import {ViewFactory} from './view-factory';
import {ResourceLoadContext, ViewCompileInstruction} from './instructions';
import {SlotCustomAttribute} from './shadow-dom';
import {HtmlBehaviorResource} from './html-behavior';
import {relativeToFile} from 'aurelia-path';

let logger = LogManager.getLogger('templating');

function ensureRegistryEntry(loader, urlOrRegistryEntry) {
  if (urlOrRegistryEntry instanceof TemplateRegistryEntry) {
    return Promise.resolve(urlOrRegistryEntry);
  }

  return loader.loadTemplate(urlOrRegistryEntry);
}

class ProxyViewFactory {
  constructor(promise) {
    promise.then(x => this.viewFactory = x);
  }

  create(container: Container, bindingContext?: Object, createInstruction?: ViewCreateInstruction, element?: Element): View {
    return this.viewFactory.create(container, bindingContext, createInstruction, element);
  }

  get isCaching() {
    return this.viewFactory.isCaching;
  }

  setCacheSize(size: number | string, doNotOverrideIfAlreadySet: boolean): void {
    this.viewFactory.setCacheSize(size, doNotOverrideIfAlreadySet);
  }

  getCachedView(): View {
    return this.viewFactory.getCachedView();
  }

  returnViewToCache(view: View): void {
    this.viewFactory.returnViewToCache(view);
  }
}

let auSlotBehavior = null;

/**
* Controls the view resource loading pipeline.
*/
@inject(Loader, Container, ViewCompiler, ModuleAnalyzer, ViewResources)
export class ViewEngine {
  /**
  * The metadata key for storing requires declared in a ViewModel.
  */
  static viewModelRequireMetadataKey = 'aurelia:view-model-require';

  /**
  * Creates an instance of ViewEngine.
  * @param loader The module loader.
  * @param container The root DI container for the app.
  * @param viewCompiler The view compiler.
  * @param moduleAnalyzer The module analyzer.
  * @param appResources The app-level global resources.
  */
  constructor(loader: Loader, container: Container, viewCompiler: ViewCompiler, moduleAnalyzer: ModuleAnalyzer, appResources: ViewResources) {
    this.loader = loader;
    this.container = container;
    this.viewCompiler = viewCompiler;
    this.moduleAnalyzer = moduleAnalyzer;
    this.appResources = appResources;
    this._pluginMap = {};

    if (auSlotBehavior === null) {
      auSlotBehavior  = new HtmlBehaviorResource();
      auSlotBehavior.attributeName = 'au-slot';
      metadata.define(metadata.resource, auSlotBehavior, SlotCustomAttribute);
    }

    auSlotBehavior.initialize(container, SlotCustomAttribute);
    auSlotBehavior.register(appResources);
  }

  /**
  * Adds a resource plugin to the resource loading pipeline.
  * @param extension The file extension to match in require elements.
  * @param implementation The plugin implementation that handles the resource type.
  */
  addResourcePlugin(extension: string, implementation: Object): void {
    let name = extension.replace('.', '') + '-resource-plugin';
    this._pluginMap[extension] = name;
    this.loader.addPlugin(name, implementation);
  }

  /**
  * Loads and compiles a ViewFactory from a url or template registry entry.
  * @param urlOrRegistryEntry A url or template registry entry to generate the view factory for.
  * @param compileInstruction Instructions detailing how the factory should be compiled.
  * @param loadContext The load context if this factory load is happening within the context of a larger load operation.
  * @param target A class from which to extract metadata of additional resources to load.
  * @return A promise for the compiled view factory.
  */
  loadViewFactory(urlOrRegistryEntry: string|TemplateRegistryEntry, compileInstruction?: ViewCompileInstruction, loadContext?: ResourceLoadContext, target?: any): Promise<ViewFactory> {
    loadContext = loadContext || new ResourceLoadContext();

    return ensureRegistryEntry(this.loader, urlOrRegistryEntry).then(registryEntry => {
      const url = registryEntry.address;

      if (registryEntry.onReady) {
        if (!loadContext.hasDependency(url)) {
          loadContext.addDependency(url);
          return registryEntry.onReady;
        }

        if (registryEntry.template === null) {
          // handle NoViewStrategy:
          return registryEntry.onReady;
        }

        return Promise.resolve(new ProxyViewFactory(registryEntry.onReady));
      }

      loadContext.addDependency(url);

      registryEntry.onReady = this.loadTemplateResources(registryEntry, compileInstruction, loadContext, target).then(resources => {
        registryEntry.resources = resources;

        if (registryEntry.template === null) {
          // handle NoViewStrategy:
          return registryEntry.factory = null;
        }

        let viewFactory = this.viewCompiler.compile(registryEntry.template, resources, compileInstruction);
        return registryEntry.factory = viewFactory;
      });

      return registryEntry.onReady;
    });
  }

  /**
  * Loads all the resources specified by the registry entry.
  * @param registryEntry The template registry entry to load the resources for.
  * @param compileInstruction The compile instruction associated with the load.
  * @param loadContext The load context if this is happening within the context of a larger load operation.
  * @param target A class from which to extract metadata of additional resources to load.
  * @return A promise of ViewResources for the registry entry.
  */
  loadTemplateResources(registryEntry: TemplateRegistryEntry, compileInstruction?: ViewCompileInstruction, loadContext?: ResourceLoadContext, target?: any): Promise<ViewResources> {
    let resources = new ViewResources(this.appResources, registryEntry.address);
    let dependencies = registryEntry.dependencies;
    let importIds;
    let names;

    compileInstruction = compileInstruction || ViewCompileInstruction.normal;

    if (dependencies.length === 0 && !compileInstruction.associatedModuleId) {
      return Promise.resolve(resources);
    }

    importIds = dependencies.map(x => x.src);
    names = dependencies.map(x => x.name);
    logger.debug(`importing resources for ${registryEntry.address}`, importIds);

    if (target) {
      let viewModelRequires = metadata.get(ViewEngine.viewModelRequireMetadataKey, target);
      if (viewModelRequires) {
        let templateImportCount = importIds.length;
        for (let i = 0, ii = viewModelRequires.length; i < ii; ++i) {
          let req = viewModelRequires[i];
          let importId = typeof req === 'function' ? Origin.get(req).moduleId : relativeToFile(req.src || req, registryEntry.address);

          if (importIds.indexOf(importId) === -1) {
            importIds.push(importId);
            names.push(req.as);
          }
        }
        logger.debug(`importing ViewModel resources for ${compileInstruction.associatedModuleId}`, importIds.slice(templateImportCount));
      }
    }

    return this.importViewResources(importIds, names, resources, compileInstruction, loadContext);
  }

  /**
  * Loads a view model as a resource.
  * @param moduleImport The module to import.
  * @param moduleMember The export from the module to generate the resource for.
  * @return A promise for the ResourceDescription.
  */
  importViewModelResource(moduleImport: string, moduleMember: string): Promise<ResourceDescription> {
    return this.loader.loadModule(moduleImport).then(viewModelModule => {
      let normalizedId = Origin.get(viewModelModule).moduleId;
      let resourceModule = this.moduleAnalyzer.analyze(normalizedId, viewModelModule, moduleMember);

      if (!resourceModule.mainResource) {
        throw new Error(`No view model found in module "${moduleImport}".`);
      }

      resourceModule.initialize(this.container);

      return resourceModule.mainResource;
    });
  }

  /**
  * Imports the specified resources with the specified names into the view resources object.
  * @param moduleIds The modules to load.
  * @param names The names associated with resource modules to import.
  * @param resources The resources lookup to add the loaded resources to.
  * @param compileInstruction The compilation instruction associated with the resource imports.
  * @return A promise for the ViewResources.
  */
  importViewResources(moduleIds: string[], names: string[], resources: ViewResources, compileInstruction?: ViewCompileInstruction, loadContext?: ResourceLoadContext): Promise<ViewResources> {
    loadContext = loadContext || new ResourceLoadContext();
    compileInstruction = compileInstruction || ViewCompileInstruction.normal;

    moduleIds = moduleIds.map(x => this._applyLoaderPlugin(x));

    return this.loader.loadAllModules(moduleIds).then(imports => {
      let i;
      let ii;
      let analysis;
      let normalizedId;
      let current;
      let associatedModule;
      let container = this.container;
      let moduleAnalyzer = this.moduleAnalyzer;
      let allAnalysis = new Array(imports.length);

      //initialize and register all resources first
      //this enables circular references for global refs
      //and enables order independence
      for (i = 0, ii = imports.length; i < ii; ++i) {
        current = imports[i];
        normalizedId = Origin.get(current).moduleId;

        analysis = moduleAnalyzer.analyze(normalizedId, current);
        analysis.initialize(container);
        analysis.register(resources, names[i]);

        allAnalysis[i] = analysis;
      }

      if (compileInstruction.associatedModuleId) {
        associatedModule = moduleAnalyzer.getAnalysis(compileInstruction.associatedModuleId);

        if (associatedModule) {
          associatedModule.register(resources);
        }
      }

      //cause compile/load of any associated views second
      //as a result all globals have access to all other globals during compilation
      for (i = 0, ii = allAnalysis.length; i < ii; ++i) {
        allAnalysis[i] = allAnalysis[i].load(container, loadContext);
      }

      return Promise.all(allAnalysis).then(() => resources);
    });
  }

  _applyLoaderPlugin(id) {
    let index = id.lastIndexOf('.');
    if (index !== -1) {
      let ext = id.substring(index);
      let pluginName = this._pluginMap[ext];

      if (pluginName === undefined) {
        return id;
      }

      return this.loader.applyPluginToUrl(id, pluginName);
    }

    return id;
  }
}
