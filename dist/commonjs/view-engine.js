"use strict";

var LogManager = require('aurelia-logging');

var Loader = require('aurelia-loader').Loader;
var relativeToFile = require('aurelia-path').relativeToFile;
var ViewCompiler = require('./view-compiler').ViewCompiler;
var ResourceRegistry = require('./resource-registry').ResourceRegistry;
var ViewResources = require('./resource-registry').ViewResources;


var importSplitter = /\s*,\s*/, logger = LogManager.getLogger("templating");

var ViewEngine = (function () {
  var ViewEngine = function ViewEngine(loader, viewCompiler, appResources) {
    this.loader = loader;
    this.viewCompiler = viewCompiler;
    this.appResources = appResources;
    this.importedViews = {};
  };

  ViewEngine.inject = function () {
    return [Loader, ViewCompiler, ResourceRegistry];
  };

  ViewEngine.prototype.loadViewFactoryForModuleId = function (moduleId, options) {
    var url = moduleId + ".html";
    return this.loadViewFactory(url, options);
  };

  ViewEngine.prototype.loadViewFactory = function (url, options) {
    var _this = this;
    var existing = this.importedViews[url];
    if (existing) {
      return Promise.resolve(existing);
    }

    return this.loader.loadTemplate(url).then(function (template) {
      return _this.loadTemplateResources(url, template).then(function (resources) {
        var viewFactory = _this.viewCompiler.compile(template, resources, options);
        _this.importedViews[url] = viewFactory;
        return viewFactory;
      });
    });
  };

  ViewEngine.prototype.loadTemplateResources = function (templateUrl, template) {
    var importIds, i, ii, j, jj, parts, registry = new ViewResources(this.appResources, templateUrl), dxImportElements = template.content.querySelectorAll("import");

    if (dxImportElements.length === 0) {
      return Promise.resolve(registry);
    }

    importIds = [];

    for (i = 0, ii = dxImportElements.length; i < ii; i++) {
      parts = dxImportElements[i].getAttribute("src").split(importSplitter);

      for (j = 0, jj = parts.length; j < jj; j++) {
        importIds.push(parts[j]);
      }
    }

    if (importIds.length === 0) {
      return Promise.resolve(registry);
    }

    importIds = importIds.map(function (x) {
      return relativeToFile(x, templateUrl);
    });
    logger.debug("importing resources for " + templateUrl, importIds);

    return this.resourceCoordinator.importResourcesFromModuleIds(importIds).then(function (toRegister) {
      toRegister.forEach(function (x) {
        return x.register(registry);
      });
      return registry;
    });
  };

  return ViewEngine;
})();

exports.ViewEngine = ViewEngine;