System.register(["./view-strategy", "./resource-coordinator", "./view-engine", "./custom-element"], function (_export) {
  "use strict";

  var ViewStrategy, UseView, ResourceCoordinator, ViewEngine, CustomElement, CompositionEngine;
  return {
    setters: [function (_viewStrategy) {
      ViewStrategy = _viewStrategy.ViewStrategy;
      UseView = _viewStrategy.UseView;
    }, function (_resourceCoordinator) {
      ResourceCoordinator = _resourceCoordinator.ResourceCoordinator;
    }, function (_viewEngine) {
      ViewEngine = _viewEngine.ViewEngine;
    }, function (_customElement) {
      CustomElement = _customElement.CustomElement;
    }],
    execute: function () {
      CompositionEngine = function CompositionEngine(resourceCoordinator, viewEngine) {
        this.resourceCoordinator = resourceCoordinator;
        this.viewEngine = viewEngine;
      };

      CompositionEngine.inject = function () {
        return [ResourceCoordinator, ViewEngine];
      };

      CompositionEngine.prototype.bindAndSwap = function (viewSlot, next, current) {
        next.bind(next.executionContext);
        viewSlot.swap(next.view);

        if (current) {
          current.unbind();
        }

        return next;
      };

      CompositionEngine.prototype.activateViewModel = function (viewModel, model) {
        if (typeof viewModel.activate === "function") {
          return viewModel.activate(model) || Promise.resolve();
        } else {
          return Promise.resolve();
        }
      };

      CompositionEngine.prototype.createBehavior = function (instruction, container, viewModelInfo) {
        var _this = this;
        return this.activateViewModel(instruction.viewModel, instruction.model).then(function () {
          var doneLoading;

          if ("getViewStrategy" in instruction.viewModel && !instruction.view) {
            instruction.view = ViewStrategy.normalize(instruction.viewModel.getViewStrategy());
          }

          if (viewModelInfo) {
            doneLoading = viewModelInfo.type.load(container, viewModelInfo.value, instruction.view);
          } else {
            doneLoading = new CustomElement().load(container, instruction.viewModel.constructor, instruction.view);
          }

          return doneLoading.then(function (behaviorType) {
            var behavior = behaviorType.create(container, { executionContext: instruction.viewModel, suppressBind: true });
            return _this.bindAndSwap(instruction.viewSlot, behavior, instruction.currentBehavior);
          });
        });
      };

      CompositionEngine.prototype.compose = function (instruction) {
        var _this2 = this;
        var childContainer;

        instruction.view = ViewStrategy.normalize(instruction.view);

        if (typeof instruction.viewModel === "string") {
          instruction.viewModel = instruction.viewResources.relativeToView(instruction.viewModel);

          return this.resourceCoordinator.loadViewModelInfo(instruction.viewModel).then(function (viewModelInfo) {
            childContainer = instruction.container.createChild();
            childContainer.autoRegister(viewModelInfo.value);
            instruction.viewModel = childContainer.get(viewModelInfo.value);
            return _this2.createBehavior(instruction, childContainer, viewModelInfo);
          });
        } else {
          if (instruction.viewModel) {
            return this.createBehavior(instruction, instruction.container.createChild());
          } else if (instruction.view) {
            return instruction.view.loadViewFactory(this.viewEngine).then(function (viewFactory) {
              childContainer = instruction.container.createChild();
              result = viewFactory.create(childContainer, instruction.executionContext);
              instruction.viewSlot.swap(result);
            });
          }
        }
      };

      _export("CompositionEngine", CompositionEngine);
    }
  };
});