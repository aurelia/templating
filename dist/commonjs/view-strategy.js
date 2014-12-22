"use strict";

var _extends = function (child, parent) {
  child.prototype = Object.create(parent.prototype, {
    constructor: {
      value: child,
      enumerable: false,
      writable: true,
      configurable: true
    }
  });
  child.__proto__ = parent;
};

var getAnnotation = require('aurelia-metadata').getAnnotation;
var Origin = require('aurelia-metadata').Origin;
var ViewStrategy = (function () {
  var ViewStrategy = function ViewStrategy() {};

  ViewStrategy.prototype.loadViewFactory = function (viewEngine, options) {
    throw new Error("A ViewStrategy must implement loadViewFactory(viewEngine, options).");
  };

  ViewStrategy.getDefault = function (target) {
    var strategy, annotation;

    if (typeof target !== "function") {
      target = target.constructor;
    }

    strategy = getAnnotation(target, ViewStrategy);

    if (!strategy) {
      annotation = Origin.get(target);

      if (!annotation) {
        throw new Error("Cannot determinte default view strategy for object.", target);
      }

      strategy = new ConventionalView(annotation.moduleId);
    }

    return strategy;
  };

  return ViewStrategy;
})();

exports.ViewStrategy = ViewStrategy;
var UseView = (function (ViewStrategy) {
  var UseView = function UseView(path) {
    this.path = path;
  };

  _extends(UseView, ViewStrategy);

  UseView.prototype.loadViewFactory = function (viewEngine, options) {
    return viewEngine.loadViewFactory(this.path, options);
  };

  return UseView;
})(ViewStrategy);

exports.UseView = UseView;
var ConventionalView = (function (ViewStrategy) {
  var ConventionalView = function ConventionalView(moduleId) {
    ViewStrategy.call(this);
    this.moduleId = moduleId;
  };

  _extends(ConventionalView, ViewStrategy);

  ConventionalView.prototype.loadViewFactory = function (viewEngine, options) {
    return viewEngine.loadViewFactoryForModuleId(this.moduleId, options);
  };

  return ConventionalView;
})(ViewStrategy);

exports.ConventionalView = ConventionalView;
var NoView = (function (ViewStrategy) {
  var NoView = function NoView() {
    ViewStrategy.call(this);
  };

  _extends(NoView, ViewStrategy);

  NoView.prototype.loadViewFactory = function () {
    return Promise.resolve(null);
  };

  return NoView;
})(ViewStrategy);

exports.NoView = NoView;