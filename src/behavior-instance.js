export class BehaviorInstance {
	constructor(taskQueue, observerLocator, behaviorType, executionContext, instruction){
		this.behaviorType = behaviorType;
		this.executionContext = executionContext;

		var lookup = observerLocator.getObserversLookup(executionContext),
        skipSelfSubscriber = behaviorType.handlesBind,
        attributes = instruction.attributes,
        boundProperties = this.boundProperties = [],
        properties = behaviorType.properties;

    properties.forEach(prop => {
      var selfSubscriber, observer, info, attribute;
      
      if(prop.changeHandler){
        selfSubscriber = (newValue, oldValue) => executionContext[prop.changeHandler](newValue, oldValue);
      }

      observer = lookup[prop.name] = new BehaviorPropertyObserver(
        taskQueue, 
        executionContext, 
        prop.name,
        selfSubscriber
        );

      Object.defineProperty(executionContext, prop.name, {
        configurable: true,
        enumerable: true,
        get: observer.getValue.bind(observer),
        set: observer.setValue.bind(observer)
      });

      info = { observer:observer };
      attribute = attributes[prop.attribute];

      if(skipSelfSubscriber){
        observer.selfSubscriber = null;
      }

      if(typeof attribute === 'string'){
        executionContext[prop.name] = attribute;
        observer.call();
      }else if(attribute){
        info.binding = attribute.createBinding(executionContext);
        boundProperties.push(info);
      }else if(prop.defaultValue){
        executionContext[prop.name] = prop.defaultValue;
        observer.call();
      }

      observer.publishing = true;
      observer.selfSubscriber = selfSubscriber;
    });
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

class BehaviorPropertyObserver {
  constructor(taskQueue, obj, propertyName, selfSubscriber){
    this.taskQueue = taskQueue;
    this.obj = obj;
    this.propertyName = propertyName;
    this.currentValue = obj[propertyName];
    this.callbacks = [];
    this.notqueued = true;
    this.publishing = false;
    this.selfSubscriber = selfSubscriber;
  }

  getValue(){
    return this.currentValue;
  }

  setValue(newValue){
    var oldValue = this.currentValue;

    if(oldValue != newValue){
      if(this.publishing && this.notqueued){
        this.notqueued = false;
        this.taskQueue.queueMicroTask(this);
      }

      this.oldValue = oldValue;
      this.currentValue = newValue;
    }
  }

  call(){
  	var callbacks = this.callbacks,
        i = callbacks.length,
        oldValue = this.oldValue,
        newValue = this.currentValue;

    this.notqueued = true;

    if(newValue != oldValue){
    	if(this.selfSubscriber){
    		this.selfSubscriber(newValue, oldValue);
    	}

    	while(i--) {
	      callbacks[i](newValue, oldValue);
	    }

    	this.oldValue = newValue;
    }
  }

  subscribe(callback){
    var callbacks = this.callbacks;
    callbacks.push(callback);
    return function(){
      callbacks.splice(callbacks.indexOf(callback), 1);
    };
  }
}