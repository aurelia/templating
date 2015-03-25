System.register(["./util", "aurelia-binding"], function (_export) {
  var hyphenate, ONE_WAY, TWO_WAY, ONE_TIME, _inherits, _prototypeProperties, _classCallCheck, BehaviorProperty, OptionsProperty, BehaviorPropertyObserver;

  return {
    setters: [function (_util) {
      hyphenate = _util.hyphenate;
    }, function (_aureliaBinding) {
      ONE_WAY = _aureliaBinding.ONE_WAY;
      TWO_WAY = _aureliaBinding.TWO_WAY;
      ONE_TIME = _aureliaBinding.ONE_TIME;
    }],
    execute: function () {
      "use strict";

      _inherits = function (subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; };

      _prototypeProperties = function (child, staticProps, instanceProps) { if (staticProps) Object.defineProperties(child, staticProps); if (instanceProps) Object.defineProperties(child.prototype, instanceProps); };

      _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } };

      BehaviorProperty = _export("BehaviorProperty", (function () {
        function BehaviorProperty(name, changeHandler, attribute, defaultValue, defaultBindingMode) {
          _classCallCheck(this, BehaviorProperty);

          this.name = name;
          this.changeHandler = changeHandler;
          this.attribute = attribute || hyphenate(name);
          this.defaultValue = defaultValue;
          this.defaultBindingMode = defaultBindingMode || ONE_WAY;
        }

        _prototypeProperties(BehaviorProperty, null, {
          bindingIsTwoWay: {
            value: function bindingIsTwoWay() {
              this.defaultBindingMode = TWO_WAY;
              return this;
            },
            writable: true,
            configurable: true
          },
          bindingIsOneWay: {
            value: function bindingIsOneWay() {
              this.defaultBindingMode = ONE_WAY;
              return this;
            },
            writable: true,
            configurable: true
          },
          bindingIsOneTime: {
            value: function bindingIsOneTime() {
              this.defaultBindingMode = ONE_TIME;
              return this;
            },
            writable: true,
            configurable: true
          },
          define: {
            value: function define(taskQueue, behavior) {
              var that = this,
                  handlerName;

              this.taskQueue = taskQueue;

              if (!this.changeHandler) {
                handlerName = this.name + "Changed";
                if (handlerName in behavior.target.prototype) {
                  this.changeHandler = handlerName;
                }
              }

              behavior.properties.push(this);
              behavior.attributes[this.attribute] = this;

              Object.defineProperty(behavior.target.prototype, this.name, {
                configurable: true,
                enumerable: true,
                get: function get() {
                  return this.__observers__[that.name].getValue();
                },
                set: function set(value) {
                  this.__observers__[that.name].setValue(value);
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

              if (this.changeHandler) {
                selfSubscriber = function (newValue, oldValue) {
                  return executionContext[_this.changeHandler](newValue, oldValue);
                };
              }

              return new BehaviorPropertyObserver(this.taskQueue, executionContext, this.name, selfSubscriber);
            },
            writable: true,
            configurable: true
          },
          initialize: {
            value: function initialize(executionContext, observerLookup, attributes, behaviorHandlesBind, boundProperties) {
              var selfSubscriber, observer, attribute;

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
            },
            writable: true,
            configurable: true
          }
        });

        return BehaviorProperty;
      })());
      OptionsProperty = _export("OptionsProperty", (function (BehaviorProperty) {
        function OptionsProperty(attribute) {
          for (var _len = arguments.length, rest = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
            rest[_key - 1] = arguments[_key];
          }

          _classCallCheck(this, OptionsProperty);

          if (typeof attribute === "string") {
            this.attribute = attribute;
          } else if (attribute) {
            rest.unshift(attribute);
          }

          this.properties = rest;
          this.hasOptions = true;
        }

        _inherits(OptionsProperty, BehaviorProperty);

        _prototypeProperties(OptionsProperty, null, {
          dynamic: {
            value: function dynamic() {
              this.isDynamic = true;
              return this;
            },
            writable: true,
            configurable: true
          },
          withProperty: {
            value: function withProperty(name, changeHandler, attribute, defaultValue, defaultBindingMode) {
              this.properties.push(new BehaviorProperty(name, changeHandler, attribute, defaultValue, defaultBindingMode));
              return this;
            },
            writable: true,
            configurable: true
          },
          define: {
            value: function define(taskQueue, behavior) {
              var i,
                  ii,
                  properties = this.properties;

              this.taskQueue = taskQueue;
              this.attribute = this.attribute || behavior.name;

              behavior.properties.push(this);
              behavior.attributes[this.attribute] = this;

              for (i = 0, ii = properties.length; i < ii; ++i) {
                properties[i].define(taskQueue, behavior);
              }
            },
            writable: true,
            configurable: true
          },
          createObserver: {
            value: function createObserver(executionContext) {},
            writable: true,
            configurable: true
          },
          initialize: {
            value: function initialize(executionContext, observerLookup, attributes, behaviorHandlesBind, boundProperties) {
              var value, key, info;

              if (!this.isDynamic) {
                return;
              }

              for (key in attributes) {
                this.createDynamicProperty(executionContext, observerLookup, behaviorHandlesBind, key, attributes[key], boundProperties);
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

              observer = observerLookup[name] = new BehaviorPropertyObserver(this.taskQueue, executionContext, name, selfSubscriber);

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

        return OptionsProperty;
      })(BehaviorProperty));

      BehaviorPropertyObserver = (function () {
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
    }
  };
});