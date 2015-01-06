define(["exports", "aurelia-metadata"], function (exports, _aureliaMetadata) {
  "use strict";

  var _inherits = function (child, parent) {
    if (typeof parent !== "function" && parent !== null) {
      throw new TypeError("Super expression must either be null or a function, not " + typeof parent);
    }
    child.prototype = Object.create(parent && parent.prototype, {
      constructor: {
        value: child,
        enumerable: false,
        writable: true,
        configurable: true
      }
    });
    if (parent) child.__proto__ = parent;
  };

  var getAnnotation = _aureliaMetadata.getAnnotation;
  var Origin = _aureliaMetadata.Origin;
  var ViewStrategy = function ViewStrategy() {};

  ViewStrategy.prototype.loadViewFactory = function (viewEngine, options) {
    throw new Error("A ViewStrategy must implement loadViewFactory(viewEngine, options).");
  };

  ViewStrategy.normalize = function (value, viewResources) {
    if (typeof value === "string") {
      value = new UseView(viewResources ? viewResources.relativeToView(value) : value);
    }

    if (value && !(value instanceof ViewStrategy)) {
      throw new Error("The view must be a string or an instance of ViewStrategy.");
    }

    return value;
  };

  ViewStrategy.getDefault = function (target) {
    var strategy, annotation;

    if (typeof target !== "function") {
      target = target.constructor;
    }

    annotation = Origin.get(target);
    strategy = getAnnotation(target, ViewStrategy);

    if (!strategy) {
      if (!annotation) {
        throw new Error("Cannot determinte default view strategy for object.", target);
      }

      strategy = new ConventionalView(annotation.moduleId);
    } else if (annotation) {
      strategy.moduleId = annotation.moduleId;
    }

    return strategy;
  };

  exports.ViewStrategy = ViewStrategy;
  var UseView = (function () {
    var _ViewStrategy = ViewStrategy;
    var UseView = function UseView(path) {
      this.path = path;
    };

    _inherits(UseView, _ViewStrategy);

    UseView.prototype.loadViewFactory = function (viewEngine, options) {
      return viewEngine.loadViewFactory(this.path, options, this.moduleId);
    };

    return UseView;
  })();

  exports.UseView = UseView;
  var ConventionalView = (function () {
    var _ViewStrategy2 = ViewStrategy;
    var ConventionalView = function ConventionalView(moduleId) {
      this.moduleId = moduleId;
      this.viewUrl = ConventionalView.convertModuleIdToViewUrl(moduleId);
    };

    _inherits(ConventionalView, _ViewStrategy2);

    ConventionalView.prototype.loadViewFactory = function (viewEngine, options) {
      return viewEngine.loadViewFactory(this.viewUrl, options, this.moduleId);
    };

    ConventionalView.convertModuleIdToViewUrl = function (moduleId) {
      return moduleId + ".html";
    };

    return ConventionalView;
  })();

  exports.ConventionalView = ConventionalView;
  var NoView = (function () {
    var _ViewStrategy3 = ViewStrategy;
    var NoView = function NoView() {
      if (_ViewStrategy3 !== null) {
        _ViewStrategy3.apply(this, arguments);
      }
    };

    _inherits(NoView, _ViewStrategy3);

    NoView.prototype.loadViewFactory = function () {
      return Promise.resolve(null);
    };

    return NoView;
  })();

  exports.NoView = NoView;
});