"use strict";

var _prototypeProperties = function (child, staticProps, instanceProps) {
  if (staticProps) Object.defineProperties(child, staticProps);
  if (instanceProps) Object.defineProperties(child.prototype, instanceProps);
};

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
var BehaviorInstance = require("./behavior-instance").BehaviorInstance;
var configureBehavior = require("./behaviors").configureBehavior;
var Property = require("./property").Property;
var hyphenate = require("./util").hyphenate;
var AttachedBehavior = (function (ResourceType) {
  var AttachedBehavior = function AttachedBehavior(attribute) {
    this.name = attribute;
    this.properties = [];
    this.attributes = {};
  };

  _inherits(AttachedBehavior, ResourceType);

  _prototypeProperties(AttachedBehavior, {
    convention: {
      value: function (name) {
        if (name.endsWith("AttachedBehavior")) {
          return new AttachedBehavior(hyphenate(name.substring(0, name.length - 16)));
        }
      },
      writable: true,
      enumerable: true,
      configurable: true
    }
  }, {
    load: {
      value: function (container, target) {
        configureBehavior(this, container, target);

        if (this.properties.length === 0 && "valueChanged" in target.prototype) {
          new Property("value", "valueChanged", this.name).configureBehavior(this);
        }

        return Promise.resolve(this);
      },
      writable: true,
      enumerable: true,
      configurable: true
    },
    register: {
      value: function (registry, name) {
        registry.registerAttribute(name || this.name, this, this.name);
      },
      writable: true,
      enumerable: true,
      configurable: true
    },
    compile: {
      value: function (compiler, resources, node, instruction) {
        instruction.suppressBind = true;
        return node;
      },
      writable: true,
      enumerable: true,
      configurable: true
    },
    create: {
      value: function (container, instruction, element, bindings) {
        var executionContext = instruction.executionContext || container.get(this.target),
            behaviorInstance = new BehaviorInstance(this.taskQueue, this.observerLocator, this, executionContext, instruction);

        if (this.childExpression) {
          bindings.push(this.childExpression.createBinding(element, behaviorInstance.executionContext));
        }

        return behaviorInstance;
      },
      writable: true,
      enumerable: true,
      configurable: true
    }
  });

  return AttachedBehavior;
})(ResourceType);

exports.AttachedBehavior = AttachedBehavior;