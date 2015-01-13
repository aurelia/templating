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

var _prototypeProperties = function (child, staticProps, instanceProps) {
  if (staticProps) Object.defineProperties(child, staticProps);
  if (instanceProps) Object.defineProperties(child.prototype, instanceProps);
};

var getAnnotation = require("aurelia-metadata").getAnnotation;
var Origin = require("aurelia-metadata").Origin;
var relativeToFile = require("aurelia-path").relativeToFile;
var ViewStrategy = (function () {
  var ViewStrategy = function ViewStrategy() {};

  _prototypeProperties(ViewStrategy, {
    normalize: {
      value: function (value) {
        if (typeof value === "string") {
          value = new UseView(value);
        }

        if (value && !(value instanceof ViewStrategy)) {
          throw new Error("The view must be a string or an instance of ViewStrategy.");
        }

        return value;
      },
      writable: true,
      enumerable: true,
      configurable: true
    },
    getDefault: {
      value: function (target) {
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
      },
      writable: true,
      enumerable: true,
      configurable: true
    }
  }, {
    makeRelativeTo: {
      value: function (baseUrl) {},
      writable: true,
      enumerable: true,
      configurable: true
    },
    loadViewFactory: {
      value: function (viewEngine, options) {
        throw new Error("A ViewStrategy must implement loadViewFactory(viewEngine, options).");
      },
      writable: true,
      enumerable: true,
      configurable: true
    }
  });

  return ViewStrategy;
})();

exports.ViewStrategy = ViewStrategy;
var UseView = (function (ViewStrategy) {
  var UseView = function UseView(path) {
    this.path = path;
  };

  _inherits(UseView, ViewStrategy);

  _prototypeProperties(UseView, null, {
    loadViewFactory: {
      value: function (viewEngine, options) {
        if (!this.absolutePath && this.moduleId) {
          this.absolutePath = relativeToFile(this.path, this.moduleId);
        }

        return viewEngine.loadViewFactory(this.absolutePath || this.path, options, this.moduleId);
      },
      writable: true,
      enumerable: true,
      configurable: true
    },
    makeRelativeTo: {
      value: function (file) {
        this.absolutePath = relativeToFile(this.path, file);
      },
      writable: true,
      enumerable: true,
      configurable: true
    }
  });

  return UseView;
})(ViewStrategy);

exports.UseView = UseView;
var ConventionalView = (function (ViewStrategy) {
  var ConventionalView = function ConventionalView(moduleId) {
    this.moduleId = moduleId;
    this.viewUrl = ConventionalView.convertModuleIdToViewUrl(moduleId);
  };

  _inherits(ConventionalView, ViewStrategy);

  _prototypeProperties(ConventionalView, {
    convertModuleIdToViewUrl: {
      value: function (moduleId) {
        return moduleId + ".html";
      },
      writable: true,
      enumerable: true,
      configurable: true
    }
  }, {
    loadViewFactory: {
      value: function (viewEngine, options) {
        return viewEngine.loadViewFactory(this.viewUrl, options, this.moduleId);
      },
      writable: true,
      enumerable: true,
      configurable: true
    }
  });

  return ConventionalView;
})(ViewStrategy);

exports.ConventionalView = ConventionalView;
var NoView = (function (ViewStrategy) {
  var NoView = function NoView() {
    if (Object.getPrototypeOf(NoView) !== null) {
      Object.getPrototypeOf(NoView).apply(this, arguments);
    }
  };

  _inherits(NoView, ViewStrategy);

  _prototypeProperties(NoView, null, {
    loadViewFactory: {
      value: function () {
        return Promise.resolve(null);
      },
      writable: true,
      enumerable: true,
      configurable: true
    }
  });

  return NoView;
})(ViewStrategy);

exports.NoView = NoView;