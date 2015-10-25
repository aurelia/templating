import {metadata} from 'aurelia-metadata';
import {Container} from 'aurelia-dependency-injection';
import {TemplateRegistryEntry} from 'aurelia-loader';
import {ValueConverterResource} from 'aurelia-binding';
import {BindingBehaviorResource} from 'aurelia-binding';
import {HtmlBehaviorResource} from './html-behavior';
import {ViewStrategy, TemplateRegistryViewStrategy} from './view-strategy';
import {ViewResources} from './view-resources';
import {ResourceLoadContext} from './instructions';
import {hyphenate} from './util';

export class ResourceModule {
  constructor(moduleId: string) {
    this.id = moduleId;
    this.moduleInstance = null;
    this.mainResource = null;
    this.resources = null;
    this.viewStrategy = null;
    this.isInitialized = false;
    this.onLoaded = null;
  }

  initialize(container: Container) {
    let current = this.mainResource;
    let resources = this.resources;
    let viewStrategy = this.viewStrategy;

    if (this.isInitialized) {
      return;
    }

    this.isInitialized = true;

    if (current !== undefined) {
      current.metadata.viewStrategy = viewStrategy;
      current.initialize(container);
    }

    for (let i = 0, ii = resources.length; i < ii; ++i) {
      current = resources[i];
      current.metadata.viewStrategy = viewStrategy;
      current.initialize(container);
    }
  }

  register(registry:ViewResources, name?:string) {
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

  load(container: Container, loadContext?: ResourceLoadContext): Promise<void> {
    if (this.onLoaded !== null) {
      return this.onLoaded;
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

    this.onLoaded = Promise.all(loads);
    return this.onLoaded;
  }
}

export class ResourceDescription {
  constructor(key: string, exportedValue: any, resourceTypeMeta: Object) {
    if (!resourceTypeMeta) {
      resourceTypeMeta = metadata.get(metadata.resource, exportedValue);

      if (!resourceTypeMeta) {
        resourceTypeMeta = new HtmlBehaviorResource();
        resourceTypeMeta.elementName = hyphenate(key);
        metadata.define(metadata.resource, resourceTypeMeta, exportedValue);
      }
    }

    if (resourceTypeMeta instanceof HtmlBehaviorResource) {
      if (resourceTypeMeta.elementName === undefined) {
        //customeElement()
        resourceTypeMeta.elementName = hyphenate(key);
      } else if (resourceTypeMeta.attributeName === undefined) {
        //customAttribute()
        resourceTypeMeta.attributeName = hyphenate(key);
      } else if (resourceTypeMeta.attributeName === null && resourceTypeMeta.elementName === null) {
        //no customeElement or customAttribute but behavior added by other metadata
        HtmlBehaviorResource.convention(key, resourceTypeMeta);
      }
    } else if (!resourceTypeMeta.name) {
      resourceTypeMeta.name = hyphenate(key);
    }

    this.metadata = resourceTypeMeta;
    this.value = exportedValue;
  }

  initialize(container: Container): void {
    this.metadata.initialize(container, this.value);
  }

  register(registry: ViewResources, name?: string): void {
    this.metadata.register(registry, name);
  }

  load(container: Container, loadContext?: ResourceLoadContext): Promise<void> | void {
    return this.metadata.load(container, this.value, null, null, loadContext);
  }
}

export class ModuleAnalyzer {
  constructor() {
    this.cache = {};
  }

  getAnalysis(moduleId: string): ResourceModule {
    return this.cache[moduleId];
  }

  analyze(moduleId: string, moduleInstance: any, viewModelMember?: string): ResourceModule {
    let mainResource;
    let fallbackValue;
    let fallbackKey;
    let resourceTypeMeta;
    let key;
    let exportedValue;
    let resources = [];
    let conventional;
    let viewStrategy;
    let resourceModule;

    resourceModule = this.cache[moduleId];
    if (resourceModule) {
      return resourceModule;
    }

    resourceModule = new ResourceModule(moduleId);
    this.cache[moduleId] = resourceModule;

    if (typeof moduleInstance === 'function') {
      moduleInstance = {'default': moduleInstance};
    }

    if (viewModelMember) {
      mainResource = new ResourceDescription(viewModelMember, moduleInstance[viewModelMember]);
    }

    for (key in moduleInstance) {
      exportedValue = moduleInstance[key];

      if (key === viewModelMember || typeof exportedValue !== 'function') {
        continue;
      }

      resourceTypeMeta = metadata.get(metadata.resource, exportedValue);

      if (resourceTypeMeta) {
        if (resourceTypeMeta.attributeName === null && resourceTypeMeta.elementName === null) {
          //no customeElement or customAttribute but behavior added by other metadata
          HtmlBehaviorResource.convention(key, resourceTypeMeta);
        }

        if (resourceTypeMeta.attributeName === null && resourceTypeMeta.elementName === null) {
          //no convention and no customeElement or customAttribute but behavior added by other metadata
          resourceTypeMeta.elementName = hyphenate(key);
        }

        if (!mainResource && resourceTypeMeta instanceof HtmlBehaviorResource && resourceTypeMeta.elementName !== null) {
          mainResource = new ResourceDescription(key, exportedValue, resourceTypeMeta);
        } else {
          resources.push(new ResourceDescription(key, exportedValue, resourceTypeMeta));
        }
      } else if (exportedValue instanceof ViewStrategy) {
        viewStrategy = exportedValue;
      } else if (exportedValue instanceof TemplateRegistryEntry) {
        viewStrategy = new TemplateRegistryViewStrategy(moduleId, exportedValue);
      } else {
        if (conventional = HtmlBehaviorResource.convention(key)) {
          if (conventional.elementName !== null && !mainResource) {
            mainResource = new ResourceDescription(key, exportedValue, conventional);
          } else {
            resources.push(new ResourceDescription(key, exportedValue, conventional));
          }

          metadata.define(metadata.resource, conventional, exportedValue);
        } else if (conventional = ValueConverterResource.convention(key)) {
          resources.push(new ResourceDescription(key, exportedValue, conventional));
          metadata.define(metadata.resource, conventional, exportedValue);
        } else if (conventional = BindingBehaviorResource.convention(key)) {
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
    resourceModule.viewStrategy = viewStrategy;

    return resourceModule;
  }
}
