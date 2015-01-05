import {Loader} from 'aurelia-loader';
import {Container} from 'aurelia-dependency-injection';
import {getAnnotation, addAnnotation, ResourceType, Origin} from 'aurelia-metadata';
import {ValueConverter} from 'aurelia-binding';
import {CustomElement} from './custom-element';
import {AttachedBehavior} from './attached-behavior';
import {TemplateController} from './template-controller';
import {ViewEngine} from './view-engine';

var id = 0;

function nextId(){
  return ++id;
}

export class ResourceCoordinator {
  static inject(){ return [Loader, Container, ViewEngine]; }
	constructor(loader, container, viewEngine){
		this.loader = loader;
		this.container = container;
		this.viewEngine = viewEngine;
		this.importedModules = {};
    this.importedAnonymous = {};
		viewEngine.resourceCoordinator = this;
	}

  getExistingModuleAnalysis(id){
    return this.importedModules[id] || this.importedAnonymous[id];
  }

  loadViewModelType(moduleImport, moduleMember){
    return this._loadAndAnalyzeModuleForElement(moduleImport, moduleMember, this.importedAnonymous).then(info => info.value);
  }

  loadAnonymousElement(moduleImport, moduleMember, viewStategy){
    return this.loadViewModelType(moduleImport, moduleMember).then(viewModelType => {
      return CustomElement.anonymous(this.container, viewModelType, viewStategy);
    });
  }

  loadElement(moduleImport, moduleMember, viewStategy){
    return this._loadAndAnalyzeModuleForElement(moduleImport, moduleMember, this.importedModules).then(info => {
      var type = info.type;

      if(type.isLoaded){
        return type;
      }

      type.isLoaded = true;

      return type.load(this.container, info.value, viewStategy);
    });
  }

  _loadAndAnalyzeModuleForElement(moduleImport, moduleMember, cache){
    var existing = cache[moduleImport];

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

  importResources(imports){
    var i, ii, current, annotation, existing, 
        lookup = {},
        finalModules = [],
        importIds = [];

    for(i = 0, ii = imports.length; i < ii; ++i){
      current = imports[i];
      annotation = Origin.get(current);
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
    var i, ii;

    this.source = source;
    this.element = element;
    this.resources = resources;

    if(element){
      this.id = Origin.get(element.value).moduleId;
    }else if(resources.length){
      this.id = Origin.get(resources[0].value).moduleId;
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
  var viewModelType, fallback, annotation, key,
      exportedValue, resources = [], name, conventional;

  if(viewModelMember){
    viewModelType = moduleInstance[viewModelMember];
  }

  for(key in moduleInstance){
    exportedValue = moduleInstance[key];

    if(key === viewModelMember || typeof exportedValue !== 'function'){
      continue;
    }

    annotation = getAnnotation(exportedValue, ResourceType);
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
          addAnnotation(exportedValue, conventional);
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
        type: getAnnotation(viewModelType, CustomElement) || new CustomElement()
      } : null,
    resources
    );
}