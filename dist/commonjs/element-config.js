"use strict";

var _prototypeProperties = function (child, staticProps, instanceProps) { if (staticProps) Object.defineProperties(child, staticProps); if (instanceProps) Object.defineProperties(child.prototype, instanceProps); };

var _inherits = function (subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; };

var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } };

var ResourceType = require("aurelia-metadata").ResourceType;

var EventManager = require("aurelia-binding").EventManager;

var ElementConfig = exports.ElementConfig = (function (ResourceType) {
  function ElementConfig() {
    _classCallCheck(this, ElementConfig);

    if (ResourceType != null) {
      ResourceType.apply(this, arguments);
    }
  }

  _inherits(ElementConfig, ResourceType);

  _prototypeProperties(ElementConfig, null, {
    load: {
      value: function load(container, target) {
        var config = new target(),
            eventManager = container.get(EventManager);

        eventManager.registerElementConfig(config);
      },
      writable: true,
      configurable: true
    },
    register: {
      value: function register() {},
      writable: true,
      configurable: true
    }
  });

  return ElementConfig;
})(ResourceType);

Object.defineProperty(exports, "__esModule", {
  value: true
});