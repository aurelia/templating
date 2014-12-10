import * as LogManager from 'aurelia-logging';
import {Loader} from 'aurelia-loader';
import {normalize} from 'aurelia-path';
import {ViewCompiler} from './view-compiler';
import {ResourceRegistry, ViewResources} from './resource-registry';

var importSplitter = /\s*,\s*/,
    logger = LogManager.getLogger('templating');

export class ViewEngine {
  static inject() { return [Loader, ViewCompiler, ResourceRegistry]; }
	constructor(loader, viewCompiler, appResources){
		this.loader = loader;
		this.viewCompiler = viewCompiler;
    this.appResources = appResources;
    this.importedViews = {};
	}

	loadViewFactoryForModuleId(moduleId, options){
		var url = moduleId + '.html';
		return this.loadViewFactory(url, options);
	}

	loadViewFactory(url, options){
    var existing = this.importedViews[url];
    if(existing){
      return Promise.resolve(existing);
    }

    return this.loader.loadTemplate(url).then(template => {
      return this.loadTemplateResources(url, template).then(resources => {
        var viewFactory = this.viewCompiler.compile(template, resources, options);
        this.importedViews[url] = viewFactory;
        return viewFactory;
      });
    });
  }

  loadTemplateResources(templateUrl, template){
    var importIds, i, ii, j, jj, parts,
        dxImportAttribute = template.getAttribute('dx-import'),
        dxImportElements = template.content.querySelectorAll('dx-import');

    if(dxImportAttribute){
      importIds = dxImportAttribute.split(importSplitter);
    }else{
      importIds = [];
    }

    for(i = 0, ii = dxImportElements.length; i < ii; i++){
      parts = dxImportElements[i]
        .getAttribute('src').split(importSplitter);

      for(j = 0, jj = parts.length; j < jj; j++){
        importIds.push(parts[j]);
      }
    }

    if(!importIds.length){
      return Promise.resolve(this.appResources);
    }

    importIds = importIds.map(x => normalize(x, templateUrl));
    logger.debug(`importing resources for ${templateUrl}`, importIds);

    return this.resourceCoordinator.importResourcesFromModuleIds(importIds).then(toRegister => {
      var registry = new ViewResources(this.appResources);
      toRegister.forEach(x => x.register(registry));
      return registry;
    });
  }
}