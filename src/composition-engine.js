import {ViewLocator} from './view-locator';
import {ViewEngine} from './view-engine';
import {HtmlBehaviorResource} from './html-behavior';
import {BehaviorInstruction, ViewCompileInstruction} from './instructions';
import {DOM} from 'aurelia-pal';
import {Container, inject} from 'aurelia-dependency-injection';

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
  * The view url or view strategy to override the default view location convention.
  */
  view?: string | ViewStategy;
  /**
  * The slot to push the dynamically composed component into.
  */
  viewSlot: ViewSlot;
  /**
  * Should the composition system skip calling the "activate" hook on the view model.
  */
  skipActivation?: boolean;
}

function tryActivateViewModel(instruction) {
  if (instruction.skipActivation || typeof instruction.viewModel.activate !== 'function') {
    return Promise.resolve();
  }

  return instruction.viewModel.activate(instruction.model) || Promise.resolve();
}

/**
* Used to dynamically compose components.
*/
@inject(ViewEngine, ViewLocator)
export class CompositionEngine {
  /**
  * Creates an instance of the CompositionEngine.
  * @param viewEngine The ViewEngine used during composition.
  */
  constructor(viewEngine: ViewEngine, viewLocator: ViewLocator) {
    this.viewEngine = viewEngine;
    this.viewLocator = viewLocator;
  }

  _createControllerAndSwap(instruction) {
    let removeResponse = instruction.viewSlot.removeAll(true);
    let afterRemove = () => {
      return this.createController(instruction).then(controller => {
        if (instruction.currentController) {
          instruction.currentController.unbind();
        }

        controller.automate();
        instruction.viewSlot.add(controller.view);

        return controller;
      });
    };

    if (removeResponse instanceof Promise) {
      return removeResponse.then(afterRemove);
    }

    return afterRemove();
  }

  /**
  * Creates a controller instance for the component described in the instruction.
  * @param instruction The ComposeInstruction that describes the component.
  * @return A Promise for the Controller.
  */
  createController(instruction: ComposeInstruction): Promise<Controller> {
    let childContainer;
    let viewModel;
    let viewModelResource;
    let metadata;

    return this.ensureViewModel(instruction).then(tryActivateViewModel).then(() => {
      childContainer = instruction.childContainer;
      viewModel = instruction.viewModel;
      viewModelResource = instruction.viewModelResource;
      metadata = viewModelResource.metadata;

      let viewStrategy = this.viewLocator.getViewStrategy(instruction.view || viewModel);

      if (instruction.viewResources) {
        viewStrategy.makeRelativeTo(instruction.viewResources.viewUrl);
      }

      return metadata.load(childContainer, viewModelResource.value, viewStrategy, true);
    }).then(viewFactory => metadata.create(childContainer, BehaviorInstruction.dynamic(instruction.host, viewModel, viewFactory)));
  }

  /**
  * Ensures that the view model and its resource are loaded for this instruction.
  * @param instruction The ComposeInstruction to load the view model and its resource for.
  * @return A Promise for the instruction.
  */
  ensureViewModel(instruction: ComposeInstruction): Promise<ComposeInstruction> {
    let childContainer = instruction.childContainer = (instruction.childContainer || instruction.container.createChild());

    if (typeof instruction.viewModel === 'string') {
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

    let metadata = new HtmlBehaviorResource();
    metadata.elementName = 'dynamic-element';
    metadata.initialize(instruction.container || childContainer, viewModel.constructor);
    instruction.viewModelResource = { metadata: metadata, value: instruction.viewModel.constructor };
    childContainer.viewModel = instruction.viewModel;
    return Promise.resolve(instruction);
  }

  /**
  * Dynamically composes a component.
  * @param instruction The ComposeInstruction providing information on how the composition should occur.
  * @return A Promise for the View or the Controller that results from the dynamic composition.
  */
  compose(instruction: ComposeInstruction): Promise<View | Controller> {
    instruction.childContainer = instruction.childContainer || instruction.container.createChild();
    instruction.view = this.viewLocator.getViewStrategy(instruction.view);

    if (instruction.viewModel) {
      return this._createControllerAndSwap(instruction);
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
