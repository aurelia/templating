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

var Behavior = require("./behavior").Behavior;
var Property = require("./behavior").Property;
var hyphenate = require("./behavior").hyphenate;
var AttachedBehavior = (function () {
  var _Behavior = Behavior;
  var AttachedBehavior = function AttachedBehavior(attribute) {
    _Behavior.call(this);
    this.attribute = attribute;
  };

  _inherits(AttachedBehavior, _Behavior);

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
    registry.registerAttribute(name || this.attribute, this, this.attribute);
  };

  AttachedBehavior.prototype.create = function (container, instruction, element, bindings) {
    var behaviorInstance = _Behavior.prototype.create.call(this, container, instruction);

    if (this.childExpression) {
      bindings.push(this.childExpression.createBinding(element, behaviorInstance.executionContext));
    }

    return behaviorInstance;
  };

  return AttachedBehavior;
})();

exports.AttachedBehavior = AttachedBehavior;