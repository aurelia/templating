import {ResourceDescription} from './module-analyzer';
import {Container} from 'aurelia-dependency-injection';

export class Controller {
  constructor(behavior, model, instruction) {
    this.behavior = behavior;
    this.model = model;
    this.isAttached = false;

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

  static createForUnitTest(modelType, attributes, bindingContext) {
    let description = ResourceDescription.get(modelType);
    description.initialize(Container.instance);

    let model = Container.instance.get(modelType);
    let controller = new Controller(description.metadata, model, {attributes: attributes || {}});

    controller.bind(bindingContext || {});

    return model;
  }

  created(context) {
    if (this.behavior.handlesCreated) {
      this.model.created(context);
    }
  }

  bind(context) {
    let skipSelfSubscriber = this.behavior.handlesBind;
    let boundProperties = this.boundProperties;
    let i;
    let ii;
    let x;
    let observer;
    let selfSubscriber;

    for (i = 0, ii = boundProperties.length; i < ii; ++i) {
      x = boundProperties[i];
      observer = x.observer;
      selfSubscriber = observer.selfSubscriber;
      observer.publishing = false;

      if (skipSelfSubscriber) {
        observer.selfSubscriber = null;
      }

      x.binding.bind(context);
      observer.call();

      observer.publishing = true;
      observer.selfSubscriber = selfSubscriber;
    }

    if (skipSelfSubscriber) {
      this.model.bind(context);
    }

    if (this.view) {
      this.view.bind(this.model);
    }
  }

  unbind() {
    let boundProperties = this.boundProperties;
    let i;
    let ii;

    if (this.view) {
      this.view.unbind();
    }

    if (this.behavior.handlesUnbind) {
      this.model.unbind();
    }

    for (i = 0, ii = boundProperties.length; i < ii; ++i) {
      boundProperties[i].binding.unbind();
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

    if (this.view) {
      this.view.attached();
    }
  }

  detached() {
    if (this.isAttached) {
      this.isAttached = false;

      if (this.view) {
        this.view.detached();
      }

      if (this.behavior.handlesDetached) {
        this.model.detached();
      }
    }
  }
}
