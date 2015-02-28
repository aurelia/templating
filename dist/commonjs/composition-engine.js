"use strict";

var _prototypeProperties = function (child, staticProps, instanceProps) { if (staticProps) Object.defineProperties(child, staticProps); if (instanceProps) Object.defineProperties(child.prototype, instanceProps); };

var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } };

var _aureliaMetadata = require("aurelia-metadata");

var Origin = _aureliaMetadata.Origin;
var Metadata = _aureliaMetadata.Metadata;

require("aurelia-dependency-injection");

var _viewStrategy = require("./view-strategy");

var ViewStrategy = _viewStrategy.ViewStrategy;
var UseView = _viewStrategy.UseView;

var ResourceCoordinator = require("./resource-coordinator").ResourceCoordinator;

var ViewEngine = require("./view-engine").ViewEngine;

var CustomElement = require("./custom-element").CustomElement;

var CompositionEngine = exports.CompositionEngine = (function () {
  function CompositionEngine(resourceCoordinator, viewEngine) {
    _classCallCheck(this, CompositionEngine);

    this.resourceCoordinator = resourceCoordinator;
    this.viewEngine = viewEngine;
  }

  _prototypeProperties(CompositionEngine, {
    inject: {
      value: function inject() {
        return [ResourceCoordinator, ViewEngine];
      },
      writable: true,
      configurable: true
    }
  }, {
    activate: {
      value: function activate(instruction) {
        if (instruction.skipActivation || typeof instruction.viewModel.activate !== "function") {
          return Promise.resolve();
        }

        return instruction.viewModel.activate(instruction.model) || Promise.resolve();
      },
      writable: true,
      configurable: true
    },
    createBehaviorAndSwap: {
      value: function createBehaviorAndSwap(instruction) {
        return this.createBehavior(instruction).then(function (behavior) {
          behavior.view.bind(behavior.executionContext);
          instruction.viewSlot.swap(behavior.view);

          if (instruction.currentBehavior) {
            instruction.currentBehavior.unbind();
          }

          return behavior;
        });
      },
      writable: true,
      configurable: true
    },
    createBehavior: {
      value: function createBehavior(instruction) {
        var childContainer = instruction.childContainer,
            viewModelInfo = instruction.viewModelInfo,
            viewModel = instruction.viewModel;

        return this.activate(instruction).then(function () {
          var doneLoading, viewStrategyFromViewModel, origin;

          if ("getViewStrategy" in viewModel && !instruction.view) {
            viewStrategyFromViewModel = true;
            instruction.view = ViewStrategy.normalize(viewModel.getViewStrategy());
          }

          if (instruction.view) {
            if (viewStrategyFromViewModel) {
              origin = Origin.get(viewModel.constructor);
              if (origin) {
                instruction.view.makeRelativeTo(origin.moduleId);
              }
            } else if (instruction.viewResources) {
              instruction.view.makeRelativeTo(instruction.viewResources.viewUrl);
            }
          }

          if (viewModelInfo) {
            doneLoading = viewModelInfo.type.load(childContainer, viewModelInfo.value, instruction.view);
          } else {
            doneLoading = new CustomElement().load(childContainer, viewModel.constructor, instruction.view);
          }

          return doneLoading.then(function (behaviorType) {
            return behaviorType.create(childContainer, { executionContext: viewModel, suppressBind: true });
          });
        });
      },
      writable: true,
      configurable: true
    },
    createViewModel: {
      value: function createViewModel(instruction) {
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
      configurable: true
    },
    compose: {
      value: function compose(instruction) {
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
          if (instruction.viewResources) {
            instruction.view.makeRelativeTo(instruction.viewResources.viewUrl);
          }

          return instruction.view.loadViewFactory(this.viewEngine).then(function (viewFactory) {
            var result = viewFactory.create(instruction.childContainer, instruction.executionContext);
            instruction.viewSlot.swap(result);
            return result;
          });
        } else if (instruction.viewSlot) {
          instruction.viewSlot.removeAll();
          return Promise.resolve(null);
        }
      },
      writable: true,
      configurable: true
    }
  });

  return CompositionEngine;
})();

Object.defineProperty(exports, "__esModule", {
  value: true
});