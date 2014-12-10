import {Loader} from 'aurelia-loader';
import {Container} from 'aurelia-dependency-injection';
import {getAnnotation, addAnnotation, ResourceType, Origin} from 'aurelia-metadata';
import {Filter} from 'aurelia-binding';
import {CustomElement} from './custom-element';
import {AttachedBehavior} from './attached-behavior';
import {TemplateController} from './template-controller';
import {ViewEngine} from './view-engine';
import {UseView} from './use-view';

export class ResourceCoordinator {
  static inject(){ return [Loader, Container, ViewEngine]; }
	constructor(loader, container, viewEngine){
		this.loader = loader;
		this.container = container;
		this.viewEngine = viewEngine;
		this.importedModules = {};
		viewEngine.resourceCoordinator = this;
	}

  _loadAndAnalyzeElementModule(moduleImport, moduleMember, persistAnalysis){
    return this.loader.loadModule(moduleImport).then(elementModule => {
      var analysis = analyzeModule(elementModule, moduleMember),
          resources = analysis.resources,
          container = this.container,
          loads = [], type, current, i , ii;

      if(!analysis.component){
        throw new Error(`No component found in module "${moduleImport}".`);
      }

      for(i = 0, ii = resources.length; i < ii; ++i){
        current = resources[i];
        type = current.type;

        if(!type.isLoaded){
          type.isLoaded = true;
          loads.push(type.load(container, current.value));
        }
      }

      if(persistAnalysis){
        this.importedModules[moduleImport] = analysis;
      }

      return Promise.all(loads).then(() => analysis.component);
    });
  }

  loadAnonymousElement(moduleImport, moduleMember, viewUrl){
    return this._loadAndAnalyzeElementModule(moduleImport, moduleMember).then(info => {
      var useView;

      if(viewUrl){
        useView = new UseView(viewUrl);
      }

      return CustomElement.anonymous(this.container, info.value, useView);
    });
  }

  loadElement(moduleImport, moduleMember, viewUrl){
    var existing = this.importedModules[moduleImport];

    if(existing){
      return Promise.resolve(existing.component.type);
    }

    return this._loadAndAnalyzeElementModule(moduleImport, moduleMember, true).then(info => {
      var type = info.type, useView;

      if(type.isLoaded){
        return type;
      }

      type.isLoaded = true;

      if(viewUrl){
      	useView = new UseView(viewUrl);
	    }

	    return type.load(this.container, info.value, useView);
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

      if(analysis.component){
        type = analysis.component.type;

        if(!type.isLoaded){
          type.isLoaded = true;
          loads.push(type.load(this.container, analysis.component.value));
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

        if(analysis.component){
          ready.push(analysis.component.type);
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

//TODO: I think we can remove this if we have the es6shim
if (!String.prototype.endsWith) {
  Object.defineProperty(String.prototype, 'endsWith', {
    value: function(searchString, position) {
      var subjectString = this.toString();
      if (position === undefined || position > subjectString.length) {
        position = subjectString.length;
      }
      position -= searchString.length;
      var lastIndex = subjectString.indexOf(searchString, position);
      return lastIndex !== -1 && lastIndex === position;
    }
  });
}

function analyzeModule(moduleInstance, componentMember){
  var behavior, component, fallback, annotation, key,
      exportedValue, resources = [], name, conventional;

  if(componentMember){
    behavior = moduleInstance[componentMember];
  }

  for(key in moduleInstance){
    exportedValue = moduleInstance[key];

    if(key === componentMember || typeof exportedValue !== 'function'){
      continue;
    }

    annotation = getAnnotation(exportedValue, ResourceType);
    if(annotation){
      if(!behavior && annotation instanceof CustomElement){
        behavior = exportedValue;
      }else{
        resources.push({type:annotation,value:exportedValue});
      }
    } else {
      name = exportedValue.name;

      if(conventional = CustomElement.convention(name)){
        if(!behavior){
          addAnnotation(exportedValue, conventional);
          behavior = exportedValue;
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

  behavior = behavior || fallback;

  return {
    source:moduleInstance,
    component: behavior ? {
      value: behavior,
      type: getAnnotation(behavior, CustomElement) || new CustomElement()
    } : null,
    resources:resources
  };
}