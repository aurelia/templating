define(["exports", "./util"], function (exports, _util) {
  "use strict";

  var _inherits = function (child, parent) {
    if (typeof parent !== "function" && parent !== null) {
      throw new TypeError("Super expression must either be null or a function, not " + typeof parent);
    }
    child.prototype = Object.create(parent && parent.prototype, {
      constructor: {
        value: child,
        enumerable: false,
        writable: true,
        configurable: true
      }
    });
    if (parent) child.__proto__ = parent;
  };

  var _prototypeProperties = function (child, staticProps, instanceProps) {
    if (staticProps) Object.defineProperties(child, staticProps);
    if (instanceProps) Object.defineProperties(child.prototype, instanceProps);
  };

  var hyphenate = _util.hyphenate;
  var Property = (function () {
    var Property = function Property(name, changeHandler, attribute, defaultValue) {
      this.name = name;
      this.changeHandler = changeHandler;
      this.attribute = attribute || hyphenate(name);
      this.defaultValue = defaultValue;
    };

    _prototypeProperties(Property, null, {
      configureBehavior: {
        value: function (behavior) {
          if (!this.changeHandler) {
            var handlerName = this.name + "Changed";
            if (handlerName in behavior.target.prototype) {
              this.changeHandler = handlerName;
            }
          }

          behavior.properties.push(this);
          behavior.attributes[this.attribute] = this;
        },
        writable: true,
        enumerable: true,
        configurable: true
      },
      create: {
        value: function (taskQueue, executionContext, observerLookup, attributes, behaviorHandlesBind) {
          var _this = this;
          var selfSubscriber, observer, attribute, info;

          if (this.changeHandler) {
            selfSubscriber = function (newValue, oldValue) {
              return executionContext[_this.changeHandler](newValue, oldValue);
            };
          }

          observer = observerLookup[this.name] = new BehaviorPropertyObserver(taskQueue, executionContext, this.name, selfSubscriber);

          Object.defineProperty(executionContext, this.name, {
            configurable: true,
            enumerable: true,
            get: observer.getValue.bind(observer),
            set: observer.setValue.bind(observer)
          });

          attribute = attributes[this.attribute];

          if (behaviorHandlesBind) {
            observer.selfSubscriber = null;
          }

          if (typeof attribute === "string") {
            executionContext[this.name] = attribute;
            observer.call();
          } else if (attribute) {
            info = { observer: observer, binding: attribute.createBinding(executionContext) };
          } else if (this.defaultValue) {
            executionContext[this.name] = this.defaultValue;
            observer.call();
          }

          observer.publishing = true;
          observer.selfSubscriber = selfSubscriber;
          return info;
        },
        writable: true,
        enumerable: true,
        configurable: true
      }
    });

    return Property;
  })();

  exports.Property = Property;
  var OptionsProperty = (function (Property) {
    var OptionsProperty = function OptionsProperty(attribute) {
      var rest = [];

      for (var _key = 1; _key < arguments.length; _key++) {
        rest[_key - 1] = arguments[_key];
      }

      if (typeof attribute === "string") {
        this.attribute = attribute;
      } else {
        rest.unshift(attribute);
      }

      this.properties = rest;
      this.hasOptions = true;
    };

    _inherits(OptionsProperty, Property);

    _prototypeProperties(OptionsProperty, null, {
      configureBehavior: {
        value: function (behavior) {
          var i, ii, properties = this.properties;

          this.attribute = this.attribute || behavior.name;

          behavior.properties.push(this);
          behavior.attributes[this.attribute] = this;

          for (i = 0, ii = properties.length; i < ii; ++i) {
            properties[i].configureBehavior(behavior);
          }
        },
        writable: true,
        enumerable: true,
        configurable: true
      },
      create: {
        value: function () {},
        writable: true,
        enumerable: true,
        configurable: true
      }
    });

    return OptionsProperty;
  })(Property);

  exports.OptionsProperty = OptionsProperty;
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

    _prototypeProperties(BehaviorPropertyObserver, null, {
      getValue: {
        value: function () {
          return this.currentValue;
        },
        writable: true,
        enumerable: true,
        configurable: true
      },
      setValue: {
        value: function (newValue) {
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
        enumerable: true,
        configurable: true
      },
      call: {
        value: function () {
          var callbacks = this.callbacks,
              i = callbacks.length,
              oldValue = this.oldValue,
              newValue = this.currentValue;

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
        },
        writable: true,
        enumerable: true,
        configurable: true
      },
      subscribe: {
        value: function (callback) {
          var callbacks = this.callbacks;
          callbacks.push(callback);
          return function () {
            callbacks.splice(callbacks.indexOf(callback), 1);
          };
        },
        writable: true,
        enumerable: true,
        configurable: true
      }
    });

    return BehaviorPropertyObserver;
  })();
});