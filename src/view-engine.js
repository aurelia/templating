import * as LogManager from 'aurelia-logging';
import {Loader} from 'aurelia-loader';
import {relativeToFile} from 'aurelia-path';
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
    var importIds, names, i, ii, j, jj, parts, src, srcParts,
        registry = new ViewResources(this.appResources, templateUrl),
        dxImportElements = template.content.querySelectorAll('import');

    if(dxImportElements.length === 0){
      return Promise.resolve(registry);
    }

    importIds = [];
    names = [];

    for(i = 0, ii = dxImportElements.length; i < ii; ++i){
      src = dxImportElements[i].getAttribute('src');

      if(!src){
        throw new Error(`Import element in ${templateUrl} has no src attribute.`);
      }

      parts = src.split(importSplitter);

      for(j = 0, jj = parts.length; j < jj; ++j){
        srcParts = parts[j].split(' as ');
        importIds.push(srcParts[0]);
        names.push(srcParts.length == 2 ? srcParts[1] : null);
      }
    }

    if(importIds.length === 0){
      return Promise.resolve(registry);
    }

    importIds = importIds.map(x => relativeToFile(x, templateUrl));
    logger.debug(`importing resources for ${templateUrl}`, importIds);

    return this.resourceCoordinator.importResourcesFromModuleIds(importIds).then(toRegister => {
      for(i = 0, ii = toRegister.length; i < ii; ++i){
        toRegister[i].register(registry, names[i]);
      }
      return registry;
    });
  }
}