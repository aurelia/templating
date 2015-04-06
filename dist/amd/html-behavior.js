define(["exports", "aurelia-metadata", "aurelia-binding", "aurelia-task-queue", "./view-strategy", "./view-engine", "./content-selector", "./util", "./bindable-property", "./behavior-instance"], function (exports, _aureliaMetadata, _aureliaBinding, _aureliaTaskQueue, _viewStrategy, _viewEngine, _contentSelector, _util, _bindableProperty, _behaviorInstance) {
  "use strict";

  var _prototypeProperties = function (child, staticProps, instanceProps) { if (staticProps) Object.defineProperties(child, staticProps); if (instanceProps) Object.defineProperties(child.prototype, instanceProps); };

  var _inherits = function (subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; };

  var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } };

  var Metadata = _aureliaMetadata.Metadata;
  var Origin = _aureliaMetadata.Origin;
  var ResourceType = _aureliaMetadata.ResourceType;
  var ObserverLocator = _aureliaBinding.ObserverLocator;
  var TaskQueue = _aureliaTaskQueue.TaskQueue;
  var ViewStrategy = _viewStrategy.ViewStrategy;
  var ViewEngine = _viewEngine.ViewEngine;
  var ContentSelector = _contentSelector.ContentSelector;
  var hyphenate = _util.hyphenate;
  var BindableProperty = _bindableProperty.BindableProperty;
  var BehaviorInstance = _behaviorInstance.BehaviorInstance;

  var defaultInstruction = { suppressBind: false },
      contentSelectorFactoryOptions = { suppressBind: true },
      hasShadowDOM = !!HTMLElement.prototype.createShadowRoot;

  var HtmlBehaviorResource = exports.HtmlBehaviorResource = (function (ResourceType) {
    function HtmlBehaviorResource() {
      _classCallCheck(this, HtmlBehaviorResource);

      this.elementName = null;
      this.attributeName = null;
      this.liftsContent = false;
      this.targetShadowDOM = false;
      this.skipContentProcessing = false;
      this.usesShadowDOM = false;
      this.childExpression = null;
      this.hasDynamicOptions = false;
      this.properties = [];
      this.attributes = {};
    }

    _inherits(HtmlBehaviorResource, ResourceType);

    _prototypeProperties(HtmlBehaviorResource, {
      convention: {
        value: function convention(name, existing) {
          var behavior;

          if (name.endsWith("CustomAttribute")) {
            behavior = existing || new HtmlBehaviorResource();
            behavior.attributeName = hyphenate(name.substring(0, name.length - 15));
          }

          if (name.endsWith("CustomElement")) {
            behavior = existing || new HtmlBehaviorResource();
            behavior.elementName = hyphenate(name.substring(0, name.length - 13));
          }

          return behavior;
        },
        writable: true,
        configurable: true
      }
    }, {
      analyze: {
        value: function analyze(container, target) {
          var proto = target.prototype,
              properties = this.properties,
              attributeName = this.attributeName,
              i,
              ii,
              current;

          this.observerLocator = container.get(ObserverLocator);
          this.taskQueue = container.get(TaskQueue);

          this.target = target;
          this.usesShadowDOM = this.targetShadowDOM && hasShadowDOM;
          this.handlesCreated = "created" in proto;
          this.handlesBind = "bind" in proto;
          this.handlesUnbind = "unbind" in proto;
          this.handlesAttached = "attached" in proto;
          this.handlesDetached = "detached" in proto;
          this.apiName = (this.elementName || this.attributeName).replace(/-([a-z])/g, function (m, w) {
            return w.toUpperCase();
          });

          if (attributeName !== null) {
            if (properties.length === 0) {
              //default for custom attributes
              new BindableProperty({
                name: "value",
                changeHandler: "valueChanged" in proto ? "valueChanged" : null,
                attribute: attributeName
              }).registerWith(target, this);
            }

            if (properties.length === 1) {
              //default for custom attributes
              current = properties[0];
              current.isDynamic = this.hasDynamicOptions;
              current.defineOn(target, this);
            } else {
              //custom attribute with options
              for (i = 0, ii = properties.length; i < ii; ++i) {
                properties[i].defineOn(target, this);
              }

              current = new BindableProperty({
                name: "value",
                changeHandler: "valueChanged" in proto ? "valueChanged" : null,
                attribute: attributeName
              });

              current.hasOptions = true;
              current.registerWith(target, this);
            }
          } else {
            for (i = 0, ii = properties.length; i < ii; ++i) {
              properties[i].defineOn(target, this);
            }
          }
        },
        writable: true,
        configurable: true
      },
      load: {
        value: function load(container, target, viewStrategy, transientView) {
          var _this = this;

          var options;

          if (this.elementName !== null) {
            viewStrategy = viewStrategy || this.viewStrategy || ViewStrategy.getDefault(target);
            options = {
              targetShadowDOM: this.targetShadowDOM,
              beforeCompile: target.beforeCompile
            };

            if (!viewStrategy.moduleId) {
              viewStrategy.moduleId = Origin.get(target).moduleId;
            }

            return viewStrategy.loadViewFactory(container.get(ViewEngine), options).then(function (viewFactory) {
              if (!transientView) {
                _this.viewFactory = viewFactory;
              }

              return viewFactory;
            });
          }

          return Promise.resolve(this);
        },
        writable: true,
        configurable: true
      },
      register: {
        value: function register(registry, name) {
          if (this.attributeName !== null) {
            registry.registerAttribute(name || this.attributeName, this, this.attributeName);
          }

          if (this.elementName !== null) {
            registry.registerElement(name || this.elementName, this);
          }
        },
        writable: true,
        configurable: true
      },
      compile: {
        value: function compile(compiler, resources, node, instruction) {
          if (this.liftsContent) {
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
          } else if (this.elementName !== null && !this.usesShadowDOM && !this.skipContentProcessing && node.hasChildNodes()) {
            //custom element
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
        configurable: true
      },
      create: {
        value: function create(container, _x, _x2, bindings) {
          var instruction = arguments[1] === undefined ? defaultInstruction : arguments[1];
          var element = arguments[2] === undefined ? null : arguments[2];

          var executionContext = instruction.executionContext || container.get(this.target),
              behaviorInstance = new BehaviorInstance(this, executionContext, instruction),
              viewFactory,
              host;

          if (this.liftsContent) {
            //template controller
            element.primaryBehavior = behaviorInstance;
          } else if (this.elementName !== null) {
            //custom element
            viewFactory = instruction.viewFactory || this.viewFactory;

            if (viewFactory) {
              behaviorInstance.view = viewFactory.create(container, behaviorInstance.executionContext, instruction);
            }

            if (element) {
              element.primaryBehavior = behaviorInstance;

              if (behaviorInstance.view) {
                if (this.usesShadowDOM) {
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

                if (this.childExpression) {
                  behaviorInstance.view.addBinding(this.childExpression.createBinding(host, behaviorInstance.executionContext));
                }

                behaviorInstance.view.appendNodesTo(host);
              }
            } else if (behaviorInstance.view) {
              behaviorInstance.view.owner = behaviorInstance;
            }
          } else if (this.childExpression) {
            //custom attribute
            bindings.push(this.childExpression.createBinding(element, behaviorInstance.executionContext));
          }

          if (element && !(this.apiName in element)) {
            element[this.apiName] = behaviorInstance.executionContext;
          }

          return behaviorInstance;
        },
        writable: true,
        configurable: true
      },
      ensurePropertiesDefined: {
        value: function ensurePropertiesDefined(instance, lookup) {
          var properties, i, ii, observer;

          if ("__propertiesDefined__" in lookup) {
            return;
          }

          lookup.__propertiesDefined__ = true;
          properties = this.properties;

          for (i = 0, ii = properties.length; i < ii; ++i) {
            observer = properties[i].createObserver(instance);

            if (observer !== undefined) {
              lookup[observer.propertyName] = observer;
            }
          }
        },
        writable: true,
        configurable: true
      }
    });

    return HtmlBehaviorResource;
  })(ResourceType);

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
});