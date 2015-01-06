define(["exports", "aurelia-metadata", "./behavior", "./content-selector", "./view-engine", "./view-strategy"], function (exports, _aureliaMetadata, _behavior, _contentSelector, _viewEngine, _viewStrategy) {
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

  var getAnnotation = _aureliaMetadata.getAnnotation;
  var Origin = _aureliaMetadata.Origin;
  var Behavior = _behavior.Behavior;
  var hyphenate = _behavior.hyphenate;
  var ContentSelector = _contentSelector.ContentSelector;
  var ViewEngine = _viewEngine.ViewEngine;
  var ViewStrategy = _viewStrategy.ViewStrategy;


  var defaultInstruction = { suppressBind: false }, contentSelectorFactoryOptions = { suppressBind: true }, hasShadowDOM = !!HTMLElement.prototype.createShadowRoot;

  var UseShadowDOM = function UseShadowDOM() {};

  exports.UseShadowDOM = UseShadowDOM;
  var CustomElement = (function () {
    var _Behavior = Behavior;
    var CustomElement = function CustomElement(tagName) {
      _Behavior.call(this);
      this.tagName = tagName;
    };

    _inherits(CustomElement, _Behavior);

    CustomElement.convention = function (name) {
      if (name.endsWith("CustomElement")) {
        return new CustomElement(hyphenate(name.substring(0, name.length - 13)));
      }
    };

    CustomElement.prototype.load = function (container, target, viewStrategy) {
      var _this = this;
      var annotation, options;

      this.setTarget(container, target);

      this.targetShadowDOM = getAnnotation(target, UseShadowDOM) !== null;
      this.usesShadowDOM = this.targetShadowDOM && hasShadowDOM;

      if (!this.tagName) {
        this.tagName = hyphenate(target.name);
      }

      if (typeof viewStrategy === "string") {
        viewStrategy = new UseView(viewStrategy);
      }

      if (viewStrategy) {
        viewStrategy.moduleId = Origin.get(target).moduleId;
      }

      viewStrategy = viewStrategy || ViewStrategy.getDefault(target);
      options = { targetShadowDOM: this.targetShadowDOM };

      return viewStrategy.loadViewFactory(container.get(ViewEngine), options).then(function (viewFactory) {
        _this.viewFactory = viewFactory;
        return _this;
      });
    };

    CustomElement.prototype.register = function (registry, name) {
      registry.registerElement(name || this.tagName, this);
    };

    CustomElement.prototype.compile = function (compiler, resources, node, instruction) {
      if (!this.usesShadowDOM && node.hasChildNodes()) {
        var fragment = document.createDocumentFragment(), currentChild = node.firstChild, nextSibling;

        while (currentChild) {
          nextSibling = currentChild.nextSibling;
          fragment.appendChild(currentChild);
          currentChild = nextSibling;
        }

        instruction.contentFactory = compiler.compile(fragment, resources);
      }

      instruction.suppressBind = true;

      return node;
    };

    CustomElement.prototype.create = function (container) {
      var _this2 = this;
      var instruction = arguments[1] === undefined ? defaultInstruction : arguments[1];
      var element = arguments[2] === undefined ? null : arguments[2];
      return (function () {
        var behaviorInstance = _Behavior.prototype.create.call(_this2, container, instruction), host;

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
    };

    return CustomElement;
  })();

  exports.CustomElement = CustomElement;
});