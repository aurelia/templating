"use strict";

var _prototypeProperties = function (child, staticProps, instanceProps) {
  if (staticProps) Object.defineProperties(child, staticProps);
  if (instanceProps) Object.defineProperties(child.prototype, instanceProps);
};

var _interopRequireWildcard = function (obj) {
  return obj && obj.constructor === Object ? obj : {
    "default": obj
  };
};

var LogManager = _interopRequireWildcard(require("aurelia-logging"));

var Loader = require("aurelia-loader").Loader;
var relativeToFile = require("aurelia-path").relativeToFile;
var ViewCompiler = require("./view-compiler").ViewCompiler;
var ResourceRegistry = require("./resource-registry").ResourceRegistry;
var ViewResources = require("./resource-registry").ViewResources;


var importSplitter = /\s*,\s*/,
    logger = LogManager.getLogger("templating");

var ViewEngine = (function () {
  function ViewEngine(loader, viewCompiler, appResources) {
    this.loader = loader;
    this.viewCompiler = viewCompiler;
    this.appResources = appResources;
    this.importedViews = {};
  }

  _prototypeProperties(ViewEngine, {
    inject: {
      value: function inject() {
        return [Loader, ViewCompiler, ResourceRegistry];
      },
      writable: true,
      enumerable: true,
      configurable: true
    }
  }, {
    loadViewFactory: {
      value: function loadViewFactory(url, compileOptions, associatedModuleId) {
        var _this = this;
        var existing = this.importedViews[url];
        if (existing) {
          return Promise.resolve(existing);
        }

        return this.loader.loadTemplate(url).then(function (template) {
          return _this.loadTemplateResources(url, template, associatedModuleId).then(function (resources) {
            existing = _this.importedViews[url];
            if (existing) {
              return existing;
            }

            var viewFactory = _this.viewCompiler.compile(template, resources, compileOptions);
            _this.importedViews[url] = viewFactory;
            return viewFactory;
          });
        });
      },
      writable: true,
      enumerable: true,
      configurable: true
    },
    loadTemplateResources: {
      value: function loadTemplateResources(templateUrl, template, associatedModuleId) {
        var _this2 = this;
        var importIds,
            names,
            i,
            ii,
            src,
            current,
            registry = new ViewResources(this.appResources, templateUrl),
            dxImportElements = template.content.querySelectorAll("import"),
            associatedModule;

        if (dxImportElements.length === 0 && !associatedModuleId) {
          return Promise.resolve(registry);
        }

        importIds = new Array(dxImportElements.length);
        names = new Array(dxImportElements.length);

        for (i = 0, ii = dxImportElements.length; i < ii; ++i) {
          current = dxImportElements[i];
          src = current.getAttribute("from");

          if (!src) {
            throw new Error("Import element in " + templateUrl + " has no \"from\" attribute.");
          }

          importIds[i] = src;
          names[i] = current.getAttribute("as");

          if (current.parentNode) {
            current.parentNode.removeChild(current);
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
      },
      writable: true,
      enumerable: true,
      configurable: true
    }
  });

  return ViewEngine;
})();

exports.ViewEngine = ViewEngine;