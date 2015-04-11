import core from 'core-js';
import {hyphenate} from './util';
import {ONE_WAY,TWO_WAY,ONE_TIME} from 'aurelia-binding';

function getObserver(behavior, instance, name){
  var lookup = instance.__observers__;

  if(lookup === undefined){
    lookup = behavior.observerLocator.getObserversLookup(instance);
    behavior.ensurePropertiesDefined(instance, lookup);
  }

  return lookup[name];
}

export class BindableProperty {
  constructor(nameOrConfig){
    if(typeof nameOrConfig === 'string'){
      this.name = nameOrConfig;
    }else{
      Object.assign(this, nameOrConfig);
    }

    this.attribute = this.attribute || hyphenate(this.name);
    this.defaultBindingMode = this.defaultBindingMode || ONE_WAY;
    this.changeHandler = this.changeHandler || null;
    this.owner = null;
  }

  registerWith(target, behavior){
    behavior.properties.push(this);
    behavior.attributes[this.attribute] = this;
    this.owner = behavior;
  }

  defineOn(target, behavior){
    var name = this.name,
        handlerName;

    if(this.changeHandler === null){
      handlerName = name + 'Changed';
      if(handlerName in target.prototype){
        this.changeHandler = handlerName;
      }
    }

    Object.defineProperty(target.prototype, name, {
      configurable: true,
      enumerable: true,
      get: function(){
        return getObserver(behavior, this, name).getValue();
      },
      set: function(value){
        getObserver(behavior, this, name).setValue(value);
      }
    });
  }

  createObserver(executionContext){
    var selfSubscriber = null;

    if(this.hasOptions){
      return;
    }

    if(this.changeHandler !== null){
      selfSubscriber = (newValue, oldValue) => executionContext[this.changeHandler](newValue, oldValue);
    }

    return new BehaviorPropertyObserver(this.owner.taskQueue, executionContext, this.name, selfSubscriber);
  }

  initialize(executionContext, observerLookup, attributes, behaviorHandlesBind, boundProperties){
    var selfSubscriber, observer, attribute;

    if(this.isDynamic){
      for(let key in attributes){
        this.createDynamicProperty(executionContext, observerLookup, behaviorHandlesBind, key, attributes[key], boundProperties);
      }
    } else if(!this.hasOptions){
      observer = observerLookup[this.name];

      if(attributes !== undefined){
        selfSubscriber = observer.selfSubscriber;
        attribute = attributes[this.attribute];

        if(behaviorHandlesBind){
          observer.selfSubscriber = null;
        }

        if(typeof attribute === 'string'){
          executionContext[this.name] = attribute;
          observer.call();
        }else if(attribute){
          boundProperties.push({observer:observer, binding:attribute.createBinding(executionContext)});
        }else if(this.defaultValue !== undefined){
          executionContext[this.name] = this.defaultValue;
          observer.call();
        }

        observer.selfSubscriber = selfSubscriber;
      }

      observer.publishing = true;
    }
  }

  createDynamicProperty(executionContext, observerLookup, behaviorHandlesBind, name, attribute, boundProperties){
    var changeHandlerName = name + 'Changed',
        selfSubscriber = null, observer, info;

    if(changeHandlerName in executionContext){
      selfSubscriber = (newValue, oldValue) => executionContext[changeHandlerName](newValue, oldValue);
    } else if ('dynamicPropertyChanged' in executionContext) {
      selfSubscriber = (newValue, oldValue) => executionContext['dynamicPropertyChanged'](name, newValue, oldValue);
    }

    observer = observerLookup[name] = new BehaviorPropertyObserver(
        this.owner.taskQueue,
        executionContext,
        name,
        selfSubscriber
        );

    Object.defineProperty(executionContext, name, {
      configurable: true,
      enumerable: true,
      get: observer.getValue.bind(observer),
      set: observer.setValue.bind(observer)
    });

    if(behaviorHandlesBind){
      observer.selfSubscriber = null;
    }

    if(typeof attribute === 'string'){
      executionContext[name] = attribute;
      observer.call();
    }else if(attribute){
      info = {observer:observer, binding:attribute.createBinding(executionContext)};
      boundProperties.push(info);
    }

    observer.publishing = true;
    observer.selfSubscriber = selfSubscriber;
  }
}

class BehaviorPropertyObserver {
  constructor(taskQueue, obj, propertyName, selfSubscriber){
    this.taskQueue = taskQueue;
    this.obj = obj;
    this.propertyName = propertyName;
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
      if(this.selfSubscriber !== null){
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
