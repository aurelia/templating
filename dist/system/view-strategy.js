System.register(["aurelia-metadata", "aurelia-path"], function (_export) {
  var Metadata, Origin, relativeToFile, _inherits, _prototypeProperties, _classCallCheck, ViewStrategy, UseView, ConventionalView, NoView, TemplateRegistryViewStrategy;

  return {
    setters: [function (_aureliaMetadata) {
      Metadata = _aureliaMetadata.Metadata;
      Origin = _aureliaMetadata.Origin;
    }, function (_aureliaPath) {
      relativeToFile = _aureliaPath.relativeToFile;
    }],
    execute: function () {
      "use strict";

      _inherits = function (subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; };

      _prototypeProperties = function (child, staticProps, instanceProps) { if (staticProps) Object.defineProperties(child, staticProps); if (instanceProps) Object.defineProperties(child.prototype, instanceProps); };

      _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } };

      ViewStrategy = _export("ViewStrategy", (function () {
        function ViewStrategy() {
          _classCallCheck(this, ViewStrategy);
        }

        _prototypeProperties(ViewStrategy, {
          normalize: {
            value: function normalize(value) {
              if (typeof value === "string") {
                value = new UseView(value);
              }

              if (value && !(value instanceof ViewStrategy)) {
                throw new Error("The view must be a string or an instance of ViewStrategy.");
              }

              return value;
            },
            writable: true,
            configurable: true
          },
          getDefault: {
            value: function getDefault(target) {
              var strategy, annotation;

              if (typeof target !== "function") {
                target = target.constructor;
              }

              annotation = Origin.get(target);
              strategy = Metadata.on(target).first(ViewStrategy);

              if (!strategy) {
                if (!annotation) {
                  throw new Error("Cannot determinte default view strategy for object.", target);
                }

                strategy = new ConventionalView(annotation.moduleId);
              } else if (annotation) {
                strategy.moduleId = annotation.moduleId;
              }

              return strategy;
            },
            writable: true,
            configurable: true
          }
        }, {
          makeRelativeTo: {
            value: function makeRelativeTo(baseUrl) {},
            writable: true,
            configurable: true
          },
          loadViewFactory: {
            value: function loadViewFactory(viewEngine, options) {
              throw new Error("A ViewStrategy must implement loadViewFactory(viewEngine, options).");
            },
            writable: true,
            configurable: true
          }
        });

        return ViewStrategy;
      })());
      UseView = _export("UseView", (function (ViewStrategy) {
        function UseView(path) {
          _classCallCheck(this, UseView);

          this.path = path;
        }

        _inherits(UseView, ViewStrategy);

        _prototypeProperties(UseView, null, {
          loadViewFactory: {
            value: function loadViewFactory(viewEngine, options) {
              if (!this.absolutePath && this.moduleId) {
                this.absolutePath = relativeToFile(this.path, this.moduleId);
              }

              return viewEngine.loadViewFactory(this.absolutePath || this.path, options, this.moduleId);
            },
            writable: true,
            configurable: true
          },
          makeRelativeTo: {
            value: function makeRelativeTo(file) {
              this.absolutePath = relativeToFile(this.path, file);
            },
            writable: true,
            configurable: true
          }
        });

        return UseView;
      })(ViewStrategy));
      ConventionalView = _export("ConventionalView", (function (ViewStrategy) {
        function ConventionalView(moduleId) {
          _classCallCheck(this, ConventionalView);

          this.moduleId = moduleId;
          this.viewUrl = ConventionalView.convertModuleIdToViewUrl(moduleId);
        }

        _inherits(ConventionalView, ViewStrategy);

        _prototypeProperties(ConventionalView, {
          convertModuleIdToViewUrl: {
            value: function convertModuleIdToViewUrl(moduleId) {
              return moduleId + ".html";
            },
            writable: true,
            configurable: true
          }
        }, {
          loadViewFactory: {
            value: function loadViewFactory(viewEngine, options) {
              return viewEngine.loadViewFactory(this.viewUrl, options, this.moduleId);
            },
            writable: true,
            configurable: true
          }
        });

        return ConventionalView;
      })(ViewStrategy));
      NoView = _export("NoView", (function (ViewStrategy) {
        function NoView() {
          _classCallCheck(this, NoView);

          if (ViewStrategy != null) {
            ViewStrategy.apply(this, arguments);
          }
        }

        _inherits(NoView, ViewStrategy);

        _prototypeProperties(NoView, null, {
          loadViewFactory: {
            value: function loadViewFactory() {
              return Promise.resolve(null);
            },
            writable: true,
            configurable: true
          }
        });

        return NoView;
      })(ViewStrategy));
      TemplateRegistryViewStrategy = _export("TemplateRegistryViewStrategy", (function (ViewStrategy) {
        function TemplateRegistryViewStrategy(moduleId, registryEntry) {
          _classCallCheck(this, TemplateRegistryViewStrategy);

          this.moduleId = moduleId;
          this.registryEntry = registryEntry;
        }

        _inherits(TemplateRegistryViewStrategy, ViewStrategy);

        _prototypeProperties(TemplateRegistryViewStrategy, null, {
          loadViewFactory: {
            value: function loadViewFactory(viewEngine, options) {
              if (this.registryEntry.isReady) {
                return Promise.resolve(this.registryEntry.factory);
              }

              return viewEngine.loadViewFactory(this.registryEntry, options, this.moduleId);
            },
            writable: true,
            configurable: true
          }
        });

        return TemplateRegistryViewStrategy;
      })(ViewStrategy));
    }
  };
});