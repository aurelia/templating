define(["exports", "aurelia-logging", "aurelia-loader", "aurelia-path", "./view-compiler", "./resource-registry"], function (exports, _aureliaLogging, _aureliaLoader, _aureliaPath, _viewCompiler, _resourceRegistry) {
  "use strict";

  var LogManager = _aureliaLogging;
  var Loader = _aureliaLoader.Loader;
  var relativeToFile = _aureliaPath.relativeToFile;
  var ViewCompiler = _viewCompiler.ViewCompiler;
  var ResourceRegistry = _resourceRegistry.ResourceRegistry;
  var ViewResources = _resourceRegistry.ViewResources;


  var importSplitter = /\s*,\s*/, logger = LogManager.getLogger("templating");

  var ViewEngine = function ViewEngine(loader, viewCompiler, appResources) {
    this.loader = loader;
    this.viewCompiler = viewCompiler;
    this.appResources = appResources;
    this.importedViews = {};
  };

  ViewEngine.inject = function () {
    return [Loader, ViewCompiler, ResourceRegistry];
  };

  ViewEngine.prototype.loadViewFactory = function (url, compileOptions, associatedModuleId) {
    var _this = this;
    var existing = this.importedViews[url];
    if (existing) {
      return Promise.resolve(existing);
    }

    return this.loader.loadTemplate(url).then(function (template) {
      return _this.loadTemplateResources(url, template, associatedModuleId).then(function (resources) {
        var viewFactory = _this.viewCompiler.compile(template, resources, compileOptions);
        _this.importedViews[url] = viewFactory;
        return viewFactory;
      });
    });
  };

  ViewEngine.prototype.loadTemplateResources = function (templateUrl, template, associatedModuleId) {
    var _this2 = this;
    var importIds, names, i, ii, j, jj, parts, src, srcParts, registry = new ViewResources(this.appResources, templateUrl), dxImportElements = template.content.querySelectorAll("import"), associatedModule;

    if (dxImportElements.length === 0 && !associatedModuleId) {
      return Promise.resolve(registry);
    }

    importIds = [];
    names = [];

    for (i = 0, ii = dxImportElements.length; i < ii; ++i) {
      src = dxImportElements[i].getAttribute("src");

      if (!src) {
        throw new Error("Import element in " + templateUrl + " has no src attribute.");
      }

      parts = src.split(importSplitter);

      for (j = 0, jj = parts.length; j < jj; ++j) {
        srcParts = parts[j].split(" as ");
        importIds.push(srcParts[0]);
        names.push(srcParts.length == 2 ? srcParts[1] : null);
      }
    }

    importIds = importIds.map(function (x) {
      return relativeToFile(x, templateUrl);
    });
    logger.debug("importing resources for " + templateUrl, importIds);

    return this.resourceCoordinator.importResourcesFromModuleIds(importIds).then(function (toRegister) {
      for (i = 0, ii = toRegister.length; i < ii; ++i) {
        toRegister[i].register(registry, names[i]);
      }

      if (associatedModuleId) {
        associatedModule = _this2.resourceCoordinator.getExistingModuleAnalysis(associatedModuleId);

        if (associatedModule) {
          associatedModule.register(registry);
        }
      }

      return registry;
    });
  };

  exports.ViewEngine = ViewEngine;
});