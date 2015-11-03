import {createOverrideContext} from 'aurelia-binding';

export class Controller {
  constructor(behavior, model, instruction) {
    this.behavior = behavior;
    this.model = model;
    this.isAttached = false;
    this.view = null;
    this.isBound = false;
    this.scope = null;

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

  bind(scope) {
    let skipSelfSubscriber = this.behavior.handlesBind;
    let boundProperties = this.boundProperties;
    let i;
    let ii;
    let x;
    let observer;
    let selfSubscriber;

    if (this.isBound) {
      if (this.scope === scope) {
        return;
      }

      this.unbind();
    }

    this.isBound = true;
    this.scope = scope;

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

    //TODO: should this come after the call to view.bind?
    if (skipSelfSubscriber) {
      this.model.bind(scope.bindingContext, scope.overrideContext);
    }

    if (this.view !== null) {
      this.view.bind(this.model, createOverrideContext(this.model, scope.overrideContext));
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
