define(["exports", "aurelia-metadata", "aurelia-path"], function (exports, _aureliaMetadata, _aureliaPath) {
  "use strict";

  var _inherits = function (subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; };

  var _prototypeProperties = function (child, staticProps, instanceProps) { if (staticProps) Object.defineProperties(child, staticProps); if (instanceProps) Object.defineProperties(child.prototype, instanceProps); };

  var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } };

  var Metadata = _aureliaMetadata.Metadata;
  var Origin = _aureliaMetadata.Origin;
  var relativeToFile = _aureliaPath.relativeToFile;

  var ViewStrategy = exports.ViewStrategy = (function () {
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
  })();

  var UseView = exports.UseView = (function (ViewStrategy) {
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
  })(ViewStrategy);

  var ConventionalView = exports.ConventionalView = (function (ViewStrategy) {
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
  })(ViewStrategy);

  var NoView = exports.NoView = (function (ViewStrategy) {
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
  })(ViewStrategy);

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
});