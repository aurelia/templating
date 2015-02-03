System.register(["aurelia-metadata", "aurelia-binding"], function (_export) {
  "use strict";

  var ResourceType, EventManager, _prototypeProperties, _inherits, ElementConfig;
  return {
    setters: [function (_aureliaMetadata) {
      ResourceType = _aureliaMetadata.ResourceType;
    }, function (_aureliaBinding) {
      EventManager = _aureliaBinding.EventManager;
    }],
    execute: function () {
      _prototypeProperties = function (child, staticProps, instanceProps) { if (staticProps) Object.defineProperties(child, staticProps); if (instanceProps) Object.defineProperties(child.prototype, instanceProps); };

      _inherits = function (subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; };

      ElementConfig = _export("ElementConfig", (function (ResourceType) {
        function ElementConfig() {
          if (Object.getPrototypeOf(ElementConfig) !== null) {
            Object.getPrototypeOf(ElementConfig).apply(this, arguments);
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
      })(ResourceType));
    }
  };
});