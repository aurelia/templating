import {Origin} from 'aurelia-metadata';
import {ViewStrategy} from './view-strategy';
import {ViewEngine} from './view-engine';
import {HtmlBehaviorResource} from './html-behavior';
import {BehaviorInstruction, ViewCompileInstruction} from './instructions';
import {DOM} from 'aurelia-pal';

export class CompositionEngine {
  static inject = [ViewEngine];

  constructor(viewEngine) {
    this.viewEngine = viewEngine;
  }

  activate(instruction) {
    if (instruction.skipActivation || typeof instruction.viewModel.activate !== 'function') {
      return Promise.resolve();
    }

    return instruction.viewModel.activate(instruction.model) || Promise.resolve();
  }

  createBehaviorAndSwap(instruction) {
    let removeResponse = instruction.viewSlot.removeAll(true);

    if (removeResponse instanceof Promise) {
      return removeResponse.then(() => {
        return this.createBehavior(instruction).then(behavior => {
          if (instruction.currentBehavior) {
            instruction.currentBehavior.unbind();
          }

          behavior.view.bind(behavior.bindingContext);
          instruction.viewSlot.add(behavior.view);

          return behavior;
        });
      });
    }

    return this.createBehavior(instruction).then(behavior => {
      if (instruction.currentBehavior) {
        instruction.currentBehavior.unbind();
      }

      behavior.view.bind(behavior.bindingContext);
      instruction.viewSlot.add(behavior.view);

      return behavior;
    });
  }

  createBehavior(instruction) {
    let childContainer = instruction.childContainer;
    let viewModelResource = instruction.viewModelResource;
    let viewModel = instruction.viewModel;
    let metadata;

    return this.activate(instruction).then(() => {
      let doneLoading;
      let viewStrategyFromViewModel;
      let origin;

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
        metadata.analyze(instruction.container || childContainer, viewModel.constructor);
        doneLoading = metadata.load(childContainer, viewModel.constructor, instruction.view, true).then(viewFactory => {
          return viewFactory;
        });
      }

      return doneLoading.then(viewFactory => {
        return metadata.create(childContainer, BehaviorInstruction.dynamic(instruction.host, viewModel, viewFactory));
      });
    });
  }

  createViewModel(instruction) {
    let childContainer = instruction.childContainer || instruction.container.createChild();

    instruction.viewModel = instruction.viewResources
        ? instruction.viewResources.relativeToView(instruction.viewModel)
        : instruction.viewModel;

    return this.viewEngine.importViewModelResource(instruction.viewModel).then(viewModelResource => {
      childContainer.autoRegister(viewModelResource.value);

      if (instruction.host) {
        childContainer.registerInstance(DOM.Element, instruction.host);
      }

      instruction.viewModel = childContainer.viewModel = childContainer.get(viewModelResource.value);
      instruction.viewModelResource = viewModelResource;
      return instruction;
    });
  }

  compose(instruction) {
    instruction.childContainer = instruction.childContainer || instruction.container.createChild();
    instruction.view = ViewStrategy.normalize(instruction.view);

    if (instruction.viewModel) {
      if (typeof instruction.viewModel === 'string') {
        return this.createViewModel(instruction).then(ins => {
          return this.createBehaviorAndSwap(ins);
        });
      }

      return this.createBehaviorAndSwap(instruction);
    } else if (instruction.view) {
      if (instruction.viewResources) {
        instruction.view.makeRelativeTo(instruction.viewResources.viewUrl);
      }

      return instruction.view.loadViewFactory(this.viewEngine, new ViewCompileInstruction()).then(viewFactory => {
        let removeResponse = instruction.viewSlot.removeAll(true);

        if (removeResponse instanceof Promise) {
          return removeResponse.then(() => {
            let result = viewFactory.create(instruction.childContainer, instruction.bindingContext);
            instruction.viewSlot.add(result);
            return result;
          });
        }

        let result = viewFactory.create(instruction.childContainer, instruction.bindingContext);
        instruction.viewSlot.add(result);
        return result;
      });
    } else if (instruction.viewSlot) {
      instruction.viewSlot.removeAll();
      return Promise.resolve(null);
    }
  }
}
