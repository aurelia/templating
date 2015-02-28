define(["exports", "aurelia-metadata", "./behavior-instance", "./behaviors", "./content-selector", "./view-engine", "./view-strategy", "./util"], function (exports, _aureliaMetadata, _behaviorInstance, _behaviors, _contentSelector, _viewEngine, _viewStrategy, _util) {
  "use strict";

  var _prototypeProperties = function (child, staticProps, instanceProps) { if (staticProps) Object.defineProperties(child, staticProps); if (instanceProps) Object.defineProperties(child.prototype, instanceProps); };

  var _inherits = function (subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; };

  var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } };

  var Metadata = _aureliaMetadata.Metadata;
  var Origin = _aureliaMetadata.Origin;
  var ResourceType = _aureliaMetadata.ResourceType;
  var BehaviorInstance = _behaviorInstance.BehaviorInstance;
  var configureBehavior = _behaviors.configureBehavior;
  var ContentSelector = _contentSelector.ContentSelector;
  var ViewEngine = _viewEngine.ViewEngine;
  var ViewStrategy = _viewStrategy.ViewStrategy;
  var hyphenate = _util.hyphenate;

  var defaultInstruction = { suppressBind: false },
      contentSelectorFactoryOptions = { suppressBind: true },
      hasShadowDOM = !!HTMLElement.prototype.createShadowRoot,
      valuePropertyName = "value";

  var UseShadowDOM = exports.UseShadowDOM = function UseShadowDOM() {
    _classCallCheck(this, UseShadowDOM);
  };

  var SkipContentProcessing = exports.SkipContentProcessing = function SkipContentProcessing() {
    _classCallCheck(this, SkipContentProcessing);
  };

  var CustomElement = exports.CustomElement = (function (ResourceType) {
    function CustomElement(tagName) {
      _classCallCheck(this, CustomElement);

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
        configurable: true
      }
    }, {
      analyze: {
        value: function analyze(container, target) {
          var meta = Metadata.on(target);
          configureBehavior(container, this, target, valuePropertyName);

          this.configured = true;
          this.targetShadowDOM = meta.has(UseShadowDOM);
          this.skipContentProcessing = meta.has(SkipContentProcessing);
          this.usesShadowDOM = this.targetShadowDOM && hasShadowDOM;
        },
        writable: true,
        configurable: true
      },
      load: {
        value: function load(container, target, viewStrategy) {
          var _this = this;

          var options;

          viewStrategy = viewStrategy || ViewStrategy.getDefault(target);
          options = {
            targetShadowDOM: this.targetShadowDOM,
            beforeCompile: target.beforeCompile
          };

          if (!viewStrategy.moduleId) {
            viewStrategy.moduleId = Origin.get(target).moduleId;
          }

          return viewStrategy.loadViewFactory(container.get(ViewEngine), options).then(function (viewFactory) {
            _this.viewFactory = viewFactory;
            return _this;
          });
        },
        writable: true,
        configurable: true
      },
      register: {
        value: function register(registry, name) {
          registry.registerElement(name || this.name, this);
        },
        writable: true,
        configurable: true
      },
      compile: {
        value: function compile(compiler, resources, node, instruction) {
          if (!this.usesShadowDOM && !this.skipContentProcessing && node.hasChildNodes()) {
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
        value: function create(container) {
          var instruction = arguments[1] === undefined ? defaultInstruction : arguments[1];
          var element = arguments[2] === undefined ? null : arguments[2];

          var executionContext = instruction.executionContext || container.get(this.target),
              behaviorInstance = new BehaviorInstance(this, executionContext, instruction),
              host;

          if (this.viewFactory) {
            behaviorInstance.view = this.viewFactory.create(container, behaviorInstance.executionContext, instruction);
          }

          if (element) {
            element.primaryBehavior = behaviorInstance;

            if (!(this.apiName in element)) {
              element[this.apiName] = behaviorInstance.executionContext;
            }

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

          return behaviorInstance;
        },
        writable: true,
        configurable: true
      }
    });

    return CustomElement;
  })(ResourceType);

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
});