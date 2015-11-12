import {ViewLocator} from './view-locator';
import {ViewEngine} from './view-engine';
import {HtmlBehaviorResource} from './html-behavior';
import {BehaviorInstruction, ViewCompileInstruction} from './instructions';
import {DOM} from 'aurelia-pal';
import {Container, inject} from 'aurelia-dependency-injection';

/**
* Instructs the composition engine how to dynamically compose a component.
*/
interface CompositionContext {
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

function tryActivateViewModel(context) {
  if (context.skipActivation || typeof context.viewModel.activate !== 'function') {
    return Promise.resolve();
  }

  return context.viewModel.activate(context.model) || Promise.resolve();
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

  _createControllerAndSwap(context) {
    let removeResponse = context.viewSlot.removeAll(true);
    let afterRemove = () => {
      return this.createController(context).then(controller => {
        if (context.currentController) {
          context.currentController.unbind();
        }

        controller.automate();
        context.viewSlot.add(controller.view);

        return controller;
      });
    };

    if (removeResponse instanceof Promise) {
      return removeResponse.then(afterRemove);
    }

    return afterRemove();
  }

  /**
  * Creates a controller instance for the component described in the context.
  * @param context The CompositionContext that describes the component.
  * @return A Promise for the Controller.
  */
  createController(context: CompositionContext): Promise<Controller> {
    let childContainer;
    let viewModel;
    let viewModelResource;
    let metadata;

    return this.ensureViewModel(context).then(tryActivateViewModel).then(() => {
      childContainer = context.childContainer;
      viewModel = context.viewModel;
      viewModelResource = context.viewModelResource;
      metadata = viewModelResource.metadata;

      let viewStrategy = this.viewLocator.getViewStrategy(context.view || viewModel);

      if (context.viewResources) {
        viewStrategy.makeRelativeTo(context.viewResources.viewUrl);
      }

      return metadata.load(childContainer, viewModelResource.value, null, viewStrategy, true);
    }).then(viewFactory => metadata.create(childContainer, BehaviorInstruction.dynamic(context.host, viewModel, viewFactory)));
  }

  /**
  * Ensures that the view model and its resource are loaded for this context.
  * @param context The CompositionContext to load the view model and its resource for.
  * @return A Promise for the context.
  */
  ensureViewModel(context: CompositionContext): Promise<CompositionContext> {
    let childContainer = context.childContainer = (context.childContainer || context.container.createChild());

    if (typeof context.viewModel === 'string') {
      context.viewModel = context.viewResources
          ? context.viewResources.relativeToView(context.viewModel)
          : context.viewModel;

      return this.viewEngine.importViewModelResource(context.viewModel).then(viewModelResource => {
        childContainer.autoRegister(viewModelResource.value);

        if (context.host) {
          childContainer.registerInstance(DOM.Element, context.host);
        }

        context.viewModel = childContainer.viewModel = childContainer.get(viewModelResource.value);
        context.viewModelResource = viewModelResource;
        return context;
      });
    }

    let metadata = new HtmlBehaviorResource();
    metadata.elementName = 'dynamic-element';
    metadata.initialize(context.container || childContainer, context.viewModel.constructor);
    context.viewModelResource = { metadata: metadata, value: context.viewModel.constructor };
    childContainer.viewModel = context.viewModel;
    return Promise.resolve(context);
  }

  /**
  * Dynamically composes a component.
  * @param context The CompositionContext providing information on how the composition should occur.
  * @return A Promise for the View or the Controller that results from the dynamic composition.
  */
  compose(context: CompositionContext): Promise<View | Controller> {
    context.childContainer = context.childContainer || context.container.createChild();
    context.view = this.viewLocator.getViewStrategy(context.view);

    if (context.viewModel) {
      return this._createControllerAndSwap(context);
    } else if (context.view) {
      if (context.viewResources) {
        context.view.makeRelativeTo(context.viewResources.viewUrl);
      }

      return context.view.loadViewFactory(this.viewEngine, new ViewCompileInstruction()).then(viewFactory => {
        let removeResponse = context.viewSlot.removeAll(true);

        if (removeResponse instanceof Promise) {
          return removeResponse.then(() => {
            let result = viewFactory.create(context.childContainer);
            result.bind(context.bindingContext, context.overrideContext);
            context.viewSlot.add(result);
            return result;
          });
        }

        let result = viewFactory.create(context.childContainer);
        result.bind(context.bindingContext, context.overrideContext);
        context.viewSlot.add(result);
        return result;
      });
    } else if (context.viewSlot) {
      context.viewSlot.removeAll();
      return Promise.resolve(null);
    }
  }
}
