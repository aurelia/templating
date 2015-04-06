export class BehaviorInstance {
  constructor(behavior, executionContext, instruction){
    this.behavior = behavior;
    this.executionContext = executionContext;
    this.isAttached = false;

    var observerLookup = behavior.observerLocator.getObserversLookup(executionContext),
        handlesBind = behavior.handlesBind,
        attributes = instruction.attributes,
        boundProperties = this.boundProperties = [],
        properties = behavior.properties,
        i, ii;

    behavior.ensurePropertiesDefined(executionContext, observerLookup);

    for(i = 0, ii = properties.length; i < ii; ++i){
      properties[i].initialize(executionContext, observerLookup, attributes, handlesBind, boundProperties);
    }
  }

  created(context){
    if(this.behavior.handlesCreated){
      this.executionContext.created(context);
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
      this.executionContext.bind(context);
    }

    if(this.view){
      this.view.bind(this.executionContext);
    }
  }

  unbind(){
    var boundProperties = this.boundProperties,
        i, ii;

    if(this.view){
      this.view.unbind();
    }

    if(this.behavior.handlesUnbind){
      this.executionContext.unbind();
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
      this.executionContext.attached();
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
        this.executionContext.detached();
      }
    }
  }
}
