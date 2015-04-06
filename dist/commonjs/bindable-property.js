"use strict";

var _prototypeProperties = function (child, staticProps, instanceProps) { if (staticProps) Object.defineProperties(child, staticProps); if (instanceProps) Object.defineProperties(child.prototype, instanceProps); };

var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } };

var hyphenate = require("./util").hyphenate;

var _aureliaBinding = require("aurelia-binding");

var ONE_WAY = _aureliaBinding.ONE_WAY;
var TWO_WAY = _aureliaBinding.TWO_WAY;
var ONE_TIME = _aureliaBinding.ONE_TIME;

function getObserver(behavior, instance, name) {
  var lookup = instance.__observers__;

  if (lookup === undefined) {
    lookup = behavior.observerLocator.getObserversLookup(this);
    behavior.ensurePropertiesDefined(instance, lookup);
  }

  return lookup[name];
}

var BindableProperty = exports.BindableProperty = (function () {
  function BindableProperty(nameOrConfig) {
    _classCallCheck(this, BindableProperty);

    if (typeof nameOrConfig === "string") {
      this.name = nameOrConfig;
    } else {
      Object.assign(this, nameOrConfig);
    }

    this.attribute = this.attribute || hyphenate(this.name);
    this.defaultBindingMode = this.defaultBindingMode || ONE_WAY;
    this.owner = null;
  }

  _prototypeProperties(BindableProperty, null, {
    registerWith: {
      value: function registerWith(target, behavior) {
        var handlerName;

        if (this.changeHandler === undefined) {
          handlerName = this.name + "Changed";
          if (handlerName in target.prototype) {
            this.changeHandler = handlerName;
          }
        }

        behavior.properties.push(this);
        behavior.attributes[this.attribute] = this;
        this.owner = behavior;
      },
      writable: true,
      configurable: true
    },
    defineOn: {
      value: function defineOn(target, behavior) {
        var name = this.name;

        Object.defineProperty(target.prototype, name, {
          configurable: true,
          enumerable: true,
          get: function get() {
            return getObserver(behavior, this, name).getValue();
          },
          set: function set(value) {
            getObserver(behavior, this, name).setValue(value);
          }
        });
      },
      writable: true,
      configurable: true
    },
    createObserver: {
      value: function createObserver(executionContext) {
        var _this = this;

        var selfSubscriber = null;

        if (this.hasOptions || this.isDynamic) {
          return;
        }

        if (this.changeHandler !== undefined) {
          selfSubscriber = function (newValue, oldValue) {
            return executionContext[_this.changeHandler](newValue, oldValue);
          };
        }

        return new BehaviorPropertyObserver(this.owner.taskQueue, executionContext, this.name, selfSubscriber);
      },
      writable: true,
      configurable: true
    },
    initialize: {
      value: function initialize(executionContext, observerLookup, attributes, behaviorHandlesBind, boundProperties) {
        var selfSubscriber, observer, attribute;

        if (this.hasOptions) {
          return;
        } else if (this.isDynamic) {
          for (key in attributes) {
            this.createDynamicProperty(executionContext, observerLookup, behaviorHandlesBind, key, attributes[key], boundProperties);
          }
        } else {
          observer = observerLookup[this.name];

          if (attributes !== undefined) {
            selfSubscriber = observer.selfSubscriber;
            attribute = attributes[this.attribute];

            if (behaviorHandlesBind) {
              observer.selfSubscriber = null;
            }

            if (typeof attribute === "string") {
              executionContext[this.name] = attribute;
              observer.call();
            } else if (attribute) {
              boundProperties.push({ observer: observer, binding: attribute.createBinding(executionContext) });
            } else if (this.defaultValue) {
              executionContext[this.name] = this.defaultValue;
              observer.call();
            }

            observer.selfSubscriber = selfSubscriber;
          }

          observer.publishing = true;
        }
      },
      writable: true,
      configurable: true
    },
    createDynamicProperty: {
      value: function createDynamicProperty(executionContext, observerLookup, behaviorHandlesBind, name, attribute, boundProperties) {
        var changeHandlerName = name + "Changed",
            selfSubscriber = null,
            observer,
            info;

        if (changeHandlerName in executionContext) {
          selfSubscriber = function (newValue, oldValue) {
            return executionContext[changeHandlerName](newValue, oldValue);
          };
        } else if ("dynamicPropertyChanged" in executionContext) {
          selfSubscriber = function (newValue, oldValue) {
            return executionContext.dynamicPropertyChanged(name, newValue, oldValue);
          };
        }

        observer = observerLookup[name] = new BehaviorPropertyObserver(this.owner.taskQueue, executionContext, name, selfSubscriber);

        Object.defineProperty(executionContext, name, {
          configurable: true,
          enumerable: true,
          get: observer.getValue.bind(observer),
          set: observer.setValue.bind(observer)
        });

        if (behaviorHandlesBind) {
          observer.selfSubscriber = null;
        }

        if (typeof attribute === "string") {
          executionContext[name] = attribute;
          observer.call();
        } else if (attribute) {
          info = { observer: observer, binding: attribute.createBinding(executionContext) };
          boundProperties.push(info);
        }

        observer.publishing = true;
        observer.selfSubscriber = selfSubscriber;
      },
      writable: true,
      configurable: true
    }
  });

  return BindableProperty;
})();

var BehaviorPropertyObserver = (function () {
  function BehaviorPropertyObserver(taskQueue, obj, propertyName, selfSubscriber) {
    _classCallCheck(this, BehaviorPropertyObserver);

    this.taskQueue = taskQueue;
    this.obj = obj;
    this.propertyName = propertyName;
    this.callbacks = [];
    this.notqueued = true;
    this.publishing = false;
    this.selfSubscriber = selfSubscriber;
  }

  _prototypeProperties(BehaviorPropertyObserver, null, {
    getValue: {
      value: function getValue() {
        return this.currentValue;
      },
      writable: true,
      configurable: true
    },
    setValue: {
      value: function setValue(newValue) {
        var oldValue = this.currentValue;

        if (oldValue != newValue) {
          if (this.publishing && this.notqueued) {
            this.notqueued = false;
            this.taskQueue.queueMicroTask(this);
          }

          this.oldValue = oldValue;
          this.currentValue = newValue;
        }
      },
      writable: true,
      configurable: true
    },
    call: {
      value: function call() {
        var callbacks = this.callbacks,
            i = callbacks.length,
            oldValue = this.oldValue,
            newValue = this.currentValue;

        this.notqueued = true;

        if (newValue != oldValue) {
          if (this.selfSubscriber !== null) {
            this.selfSubscriber(newValue, oldValue);
          }

          while (i--) {
            callbacks[i](newValue, oldValue);
          }

          this.oldValue = newValue;
        }
      },
      writable: true,
      configurable: true
    },
    subscribe: {
      value: function subscribe(callback) {
        var callbacks = this.callbacks;
        callbacks.push(callback);
        return function () {
          callbacks.splice(callbacks.indexOf(callback), 1);
        };
      },
      writable: true,
      configurable: true
    }
  });

  return BehaviorPropertyObserver;
})();

Object.defineProperty(exports, "__esModule", {
  value: true
});