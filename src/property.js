import {hyphenate} from './util';
import {ONE_WAY,TWO_WAY,ONE_TIME} from 'aurelia-binding';

export class Property {
  constructor(name, changeHandler, attribute, defaultValue, defaultBindingMode){
    this.name = name;
    this.changeHandler = changeHandler;
    this.attribute = attribute || hyphenate(name);
    this.defaultValue = defaultValue;
    this.defaultBindingMode = defaultBindingMode || ONE_WAY;
  }

  defaultBindingIsTwoWay(){
    this.defaultBindingMode = TWO_WAY;
    return this;
  }

  defaultBindingIsOneWay(){
    this.defaultBindingMode = ONE_WAY;
    return this;
  }

  defaultBindingIsOneTime(){
    this.defaultBindingMode = ONE_TIME;
    return this;
  }

  configureBehavior(behavior){
    if(!this.changeHandler){
      var handlerName = this.name + 'Changed';
      if(handlerName in behavior.target.prototype){
        this.changeHandler = handlerName;
      }
    }

    behavior.properties.push(this);
    behavior.attributes[this.attribute] = this;
  }

  create(taskQueue, executionContext, observerLookup, attributes, behaviorHandlesBind, boundProperties){
    var selfSubscriber, observer, attribute, info;
      
    if(this.changeHandler){
      selfSubscriber = (newValue, oldValue) => executionContext[this.changeHandler](newValue, oldValue);
    }

    observer = observerLookup[this.name] = new BehaviorPropertyObserver(
      taskQueue, 
      executionContext, 
      this.name,
      selfSubscriber
      );

    Object.defineProperty(executionContext, this.name, {
      configurable: true,
      enumerable: true,
      get: observer.getValue.bind(observer),
      set: observer.setValue.bind(observer)
    });

    attribute = attributes[this.attribute];

    if(behaviorHandlesBind){
      observer.selfSubscriber = null;
    }

    if(typeof attribute === 'string'){
      executionContext[this.name] = attribute;
      observer.call();
    }else if(attribute){
      info = {observer:observer, binding:attribute.createBinding(executionContext)};
      boundProperties.push(info);
    }else if(this.defaultValue){
      executionContext[this.name] = this.defaultValue;
      observer.call();
    }

    observer.publishing = true;
    observer.selfSubscriber = selfSubscriber;
  }
}

export class OptionsProperty extends Property{
  constructor(attribute, ...rest){
    if(typeof attribute === 'string'){
      this.attribute = attribute;
    }else if(attribute){
      rest.unshift(attribute);
    }

    this.properties = rest;
    this.hasOptions = true;
  }

  dynamic(){
    this.isDynamic = true;
    return this;
  }

  configureBehavior(behavior){
    var i, ii, properties = this.properties;

    this.attribute = this.attribute || behavior.name;

    behavior.properties.push(this);
    behavior.attributes[this.attribute] = this;

    for(i = 0, ii = properties.length; i < ii; ++i){
      properties[i].configureBehavior(behavior);
    }
  }

  create(taskQueue, executionContext, observerLookup, attributes, behaviorHandlesBind, boundProperties){
    var value, key, info;

    if(!this.isDynamic){
      return;
    }

    for(key in attributes){
      this.createDynamicProperty(taskQueue, executionContext, observerLookup, behaviorHandlesBind, key, attributes[key], boundProperties);
    }
  }

  createDynamicProperty(taskQueue, executionContext, observerLookup, behaviorHandlesBind, name, attribute, boundProperties){
    var changeHandlerName = name + 'Changed',
        selfSubscriber, observer, info;

    if(changeHandlerName in executionContext){
      selfSubscriber = (newValue, oldValue) => executionContext[changeHandlerName](newValue, oldValue);
    }

    observer = observerLookup[name] = new BehaviorPropertyObserver(
        taskQueue, 
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