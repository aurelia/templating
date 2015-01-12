System.register(["./view-strategy", "./resource-coordinator", "./view-engine", "./custom-element"], function (_export) {
  "use strict";

  var ViewStrategy, UseView, ResourceCoordinator, ViewEngine, CustomElement, _prototypeProperties, CompositionEngine;
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
      _prototypeProperties = function (child, staticProps, instanceProps) {
        if (staticProps) Object.defineProperties(child, staticProps);
        if (instanceProps) Object.defineProperties(child.prototype, instanceProps);
      };

      CompositionEngine = (function () {
        var CompositionEngine = function CompositionEngine(resourceCoordinator, viewEngine) {
          this.resourceCoordinator = resourceCoordinator;
          this.viewEngine = viewEngine;
        };

        _prototypeProperties(CompositionEngine, {
          inject: {
            value: function () {
              return [ResourceCoordinator, ViewEngine];
            },
            writable: true,
            enumerable: true,
            configurable: true
          }
        }, {
          activate: {
            value: function (instruction) {
              if (instruction.skipActivation || typeof instruction.viewModel.activate !== "function") {
                return Promise.resolve();
              }

              return instruction.viewModel.activate(instruction.model) || Promise.resolve();
            },
            writable: true,
            enumerable: true,
            configurable: true
          },
          createBehaviorAndSwap: {
            value: function (instruction) {
              return this.createBehavior(instruction).then(function (behavior) {
                instruction.viewSlot.swap(behavior.view);

                if (instruction.currentBehavior) {
                  instruction.currentBehavior.unbind();
                }

                return behavior;
              });
            },
            writable: true,
            enumerable: true,
            configurable: true
          },
          createBehavior: {
            value: function (instruction) {
              var childContainer = instruction.childContainer,
                  viewModelInfo = instruction.viewModelInfo,
                  viewModel = instruction.viewModel;

              return this.activate(instruction).then(function () {
                var doneLoading;

                if ("getViewStrategy" in viewModel && !instruction.view) {
                  instruction.view = ViewStrategy.normalize(viewModel.getViewStrategy());
                }

                if (instruction.view && instruction.viewResources) {
                  instruction.view.makeRelativeTo(instruction.viewResources.viewUrl);
                }

                if (viewModelInfo) {
                  doneLoading = viewModelInfo.type.load(childContainer, viewModelInfo.value, instruction.view);
                } else {
                  doneLoading = new CustomElement().load(childContainer, viewModel.constructor, instruction.view);
                }

                return doneLoading.then(function (behaviorType) {
                  return behaviorType.create(childContainer, { executionContext: viewModel });
                });
              });
            },
            writable: true,
            enumerable: true,
            configurable: true
          },
          createViewModel: {
            value: function (instruction) {
              var childContainer = instruction.childContainer || instruction.container.createChild();

              instruction.viewModel = instruction.viewResources ? instruction.viewResources.relativeToView(instruction.viewModel) : instruction.viewModel;

              return this.resourceCoordinator.loadViewModelInfo(instruction.viewModel).then(function (viewModelInfo) {
                childContainer.autoRegister(viewModelInfo.value);
                instruction.viewModel = childContainer.viewModel = childContainer.get(viewModelInfo.value);
                instruction.viewModelInfo = viewModelInfo;
                return instruction;
              });
            },
            writable: true,
            enumerable: true,
            configurable: true
          },
          compose: {
            value: function (instruction) {
              var _this = this;
              instruction.childContainer = instruction.childContainer || instruction.container.createChild();
              instruction.view = ViewStrategy.normalize(instruction.view);

              if (instruction.viewModel) {
                if (typeof instruction.viewModel === "string") {
                  return this.createViewModel(instruction).then(function (instruction) {
                    return _this.createBehaviorAndSwap(instruction);
                  });
                } else {
                  return this.createBehaviorAndSwap(instruction);
                }
              } else if (instruction.view) {
                return instruction.view.loadViewFactory(this.viewEngine).then(function (viewFactory) {
                  result = viewFactory.create(childContainer, instruction.executionContext);
                  instruction.viewSlot.swap(result);
                  return result;
                });
              } else if (instruction.viewSlot) {
                instruction.viewSlot.removeAll();
                return Promise.resolve(null);
              }
            },
            writable: true,
            enumerable: true,
            configurable: true
          }
        });

        return CompositionEngine;
      })();
      _export("CompositionEngine", CompositionEngine);
    }
  };
});