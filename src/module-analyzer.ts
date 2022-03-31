import {metadata} from 'aurelia-metadata';
import {Container} from 'aurelia-dependency-injection';
import {TemplateRegistryEntry} from 'aurelia-loader';
import {ValueConverterResource, BindingBehaviorResource} from 'aurelia-binding';
import {ViewEngineHooksResource} from './view-engine-hooks-resource';
import {HtmlBehaviorResource} from './html-behavior';
import {viewStrategy, TemplateRegistryViewStrategy, ViewStrategy} from './view-strategy';
import {ViewResources} from './view-resources';
import {ResourceLoadContext} from './instructions';
import {_hyphenate} from './util';
import { ViewResourceType } from './type-extension';

/**
* Represents a module with view resources.
*/
export class ResourceModule {

  /** @internal */
  private id: string;

  /** @internal */
  moduleInstance: any;

  /** @internal */
  mainResource: any;

  /** @internal */
  resources: any;

  /** @internal */
  viewStrategy: ViewStrategy;

  /** @internal */
  private isInitialized: boolean;

  /** @internal */
  private onLoaded: any;

  /** @internal */
  private loadContext: any;

  /**
  * Creates an instance of ResourceModule.
  * @param moduleId The id of the module that contains view resources.
  */
  constructor(moduleId: string) {
    this.id = moduleId;
    this.moduleInstance = null;
    this.mainResource = null;
    this.resources = null;
    this.viewStrategy = null;
    this.isInitialized = false;
    this.onLoaded = null;
    this.loadContext = null;
  }

  /**
  * Initializes the resources within the module.
  * @param container The dependency injection container usable during resource initialization.
  */
  initialize(container: Container): void {
    let current = this.mainResource;
    let resources = this.resources;
    let vs = this.viewStrategy;

    if (this.isInitialized) {
      return;
    }

    this.isInitialized = true;

    if (current !== undefined) {
      current.metadata.viewStrategy = vs;
      current.initialize(container);
    }

    for (let i = 0, ii = resources.length; i < ii; ++i) {
      current = resources[i];
      current.metadata.viewStrategy = vs;
      current.initialize(container);
    }
  }

  /**
  * Registers the resources in the module with the view resources.
  * @param registry The registry of view resources to regiser within.
  * @param name The name to use in registering the default resource.
  */
  register(registry:ViewResources, name?:string): void {
    let main = this.mainResource;
    let resources = this.resources;

    if (main !== undefined) {
      main.register(registry, name);
      name = null;
    }

    for (let i = 0, ii = resources.length; i < ii; ++i) {
      resources[i].register(registry, name);
      name = null;
    }
  }

  /**
  * Loads any dependencies of the resources within this module.
  * @param container The DI container to use during dependency resolution.
  * @param loadContext The loading context used for loading all resources and dependencies.
  * @return A promise that resolves when all loading is complete.
  */
  load(container: Container, loadContext?: ResourceLoadContext): Promise<void> {
    if (this.onLoaded !== null) {
      //if it's trying to load the same thing again during the same load, this is a circular dep, so just resolve
      return this.loadContext === loadContext ? Promise.resolve() : this.onLoaded;
    }

    let main = this.mainResource;
    let resources = this.resources;
    let loads;

    if (main !== undefined) {
      loads = new Array(resources.length + 1);
      loads[0] = main.load(container, loadContext);
      for (let i = 0, ii = resources.length; i < ii; ++i) {
        loads[i + 1] = resources[i].load(container, loadContext);
      }
    } else {
      loads = new Array(resources.length);
      for (let i = 0, ii = resources.length; i < ii; ++i) {
        loads[i] = resources[i].load(container, loadContext);
      }
    }

    this.loadContext = loadContext;
    this.onLoaded = Promise.all(loads);
    return this.onLoaded;
  }
}

/**
* Represents a single view resource with a ResourceModule.
*/
export class ResourceDescription {

  /** @internal */
  metadata: ViewResourceType;

  /** @internal */
  value: any;

  /**
  * Creates an instance of ResourceDescription.
  * @param key The key that the resource was exported as.
  * @param exportedValue The exported resource.
  * @param resourceTypeMeta The metadata located on the resource.
  */
  constructor(key: string, exportedValue: any, resourceTypeMeta?: Object) {
    if (!resourceTypeMeta) {
      resourceTypeMeta = metadata.get(metadata.resource, exportedValue);

      if (!resourceTypeMeta) {
        resourceTypeMeta = new HtmlBehaviorResource();
        (resourceTypeMeta as HtmlBehaviorResource).elementName = _hyphenate(key);
        metadata.define(metadata.resource, resourceTypeMeta, exportedValue);
      }
    }

    if (resourceTypeMeta instanceof HtmlBehaviorResource) {
      if (resourceTypeMeta.elementName === undefined) {
        //customeElement()
        resourceTypeMeta.elementName = _hyphenate(key);
      } else if (resourceTypeMeta.attributeName === undefined) {
        //customAttribute()
        resourceTypeMeta.attributeName = _hyphenate(key);
      } else if (resourceTypeMeta.attributeName === null && resourceTypeMeta.elementName === null) {
        //no customeElement or customAttribute but behavior added by other metadata
        HtmlBehaviorResource.convention(key, resourceTypeMeta);
      }
    } else if (!(resourceTypeMeta as any).name) {
      (resourceTypeMeta as any).name = _hyphenate(key);
    }

    this.metadata = resourceTypeMeta as ViewResourceType;
    this.value = exportedValue;
  }

  /**
  * Initializes the resource.
  * @param container The dependency injection container usable during resource initialization.
  */
  initialize(container: Container): void {
    this.metadata.initialize(container, this.value);
  }

