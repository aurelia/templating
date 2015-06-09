import {Metadata} from 'aurelia-metadata';
import {TemplateRegistryEntry} from 'aurelia-loader';
import {ValueConverterResource} from 'aurelia-binding';
import {HtmlBehaviorResource} from './html-behavior';
import {ViewStrategy,TemplateRegistryViewStrategy} from './view-strategy';
import {hyphenate} from './util';

class ResourceModule {
  constructor(moduleId){
    this.id = moduleId;
    this.moduleInstance = null;
    this.mainResource = null;
    this.resources = null;
    this.viewStrategy = null;
    this.isAnalyzed = false;
  }

  analyze(container){
    var current = this.mainResource,
        resources = this.resources,
        viewStrategy = this.viewStrategy,
        i, ii, metadata;

    if(this.isAnalyzed){
      return;
    }

    this.isAnalyzed = true;

    if(current){
      metadata = current.metadata;
      metadata.viewStrategy = viewStrategy;

      if('analyze' in metadata){
        metadata.analyze(container, current.value);
      }
    }

    for(i = 0, ii = resources.length; i < ii; ++i){
      current = resources[i];
      metadata = current.metadata;
      metadata.viewStrategy = viewStrategy;

      if('analyze' in metadata){
        metadata.analyze(container, current.value);
      }
    }
  }

  register(registry, name){
    var i, ii, resources = this.resources;

    if(this.mainResource){
      this.mainResource.metadata.register(registry, name);
      name = null;
    }

    for(i = 0, ii = resources.length; i < ii; ++i){
      resources[i].metadata.register(registry, name);
      name = null;
    }
  }

  load(container){
    if(this.onLoaded){
      return this.onLoaded;
    }

    var current = this.mainResource,
        resources = this.resources,
        i, ii, metadata, loads = [];

    if(current){
      metadata = current.metadata;

      if('load' in metadata){
        loads.push(metadata.load(container, current.value));
      }
    }

    for(i = 0, ii = resources.length; i < ii; ++i){
      current = resources[i];
      metadata = current.metadata;

      if('load' in metadata){
        loads.push(metadata.load(container, current.value));
      }
    }

    this.onLoaded = Promise.all(loads);
    return this.onLoaded;
  }
}

class ResourceDescription {
  constructor(key, exportedValue, resourceTypeMeta){
    if(!resourceTypeMeta){
      resourceTypeMeta = Metadata.get(Metadata.resource, exportedValue);

      if(!resourceTypeMeta){
        resourceTypeMeta = new HtmlBehaviorResource();
        resourceTypeMeta.elementName = hyphenate(key);
        Reflect.defineMetadata(Metadata.resource, resourceTypeMeta, exportedValue);
      }
    }

    if(resourceTypeMeta instanceof HtmlBehaviorResource){
      if(resourceTypeMeta.elementName === undefined){
        //customeElement()
        resourceTypeMeta.elementName = hyphenate(key);
      } else if(resourceTypeMeta.attributeName === undefined){
        //customAttribute()
        resourceTypeMeta.attributeName = hyphenate(key);
      } else if(resourceTypeMeta.attributeName === null && resourceTypeMeta.elementName === null){
        //no customeElement or customAttribute but behavior added by other metadata
        HtmlBehaviorResource.convention(key, resourceTypeMeta);
      }
    }else if(!resourceTypeMeta.name){
      resourceTypeMeta.name = hyphenate(key);
    }

    this.metadata = resourceTypeMeta;
    this.value = exportedValue;
  }
}

export class ModuleAnalyzer {
  constructor(){
    this.cache = {};
  }

  getAnalysis(moduleId){
    return this.cache[moduleId];
  }

  analyze(moduleId, moduleInstance, viewModelMember){
    var mainResource, fallbackValue, fallbackKey, resourceTypeMeta, key,
        exportedValue, resources = [], conventional, viewStrategy, resourceModule;

    resourceModule = this.cache[moduleId];
    if(resourceModule){
      return resourceModule;
    }

    resourceModule = new ResourceModule(moduleId);
    this.cache[moduleId] = resourceModule;

    if(typeof moduleInstance === 'function'){
      moduleInstance = {'default': moduleInstance};
    }

    if(viewModelMember){
      mainResource = new ResourceDescription(viewModelMember, moduleInstance[viewModelMember]);
    }

    for(key in moduleInstance){
      exportedValue = moduleInstance[key];

      if(key === viewModelMember || typeof exportedValue !== 'function'){
        continue;
      }

      resourceTypeMeta = Metadata.get(Metadata.resource, exportedValue);

      if(resourceTypeMeta){
        if(resourceTypeMeta.attributeName === null && resourceTypeMeta.elementName === null){
          //no customeElement or customAttribute but behavior added by other metadata
          HtmlBehaviorResource.convention(key, resourceTypeMeta);
        }

        if(resourceTypeMeta.attributeName === null && resourceTypeMeta.elementName === null){
          //no convention and no customeElement or customAttribute but behavior added by other metadata
          resourceTypeMeta.elementName = hyphenate(key);
        }

        if(!mainResource && resourceTypeMeta instanceof HtmlBehaviorResource && resourceTypeMeta.elementName !== null){
          mainResource = new ResourceDescription(key, exportedValue, resourceTypeMeta);
        }else{
          resources.push(new ResourceDescription(key, exportedValue, resourceTypeMeta));
        }
      } else if(exportedValue instanceof ViewStrategy){
        viewStrategy = exportedValue;
      } else if(exportedValue instanceof TemplateRegistryEntry){
        viewStrategy = new TemplateRegistryViewStrategy(moduleId, exportedValue);
      } else {
        if(conventional = HtmlBehaviorResource.convention(key)){
          if(conventional.elementName !== null && !mainResource){
            mainResource = new ResourceDescription(key, exportedValue, conventional);
          }else{
            resources.push(new ResourceDescription(key, exportedValue, conventional));
          }

          Reflect.defineMetadata(Metadata.resource, conventional, exportedValue);
        } else if(conventional = ValueConverterResource.convention(key)) {
          resources.push(new ResourceDescription(key, exportedValue, conventional));
          Reflect.defineMetadata(Metadata.resource, conventional, exportedValue);
        } else if(!fallbackValue){
          fallbackValue = exportedValue;
          fallbackKey = key;
        }
      }
    }

    if(!mainResource && fallbackValue){
      mainResource = new ResourceDescription(fallbackKey, fallbackValue);
    }

    resourceModule.moduleInstance = moduleInstance;
    resourceModule.mainResource = mainResource;
    resourceModule.resources = resources;
    resourceModule.viewStrategy = viewStrategy;

    return resourceModule;
  }
}
