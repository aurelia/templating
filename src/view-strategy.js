import {Metadata, Origin} from 'aurelia-metadata';
import {relativeToFile} from 'aurelia-path';

export class ViewStrategy {
  makeRelativeTo(baseUrl){}
  
  loadViewFactory(viewEngine, options){
    throw new Error('A ViewStrategy must implement loadViewFactory(viewEngine, options).');
  }

  static normalize(value){
    if(typeof value === 'string'){
      value = new UseView(value);
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
    strategy = Metadata.on(target).first(ViewStrategy);
    
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
    if(!this.absolutePath && this.moduleId){
      this.absolutePath = relativeToFile(this.path, this.moduleId);
    }

		return viewEngine.loadViewFactory(this.absolutePath || this.path, options, this.moduleId);
	}

  makeRelativeTo(file){
    this.absolutePath = relativeToFile(this.path, file);
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