  /**
  * Registrers the resource with the view resources.
  * @param registry The registry of view resources to regiser within.
  * @param name The name to use in registering the resource.
  */
  register(registry: ViewResources, name?: string): void {
    this.metadata.register(registry, name);
  }

  /**
  * Loads any dependencies of the resource.
  * @param container The DI container to use during dependency resolution.
  * @param loadContext The loading context used for loading all resources and dependencies.
  * @return A promise that resolves when all loading is complete.
  */
  load(container: Container, loadContext?: ResourceLoadContext): Promise<void> | void {
    return (this.metadata as any).load(container, this.value, loadContext);
  }
}

/**
* Analyzes a module in order to discover the view resources that it exports.
*/
export class ModuleAnalyzer {
  /** @internal */
  private cache: Record<string, ResourceModule>;
  /**
  * Creates an instance of ModuleAnalyzer.
  */
  constructor() {
    this.cache = Object.create(null);
  }

  /**
  * Retrieves the ResourceModule analysis for a previously analyzed module.
  * @param moduleId The id of the module to lookup.
  * @return The ResouceModule if found, undefined otherwise.
  */
  getAnalysis(moduleId: string): ResourceModule {
    return this.cache[moduleId];
  }

  /**
  * Analyzes a module.
  * @param moduleId The id of the module to analyze.
  * @param moduleInstance The module instance to analyze.
  * @param mainResourceKey The name of the main resource.
  * @return The ResouceModule representing the analysis.
  */
  analyze(moduleId: string, moduleInstance: any, mainResourceKey?: string): ResourceModule {
    let mainResource: ResourceDescription;
    let fallbackValue;
    let fallbackKey;
    let resourceTypeMeta: ViewResourceType;
    let key: string;
    let exportedValue;
    let resources: ResourceDescription[] = [];
    let conventional: ViewResourceType;
    let vs: ViewStrategy;
    let resourceModule: ResourceModule;

    resourceModule = this.cache[moduleId];
    if (resourceModule) {
      return resourceModule;
    }

    resourceModule = new ResourceModule(moduleId);
    this.cache[moduleId] = resourceModule;

    if (typeof moduleInstance === 'function') {
      moduleInstance = {'default': moduleInstance};
    }

    if (mainResourceKey) {
      mainResource = new ResourceDescription(mainResourceKey, moduleInstance[mainResourceKey]);
    }

    for (key in moduleInstance) {
      exportedValue = moduleInstance[key];

      if (key === mainResourceKey || typeof exportedValue !== 'function') {
        continue;
      }

      // This is an unexpected behavior for inheritance as it will walk through the whole prototype chain
      // to look for metadata. Should be `getOwn` instead. Though it's subjected to a breaking changes change
      resourceTypeMeta = metadata.get(metadata.resource, exportedValue) as ViewResourceType;

      if (resourceTypeMeta) {
        if (resourceTypeMeta instanceof HtmlBehaviorResource) {
          // first used static resource
          ViewResources.convention(exportedValue, resourceTypeMeta);

          if (resourceTypeMeta.attributeName === null && resourceTypeMeta.elementName === null) {
            //no customeElement or customAttribute but behavior added by other metadata
            HtmlBehaviorResource.convention(key, resourceTypeMeta);
          }

          if (resourceTypeMeta.attributeName === null && resourceTypeMeta.elementName === null) {
            //no convention and no customeElement or customAttribute but behavior added by other metadata
            resourceTypeMeta.elementName = _hyphenate(key);
          }
        }

        if (!mainResource && resourceTypeMeta instanceof HtmlBehaviorResource && resourceTypeMeta.elementName !== null) {
          mainResource = new ResourceDescription(key, exportedValue, resourceTypeMeta);
        } else {
          resources.push(new ResourceDescription(key, exportedValue, resourceTypeMeta));
        }
      } else if (viewStrategy.decorates(exportedValue)) {
        vs = exportedValue;
      } else if (exportedValue instanceof TemplateRegistryEntry) {
        vs = new TemplateRegistryViewStrategy(moduleId, exportedValue);
      } else {
        if (conventional = ViewResources.convention(exportedValue)) {
          if ((conventional as HtmlBehaviorResource).elementName !== null && !mainResource) {
            mainResource = new ResourceDescription(key, exportedValue, conventional);
          } else {
            resources.push(new ResourceDescription(key, exportedValue, conventional));
          }
          metadata.define(metadata.resource, conventional, exportedValue);
        } else if (conventional = HtmlBehaviorResource.convention(key)) {
          if ((conventional as HtmlBehaviorResource).elementName !== null && !mainResource) {
            mainResource = new ResourceDescription(key, exportedValue, conventional);
          } else {
            resources.push(new ResourceDescription(key, exportedValue, conventional));
          }

          metadata.define(metadata.resource, conventional, exportedValue);
        } else if (conventional = ValueConverterResource.convention(key)
          || BindingBehaviorResource.convention(key)
          || ViewEngineHooksResource.convention(key)) {
          resources.push(new ResourceDescription(key, exportedValue, conventional));
          metadata.define(metadata.resource, conventional, exportedValue);
        } else if (!fallbackValue) {
          fallbackValue = exportedValue;
          fallbackKey = key;
        }
      }
    }

    if (!mainResource && fallbackValue) {
      mainResource = new ResourceDescription(fallbackKey, fallbackValue);
    }

    resourceModule.moduleInstance = moduleInstance;
    resourceModule.mainResource = mainResource;
    resourceModule.resources = resources;
    resourceModule.viewStrategy = vs;

    return resourceModule;
  }
}
