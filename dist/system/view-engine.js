System.register(["aurelia-logging", "aurelia-loader", "aurelia-path", "./view-compiler", "./resource-registry"], function (_export) {
  var LogManager, Loader, relativeToFile, ViewCompiler, ResourceRegistry, ViewResources, _prototypeProperties, _classCallCheck, importSplitter, logger, ViewEngine;

  return {
    setters: [function (_aureliaLogging) {
      LogManager = _aureliaLogging;
    }, function (_aureliaLoader) {
      Loader = _aureliaLoader.Loader;
    }, function (_aureliaPath) {
      relativeToFile = _aureliaPath.relativeToFile;
    }, function (_viewCompiler) {
      ViewCompiler = _viewCompiler.ViewCompiler;
    }, function (_resourceRegistry) {
      ResourceRegistry = _resourceRegistry.ResourceRegistry;
      ViewResources = _resourceRegistry.ViewResources;
    }],
    execute: function () {
      "use strict";

      _prototypeProperties = function (child, staticProps, instanceProps) { if (staticProps) Object.defineProperties(child, staticProps); if (instanceProps) Object.defineProperties(child.prototype, instanceProps); };

      _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } };

      importSplitter = /\s*,\s*/;
      logger = LogManager.getLogger("templating");
      ViewEngine = _export("ViewEngine", (function () {
        function ViewEngine(loader, viewCompiler, appResources) {
          _classCallCheck(this, ViewEngine);

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
            configurable: true
          },
          loadTemplateResources: {
            value: function loadTemplateResources(templateUrl, template, associatedModuleId) {
              var _this = this;

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
                  associatedModule = _this.resourceCoordinator.getExistingModuleAnalysis(associatedModuleId);

                  if (associatedModule) {
                    associatedModule.register(registry);
                  }
                }

                return registry;
              });
            },
            writable: true,
            configurable: true
          }
        });

        return ViewEngine;
      })());
    }
  };
});