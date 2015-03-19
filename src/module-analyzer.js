import {Metadata, ResourceType} from 'aurelia-metadata';
import {TemplateRegistryEntry} from 'aurelia-loader';
import {ValueConverter} from 'aurelia-binding';
import {CustomElement} from './custom-element';
import {AttachedBehavior} from './attached-behavior';
import {TemplateController} from './template-controller';
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

      if('analyze' in metadata && !metadata.isAnalyzed){
        metadata.isAnalyzed = true;
        metadata.analyze(container, current.value);
      }
    }

    for(i = 0, ii = resources.length; i < ii; ++i){
      current = resources[i];
      metadata = current.metadata;
      metadata.viewStrategy = viewStrategy;

      if('analyze' in metadata && !metadata.isAnalyzed){
        metadata.isAnalyzed = true;
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
    var current = this.mainResource,
        resources = this.resources,
        i, ii, metadata, loads;

    if(this.isLoaded){
      return Promise.resolve();
    }

    this.isLoaded = true;
    loads = [];

    if(current){
      metadata = current.metadata;

      if('load' in metadata && !metadata.isLoaded){
        metadata.isLoaded = true;
        loads.push(metadata.load(container, current.value));
      }
    }

    for(i = 0, ii = resources.length; i < ii; ++i){
      current = resources[i];
      metadata = current.metadata;

      if('load' in metadata && !metadata.isLoaded){
        metadata.isLoaded = true;
        loads.push(metadata.load(container, current.value));
      }
    }

    return Promise.all(loads);
  }
}

class ResourceDescription {
  constructor(key, exportedValue, allMetadata, resourceTypeMeta){
    if(!resourceTypeMeta){
      if(!allMetadata){
        allMetadata = Metadata.on(exportedValue);
      }

      resourceTypeMeta = allMetadata.first(ResourceType);

      if(!resourceTypeMeta){
        resourceTypeMeta = new CustomElement(hyphenate(key));
        allMetadata.add(resourceTypeMeta);
      }
    }

    if(!resourceTypeMeta.name){
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
    var mainResource, fallbackValue, fallbackKey, fallbackMetadata, resourceTypeMeta, key, allMetadata,
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

      allMetadata = Metadata.on(exportedValue);
      resourceTypeMeta = allMetadata.first(ResourceType);

      if(resourceTypeMeta){
        if(!mainResource && resourceTypeMeta instanceof CustomElement){
          mainResource = new ResourceDescription(key, exportedValue, allMetadata, resourceTypeMeta);
        }else{
          resources.push(new ResourceDescription(key, exportedValue, allMetadata, resourceTypeMeta));
        }
      } else if(exportedValue instanceof ViewStrategy){
        viewStrategy = exportedValue;
      } else if(exportedValue instanceof TemplateRegistryEntry){
        viewStrategy = new TemplateRegistryViewStrategy(moduleId, exportedValue);
      } else {
        if(conventional = CustomElement.convention(key)){
          if(!mainResource){
            mainResource = new ResourceDescription(key, exportedValue, allMetadata, conventional);
          }else{
            resources.push(new ResourceDescription(key, exportedValue, allMetadata, conventional));
          }

          allMetadata.add(conventional);
        } else if(conventional = AttachedBehavior.convention(key)){
          resources.push(new ResourceDescription(key, exportedValue, allMetadata, conventional));
          allMetadata.add(conventional);
        } else if(conventional = TemplateController.convention(key)){
          resources.push(new ResourceDescription(key, exportedValue, allMetadata, conventional));
          allMetadata.add(conventional);
        } else if(conventional = ValueConverter.convention(key)) {
          resources.push(new ResourceDescription(key, exportedValue, allMetadata, conventional));
          allMetadata.add(conventional);
        } else if(!fallbackValue){
          fallbackValue = exportedValue;
          fallbackKey = key;
          fallbackMetadata = allMetadata;
        }
      }
    }

    if(!mainResource && fallbackValue){
      mainResource = new ResourceDescription(fallbackKey, fallbackValue, fallbackMetadata);
    }

    resourceModule.moduleInstance = moduleInstance;
    resourceModule.mainResource = mainResource;
    resourceModule.resources = resources;
    resourceModule.viewStrategy = viewStrategy;

    return resourceModule;
  }
}
