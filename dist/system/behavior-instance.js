System.register([], function (_export) {
  var _prototypeProperties, _classCallCheck, BehaviorInstance;

  return {
    setters: [],
    execute: function () {
      "use strict";

      _prototypeProperties = function (child, staticProps, instanceProps) { if (staticProps) Object.defineProperties(child, staticProps); if (instanceProps) Object.defineProperties(child.prototype, instanceProps); };

      _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } };

      BehaviorInstance = _export("BehaviorInstance", (function () {
        function BehaviorInstance(behavior, executionContext, instruction) {
          _classCallCheck(this, BehaviorInstance);

          this.behavior = behavior;
          this.executionContext = executionContext;

          var observerLookup = behavior.observerLocator.getObserversLookup(executionContext),
              handlesBind = behavior.handlesBind,
              attributes = instruction.attributes,
              boundProperties = this.boundProperties = [],
              properties = behavior.properties,
              i,
              ii;

          for (i = 0, ii = properties.length; i < ii; ++i) {
            properties[i].initialize(executionContext, observerLookup, attributes, handlesBind, boundProperties);
          }
        }

        _prototypeProperties(BehaviorInstance, null, {
          created: {
            value: function created(context) {
              if (this.behavior.handlesCreated) {
                this.executionContext.created(context);
              }
            },
            writable: true,
            configurable: true
          },
          bind: {
            value: function bind(context) {
              var skipSelfSubscriber = this.behavior.handlesBind,
                  boundProperties = this.boundProperties,
                  i,
                  ii,
                  x,
                  observer,
                  selfSubscriber;

              for (i = 0, ii = boundProperties.length; i < ii; ++i) {
                x = boundProperties[i];
                observer = x.observer;
                selfSubscriber = observer.selfSubscriber;
                observer.publishing = false;

                if (skipSelfSubscriber) {
                  observer.selfSubscriber = null;
                }

                x.binding.bind(context);
                observer.call();

                observer.publishing = true;
                observer.selfSubscriber = selfSubscriber;
              }

              if (skipSelfSubscriber) {
                this.executionContext.bind(context);
              }

              if (this.view) {
                this.view.bind(this.executionContext);
              }
            },
            writable: true,
            configurable: true
          },
          unbind: {
            value: function unbind() {
              var boundProperties = this.boundProperties,
                  i,
                  ii;

              if (this.view) {
                this.view.unbind();
              }

              if (this.behavior.handlesUnbind) {
                this.executionContext.unbind();
              }

              for (i = 0, ii = boundProperties.length; i < ii; ++i) {
                boundProperties[i].binding.unbind();
              }
            },
            writable: true,
            configurable: true
          },
          attached: {
            value: function attached() {
              if (this.behavior.handlesAttached) {
                this.executionContext.attached();
              }
            },
            writable: true,
            configurable: true
          },
          detached: {
            value: function detached() {
              if (this.behavior.handlesDetached) {
                this.executionContext.detached();
              }
            },
            writable: true,
            configurable: true
          }
        });

        return BehaviorInstance;
      })());
    }
  };
});