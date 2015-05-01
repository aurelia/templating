System.register(['aurelia-metadata', 'aurelia-loader', 'aurelia-binding', './html-behavior', './view-strategy', './util'], function (_export) {
  var Metadata, TemplateRegistryEntry, ValueConverterResource, HtmlBehaviorResource, ViewStrategy, TemplateRegistryViewStrategy, hyphenate, _classCallCheck, ResourceModule, ResourceDescription, ModuleAnalyzer;

  return {
    setters: [function (_aureliaMetadata) {
      Metadata = _aureliaMetadata.Metadata;
    }, function (_aureliaLoader) {
      TemplateRegistryEntry = _aureliaLoader.TemplateRegistryEntry;
    }, function (_aureliaBinding) {
      ValueConverterResource = _aureliaBinding.ValueConverterResource;
    }, function (_htmlBehavior) {
      HtmlBehaviorResource = _htmlBehavior.HtmlBehaviorResource;
    }, function (_viewStrategy) {
      ViewStrategy = _viewStrategy.ViewStrategy;
      TemplateRegistryViewStrategy = _viewStrategy.TemplateRegistryViewStrategy;
    }, function (_util) {
      hyphenate = _util.hyphenate;
    }],
    execute: function () {
      'use strict';

      _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } };

      ResourceModule = (function () {
        function ResourceModule(moduleId) {
          _classCallCheck(this, ResourceModule);

          this.id = moduleId;
          this.moduleInstance = null;
          this.mainResource = null;
          this.resources = null;
          this.viewStrategy = null;
          this.isAnalyzed = false;
        }

        ResourceModule.prototype.analyze = function analyze(container) {
          var current = this.mainResource,
              resources = this.resources,
              viewStrategy = this.viewStrategy,
              i,
              ii,
              metadata;

          if (this.isAnalyzed) {
            return;
          }

          this.isAnalyzed = true;

          if (current) {
            metadata = current.metadata;
            metadata.viewStrategy = viewStrategy;

            if ('analyze' in metadata && !metadata.isAnalyzed) {
              metadata.isAnalyzed = true;
              metadata.analyze(container, current.value);
            }
          }

          for (i = 0, ii = resources.length; i < ii; ++i) {
            current = resources[i];
            metadata = current.metadata;
            metadata.viewStrategy = viewStrategy;

            if ('analyze' in metadata && !metadata.isAnalyzed) {
              metadata.isAnalyzed = true;
              metadata.analyze(container, current.value);
            }
          }
        };

        ResourceModule.prototype.register = function register(registry, name) {
          var i,
              ii,
              resources = this.resources;

          if (this.mainResource) {
            this.mainResource.metadata.register(registry, name);
            name = null;
          }

          for (i = 0, ii = resources.length; i < ii; ++i) {
            resources[i].metadata.register(registry, name);
            name = null;
          }
        };

        ResourceModule.prototype.load = function load(container) {
          var current = this.mainResource,
              resources = this.resources,
              i,
              ii,
              metadata,
              loads;

          if (this.isLoaded) {
            return Promise.resolve();
          }

          this.isLoaded = true;
          loads = [];

          if (current) {
            metadata = current.metadata;

            if ('load' in metadata && !metadata.isLoaded) {
              metadata.isLoaded = true;
              loads.push(metadata.load(container, current.value));
            }
          }

          for (i = 0, ii = resources.length; i < ii; ++i) {
            current = resources[i];
            metadata = current.metadata;

            if ('load' in metadata && !metadata.isLoaded) {
              metadata.isLoaded = true;
              loads.push(metadata.load(container, current.value));
            }
          }

          return Promise.all(loads);
        };

        return ResourceModule;
      })();

      ResourceDescription = function ResourceDescription(key, exportedValue, resourceTypeMeta) {
        _classCallCheck(this, ResourceDescription);

        if (!resourceTypeMeta) {
          resourceTypeMeta = Metadata.get(Metadata.resource, exportedValue);

          if (!resourceTypeMeta) {
            resourceTypeMeta = new HtmlBehaviorResource();
            resourceTypeMeta.elementName = hyphenate(key);
            Reflect.defineMetadata(Metadata.resource, resourceTypeMeta, exportedValue);
          }
        }

        if (resourceTypeMeta instanceof HtmlBehaviorResource) {
          if (resourceTypeMeta.elementName === undefined) {
            resourceTypeMeta.elementName = hyphenate(key);
          } else if (resourceTypeMeta.attributeName === undefined) {
            resourceTypeMeta.attributeName = hyphenate(key);
          } else if (resourceTypeMeta.attributeName === null && resourceTypeMeta.elementName === null) {
            HtmlBehaviorResource.convention(key, resourceTypeMeta);
          }
        } else if (!resourceTypeMeta.name) {
          resourceTypeMeta.name = hyphenate(key);
        }

        this.metadata = resourceTypeMeta;
        this.value = exportedValue;
      };

      ModuleAnalyzer = (function () {
        function ModuleAnalyzer() {
          _classCallCheck(this, ModuleAnalyzer);

          this.cache = {};
        }

        ModuleAnalyzer.prototype.getAnalysis = function getAnalysis(moduleId) {
          return this.cache[moduleId];
        };

        ModuleAnalyzer.prototype.analyze = function analyze(moduleId, moduleInstance, viewModelMember) {
          var mainResource,
              fallbackValue,
              fallbackKey,
              resourceTypeMeta,
              key,
              exportedValue,
              resources = [],
              conventional,
              viewStrategy,
              resourceModule;

          resourceModule = this.cache[moduleId];
          if (resourceModule) {
            return resourceModule;
          }

          resourceModule = new ResourceModule(moduleId);
          this.cache[moduleId] = resourceModule;

          if (typeof moduleInstance === 'function') {
            moduleInstance = { 'default': moduleInstance };
          }

          if (viewModelMember) {
            mainResource = new ResourceDescription(viewModelMember, moduleInstance[viewModelMember]);
          }

          for (key in moduleInstance) {
            exportedValue = moduleInstance[key];

            if (key === viewModelMember || typeof exportedValue !== 'function') {
              continue;
            }

            resourceTypeMeta = Metadata.get(Metadata.resource, exportedValue);

            if (resourceTypeMeta) {
              if (resourceTypeMeta.attributeName === null && resourceTypeMeta.elementName === null) {
                HtmlBehaviorResource.convention(key, resourceTypeMeta);
              }

              if (resourceTypeMeta.attributeName === null && resourceTypeMeta.elementName === null) {
                resourceTypeMeta.elementName = hyphenate(key);
              }

              if (!mainResource && resourceTypeMeta instanceof HtmlBehaviorResource && resourceTypeMeta.elementName !== null) {
                mainResource = new ResourceDescription(key, exportedValue, resourceTypeMeta);
              } else {
                resources.push(new ResourceDescription(key, exportedValue, resourceTypeMeta));
              }
            } else if (exportedValue instanceof ViewStrategy) {
              viewStrategy = exportedValue;
            } else if (exportedValue instanceof TemplateRegistryEntry) {
              viewStrategy = new TemplateRegistryViewStrategy(moduleId, exportedValue);
            } else {
              if (conventional = HtmlBehaviorResource.convention(key)) {
                if (conventional.elementName !== null && !mainResource) {
                  mainResource = new ResourceDescription(key, exportedValue, conventional);
                } else {
                  resources.push(new ResourceDescription(key, exportedValue, conventional));
                }

                Reflect.defineMetadata(Metadata.resource, conventional, exportedValue);
              } else if (conventional = ValueConverterResource.convention(key)) {
                resources.push(new ResourceDescription(key, exportedValue, conventional));
                Reflect.defineMetadata(Metadata.resource, conventional, exportedValue);
              } else if (!fallbackValue) {
                fallbackValue = exportedValue;
                fallbackKey = key;
              }
            }
          }

          if (!mainResource && fallbackValue) {
            mainResource = new ResourceDescription(fallbackKey, fallbackValue);
          }

          resourceModule.moduleInstance = moduleInstance;
          resourceModule.mainResource = mainResource;
          resourceModule.resources = resources;
          resourceModule.viewStrategy = viewStrategy;

          return resourceModule;
        };

        return ModuleAnalyzer;
      })();

      _export('ModuleAnalyzer', ModuleAnalyzer);
    }
  };
});