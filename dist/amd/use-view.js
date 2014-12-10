define(["exports"], function (exports) {
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

  var UseView = (function () {
    var UseView = function UseView(path) {
      this.path = path;
    };

    UseView.prototype.loadViewFactory = function (viewEngine, options) {
      return viewEngine.loadViewFactory(this.path, options);
    };

    return UseView;
  })();

  exports.UseView = UseView;
  var ConventionalView = (function (UseView) {
    var ConventionalView = function ConventionalView(moduleId) {
      UseView.call(this);
      this.moduleId = moduleId;
    };

    _extends(ConventionalView, UseView);

    ConventionalView.prototype.loadViewFactory = function (viewEngine, options) {
      return viewEngine.loadViewFactoryForModuleId(this.moduleId, options);
    };

    return ConventionalView;
  })(UseView);

  exports.ConventionalView = ConventionalView;
  var NoView = (function (UseView) {
    var NoView = function NoView() {
      UseView.call(this);
    };

    _extends(NoView, UseView);

    NoView.prototype.loadViewFactory = function () {
      return Promise.resolve(null);
    };

    return NoView;
  })(UseView);

  exports.NoView = NoView;
});