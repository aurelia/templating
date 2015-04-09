System.register(['core-js', 'aurelia-logging', 'aurelia-metadata', 'aurelia-loader', 'aurelia-dependency-injection', './view-compiler', './resource-registry', './module-analyzer'], function (_export) {
  var core, LogManager, Origin, Loader, TemplateRegistryEntry, Container, ViewCompiler, ResourceRegistry, ViewResources, ModuleAnalyzer, _classCallCheck, _createClass, logger, ViewEngine;

  function ensureRegistryEntry(loader, urlOrRegistryEntry) {
    if (urlOrRegistryEntry instanceof TemplateRegistryEntry) {
      return Promise.resolve(urlOrRegistryEntry);
    }

    return loader.loadTemplate(urlOrRegistryEntry);
  }

  return {
    setters: [function (_coreJs) {
      core = _coreJs['default'];
    }, function (_aureliaLogging) {
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
      'use strict';

      _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } };

      _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

      logger = LogManager.getLogger('templating');

      ViewEngine = (function () {
        function ViewEngine(loader, container, viewCompiler, moduleAnalyzer, appResources) {
          _classCallCheck(this, ViewEngine);

          this.loader = loader;
          this.container = container;
          this.viewCompiler = viewCompiler;
          this.moduleAnalyzer = moduleAnalyzer;
          this.appResources = appResources;
        }

        _createClass(ViewEngine, [{
          key: 'loadViewFactory',
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
          }
        }, {
          key: 'loadTemplateResources',
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
            logger.debug('importing resources for ' + viewRegistryEntry.id, importIds);

            return this.importViewResources(importIds, names, resources, associatedModuleId);
          }
        }, {
          key: 'importViewModelResource',
          value: function importViewModelResource(moduleImport, moduleMember) {
            var _this2 = this;

            return this.loader.loadModule(moduleImport).then(function (viewModelModule) {
              var normalizedId = Origin.get(viewModelModule).moduleId,
                  resourceModule = _this2.moduleAnalyzer.analyze(normalizedId, viewModelModule, moduleMember);

              if (!resourceModule.mainResource) {
                throw new Error('No view model found in module "' + moduleImport + '".');
              }

              resourceModule.analyze(_this2.container);

              return resourceModule.mainResource;
            });
          }
        }, {
          key: 'importViewResources',
          value: function importViewResources(moduleIds, names, resources, associatedModuleId) {
            var _this3 = this;

            return this.loader.loadAllModules(moduleIds).then(function (imports) {
              var i,
                  ii,
                  analysis,
                  normalizedId,
                  current,
                  associatedModule,
                  container = _this3.container,
                  moduleAnalyzer = _this3.moduleAnalyzer,
                  allAnalysis = new Array(imports.length);

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

              for (i = 0, ii = allAnalysis.length; i < ii; ++i) {
                allAnalysis[i] = allAnalysis[i].load(container);
              }

              return Promise.all(allAnalysis).then(function () {
                return resources;
              });
            });
          }
        }], [{
          key: 'inject',
          value: function inject() {
            return [Loader, Container, ViewCompiler, ModuleAnalyzer, ResourceRegistry];
          }
        }]);

        return ViewEngine;
      })();

      _export('ViewEngine', ViewEngine);
    }
  };
});