System.register(['aurelia-binding'], function (_export) {
  var EventManager, _classCallCheck, ElementConfigResource;

  return {
    setters: [function (_aureliaBinding) {
      EventManager = _aureliaBinding.EventManager;
    }],
    execute: function () {
      'use strict';

      _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } };

      ElementConfigResource = (function () {
        function ElementConfigResource() {
          _classCallCheck(this, ElementConfigResource);
        }

        ElementConfigResource.prototype.load = function load(container, target) {
          var config = new target(),
              eventManager = container.get(EventManager);

          eventManager.registerElementConfig(config);
          return Promise.resolve(this);
        };

        ElementConfigResource.prototype.register = function register() {};

        return ElementConfigResource;
      })();

      _export('ElementConfigResource', ElementConfigResource);
    }
  };
});