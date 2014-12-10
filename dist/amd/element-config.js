define(["exports", "aurelia-metadata", "aurelia-binding"], function (exports, _aureliaMetadata, _aureliaBinding) {
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

  var ResourceType = _aureliaMetadata.ResourceType;
  var EventManager = _aureliaBinding.EventManager;
  var ElementConfig = (function (ResourceType) {
    var ElementConfig = function ElementConfig(tagName) {
      this.tagName = tagName;
    };

    _extends(ElementConfig, ResourceType);

    ElementConfig.prototype.load = function (container, target) {
      var config = target(), eventManager = container.get(EventManager);

      eventManager.registerElementConfig(this.tagName, config);
    };

    ElementConfig.prototype.register = function () {};

    return ElementConfig;
  })(ResourceType);

  exports.ElementConfig = ElementConfig;
});