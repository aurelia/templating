System.register(["aurelia-metadata", "./behavior-instance", "./behaviors", "./content-selector", "./view-engine", "./view-strategy", "./util"], function (_export) {
  "use strict";

  var Metadata, Origin, ResourceType, BehaviorInstance, configureBehavior, ContentSelector, ViewEngine, ViewStrategy, hyphenate, _prototypeProperties, _inherits, defaultInstruction, contentSelectorFactoryOptions, hasShadowDOM, valuePropertyName, UseShadowDOM, CustomElement;
  return {
    setters: [function (_aureliaMetadata) {
      Metadata = _aureliaMetadata.Metadata;
      Origin = _aureliaMetadata.Origin;
      ResourceType = _aureliaMetadata.ResourceType;
    }, function (_behaviorInstance) {
      BehaviorInstance = _behaviorInstance.BehaviorInstance;
    }, function (_behaviors) {
      configureBehavior = _behaviors.configureBehavior;
    }, function (_contentSelector) {
      ContentSelector = _contentSelector.ContentSelector;
    }, function (_viewEngine) {
      ViewEngine = _viewEngine.ViewEngine;
    }, function (_viewStrategy) {
      ViewStrategy = _viewStrategy.ViewStrategy;
    }, function (_util) {
      hyphenate = _util.hyphenate;
    }],
    execute: function () {
      _prototypeProperties = function (child, staticProps, instanceProps) {
        if (staticProps) Object.defineProperties(child, staticProps);
        if (instanceProps) Object.defineProperties(child.prototype, instanceProps);
      };

      _inherits = function (subClass, superClass) {
        if (typeof superClass !== "function" && superClass !== null) {
          throw new TypeError("Super expression must either be null or a function, not " + typeof superClass);
        }
        subClass.prototype = Object.create(superClass && superClass.prototype, {
          constructor: {
            value: subClass,
            enumerable: false,
            writable: true,
            configurable: true
          }
        });
        if (superClass) subClass.__proto__ = superClass;
      };

      defaultInstruction = { suppressBind: false };
      contentSelectorFactoryOptions = { suppressBind: true };
      hasShadowDOM = !!HTMLElement.prototype.createShadowRoot;
      valuePropertyName = "value";
      UseShadowDOM = function UseShadowDOM() {};

      _export("UseShadowDOM", UseShadowDOM);

      CustomElement = (function (ResourceType) {
        function CustomElement(tagName) {
          this.name = tagName;
          this.properties = [];
          this.attributes = {};
        }

        _inherits(CustomElement, ResourceType);

        _prototypeProperties(CustomElement, {
          convention: {
            value: function convention(name) {
              if (name.endsWith("CustomElement")) {
                return new CustomElement(hyphenate(name.substring(0, name.length - 13)));
              }
            },
            writable: true,
            enumerable: true,
            configurable: true
          }
        }, {
          load: {
            value: function load(container, target, viewStrategy) {
              var _this = this;
              var annotation, options;

              configureBehavior(container, this, target, valuePropertyName);

              this.targetShadowDOM = Metadata.on(target).has(UseShadowDOM);
              this.usesShadowDOM = this.targetShadowDOM && hasShadowDOM;

              viewStrategy = viewStrategy || ViewStrategy.getDefault(target);
              options = { targetShadowDOM: this.targetShadowDOM };

              if (!viewStrategy.moduleId) {
                viewStrategy.moduleId = Origin.get(target).moduleId;
              }

              return viewStrategy.loadViewFactory(container.get(ViewEngine), options).then(function (viewFactory) {
                _this.viewFactory = viewFactory;
                return _this;
              });
            },
            writable: true,
            enumerable: true,
            configurable: true
          },
          register: {
            value: function register(registry, name) {
              registry.registerElement(name || this.name, this);
            },
            writable: true,
            enumerable: true,
            configurable: true
          },
          compile: {
            value: function compile(compiler, resources, node, instruction) {
              if (!this.usesShadowDOM && node.hasChildNodes()) {
                var fragment = document.createDocumentFragment(),
                    currentChild = node.firstChild,
                    nextSibling;

                while (currentChild) {
                  nextSibling = currentChild.nextSibling;
                  fragment.appendChild(currentChild);
                  currentChild = nextSibling;
                }

                instruction.contentFactory = compiler.compile(fragment, resources);
              }

              instruction.suppressBind = true;

              return node;
            },
            writable: true,
            enumerable: true,
            configurable: true
          },
          create: {
            value: function create(container) {
              var _this2 = this;
              var instruction = arguments[1] === undefined ? defaultInstruction : arguments[1];
              var element = arguments[2] === undefined ? null : arguments[2];
              return (function () {
                var executionContext = instruction.executionContext || container.get(_this2.target),
                    behaviorInstance = new BehaviorInstance(_this2, executionContext, instruction),
                    host;

                if (_this2.viewFactory) {
                  behaviorInstance.view = _this2.viewFactory.create(container, behaviorInstance.executionContext, instruction);
                }

                if (element) {
                  element.elementBehavior = behaviorInstance;
                  element.primaryBehavior = behaviorInstance;

                  if (behaviorInstance.view) {
                    if (_this2.usesShadowDOM) {
                      host = element.createShadowRoot();
                    } else {
                      host = element;

                      if (instruction.contentFactory) {
                        var contentView = instruction.contentFactory.create(container, null, contentSelectorFactoryOptions);

                        ContentSelector.applySelectors(contentView, behaviorInstance.view.contentSelectors, function (contentSelector, group) {
                          return contentSelector.add(group);
                        });

                        behaviorInstance.contentView = contentView;
                      }
                    }

                    if (_this2.childExpression) {
                      behaviorInstance.view.addBinding(_this2.childExpression.createBinding(host, behaviorInstance.executionContext));
                    }

                    behaviorInstance.view.appendNodesTo(host);
                  }
                } else if (behaviorInstance.view) {
                  behaviorInstance.view.owner = behaviorInstance;
                }

                return behaviorInstance;
              })();
            },
            writable: true,
            enumerable: true,
            configurable: true
          }
        });

        return CustomElement;
      })(ResourceType);
      _export("CustomElement", CustomElement);
    }
  };
});