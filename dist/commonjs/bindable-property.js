'use strict';

var _interopRequireWildcard = function (obj) { return obj && obj.__esModule ? obj : { 'default': obj }; };

var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } };

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _core = require('core-js');

var _core2 = _interopRequireWildcard(_core);

var _hyphenate = require('./util');

var _ONE_WAY$TWO_WAY$ONE_TIME = require('aurelia-binding');

function getObserver(behavior, instance, name) {
  var lookup = instance.__observers__;

  if (lookup === undefined) {
    lookup = behavior.observerLocator.getObserversLookup(instance);
    behavior.ensurePropertiesDefined(instance, lookup);
  }

  return lookup[name];
}

var BindableProperty = (function () {
  function BindableProperty(nameOrConfig) {
    _classCallCheck(this, BindableProperty);

    if (typeof nameOrConfig === 'string') {
      this.name = nameOrConfig;
    } else {
      Object.assign(this, nameOrConfig);
    }

    this.attribute = this.attribute || _hyphenate.hyphenate(this.name);
    this.defaultBindingMode = this.defaultBindingMode || _ONE_WAY$TWO_WAY$ONE_TIME.ONE_WAY;
    this.owner = null;
  }

  _createClass(BindableProperty, [{
    key: 'registerWith',
    value: function registerWith(target, behavior) {
      behavior.properties.push(this);
      behavior.attributes[this.attribute] = this;
      this.owner = behavior;
    }
  }, {
    key: 'defineOn',
    value: function defineOn(target, behavior) {
      var name = this.name,
          handlerName;

      if (this.changeHandler === undefined) {
        handlerName = name + 'Changed';
        if (handlerName in target.prototype) {
          this.changeHandler = handlerName;
        }
      }

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
    }
  }, {
    key: 'createObserver',
    value: function createObserver(executionContext) {
      var _this = this;

      var selfSubscriber = null;

      if (this.hasOptions) {
        return;
      }

      if (this.changeHandler !== undefined) {
        selfSubscriber = function (newValue, oldValue) {
          return executionContext[_this.changeHandler](newValue, oldValue);
        };
      }

      return new BehaviorPropertyObserver(this.owner.taskQueue, executionContext, this.name, selfSubscriber);
    }
  }, {
    key: 'initialize',
    value: function initialize(executionContext, observerLookup, attributes, behaviorHandlesBind, boundProperties) {
      var selfSubscriber, observer, attribute;

      if (this.isDynamic) {
        for (var key in attributes) {
          this.createDynamicProperty(executionContext, observerLookup, behaviorHandlesBind, key, attributes[key], boundProperties);
        }
      } else if (!this.hasOptions) {
        observer = observerLookup[this.name];

        if (attributes !== undefined) {
          selfSubscriber = observer.selfSubscriber;
          attribute = attributes[this.attribute];

          if (behaviorHandlesBind) {
            observer.selfSubscriber = null;
          }

          if (typeof attribute === 'string') {
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
    }
  }, {
    key: 'createDynamicProperty',
    value: function createDynamicProperty(executionContext, observerLookup, behaviorHandlesBind, name, attribute, boundProperties) {
      var changeHandlerName = name + 'Changed',
          selfSubscriber = null,
          observer,
          info;

      if (changeHandlerName in executionContext) {
        selfSubscriber = function (newValue, oldValue) {
          return executionContext[changeHandlerName](newValue, oldValue);
        };
      } else if ('dynamicPropertyChanged' in executionContext) {
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

      if (typeof attribute === 'string') {
        executionContext[name] = attribute;
        observer.call();
      } else if (attribute) {
        info = { observer: observer, binding: attribute.createBinding(executionContext) };
        boundProperties.push(info);
      }

      observer.publishing = true;
      observer.selfSubscriber = selfSubscriber;
    }
  }]);

  return BindableProperty;
})();

exports.BindableProperty = BindableProperty;

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

  _createClass(BehaviorPropertyObserver, [{
    key: 'getValue',
    value: function getValue() {
      return this.currentValue;
    }
  }, {
    key: 'setValue',
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
    }
  }, {
    key: 'call',
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
    }
  }, {
    key: 'subscribe',
    value: function subscribe(callback) {
      var callbacks = this.callbacks;
      callbacks.push(callback);
      return function () {
        callbacks.splice(callbacks.indexOf(callback), 1);
      };
    }
  }]);

  return BehaviorPropertyObserver;
})();