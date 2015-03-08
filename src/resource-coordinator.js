import {Loader} from 'aurelia-loader';
import {Container} from 'aurelia-dependency-injection';
import {Origin} from 'aurelia-metadata';
import {ViewEngine} from './view-engine';
import {ResourceRegistry} from './resource-registry';
import {ModuleAnalyzer} from './module-analyzer';

export class ResourceCoordinator {
  static inject(){ return [Loader, Container, ViewEngine, ResourceRegistry, ModuleAnalyzer]; }
	constructor(loader, container, viewEngine, appResources, moduleAnalyzer){
		this.loader = loader;
		this.container = container;
		this.viewEngine = viewEngine;
    this.appResources = appResources;
    this.moduleAnalyzer = moduleAnalyzer;
		viewEngine.resourceCoordinator = this;
	}

  importViewModelResource(moduleImport, moduleMember){
    return this.loader.loadModule(moduleImport).then(viewModelModule => {
      var normalizedId = Origin.get(viewModelModule).moduleId,
          resourceModule = this.moduleAnalyzer.analyze(normalizedId, viewModelModule, moduleMember);

      if(!resourceModule.mainResource){
        throw new Error(`No view model found in module "${moduleImport}".`);
      }

      resourceModule.analyze(this.container);

      return resourceModule.mainResource;
    });
  }

  importViewResources(moduleIds, names, resources, associatedModuleId){
    return this.loader.loadAllModules(moduleIds).then(imports => {
      return this.importResourcesFromModules(imports, names, resources, associatedModuleId);
    });
  }

  importResourcesFromModules(imports, names, resources, associatedModuleId){
    var i, ii, analysis, normalizedId, current, associatedModule,
        container = this.container,
        moduleAnalyzer = this.moduleAnalyzer,
        allAnalysis = new Array(imports.length),
        loads = new Array(imports.length);

    for(i = 0, ii = imports.length; i < ii; ++i){
      current = imports[i];
      normalizedId = Origin.get(current).moduleId;

      analysis = moduleAnalyzer.analyze(normalizedId, current);
      analysis.analyze(container);
      analysis.register(resources, names[i]);

      allAnalysis[i] = analysis;
    }

    if(associatedModuleId){
      associatedModule = moduleAnalyzer.getAnalysis(associatedModuleId);

      if(associatedModule){
        associatedModule.register(resources);
      }
    }

    for(i = 0, ii = allAnalysis.length; i < ii; ++i){
      loads[i] = allAnalysis[i].load(container);
    }

    return Promise.all(loads).then(() => resources);
  }
}
