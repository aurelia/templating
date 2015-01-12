System.register(["aurelia-metadata", "./behavior-instance", "./behaviors", "./property", "./util"], function (_export) {
  "use strict";

  var ResourceType, BehaviorInstance, configureBehavior, Property, hyphenate, _prototypeProperties, _inherits, TemplateController;
  return {
    setters: [function (_aureliaMetadata) {
      ResourceType = _aureliaMetadata.ResourceType;
    }, function (_behaviorInstance) {
      BehaviorInstance = _behaviorInstance.BehaviorInstance;
    }, function (_behaviors) {
      configureBehavior = _behaviors.configureBehavior;
    }, function (_property) {
      Property = _property.Property;
    }, function (_util) {
      hyphenate = _util.hyphenate;
    }],
    execute: function () {
      _prototypeProperties = function (child, staticProps, instanceProps) {
        if (staticProps) Object.defineProperties(child, staticProps);
        if (instanceProps) Object.defineProperties(child.prototype, instanceProps);
      };

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

      TemplateController = (function (ResourceType) {
        var TemplateController = function TemplateController(attribute) {
          this.name = attribute;
          this.properties = [];
          this.attributes = {};
          this.liftsContent = true;
        };

        _inherits(TemplateController, ResourceType);

        _prototypeProperties(TemplateController, {
          convention: {
            value: function (name) {
              if (name.endsWith("TemplateController")) {
                return new TemplateController(hyphenate(name.substring(0, name.length - 18)));
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
            value: function (compiler, resources, node, instruction, parentNode) {
              if (!instruction.viewFactory) {
                var template = document.createElement("template"),
                    fragment = document.createDocumentFragment();

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
            },
            writable: true,
            enumerable: true,
            configurable: true
          },
          create: {
            value: function (container, instruction, element) {
              var executionContext = instruction.executionContext || container.get(this.target),
                  behaviorInstance = new BehaviorInstance(this.taskQueue, this.observerLocator, this, executionContext, instruction);
              element.primaryBehavior = behaviorInstance;
              return behaviorInstance;
            },
            writable: true,
            enumerable: true,
            configurable: true
          }
        });

        return TemplateController;
      })(ResourceType);
      _export("TemplateController", TemplateController);
    }
  };
});