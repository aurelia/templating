System.register(["aurelia-logging", "aurelia-metadata", "aurelia-loader", "aurelia-dependency-injection", "./view-compiler", "./resource-registry", "./module-analyzer"], function (_export) {
  var LogManager, Origin, Loader, TemplateRegistryEntry, Container, ViewCompiler, ResourceRegistry, ViewResources, ModuleAnalyzer, _prototypeProperties, _classCallCheck, logger, ViewEngine;

  function ensureRegistryEntry(loader, urlOrRegistryEntry) {
    if (urlOrRegistryEntry instanceof TemplateRegistryEntry) {
      return Promise.resolve(urlOrRegistryEntry);
    }

    return loader.loadTemplate(urlOrRegistryEntry);
  }

  return {
    setters: [function (_aureliaLogging) {
      LogManager = _aureliaLogging;
    }, function (_aureliaMetadata) {
      Origin = _aureliaMetadata.Origin;
    }, function (_aureliaLoader) {
      Loader = _aureliaLoader.Loader;
      TemplateRegistryEntry = _aureliaLoader.TemplateRegistryEntry;
    }, function (_aureliaDependencyInjection) {
      Container = _aureliaDependencyInjection.Container;
    }, function (_viewCompiler) {
      ViewCompiler = _viewCompiler.ViewCompiler;
    }, function (_resourceRegistry) {
      ResourceRegistry = _resourceRegistry.ResourceRegistry;
      ViewResources = _resourceRegistry.ViewResources;
    }, function (_moduleAnalyzer) {
      ModuleAnalyzer = _moduleAnalyzer.ModuleAnalyzer;
    }],
    execute: function () {
      "use strict";

      _prototypeProperties = function (child, staticProps, instanceProps) { if (staticProps) Object.defineProperties(child, staticProps); if (instanceProps) Object.defineProperties(child.prototype, instanceProps); };

      _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } };

      logger = LogManager.getLogger("templating");
      ViewEngine = _export("ViewEngine", (function () {
        function ViewEngine(loader, container, viewCompiler, moduleAnalyzer, appResources) {
          _classCallCheck(this, ViewEngine);

          this.loader = loader;
          this.container = container;
          this.viewCompiler = viewCompiler;
          this.moduleAnalyzer = moduleAnalyzer;
          this.appResources = appResources;
        }

        _prototypeProperties(ViewEngine, {
          inject: {
            value: function inject() {
              return [Loader, Container, ViewCompiler, ModuleAnalyzer, ResourceRegistry];
            },
            writable: true,
            configurable: true
          }
        }, {
          loadViewFactory: {
            value: function loadViewFactory(urlOrRegistryEntry, compileOptions, associatedModuleId) {
              var _this = this;

              return ensureRegistryEntry(this.loader, urlOrRegistryEntry).then(function (viewRegistryEntry) {
                if (viewRegistryEntry.isReady) {
                  return viewRegistryEntry.factory;
                }

                return _this.loadTemplateResources(viewRegistryEntry, associatedModuleId).then(function (resources) {
                  if (viewRegistryEntry.isReady) {
                    return viewRegistryEntry.factory;
                  }

                  viewRegistryEntry.setResources(resources);

                  var viewFactory = _this.viewCompiler.compile(viewRegistryEntry.template, resources, compileOptions);
                  viewRegistryEntry.setFactory(viewFactory);
                  return viewFactory;
                });
              });
            },
            writable: true,
            configurable: true
          },
          loadTemplateResources: {
            value: function loadTemplateResources(viewRegistryEntry, associatedModuleId) {
              var resources = new ViewResources(this.appResources, viewRegistryEntry.id),
                  dependencies = viewRegistryEntry.dependencies,
                  importIds,
                  names;

              if (dependencies.length === 0 && !associatedModuleId) {
                return Promise.resolve(resources);
              }

              importIds = dependencies.map(function (x) {
                return x.src;
              });
              names = dependencies.map(function (x) {
                return x.name;
              });
              logger.debug("importing resources for " + viewRegistryEntry.id, importIds);

              return this.importViewResources(importIds, names, resources, associatedModuleId);
            },
            writable: true,
            configurable: true
          },
          importViewModelResource: {
            value: function importViewModelResource(moduleImport, moduleMember) {
              var _this = this;

              return this.loader.loadModule(moduleImport).then(function (viewModelModule) {
                var normalizedId = Origin.get(viewModelModule).moduleId,
                    resourceModule = _this.moduleAnalyzer.analyze(normalizedId, viewModelModule, moduleMember);

                if (!resourceModule.mainResource) {
                  throw new Error("No view model found in module \"" + moduleImport + "\".");
                }

                resourceModule.analyze(_this.container);

                return resourceModule.mainResource;
              });
            },
            writable: true,
            configurable: true
          },
          importViewResources: {
            value: function importViewResources(moduleIds, names, resources, associatedModuleId) {
              var _this = this;

              return this.loader.loadAllModules(moduleIds).then(function (imports) {
                var i,
                    ii,
                    analysis,
                    normalizedId,
                    current,
                    associatedModule,
                    container = _this.container,
                    moduleAnalyzer = _this.moduleAnalyzer,
                    allAnalysis = new Array(imports.length);

                //analyze and register all resources first
                //this enables circular references for global refs
                //and enables order independence
                for (i = 0, ii = imports.length; i < ii; ++i) {
                  current = imports[i];
                  normalizedId = Origin.get(current).moduleId;

                  analysis = moduleAnalyzer.analyze(normalizedId, current);
                  analysis.analyze(container);
                  analysis.register(resources, names[i]);

                  allAnalysis[i] = analysis;
                }

                if (associatedModuleId) {
                  associatedModule = moduleAnalyzer.getAnalysis(associatedModuleId);

                  if (associatedModule) {
                    associatedModule.register(resources);
                  }
                }

                //cause compile/load of any associated views second
                //as a result all globals have access to all other globals during compilation
                for (i = 0, ii = allAnalysis.length; i < ii; ++i) {
                  allAnalysis[i] = allAnalysis[i].load(container);
                }

                return Promise.all(allAnalysis).then(function () {
                  return resources;
                });
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