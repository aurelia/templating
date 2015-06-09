'use strict';

exports.__esModule = true;

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var _aureliaBinding = require('aurelia-binding');

var ElementConfigResource = (function () {
  function ElementConfigResource() {
    _classCallCheck(this, ElementConfigResource);
  }

  ElementConfigResource.prototype.load = function load(container, target) {
    var config = new target(),
        eventManager = container.get(_aureliaBinding.EventManager);

    eventManager.registerElementConfig(config);
    return Promise.resolve(this);
  };

  ElementConfigResource.prototype.register = function register() {};

  return ElementConfigResource;
})();

exports.ElementConfigResource = ElementConfigResource;