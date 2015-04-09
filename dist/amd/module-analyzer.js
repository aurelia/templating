define(['exports', 'aurelia-metadata', 'aurelia-loader', 'aurelia-binding', './html-behavior', './view-strategy', './util'], function (exports, _aureliaMetadata, _aureliaLoader, _aureliaBinding, _htmlBehavior, _viewStrategy, _util) {
  'use strict';

  var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } };

  var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

  Object.defineProperty(exports, '__esModule', {
    value: true
  });

  var ResourceModule = (function () {
    function ResourceModule(moduleId) {
      _classCallCheck(this, ResourceModule);

      this.id = moduleId;
      this.moduleInstance = null;
      this.mainResource = null;
      this.resources = null;
      this.viewStrategy = null;
      this.isAnalyzed = false;
    }

    _createClass(ResourceModule, [{
      key: 'analyze',
      value: function analyze(container) {
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
      }
    }, {
      key: 'register',
      value: function register(registry, name) {
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
      }
    }, {
      key: 'load',
      value: function load(container) {
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
      }
    }]);

    return ResourceModule;
  })();

  var ResourceDescription = function ResourceDescription(key, exportedValue, allMetadata, resourceTypeMeta) {
    _classCallCheck(this, ResourceDescription);

    if (!resourceTypeMeta) {
      if (!allMetadata) {
        allMetadata = _aureliaMetadata.Metadata.on(exportedValue);
      }

      resourceTypeMeta = allMetadata.first(_aureliaMetadata.ResourceType);

      if (!resourceTypeMeta) {
        resourceTypeMeta = new _htmlBehavior.HtmlBehaviorResource();
        resourceTypeMeta.elementName = _util.hyphenate(key);
        allMetadata.add(resourceTypeMeta);
      }
    }

    if (resourceTypeMeta instanceof _htmlBehavior.HtmlBehaviorResource) {
      if (resourceTypeMeta.elementName === undefined) {
        resourceTypeMeta.elementName = _util.hyphenate(key);
      } else if (resourceTypeMeta.attributeName === undefined) {
        resourceTypeMeta.attributeName = _util.hyphenate(key);
      } else if (resourceTypeMeta.attributeName === null && resourceTypeMeta.elementName === null) {
        _htmlBehavior.HtmlBehaviorResource.convention(key, resourceTypeMeta);
      }
    } else if (!resourceTypeMeta.name) {
      resourceTypeMeta.name = _util.hyphenate(key);
    }

    this.metadata = resourceTypeMeta;
    this.value = exportedValue;
  };

  var ModuleAnalyzer = (function () {
    function ModuleAnalyzer() {
      _classCallCheck(this, ModuleAnalyzer);

      this.cache = {};
    }

    _createClass(ModuleAnalyzer, [{
      key: 'getAnalysis',
      value: function getAnalysis(moduleId) {
        return this.cache[moduleId];
      }
    }, {
      key: 'analyze',
      value: function analyze(moduleId, moduleInstance, viewModelMember) {
        var mainResource,
            fallbackValue,
            fallbackKey,
            fallbackMetadata,
            resourceTypeMeta,
            key,
            allMetadata,
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

          allMetadata = _aureliaMetadata.Metadata.on(exportedValue);
          resourceTypeMeta = allMetadata.first(_aureliaMetadata.ResourceType);

          if (resourceTypeMeta) {
            if (resourceTypeMeta.attributeName === null && resourceTypeMeta.elementName === null) {
              _htmlBehavior.HtmlBehaviorResource.convention(key, resourceTypeMeta);
            }

            if (resourceTypeMeta.attributeName === null && resourceTypeMeta.elementName === null) {
              resourceTypeMeta.elementName = _util.hyphenate(key);
            }

            if (!mainResource && resourceTypeMeta instanceof _htmlBehavior.HtmlBehaviorResource && resourceTypeMeta.elementName !== null) {
              mainResource = new ResourceDescription(key, exportedValue, allMetadata, resourceTypeMeta);
            } else {
              resources.push(new ResourceDescription(key, exportedValue, allMetadata, resourceTypeMeta));
            }
          } else if (exportedValue instanceof _viewStrategy.ViewStrategy) {
            viewStrategy = exportedValue;
          } else if (exportedValue instanceof _aureliaLoader.TemplateRegistryEntry) {
            viewStrategy = new _viewStrategy.TemplateRegistryViewStrategy(moduleId, exportedValue);
          } else {
            if (conventional = _htmlBehavior.HtmlBehaviorResource.convention(key)) {
              if (conventional.elementName !== null && !mainResource) {
                mainResource = new ResourceDescription(key, exportedValue, allMetadata, conventional);
              } else {
                resources.push(new ResourceDescription(key, exportedValue, allMetadata, conventional));
              }

              allMetadata.add(conventional);
            } else if (conventional = _aureliaBinding.ValueConverterResource.convention(key)) {
              resources.push(new ResourceDescription(key, exportedValue, allMetadata, conventional));
              allMetadata.add(conventional);
            } else if (!fallbackValue) {
              fallbackValue = exportedValue;
              fallbackKey = key;
              fallbackMetadata = allMetadata;
            }
          }
        }

        if (!mainResource && fallbackValue) {
          mainResource = new ResourceDescription(fallbackKey, fallbackValue, fallbackMetadata);
        }

        resourceModule.moduleInstance = moduleInstance;
        resourceModule.mainResource = mainResource;
        resourceModule.resources = resources;
        resourceModule.viewStrategy = viewStrategy;

        return resourceModule;
      }
    }]);

    return ModuleAnalyzer;
  })();

  exports.ModuleAnalyzer = ModuleAnalyzer;
});