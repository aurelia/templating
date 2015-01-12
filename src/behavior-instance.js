export class BehaviorInstance {
	constructor(taskQueue, observerLocator, behaviorType, executionContext, instruction){
		this.behaviorType = behaviorType;
		this.executionContext = executionContext;

		var observerLookup = observerLocator.getObserversLookup(executionContext),
        handlesBind = behaviorType.handlesBind,
        attributes = instruction.attributes,
        boundProperties = this.boundProperties = [],
        properties = behaviorType.properties,
        i, ii, info;

    for(i = 0, ii = properties.length; i < ii; ++i){
      info = properties[i].create(taskQueue, executionContext, observerLookup, attributes, handlesBind);
      if(info !== undefined){
        boundProperties.push(info);
      }
    }
	}

  created(context){
    if(this.behaviorType.handlesCreated){
      this.executionContext.created(context);
    }
  }

	bind(context){
		var skipSelfSubscriber = this.behaviorType.handlesBind,
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

    if(this.behaviorType.handlesUnbind){
      this.executionContext.unbind();
    }

    for(i = 0, ii = boundProperties.length; i < ii; ++i){
      boundProperties[i].binding.unbind();
    }
	}

  attached(){
    if(this.behaviorType.handlesAttached){
      this.executionContext.attached();
    }
  }

  detached(){
    if(this.behaviorType.handlesDetached){
      this.executionContext.detached();
    }
  }
}