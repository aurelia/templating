import {Origin} from 'aurelia-metadata';
import {ViewStrategy} from './view-strategy';
import {ViewEngine} from './view-engine';
import {HtmlBehaviorResource} from './html-behavior';
import {BehaviorInstruction, ViewCompileInstruction} from './instructions';
import {DOM} from 'aurelia-pal';
import {Container, inject} from 'aurelia-dependency-injection';

function tryActivateViewModel(instruction) {
  if (instruction.skipActivation || typeof instruction.viewModel.activate !== 'function') {
    return Promise.resolve();
  }

  return instruction.viewModel.activate(instruction.model) || Promise.resolve();
}

function createCompositionControllerAndSwap(instruction) {
  let removeResponse = instruction.viewSlot.removeAll(true);

  if (removeResponse instanceof Promise) {
    return removeResponse.then(() => {
      return createCompositionController(instruction).then(controller => {
        if (instruction.currentController) {
          instruction.currentController.unbind();
        }

        controller.automate();
        instruction.viewSlot.add(controller.view);

        return controller;
      });
    });
  }

  return createCompositionController(instruction).then(controller => {
    if (instruction.currentController) {
      instruction.currentController.unbind();
    }

    controller.automate();
    instruction.viewSlot.add(controller.view);

    return controller;
  });
}

function createCompositionController(instruction) {
  let childContainer = instruction.childContainer;
  let viewModelResource = instruction.viewModelResource;
  let viewModel = instruction.viewModel;
  let metadata;

  return tryActivateViewModel(instruction).then(() => {
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
      metadata.initialize(instruction.container || childContainer, viewModel.constructor);
      doneLoading = metadata.load(childContainer, viewModel.constructor, instruction.view, true).then(viewFactory => {
        return viewFactory;
      });
    }

    return doneLoading.then(viewFactory => {
      return metadata.create(childContainer, BehaviorInstruction.dynamic(instruction.host, viewModel, viewFactory));
    });
  });
}

/**
* Instructs the composition engine how to dynamically compose a component.
*/
interface ComposeInstruction {
  /**
  * The parent Container for the component creation.
  */
  container: Container;
  /**
  * The child Container for the component creation. One will be created from the parent if not provided.
  */
  childContainer?: Container;
  /**
  * The view model for the component.
  */
  viewModel?: string | Object;
  /**
  * The HtmlBehaviorResource for the component.
  */
  viewModelResource?: HtmlBehaviorResource;
  /**
  * The view resources for the view in which the component should be created.
  */
  viewResources: ViewResources;
  /**
  * The view url or ViewStrategy to override the default view location convention.
  */
  view?: string | ViewStrategy;
  /**
  * The slot to push the dynamically composed component into.
  */
  viewSlot: ViewSlot;
  /**
  * Should the composition system skip calling the "activate" hook on the view model.
  */
  skipActivation?: boolean;
}

/**
* Used to dynamically compose components.
*/
@inject(ViewEngine)
export class CompositionEngine {
  /**
  * Creates an instance of the CompositionEngine.
  * @param viewEngine The ViewEngine used during composition.
  */
  constructor(viewEngine: ViewEngine) {
    this.viewEngine = viewEngine;
  }

  /**
  * Ensures that the view model and its resource are loaded for this instruction.
  * @param instruction The ComposeInstruction to load the view model and its resource for.
  * @return A Promise for the instruction.
  */
  ensureViewModel(instruction: ComposeInstruction): Promise<ComposeInstruction> {
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

  /**
  * Dynamically composes a component.
  * @param instruction The ComposeInstruction providing information on how the composition should occur.
  * @return A Promise for the View or the Controller that results from the dynamic composition.
  */
  compose(instruction: ComposeInstruction): Promise<View | Controller> {
    instruction.childContainer = instruction.childContainer || instruction.container.createChild();
    instruction.view = ViewStrategy.normalize(instruction.view);

    if (instruction.viewModel) {
      if (typeof instruction.viewModel === 'string') {
        return this.ensureViewModel(instruction).then(createCompositionControllerAndSwap);
      }

      return createCompositionControllerAndSwap(instruction);
    } else if (instruction.view) {
      if (instruction.viewResources) {
        instruction.view.makeRelativeTo(instruction.viewResources.viewUrl);
      }

      return instruction.view.loadViewFactory(this.viewEngine, new ViewCompileInstruction()).then(viewFactory => {
        let removeResponse = instruction.viewSlot.removeAll(true);

        if (removeResponse instanceof Promise) {
          return removeResponse.then(() => {
            let result = viewFactory.create(instruction.childContainer);
            result.bind(instruction.bindingContext);
            instruction.viewSlot.add(result);
            return result;
          });
        }

        let result = viewFactory.create(instruction.childContainer);
        result.bind(instruction.bindingContext);
        instruction.viewSlot.add(result);
        return result;
      });
    } else if (instruction.viewSlot) {
      instruction.viewSlot.removeAll();
      return Promise.resolve(null);
    }
  }
}
