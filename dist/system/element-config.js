System.register(["aurelia-metadata", "aurelia-binding"], function (_export) {
  "use strict";

  var ResourceType, EventManager, _inherits, ElementConfig;
  return {
    setters: [function (_aureliaMetadata) {
      ResourceType = _aureliaMetadata.ResourceType;
    }, function (_aureliaBinding) {
      EventManager = _aureliaBinding.EventManager;
    }],
    execute: function () {
      _inherits = function (child, parent) {
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

      ElementConfig = (function () {
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
      _export("ElementConfig", ElementConfig);
    }
  };
});