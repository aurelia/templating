import {createOverrideContext} from 'aurelia-binding';

export class Controller {
  constructor(behavior, model, instruction) {
    this.behavior = behavior;
    this.model = model;
    this.isAttached = false;
    this.view = null;
    this.isBound = false;
    this.bindingContext = null;

    let observerLookup = behavior.observerLocator.getOrCreateObserversLookup(model);
    let handlesBind = behavior.handlesBind;
    let attributes = instruction.attributes;
    let boundProperties = this.boundProperties = [];
    let properties = behavior.properties;
    let i;
    let ii;

    behavior.ensurePropertiesDefined(model, observerLookup);

    for (i = 0, ii = properties.length; i < ii; ++i) {
      properties[i].initialize(model, observerLookup, attributes, handlesBind, boundProperties);
    }
  }

  created(view) {
    if (this.behavior.handlesCreated) {
      this.model.created(view);
    }
  }

  automate(overrideContext?: Object) {
    this.view.bindingContext = this.model;
    this.view.overrideContext = overrideContext || createOverrideContext(this.model);
    this.bind(this.view);
  }

  bind(scope) {
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
      if(skipSelfSubscriber) {
        this.view.modelScope = scope;
      }

      this.view.bind(this.model, createOverrideContext(this.model, scope.overrideContext));
    } else if (skipSelfSubscriber) {
      this.model.bind(context, scope.overrideContext);
    }
  }

  unbind() {
    if(this.isBound) {
      let boundProperties = this.boundProperties;
      let i;
      let ii;

      this.isBound = false;
      this.scope = null;

      if (this.view !== null) {
        this.view.unbind();
      }

      if (this.behavior.handlesUnbind) {
        this.model.unbind();
      }

      for (i = 0, ii = boundProperties.length; i < ii; ++i) {
        boundProperties[i].binding.unbind();
      }
    }
  }

  attached() {
    if (this.isAttached) {
      return;
    }

    this.isAttached = true;

    if (this.behavior.handlesAttached) {
      this.model.attached();
    }

    if (this.view !== null) {
      this.view.attached();
    }
  }

  detached() {
    if (this.isAttached) {
      this.isAttached = false;

      if (this.view !== null) {
        this.view.detached();
      }

      if (this.behavior.handlesDetached) {
        this.model.detached();
      }
    }
  }
}
