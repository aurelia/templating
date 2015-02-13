import {Loader} from 'aurelia-loader';
import {relativeToFile, join} from 'aurelia-path';
import {Container} from 'aurelia-dependency-injection';
import {Metadata, ResourceType, Origin} from 'aurelia-metadata';
import {ValueConverter} from 'aurelia-binding';
import {CustomElement} from './custom-element';
import {AttachedBehavior} from './attached-behavior';
import {TemplateController} from './template-controller';
import {ViewEngine} from './view-engine';
import {ResourceRegistry} from './resource-registry';

var id = 0;

function nextId(){
  return ++id;
}

export class ResourceCoordinator {
  static inject(){ return [Loader, Container, ViewEngine, ResourceRegistry]; }
	constructor(loader, container, viewEngine, appResources){
		this.loader = loader;
		this.container = container;
		this.viewEngine = viewEngine;
		this.importedModules = {};
    this.importedAnonymous = {};
    this.appResources = appResources;
		viewEngine.resourceCoordinator = this;
	}

  getExistingModuleAnalysis(id){
    return this.importedModules[id] || this.importedAnonymous[id];
  }

  loadViewModelInfo(moduleImport, moduleMember){
    return this._loadAndAnalyzeModuleForElement(moduleImport, moduleMember, this.importedAnonymous, true);
  }

  loadElement(moduleImport, moduleMember, viewStategy){
    return this._loadAndAnalyzeModuleForElement(moduleImport, moduleMember, this.importedModules, false).then(info => {
      var type = info.type;

      if(type.isLoaded){
        return type;
      }

      type.isLoaded = true;

      return type.load(this.container, info.value, viewStategy);
    });
  }

  _loadAndAnalyzeModuleForElement(moduleImport, moduleMember, cache, skipCacheLookup){
    var existing = !skipCacheLookup && cache[moduleImport];

    if(existing){
      return Promise.resolve(existing.element);
    }

    return this.loader.loadModule(moduleImport).then(elementModule => {
      var analysis = analyzeModule(elementModule, moduleMember),
          resources = analysis.resources,
          container = this.container,
          loads = [], type, current, i , ii;

      if(!analysis.element){
        throw new Error(`No element found in module "${moduleImport}".`);
      }

      analysis.analyze(container);

      for(i = 0, ii = resources.length; i < ii; ++i){
        current = resources[i];
        type = current.type;

        if(!type.isLoaded){
          type.isLoaded = true;
          loads.push(type.load(container, current.value));
        }
      }

      cache[analysis.id] = analysis;

      return Promise.all(loads).then(() => analysis.element);
    });
  }

  importResources(imports, resourceManifestUrl){
    var i, ii, current, annotation, existing,
        lookup = {},
        finalModules = [],
        importIds = [], analysis, type;

    var container = this.container;

    for(i = 0, ii = imports.length; i < ii; ++i){
      current = imports[i];
      annotation = Origin.get(current);

      if(!annotation){
        analysis = analyzeModule({'default':current});
        analysis.analyze(container);
        type = (analysis.element || analysis.resources[0]).type;

        if(resourceManifestUrl){
          annotation = new Origin(relativeToFile("./" + type.name, resourceManifestUrl));
        }else{
          annotation = new Origin(join(this.appResources.baseResourceUrl, type.name));
        }

        Origin.set(current, annotation);
      }

      existing = lookup[annotation.moduleId];

      if(!existing){
        existing = {};
        importIds.push(annotation.moduleId);
        finalModules.push(existing);
        lookup[annotation.moduleId] = existing;
      }

      existing[nextId()] = current;
    }

    return this.importResourcesFromModules(finalModules, importIds);
  }

  importResourcesFromModuleIds(importIds){
    return this.loader.loadAllModules(importIds).then(imports => {
      return this.importResourcesFromModules(imports, importIds);
    });
  }

