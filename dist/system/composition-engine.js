System.register(['aurelia-metadata', './view-strategy', './view-engine', './html-behavior'], function (_export) {
  var Origin, Metadata, ViewStrategy, UseViewStrategy, ViewEngine, HtmlBehaviorResource, _classCallCheck, _createClass, CompositionEngine;

  return {
    setters: [function (_aureliaMetadata) {
      Origin = _aureliaMetadata.Origin;
      Metadata = _aureliaMetadata.Metadata;
    }, function (_viewStrategy) {
      ViewStrategy = _viewStrategy.ViewStrategy;
      UseViewStrategy = _viewStrategy.UseViewStrategy;
    }, function (_viewEngine) {
      ViewEngine = _viewEngine.ViewEngine;
    }, function (_htmlBehavior) {
      HtmlBehaviorResource = _htmlBehavior.HtmlBehaviorResource;
    }],
    execute: function () {
      'use strict';

      _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } };

      _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

      CompositionEngine = (function () {
        function CompositionEngine(viewEngine) {
          _classCallCheck(this, CompositionEngine);

          this.viewEngine = viewEngine;
        }

        _createClass(CompositionEngine, [{
          key: 'activate',
          value: function activate(instruction) {
            if (instruction.skipActivation || typeof instruction.viewModel.activate !== 'function') {
              return Promise.resolve();
            }

            return instruction.viewModel.activate(instruction.model) || Promise.resolve();
          }
        }, {
          key: 'createBehaviorAndSwap',
          value: function createBehaviorAndSwap(instruction) {
            return this.createBehavior(instruction).then(function (behavior) {
              behavior.view.bind(behavior.executionContext);
              instruction.viewSlot.swap(behavior.view);

              if (instruction.currentBehavior) {
                instruction.currentBehavior.unbind();
              }

              return behavior;
            });
          }
        }, {
          key: 'createBehavior',
          value: function createBehavior(instruction) {
            var childContainer = instruction.childContainer,
                viewModelResource = instruction.viewModelResource,
                viewModel = instruction.viewModel,
                metadata;

            return this.activate(instruction).then(function () {
              var doneLoading, viewStrategyFromViewModel, origin;

              if ('getViewStrategy' in viewModel && !instruction.view) {
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

              if (viewModelResource) {
                metadata = viewModelResource.metadata;
                doneLoading = metadata.load(childContainer, viewModelResource.value, instruction.view, true);
              } else {
                metadata = new HtmlBehaviorResource();
                metadata.elementName = 'dynamic-element';
                doneLoading = metadata.load(childContainer, viewModel.constructor, instruction.view, true);
              }

              return doneLoading.then(function (viewFactory) {
                return metadata.create(childContainer, {
                  executionContext: viewModel,
                  viewFactory: viewFactory,
                  suppressBind: true
                });
              });
            });
          }
        }, {
          key: 'createViewModel',
          value: function createViewModel(instruction) {
            var childContainer = instruction.childContainer || instruction.container.createChild();

            instruction.viewModel = instruction.viewResources ? instruction.viewResources.relativeToView(instruction.viewModel) : instruction.viewModel;

            return this.viewEngine.importViewModelResource(instruction.viewModel).then(function (viewModelResource) {
              childContainer.autoRegister(viewModelResource.value);
              instruction.viewModel = childContainer.viewModel = childContainer.get(viewModelResource.value);
              instruction.viewModelResource = viewModelResource;
              return instruction;
            });
          }
        }, {
          key: 'compose',
          value: function compose(instruction) {
            var _this = this;

            instruction.childContainer = instruction.childContainer || instruction.container.createChild();
            instruction.view = ViewStrategy.normalize(instruction.view);

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
          }
        }], [{
          key: 'inject',
          value: function inject() {
            return [ViewEngine];
          }
        }]);

        return CompositionEngine;
      })();

      _export('CompositionEngine', CompositionEngine);
    }
  };
});