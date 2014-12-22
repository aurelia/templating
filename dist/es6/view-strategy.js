import {getAnnotation, Origin} from 'aurelia-metadata';

export class ViewStrategy {
  loadViewFactory(viewEngine, options){
    throw new Error('A ViewStrategy must implement loadViewFactory(viewEngine, options).');
  }

  static getDefault(target){
    var strategy, annotation;

    if(typeof target !== 'function'){
      target = target.constructor;
    }

    strategy = getAnnotation(target, ViewStrategy);
    
    if(!strategy){
      annotation = Origin.get(target);

      if(!annotation){
        throw new Error('Cannot determinte default view strategy for object.', target);
      }

      strategy = new ConventionalView(annotation.moduleId);
    }

    return strategy;
  }
}

export class UseView extends ViewStrategy {
	constructor(path){
		this.path = path;
	}

	loadViewFactory(viewEngine, options){
		return viewEngine.loadViewFactory(this.path, options);
	}
}

export class ConventionalView extends ViewStrategy {
	constructor(moduleId){
		super();
		this.moduleId = moduleId;
	}

	loadViewFactory(viewEngine, options){
		return viewEngine.loadViewFactoryForModuleId(this.moduleId, options);
	}
}

export class NoView extends ViewStrategy {
	constructor(){
		super();
	}

	loadViewFactory(){
		return Promise.resolve(null);
	}
}