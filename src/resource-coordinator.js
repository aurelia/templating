import {Loader} from 'aurelia-loader';
import {Container} from 'aurelia-dependency-injection';
import {getAnnotation, addAnnotation, ResourceType, Origin} from 'aurelia-metadata';
import {Filter} from 'aurelia-binding';
import {CustomElement} from './custom-element';
import {AttachedBehavior} from './attached-behavior';
import {TemplateController} from './template-controller';
import {ViewEngine} from './view-engine';

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

  _loadAndAnalyzeModule(moduleImport, moduleMember, cache){
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

      cache[moduleImport] = analysis;

      return Promise.all(loads).then(() => analysis.element);
    });
  }

  loadViewModelType(moduleImport, moduleMember){
    return this._loadAndAnalyzeModule(moduleImport, moduleMember, this.importedAnonymous).then(info => info.value);
  }

  loadAnonymousElement(moduleImport, moduleMember, viewStategy){
    return this.loadViewModelType(moduleImport, moduleMember).then(viewModelType => {
      return CustomElement.anonymous(this.container, viewModelType, viewStategy);
    });
  }

  loadElement(moduleImport, moduleMember, viewStategy){
    return this._loadAndAnalyzeModule(moduleImport, moduleMember, this.importedModules).then(info => {
      var type = info.type;

      if(type.isLoaded){
        return type;
      }

      type.isLoaded = true;

	    return type.load(this.container, info.value, viewStategy);
    });
  }

  importResources(imports, importIds){
    var i, ii;

    for(i = 0, ii = imports.length; i < ii; ++i){
      imports[i] = { 'default':imports[i] };
    }

    return this.importResourcesFromModules(imports, importIds);
  }

  importResourcesFromModules(imports, importIds){
    var loads = [], i, ii, analysis, type, key, annotation,
                j, jj, resources, current,
                existing = this.importedModules;

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
      analysis = analyzeModule(imports[i]);
      existing[importIds[i]] = analysis;
      resources = analysis.resources;

      for(j = 0, jj = resources.length; j < jj; ++j){
        current = resources[j];
        type = current.type;

        if(!type.isLoaded){
          type.isLoaded = true;
          loads.push(type.load(this.container, current.value));
        } else{
          loads.push(type);
        }
      }

      if(analysis.element){
        type = analysis.element.type;

        if(!type.isLoaded){
          type.isLoaded = true;
          loads.push(type.load(this.container, analysis.element.value));
        } else{
          loads.push(type);
        }
      }
    }

    return Promise.all(loads);
  }

	importResourcesFromModuleIds(importIds){
		var existing = this.importedModules, analysis, resources,
        toLoad = [], toLoadIds = [],
        ready = [],
        i, ii, j, jj, current;

    for(i = 0, ii = importIds.length; i < ii; ++i){
      current = importIds[i];
      analysis = existing[current];

      if(!analysis){
        toLoadIds.push(current);
        toLoad.push(current);
      }else{
        resources = analysis.resources;

        for(j = 0, jj = resources.length; j < jj; ++j){
          ready.push(resources[j].type);
        }

        if(analysis.element){
          ready.push(analysis.element.type);
        }
      }
    }

    if(toLoad.length === 0){
      return Promise.resolve(ready);
    }

    return this.loader.loadAllModules(toLoad).then(imports => {
      return this.importResourcesFromModules(imports, toLoadIds).then(resources => {
        return ready.concat(resources);
      });
    });
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
      } else if(conventional = Filter.convention(name)) {
        resources.push({type:conventional,value:exportedValue});
      } else if(!fallback){
        fallback = exportedValue;
      }
    }
  }

  viewModelType = viewModelType || fallback;

  return {
    source:moduleInstance,
    element: viewModelType ? {
      value: viewModelType,
      type: getAnnotation(viewModelType, CustomElement) || new CustomElement()
    } : null,
    resources:resources
  };
}