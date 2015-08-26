import {ResourceDescription} from './module-analyzer';
import {Container} from 'aurelia-dependency-injection';

export class BehaviorInstance {
  constructor(behavior, bindingContext, instruction){
    this.behavior = behavior;
    this.bindingContext = bindingContext;
    this.isAttached = false;

    var observerLookup = behavior.observerLocator.getOrCreateObserversLookup(bindingContext),
        handlesBind = behavior.handlesBind,
        attributes = instruction.attributes,
        boundProperties = this.boundProperties = [],
        properties = behavior.properties,
        i, ii;

    behavior.ensurePropertiesDefined(bindingContext, observerLookup);

    for(i = 0, ii = properties.length; i < ii; ++i){
      properties[i].initialize(bindingContext, observerLookup, attributes, handlesBind, boundProperties);
    }
  }

  static createForUnitTest(type, attributes, bindingContext){
    let description = ResourceDescription.get(type);
    description.analyze(Container.instance);

    let behaviorContext = Container.instance.get(type);
    let behaviorInstance = new BehaviorInstance(description.metadata, behaviorContext, {attributes:attributes||{}});

    behaviorInstance.bind(bindingContext || {});

    return behaviorContext;
  }

  created(context){
    if(this.behavior.handlesCreated){
      this.bindingContext.created(context);
    }
  }

  bind(context){
    var skipSelfSubscriber = this.behavior.handlesBind,
        boundProperties = this.boundProperties,
        i, ii, x, observer, selfSubscriber;

    for(i = 0, ii = boundProperties.length; i < ii; ++i){
      x = boundProperties[i];
      observer = x.observer;
      selfSubscriber = observer.selfSubscriber;
      observer.publishing = false;

      if(skipSelfSubscriber){
        observer.selfSubscriber = null;
      }

      x.binding.bind(context);
      observer.call();

      observer.publishing = true;
      observer.selfSubscriber = selfSubscriber;
    }

    if(skipSelfSubscriber){
      this.bindingContext.bind(context);
    }

    if(this.view){
      this.view.bind(this.bindingContext);
    }
  }

  unbind(){
    var boundProperties = this.boundProperties,
        i, ii;

    if(this.view){
      this.view.unbind();
    }

    if(this.behavior.handlesUnbind){
      this.bindingContext.unbind();
    }

    for(i = 0, ii = boundProperties.length; i < ii; ++i){
      boundProperties[i].binding.unbind();
    }
  }

  attached(){
    if(this.isAttached){
      return;
    }

    this.isAttached = true;

    if(this.behavior.handlesAttached){
      this.bindingContext.attached();
    }

    if(this.view){
      this.view.attached();
    }
  }

  detached(){
    if(this.isAttached){
      this.isAttached = false;

      if(this.view){
        this.view.detached();
      }

      if(this.behavior.handlesDetached){
        this.bindingContext.detached();
      }
    }
  }
}
