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

var ResourceType = require('aurelia-metadata').ResourceType;
var EventManager = require('aurelia-binding').EventManager;
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