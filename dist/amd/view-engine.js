define(["exports", "aurelia-logging", "aurelia-metadata", "aurelia-loader", "aurelia-dependency-injection", "./view-compiler", "./resource-registry", "./module-analyzer"], function (exports, _aureliaLogging, _aureliaMetadata, _aureliaLoader, _aureliaDependencyInjection, _viewCompiler, _resourceRegistry, _moduleAnalyzer) {
  "use strict";

  var _prototypeProperties = function (child, staticProps, instanceProps) { if (staticProps) Object.defineProperties(child, staticProps); if (instanceProps) Object.defineProperties(child.prototype, instanceProps); };

  var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } };

  var LogManager = _aureliaLogging;
  var Origin = _aureliaMetadata.Origin;
  var Loader = _aureliaLoader.Loader;
  var TemplateRegistryEntry = _aureliaLoader.TemplateRegistryEntry;
  var Container = _aureliaDependencyInjection.Container;
  var ViewCompiler = _viewCompiler.ViewCompiler;
  var ResourceRegistry = _resourceRegistry.ResourceRegistry;
  var ViewResources = _resourceRegistry.ViewResources;
  var ModuleAnalyzer = _moduleAnalyzer.ModuleAnalyzer;

  var logger = LogManager.getLogger("templating");

  function ensureRegistryEntry(loader, urlOrRegistryEntry) {
    if (urlOrRegistryEntry instanceof TemplateRegistryEntry) {
      return Promise.resolve(urlOrRegistryEntry);
    }

    return loader.loadTemplate(urlOrRegistryEntry);
  }

  var ViewEngine = exports.ViewEngine = (function () {
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
  })();

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
});