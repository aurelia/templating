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
var TemplateController = (function () {
  var _Behavior = Behavior;
  var TemplateController = function TemplateController(attribute) {
    _Behavior.call(this);
    this.attribute = attribute;
    this.liftsContent = true;
  };

  _inherits(TemplateController, _Behavior);

  TemplateController.convention = function (name) {
    if (name.endsWith("TemplateController")) {
      return new TemplateController(hyphenate(name.substring(0, name.length - 18)));
    }
  };

  TemplateController.prototype.load = function (container, target) {
    this.setTarget(container, target);

    if (!this.attribute) {
      this.attribute = hyphenate(target.name);
    }

    if (this.properties.length === 0 && "valueChanged" in target.prototype) {
      this.configureProperty(new Property("value", "valueChanged", this.attribute));
    }

    return Promise.resolve(this);
  };

  TemplateController.prototype.register = function (registry, name) {
    registry.registerAttribute(name || this.attribute, this, this.attribute);
  };

  TemplateController.prototype.compile = function (compiler, resources, node, instruction, parentNode) {
    if (!instruction.viewFactory) {
      var template = document.createElement("template"), fragment = document.createDocumentFragment();

      node.removeAttribute(instruction.originalAttrName);

      if (node.parentNode) {
        node.parentNode.replaceChild(template, node);
      } else if (window.ShadowDOMPolyfill) {
        ShadowDOMPolyfill.unwrap(parentNode).replaceChild(ShadowDOMPolyfill.unwrap(template), ShadowDOMPolyfill.unwrap(node));
      } else {
        parentNode.replaceChild(template, node);
      }

      fragment.appendChild(node);

      instruction.viewFactory = compiler.compile(fragment, resources);
      node = template;
    }

    instruction.suppressBind = true;

    return node;
  };

  TemplateController.prototype.create = function (container, instruction, element) {
    var behaviorInstance = _Behavior.prototype.create.call(this, container, instruction, element);
    element.primaryBehavior = behaviorInstance;
    return behaviorInstance;
  };

  return TemplateController;
})();

exports.TemplateController = TemplateController;