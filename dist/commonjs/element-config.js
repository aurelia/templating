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

var ResourceType = require("aurelia-metadata").ResourceType;
var EventManager = require("aurelia-binding").EventManager;
var ElementConfig = (function () {
  var _ResourceType = ResourceType;
  var ElementConfig = function ElementConfig(tagName) {
    this.tagName = tagName;
  };

  _inherits(ElementConfig, _ResourceType);

  ElementConfig.prototype.load = function (container, target) {
    var config = target(), eventManager = container.get(EventManager);

    eventManager.registerElementConfig(this.tagName, config);
  };

  ElementConfig.prototype.register = function () {};

  return ElementConfig;
})();

exports.ElementConfig = ElementConfig;