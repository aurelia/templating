define(["exports"], function (exports) {
  "use strict";

  var BehaviorInstance = (function () {
    var BehaviorInstance = function BehaviorInstance(taskQueue, observerLocator, behaviorType, executionContext, instruction) {
      this.behaviorType = behaviorType;
      this.executionContext = executionContext;

      var lookup = observerLocator.getObserversLookup(executionContext), skipSelfSubscriber = this.behaviorType.handlesBind, attributes = instruction.attributes, boundProperties = this.boundProperties = [];

      behaviorType.properties.forEach(function (prop) {
        var selfSubscriber;

        if (prop.changeHandler) {
          selfSubscriber = function (newValue, oldValue) {
            return executionContext[prop.changeHandler](newValue, oldValue);
          };
        }

        var observer = lookup[prop.name] = new BehaviorPropertyObserver(taskQueue, executionContext, prop.name, selfSubscriber);

        Object.defineProperty(executionContext, prop.name, {
          configurable: true,
          enumerable: true,
          get: observer.getValue.bind(observer),
          set: observer.setValue.bind(observer)
        });

        var info = { observer: observer };
        var attribute = attributes[prop.attribute];

        if (skipSelfSubscriber) {
          observer.selfSubscriber = null;
        }

        if (typeof attribute === "string") {
          executionContext[prop.name] = attribute;
          observer.call();
        } else if (attribute) {
          info.binding = attribute.createBinding(executionContext);
          boundProperties.push(info);
        } else if (prop.defaultValue) {
          executionContext[prop.name] = prop.defaultValue;
          observer.call();
        }

        observer.publishing = true;
        observer.selfSubscriber = selfSubscriber;
      });
    };

    BehaviorInstance.prototype.created = function (context) {
      if (this.behaviorType.handlesCreated) {
        this.executionContext.created(context);
      }
    };

    BehaviorInstance.prototype.bind = function (context) {
      var skipSelfSubscriber = this.behaviorType.handlesBind;

      this.boundProperties.forEach(function (x) {
        var observer = x.observer, selfSubscriber = observer.selfSubscriber;

        observer.publishing = false;

        if (skipSelfSubscriber) {
          observer.selfSubscriber = null;
        }

        x.binding.bind(context);
        observer.call();

        observer.publishing = true;
        observer.selfSubscriber = selfSubscriber;
      });

      if (skipSelfSubscriber) {
        this.executionContext.bind(context);
      }

      if (this.view) {
        this.view.bind(this.executionContext);
      }
    };

    BehaviorInstance.prototype.unbind = function () {
      if (this.view) {
        this.view.unbind();
      }

      if (this.behaviorType.handlesUnbind) {
        this.executionContext.unbind();
      }

      this.boundProperties.forEach(function (x) {
        return x.binding.unbind();
      });
    };

    BehaviorInstance.prototype.attached = function () {
      if (this.behaviorType.handlesAttached) {
        this.executionContext.attached();
      }
    };

    BehaviorInstance.prototype.detached = function () {
      if (this.behaviorType.handlesDetached) {
        this.executionContext.detached();
      }
    };

    return BehaviorInstance;
  })();

  exports.BehaviorInstance = BehaviorInstance;
  var BehaviorPropertyObserver = (function () {
    var BehaviorPropertyObserver = function BehaviorPropertyObserver(taskQueue, obj, propertyName, selfSubscriber) {
      this.taskQueue = taskQueue;
      this.obj = obj;
      this.propertyName = propertyName;
      this.currentValue = obj[propertyName];
      this.callbacks = [];
      this.notqueued = true;
      this.publishing = false;
      this.selfSubscriber = selfSubscriber;
    };

    BehaviorPropertyObserver.prototype.getValue = function () {
      return this.currentValue;
    };

    BehaviorPropertyObserver.prototype.setValue = function (newValue) {
      var oldValue = this.currentValue;

      if (oldValue != newValue) {
        if (this.publishing && this.notqueued) {
          this.notqueued = false;
          this.taskQueue.queueMicroTask(this);
        }

        this.oldValue = oldValue;
        this.currentValue = newValue;
      }
    };

    BehaviorPropertyObserver.prototype.call = function () {
      var callbacks = this.callbacks, i = callbacks.length, oldValue = this.oldValue, newValue = this.currentValue;

      this.notqueued = true;

      if (newValue != oldValue) {
        if (this.selfSubscriber) {
          this.selfSubscriber(newValue, oldValue);
        }

        while (i--) {
          callbacks[i](newValue, oldValue);
        }

        this.oldValue = newValue;
      }
    };

    BehaviorPropertyObserver.prototype.subscribe = function (callback) {
      var callbacks = this.callbacks;
      callbacks.push(callback);
      return function () {
        callbacks.splice(callbacks.indexOf(callback), 1);
      };
    };

    return BehaviorPropertyObserver;
  })();
});