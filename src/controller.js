import {createOverrideContext} from 'aurelia-binding';

/**
* Controls a view model (and optionally its view), according to a particular behavior and by following a set of instructions.
*/
export class Controller {
  /**
  * The HtmlBehaviorResource that provides the base behavior for this controller.
  */
  behavior: HtmlBehaviorResource;

  /**
  * The developer's view model instance which provides the custom behavior for this controller.
  */
  viewModel: Object;

  /**
  * The view associated with the component being controlled by this controller.
  * Note: Not all components will have a view, so the value may be null.
  */
  view: View;

  /**
  * Creates an instance of Controller.
  * @param behavior The HtmlBehaviorResource that provides the base behavior for this controller.
  * @param instruction The instructions pertaining to the controller's behavior.
  * @param viewModel The developer's view model instance which provides the custom behavior for this controller.
  */
  constructor(behavior: HtmlBehaviorResource, instruction: BehaviorInstruction, viewModel: Object) {
    this.behavior = behavior;
    this.instruction = instruction;
    this.viewModel = viewModel;
    this.isAttached = false;
    this.view = null;
    this.isBound = false;
    this.bindingContext = null;

    let observerLookup = behavior.observerLocator.getOrCreateObserversLookup(viewModel);
    let handlesBind = behavior.handlesBind;
    let attributes = instruction.attributes;
    let boundProperties = this.boundProperties = [];
    let properties = behavior.properties;
    let i;
    let ii;

    behavior._ensurePropertiesDefined(viewModel, observerLookup);

    for (i = 0, ii = properties.length; i < ii; ++i) {
      properties[i]._initialize(viewModel, observerLookup, attributes, handlesBind, boundProperties);
    }
  }

  /**
  * Invoked when the view which contains this controller is created.
  * @param owningView The view inside which this controller resides.
  */
  created(owningView): void {
    if (this.behavior.handlesCreated) {
      this.viewModel.created(owningView, this.view);
    }
  }

  /**
  * Used to automate the proper binding of this controller and its view. Used by the composition engine for dynamic component creation.
  * This should be considered a semi-private API and is subject to change without notice, even across minor or patch releases.
  * @param overrideContext An override context for binding.
  */
  automate(overrideContext?: Object): void {
    this.view.bindingContext = this.viewModel;
    this.view.overrideContext = overrideContext || createOverrideContext(this.viewModel);
    this.view._isUserControlled = true;
    this.bind(this.view);
  }

  /**
  * Binds the controller to the scope.
  * @param scope The binding scope.
  */
  bind(scope: Object): void {
    let skipSelfSubscriber = this.behavior.handlesBind;
    let boundProperties = this.boundProperties;
    let i;
    let ii;
    let x;
    let observer;
    let selfSubscriber;
    let context = scope.bindingContext;

    if (this.isBound) {
      if (this.bindingContext === context) {
        return;
      }

      this.unbind();
    }

    this.isBound = true;
    this.bindingContext = context;

    for (i = 0, ii = boundProperties.length; i < ii; ++i) {
      x = boundProperties[i];
      observer = x.observer;
      selfSubscriber = observer.selfSubscriber;
      observer.publishing = false;

      if (skipSelfSubscriber) {
        observer.selfSubscriber = null;
      }

      x.binding.bind(scope);
      observer.call();

      observer.publishing = true;
      observer.selfSubscriber = selfSubscriber;
    }

    if (this.view !== null) {
      if (skipSelfSubscriber) {
        this.view.viewModelScope = scope;
      }

      this.view.bind(this.viewModel, createOverrideContext(this.viewModel, scope.overrideContext));
    } else if (skipSelfSubscriber) {
      this.viewModel.bind(context, scope.overrideContext);
    }
  }

  /**
  * Unbinds the controller.
  */
  unbind(): void {
    if (this.isBound) {
      let boundProperties = this.boundProperties;
      let i;
      let ii;

      this.isBound = false;
      this.scope = null;

      if (this.view !== null) {
        this.view.unbind();
      }

      if (this.behavior.handlesUnbind) {
        this.viewModel.unbind();
      }

      for (i = 0, ii = boundProperties.length; i < ii; ++i) {
        boundProperties[i].binding.unbind();
      }
    }
  }

  /**
  * Attaches the controller.
  */
  attached(): void {
    if (this.isAttached) {
      return;
    }

    this.isAttached = true;

    if (this.behavior.handlesAttached) {
      this.viewModel.attached();
    }

    if (this.view !== null) {
      this.view.attached();
    }
  }

  /**
  * Detaches the controller.
  */
  detached(): void {
    if (this.isAttached) {
      this.isAttached = false;

      if (this.view !== null) {
        this.view.detached();
      }

      if (this.behavior.handlesDetached) {
        this.viewModel.detached();
      }
    }
  }
}
