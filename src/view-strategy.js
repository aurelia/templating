import {getAnnotation, Origin} from 'aurelia-metadata';

export class ViewStrategy {
  loadViewFactory(viewEngine, options){
    throw new Error('A ViewStrategy must implement loadViewFactory(viewEngine, options).');
  }

  static normalize(value, viewResources){
    if(typeof value === 'string'){
      value = new UseView(viewResources ? viewResources.relativeToView(value) : value);
    }

    if(value && !(value instanceof ViewStrategy)){
      throw new Error('The view must be a string or an instance of ViewStrategy.');
    }

    return value;
  }

  static getDefault(target){
    var strategy, annotation;

    if(typeof target !== 'function'){
      target = target.constructor;
    }

    annotation = Origin.get(target);
    strategy = getAnnotation(target, ViewStrategy);
    
    if(!strategy){
      if(!annotation){
        throw new Error('Cannot determinte default view strategy for object.', target);
      }

      strategy = new ConventionalView(annotation.moduleId);
    }else if(annotation){
      strategy.moduleId = annotation.moduleId;
    }

    return strategy;
  }
}

export class UseView extends ViewStrategy {
	constructor(path){
		this.path = path;
	}

	loadViewFactory(viewEngine, options){
		return viewEngine.loadViewFactory(this.path, options, this.moduleId);
	}
}

export class ConventionalView extends ViewStrategy {
	constructor(moduleId){
		this.moduleId = moduleId;
    this.viewUrl = ConventionalView.convertModuleIdToViewUrl(moduleId);
	}

	loadViewFactory(viewEngine, options){
		return viewEngine.loadViewFactory(this.viewUrl, options, this.moduleId);
	}

  static convertModuleIdToViewUrl(moduleId){
    return moduleId + '.html';
  }
}

export class NoView extends ViewStrategy {
	loadViewFactory(){
		return Promise.resolve(null);
	}
}