export class UseView {
	constructor(path){
		this.path = path;
	}

	loadViewFactory(viewEngine, options){
		return viewEngine.loadViewFactory(this.path, options);
	}
}

export class ConventionalView extends UseView {
	constructor(moduleId){
		super();
		this.moduleId = moduleId;
	}

	loadViewFactory(viewEngine, options){
		return viewEngine.loadViewFactoryForModuleId(this.moduleId, options);
	}
}

export class NoView extends UseView {
	constructor(){
		super();
	}

	loadViewFactory(){
		return Promise.resolve(null);
	}
}