  importResourcesFromModules(imports, importIds){
    var loads = [], i, ii, analysis, type, key, annotation,
                j, jj, resources, current,
                existing = this.importedModules,
                container = this.container,
                allAnalysis = new Array(imports.length);

    if(!importIds){
      importIds = new Array(imports.length);

      for(i = 0, ii = imports.length; i < ii; ++i){
        current = imports[i];

        for(key in current){
          type = current[key];
          annotation = Origin.get(type);
          if(annotation){
            importIds[i] = annotation.moduleId;
            break;
          }
        }
      }
    }

    for(i = 0, ii = imports.length; i < ii; ++i){
      analysis = existing[importIds[i]];

      if(analysis){
        allAnalysis[i] = analysis;
        continue;
      }

      analysis = analyzeModule(imports[i]);
      analysis.analyze(container);
      existing[analysis.id] = analysis;
      allAnalysis[i] = analysis;
      resources = analysis.resources;

      for(j = 0, jj = resources.length; j < jj; ++j){
        current = resources[j];
        type = current.type;

        if(!type.isLoaded){
          type.isLoaded = true;
          loads.push(type.load(container, current.value));
        }
      }

      if(analysis.element){
        type = analysis.element.type;

        if(!type.isLoaded){
          type.isLoaded = true;
          loads.push(type.load(container, analysis.element.value));
        }
      }
    }

    return Promise.all(loads).then(() => allAnalysis);
  }
}

class ResourceModule {
  constructor(source, element, resources){
    var i, ii, org;

    this.source = source;
    this.element = element;
    this.resources = resources;

    if(element){
      org = Origin.get(element.value);
    }else if(resources.length){
      org = Origin.get(resources[0].value);
    }else{
      org = Origin.get(source);
    }

    if(org){
      this.id = org.moduleId;
    }
  }

  analyze(container){
    var current = this.element,
        resources = this.resources,
        i, ii;

    if(current){
      if(!current.type.isAnalyzed){
        current.type.isAnalyzed = true;
        current.type.analyze(container, current.value);
      }
    }

    for(i = 0, ii = resources.length; i < ii; ++i){
      current = resources[i];

      if('analyze' in current.type && !current.type.isAnalyzed){
        current.type.isAnalyzed = true;
        current.type.analyze(container, current.value);
      }
    }
  }

  register(registry, name){
    var i, ii, resources = this.resources;

    if(this.element){
      this.element.type.register(registry, name);
      name = null;
    }

    for(i = 0, ii = resources.length; i < ii; ++i){
      resources[i].type.register(registry, name);
      name = null;
    }
  }
}

function analyzeModule(moduleInstance, viewModelMember){
  var viewModelType, fallback, annotation, key, meta,
      exportedValue, resources = [], name, conventional;

  if(typeof moduleInstance === 'function'){
    moduleInstance = {'default': moduleInstance};
  }

  if(viewModelMember){
    viewModelType = moduleInstance[viewModelMember];
  }

  for(key in moduleInstance){
    exportedValue = moduleInstance[key];

    if(key === viewModelMember || typeof exportedValue !== 'function'){
      continue;
    }

    meta = Metadata.on(exportedValue);
    annotation = meta.first(ResourceType);

    if(annotation){
      if(!viewModelType && annotation instanceof CustomElement){
        viewModelType = exportedValue;
      }else{
        resources.push({type:annotation,value:exportedValue});
      }
    } else {
      name = exportedValue.name;

      if(conventional = CustomElement.convention(name)){
        if(!viewModelType){
          meta.add(conventional);
          viewModelType = exportedValue;
        }else{
          resources.push({type:conventional,value:exportedValue});
        }
      } else if(conventional = AttachedBehavior.convention(name)){
        resources.push({type:conventional,value:exportedValue});
      } else if(conventional = TemplateController.convention(name)){
        resources.push({type:conventional,value:exportedValue});
      } else if(conventional = ValueConverter.convention(name)) {
        resources.push({type:conventional,value:exportedValue});
      } else if(!fallback){
        fallback = exportedValue;
      }
    }
  }

  viewModelType = viewModelType || fallback;

  return new ResourceModule(
    moduleInstance,
    viewModelType ? {
        value: viewModelType,
        type: Metadata.on(viewModelType).first(CustomElement) || new CustomElement()
      } : null,
    resources
    );
}
