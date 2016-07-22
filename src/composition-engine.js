import {ViewLocator} from './view-locator';
import {ViewEngine} from './view-engine';
import {HtmlBehaviorResource} from './html-behavior';
import {BehaviorInstruction, ViewCompileInstruction} from './instructions';
import {CompositionTransaction} from './composition-transaction';
import {DOM} from 'aurelia-pal';
import {Container, inject} from 'aurelia-dependency-injection';
import {metadata} from 'aurelia-metadata';

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
  * The context in which the view model is executed in.
  */
  bindingContext: any;
  /**
  * A secondary binding context that can override the standard context.
  */
  overrideContext?: any;
  /**
  * The view model url or instance for the component.
  */
  viewModel?: any;
  /**
  * Data to be passed to the "activate" hook on the view model.
  */
  model?: any;
  /**
  * The HtmlBehaviorResource for the component.
  */
  viewModelResource?: HtmlBehaviorResource;
  /**
  * The view resources for the view in which the component should be created.
  */
  viewResources: ViewResources;
  /**
  * The view inside which this composition is happening.
  */
  owningView?: View;
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
    function swap(controller) {
      return Promise.resolve(context.viewSlot.removeAll(true)).then(() => {
        if (context.currentController) {
          context.currentController.unbind();
        }

        context.viewSlot.add(controller.view);

        if (context.compositionTransactionNotifier) {
          context.compositionTransactionNotifier.done();
        }

        return controller;
      });
    }

    return this.createController(context).then(controller => {
      controller.automate(context.overrideContext, context.owningView);

      if (context.compositionTransactionOwnershipToken) {
        return context.compositionTransactionOwnershipToken.waitForCompositionComplete().then(() => swap(controller));
      }

      return swap(controller);
    });
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
    let m;

    return this.ensureViewModel(context).then(tryActivateViewModel).then(() => {
      childContainer = context.childContainer;
      viewModel = context.viewModel;
      viewModelResource = context.viewModelResource;
      m = viewModelResource.metadata;

      let viewStrategy = this.viewLocator.getViewStrategy(context.view || viewModel);

      if (context.viewResources) {
        viewStrategy.makeRelativeTo(context.viewResources.viewUrl);
      }

      return m.load(childContainer, viewModelResource.value, null, viewStrategy, true);
    }).then(viewFactory => m.create(childContainer, BehaviorInstruction.dynamic(context.host, viewModel, viewFactory)));
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

    let m = metadata.getOrCreateOwn(metadata.resource, HtmlBehaviorResource, context.viewModel.constructor);
    m.elementName = m.elementName || 'dynamic-element';
    m.initialize(context.container || childContainer, context.viewModel.constructor);
    context.viewModelResource = { metadata: m, value: context.viewModel.constructor };
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

    let transaction = context.childContainer.get(CompositionTransaction);
    let compositionTransactionOwnershipToken = transaction.tryCapture();

    if (compositionTransactionOwnershipToken) {
      context.compositionTransactionOwnershipToken = compositionTransactionOwnershipToken;
    } else {
      context.compositionTransactionNotifier = transaction.enlist();
    }

    if (context.viewModel) {
      return this._createControllerAndSwap(context);
    } else if (context.view) {
      if (context.viewResources) {
        context.view.makeRelativeTo(context.viewResources.viewUrl);
      }

      return context.view.loadViewFactory(this.viewEngine, new ViewCompileInstruction()).then(viewFactory => {
        let result = viewFactory.create(context.childContainer);
        result.bind(context.bindingContext, context.overrideContext);

        let work = () => {
          return Promise.resolve(context.viewSlot.removeAll(true)).then(() => {
            context.viewSlot.add(result);

            if (context.compositionTransactionNotifier) {
              context.compositionTransactionNotifier.done();
            }

            return result;
          });
        };

        if (context.compositionTransactionOwnershipToken) {
          return context.compositionTransactionOwnershipToken.waitForCompositionComplete().then(work);
        }

        return work();
      });
    } else if (context.viewSlot) {
      context.viewSlot.removeAll();

      if (context.compositionTransactionNotifier) {
        context.compositionTransactionNotifier.done();
      }

      return Promise.resolve(null);
    }

    return Promise.resolve(null);
  }
}
