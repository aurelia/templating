define(['exports', 'aurelia-metadata', './view-strategy', './view-engine', './html-behavior'], function (exports, _aureliaMetadata, _viewStrategy, _viewEngine, _htmlBehavior) {
  'use strict';

  var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } };

  exports.__esModule = true;

  var CompositionEngine = (function () {
    function CompositionEngine(viewEngine) {
      _classCallCheck(this, CompositionEngine);

      this.viewEngine = viewEngine;
    }

    CompositionEngine.inject = function inject() {
      return [_viewEngine.ViewEngine];
    };

    CompositionEngine.prototype.activate = function activate(instruction) {
      if (instruction.skipActivation || typeof instruction.viewModel.activate !== 'function') {
        return Promise.resolve();
      }

      return instruction.viewModel.activate(instruction.model) || Promise.resolve();
    };

    CompositionEngine.prototype.createBehaviorAndSwap = function createBehaviorAndSwap(instruction) {
      return this.createBehavior(instruction).then(function (behavior) {
        behavior.view.bind(behavior.executionContext);
        instruction.viewSlot.swap(behavior.view);

        if (instruction.currentBehavior) {
          instruction.currentBehavior.unbind();
        }

        return behavior;
      });
    };

    CompositionEngine.prototype.createBehavior = function createBehavior(instruction) {
      var childContainer = instruction.childContainer,
          viewModelResource = instruction.viewModelResource,
          viewModel = instruction.viewModel,
          metadata;

      return this.activate(instruction).then(function () {
        var doneLoading, viewStrategyFromViewModel, origin;

        if ('getViewStrategy' in viewModel && !instruction.view) {
          viewStrategyFromViewModel = true;
          instruction.view = _viewStrategy.ViewStrategy.normalize(viewModel.getViewStrategy());
        }

        if (instruction.view) {
          if (viewStrategyFromViewModel) {
            origin = _aureliaMetadata.Origin.get(viewModel.constructor);
            if (origin) {
              instruction.view.makeRelativeTo(origin.moduleId);
            }
          } else if (instruction.viewResources) {
            instruction.view.makeRelativeTo(instruction.viewResources.viewUrl);
          }
        }

        if (viewModelResource) {
          metadata = viewModelResource.metadata;
          doneLoading = metadata.load(childContainer, viewModelResource.value, instruction.view, true);
        } else {
          metadata = new _htmlBehavior.HtmlBehaviorResource();
          metadata.elementName = 'dynamic-element';
          doneLoading = metadata.load(childContainer, viewModel.constructor, instruction.view, true).then(function (viewFactory) {
            metadata.analyze(instruction.container || childContainer, viewModel.constructor);
            return viewFactory;
          });
        }

        return doneLoading.then(function (viewFactory) {
          return metadata.create(childContainer, {
            executionContext: viewModel,
            viewFactory: viewFactory,
            suppressBind: true
          });
        });
      });
    };

    CompositionEngine.prototype.createViewModel = function createViewModel(instruction) {
      var childContainer = instruction.childContainer || instruction.container.createChild();

      instruction.viewModel = instruction.viewResources ? instruction.viewResources.relativeToView(instruction.viewModel) : instruction.viewModel;

      return this.viewEngine.importViewModelResource(instruction.viewModel).then(function (viewModelResource) {
        childContainer.autoRegister(viewModelResource.value);
        instruction.viewModel = childContainer.viewModel = childContainer.get(viewModelResource.value);
        instruction.viewModelResource = viewModelResource;
        return instruction;
      });
    };

    CompositionEngine.prototype.compose = function compose(instruction) {
      var _this = this;

      instruction.childContainer = instruction.childContainer || instruction.container.createChild();
      instruction.view = _viewStrategy.ViewStrategy.normalize(instruction.view);

      if (instruction.viewModel) {
        if (typeof instruction.viewModel === 'string') {
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
    };

    return CompositionEngine;
  })();

  exports.CompositionEngine = CompositionEngine;
});