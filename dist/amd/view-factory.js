define(["exports", "aurelia-dependency-injection", "./view", "./view-slot", "./content-selector", "./resource-registry"], function (exports, _aureliaDependencyInjection, _view, _viewSlot, _contentSelector, _resourceRegistry) {
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

  var Container = _aureliaDependencyInjection.Container;
  var View = _view.View;
  var ViewSlot = _viewSlot.ViewSlot;
  var ContentSelector = _contentSelector.ContentSelector;
  var ViewResources = _resourceRegistry.ViewResources;
  var BehaviorContainer = (function (Container) {
    var BehaviorContainer = function BehaviorContainer() {
      Container.apply(this, arguments);
    };

    _extends(BehaviorContainer, Container);

    BehaviorContainer.prototype.get = function (key) {
      if (key === Element) {
        return this.element;
      }

      if (key === BoundViewFactory) {
        return this.boundViewFactory || (this.boundViewFactory = new BoundViewFactory(this, this.instruction.viewFactory, this.executionContext));
      }

      if (key === ViewSlot) {
        if (this.viewSlot === undefined) {
          this.viewSlot = new ViewSlot(this.element, this.instruction.anchorIsContainer, this.executionContext);
          this.children.push(this.viewSlot);
        }

        return this.viewSlot;
      }

      if (key === ViewResources) {
        return this.viewResources;
      }

      return Container.prototype.get.call(this, key);
    };

    return BehaviorContainer;
  })(Container);

  function applyInstructions(containers, executionContext, element, instruction, behaviors, bindings, children, contentSelectors, resources) {
    var behaviorInstructions = instruction.behaviorInstructions, elementContainer;

    if (instruction.contentExpression) {
      bindings.push(instruction.contentExpression.createBinding(element.nextSibling));
      element.parentNode.removeChild(element);
      return;
    }

    if (instruction.contentSelector) {
      contentSelectors.push(new ContentSelector(element, instruction.selector));
      return;
    }

    if (behaviorInstructions.length) {
      containers[instruction.injectorId] = elementContainer = containers[instruction.parentInjectorId].createTypedChild(BehaviorContainer);

      elementContainer.element = element;
      elementContainer.instruction = instruction;
      elementContainer.executionContext = executionContext;
      elementContainer.children = children;
      elementContainer.viewResources = resources;
      elementContainer.autoRegisterAll(instruction.providers);

      behaviorInstructions.forEach(function (behaviorInstruction) {
        var instance = behaviorInstruction.type.create(elementContainer, behaviorInstruction, element, bindings);

        if (instance.contentView) {
          children.push(instance.contentView);
        }

        behaviors.push(instance);
      });
    }

    instruction.expressions.forEach(function (exp) {
      return bindings.push(exp.createBinding(element));
    });
  }

  var BoundViewFactory = (function () {
    var BoundViewFactory = function BoundViewFactory(parentContainer, viewFactory, executionContext) {
      this.parentContainer = parentContainer;
      this.viewFactory = viewFactory;
      this.executionContext = executionContext;
      this.factoryOptions = { behaviorInstance: false };
    };

    BoundViewFactory.prototype.create = function (executionContext) {
      var childContainer = this.parentContainer.createChild(), context = executionContext || this.executionContext;

      this.factoryOptions.systemControlled = !executionContext;

      return this.viewFactory.create(childContainer, context, this.factoryOptions);
    };

    return BoundViewFactory;
  })();

  exports.BoundViewFactory = BoundViewFactory;


  var defaultFactoryOptions = {
    systemControlled: false,
    suppressBind: false
  };

  var ViewFactory = (function () {
    var ViewFactory = function ViewFactory(template, instructions, resources) {
      this.template = template;
      this.instructions = instructions;
      this.resources = resources;
    };

    ViewFactory.prototype.create = function (container, executionContext, options) {
      var _this = this;
      if (options === undefined) options = defaultFactoryOptions;
      return (function () {
        var fragment = _this.template.cloneNode(true), instructables = fragment.querySelectorAll(".ai-target"), instructions = _this.instructions, resources = _this.resources, behaviors = [], bindings = [], children = [], contentSelectors = [], containers = { root: container };

        for (var i = 0, ii = instructables.length; i < ii; i++) {
          applyInstructions(containers, executionContext, instructables[i], instructions[i], behaviors, bindings, children, contentSelectors, resources);
        }

        var view = new View(fragment, behaviors, bindings, children, options.systemControlled, contentSelectors);

        view.created(executionContext);

        if (!options.suppressBind) {
          view.bind(executionContext);
        }

        return view;
      })();
    };

    return ViewFactory;
  })();

  exports.ViewFactory = ViewFactory;
});