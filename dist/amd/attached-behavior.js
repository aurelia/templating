define(["exports", "./behavior"], function (exports, _behavior) {
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

  var Behavior = _behavior.Behavior;
  var Property = _behavior.Property;
  var hyphenate = _behavior.hyphenate;
  var AttachedBehavior = (function (Behavior) {
    var AttachedBehavior = function AttachedBehavior(attribute) {
      Behavior.call(this);
      this.attribute = attribute;
    };

    _extends(AttachedBehavior, Behavior);

    AttachedBehavior.convention = function (name) {
      if (name.endsWith("AttachedBehavior")) {
        return new AttachedBehavior(hyphenate(name.substring(0, name.length - 16)));
      }
    };

    AttachedBehavior.prototype.load = function (container, target) {
      this.setTarget(container, target);

      if (!this.attribute) {
        this.attribute = hyphenate(target.name);
      }

      if (this.properties.length === 0 && "valueChanged" in target.prototype) {
        this.configureProperty(new Property("value", "valueChanged", this.attribute));
      }

      return Promise.resolve(this);
    };

    AttachedBehavior.prototype.register = function (registry, name) {
      registry.registerAttribute(name || this.attribute, this);
    };

    AttachedBehavior.prototype.create = function (container, instruction, element, bindings) {
      var behaviorInstance = Behavior.prototype.create.call(this, container, instruction);

      if (this.childExpression) {
        bindings.push(this.childExpression.createBinding(element, behaviorInstance.executionContext));
      }

      return behaviorInstance;
    };

    return AttachedBehavior;
  })(Behavior);

  exports.AttachedBehavior = AttachedBehavior;
});