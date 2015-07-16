import {Metadata} from 'aurelia-metadata';
import {Container} from 'aurelia-dependency-injection';
import {TemplateRegistryEntry} from 'aurelia-loader';
import {ValueConverterResource} from 'aurelia-binding';
import {HtmlBehaviorResource} from './html-behavior';
import {ViewStrategy,TemplateRegistryViewStrategy} from './view-strategy';
import {ResourceRegistry} from './resource-registry';
import {hyphenate} from './util';

export class ResourceModule {
  constructor(moduleId:string){
    this.id = moduleId;
    this.moduleInstance = null;
    this.mainResource = null;
    this.resources = null;
    this.viewStrategy = null;
    this.isAnalyzed = false;
  }

  analyze(container:Container){
    var current = this.mainResource,
        resources = this.resources,
        viewStrategy = this.viewStrategy,
        i, ii;

    if(this.isAnalyzed){
      return;
    }

    this.isAnalyzed = true;

    if(current){
      current.metadata.viewStrategy = viewStrategy;
      current.analyze(container);
    }

    for(i = 0, ii = resources.length; i < ii; ++i){
      current = resources[i];
      current.metadata.viewStrategy = viewStrategy;
      current.analyze(container);
    }
  }

  register(registry:ResourceRegistry, name?:string){
    var i, ii, resources = this.resources;

    if(this.mainResource){
      this.mainResource.register(registry, name);
      name = null;
    }

    for(i = 0, ii = resources.length; i < ii; ++i){
      resources[i].register(registry, name);
      name = null;
    }
  }

  load(container:Container, loadContext?:string[]):Promise<void>{
    if(this.onLoaded){
      return this.onLoaded;
    }

    var current = this.mainResource,
        resources = this.resources,
        i, ii, loads = [];

    if(current){
      loads.push(current.load(container, loadContext));
    }

    for(i = 0, ii = resources.length; i < ii; ++i){
      loads.push(resources[i].load(container, loadContext));
    }

    this.onLoaded = Promise.all(loads);
    return this.onLoaded;
  }
}

export class ResourceDescription {
  constructor(key:string, exportedValue:any, resourceTypeMeta:Object){
    if(!resourceTypeMeta){
      resourceTypeMeta = Metadata.get(Metadata.resource, exportedValue);

      if(!resourceTypeMeta){
        resourceTypeMeta = new HtmlBehaviorResource();
        resourceTypeMeta.elementName = hyphenate(key);
        Metadata.define(Metadata.resource, resourceTypeMeta, exportedValue);
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

  analyze(container:Container){
    let metadata = this.metadata,
        value = this.value;

    if('analyze' in metadata){
      metadata.analyze(container, value);
    }
  }

  register(registry:ResourceRegistry, name?:string){
    this.metadata.register(registry, name);
  }

  load(container:Container, loadContext?:string[]):Promise<void>|void{
    let metadata = this.metadata,
        value = this.value;

    if('load' in metadata){
      return metadata.load(container, value, null, null, loadContext);
    }
  }

  static get(resource:any, key?:string='custom-resource'):ResourceDescription{
    var resourceTypeMeta = Metadata.get(Metadata.resource, resource),
        resourceDescription;

    if(resourceTypeMeta){
      if(resourceTypeMeta.attributeName === null && resourceTypeMeta.elementName === null){
        //no customeElement or customAttribute but behavior added by other metadata
        HtmlBehaviorResource.convention(key, resourceTypeMeta);
      }

      if(resourceTypeMeta.attributeName === null && resourceTypeMeta.elementName === null){
        //no convention and no customeElement or customAttribute but behavior added by other metadata
        resourceTypeMeta.elementName = hyphenate(key);
      }

      resourceDescription = new ResourceDescription(key, resource, resourceTypeMeta);
    } else {
      if(resourceTypeMeta = HtmlBehaviorResource.convention(key)){
        resourceDescription = new ResourceDescription(key, resource, resourceTypeMeta);
        Metadata.define(Metadata.resource, resourceTypeMeta, resource);
      } else if(resourceTypeMeta = ValueConverterResource.convention(key)) {
        resourceDescription = new ResourceDescription(key, resource, resourceTypeMeta);
        Metadata.define(Metadata.resource, resourceTypeMeta, resource);
      }
    }

    return resourceDescription;
  }
}

export class ModuleAnalyzer {
  constructor(){
    this.cache = {};
  }

  getAnalysis(moduleId:string):ResourceModule{
    return this.cache[moduleId];
  }

  analyze(moduleId:string, moduleInstance:any, viewModelMember?:string):ResourceModule{
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

          Metadata.define(Metadata.resource, conventional, exportedValue);
        } else if(conventional = ValueConverterResource.convention(key)) {
          resources.push(new ResourceDescription(key, exportedValue, conventional));
          Metadata.define(Metadata.resource, conventional, exportedValue);
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
