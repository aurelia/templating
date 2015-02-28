System.register(["aurelia-metadata", "./behavior-instance", "./behaviors", "./util"], function (_export) {
  var ResourceType, BehaviorInstance, configureBehavior, hyphenate, _prototypeProperties, _inherits, _classCallCheck, TemplateController;

  return {
    setters: [function (_aureliaMetadata) {
      ResourceType = _aureliaMetadata.ResourceType;
    }, function (_behaviorInstance) {
      BehaviorInstance = _behaviorInstance.BehaviorInstance;
    }, function (_behaviors) {
      configureBehavior = _behaviors.configureBehavior;
    }, function (_util) {
      hyphenate = _util.hyphenate;
    }],
    execute: function () {
      "use strict";

      _prototypeProperties = function (child, staticProps, instanceProps) { if (staticProps) Object.defineProperties(child, staticProps); if (instanceProps) Object.defineProperties(child.prototype, instanceProps); };

      _inherits = function (subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; };

      _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } };

      TemplateController = _export("TemplateController", (function (ResourceType) {
        function TemplateController(attribute) {
          _classCallCheck(this, TemplateController);

          this.name = attribute;
          this.properties = [];
          this.attributes = {};
          this.liftsContent = true;
        }

        _inherits(TemplateController, ResourceType);

        _prototypeProperties(TemplateController, {
          convention: {
            value: function convention(name) {
              if (name.endsWith("TemplateController")) {
                return new TemplateController(hyphenate(name.substring(0, name.length - 18)));
              }
            },
            writable: true,
            configurable: true
          }
        }, {
          analyze: {
            value: function analyze(container, target) {
              configureBehavior(container, this, target);
            },
            writable: true,
            configurable: true
          },
          load: {
            value: function load(container, target) {
              return Promise.resolve(this);
            },
            writable: true,
            configurable: true
          },
          register: {
            value: function register(registry, name) {
              registry.registerAttribute(name || this.name, this, this.name);
            },
            writable: true,
            configurable: true
          },
          compile: {
            value: function compile(compiler, resources, node, instruction, parentNode) {
              if (!instruction.viewFactory) {
                var template = document.createElement("template"),
                    fragment = document.createDocumentFragment();

                node.removeAttribute(instruction.originalAttrName);

                if (node.parentNode) {
                  node.parentNode.replaceChild(template, node);
                } else if (window.ShadowDOMPolyfill) {
                  //HACK: IE template element and shadow dom polyfills not quite right...
                  ShadowDOMPolyfill.unwrap(parentNode).replaceChild(ShadowDOMPolyfill.unwrap(template), ShadowDOMPolyfill.unwrap(node));
                } else {
                  //HACK: same as above
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
            configurable: true
          },
          create: {
            value: function create(container, instruction, element) {
              var executionContext = instruction.executionContext || container.get(this.target),
                  behaviorInstance = new BehaviorInstance(this, executionContext, instruction);

              element.primaryBehavior = behaviorInstance;

              if (!(this.apiName in element)) {
                element[this.apiName] = behaviorInstance.executionContext;
              }

              return behaviorInstance;
            },
            writable: true,
            configurable: true
          }
        });

        return TemplateController;
      })(ResourceType));
    }
  };
});