"use strict";

var _prototypeProperties = function (child, staticProps, instanceProps) {
  if (staticProps) Object.defineProperties(child, staticProps);
  if (instanceProps) Object.defineProperties(child.prototype, instanceProps);
};

var BehaviorInstance = (function () {
  var BehaviorInstance = function BehaviorInstance(taskQueue, observerLocator, behaviorType, executionContext, instruction) {
    this.behaviorType = behaviorType;
    this.executionContext = executionContext;

    var observerLookup = observerLocator.getObserversLookup(executionContext),
        handlesBind = behaviorType.handlesBind,
        attributes = instruction.attributes,
        boundProperties = this.boundProperties = [],
        properties = behaviorType.properties,
        i,
        ii,
        info;

    for (i = 0, ii = properties.length; i < ii; ++i) {
      info = properties[i].create(taskQueue, executionContext, observerLookup, attributes, handlesBind);
      if (info !== undefined) {
        boundProperties.push(info);
      }
    }
  };

  _prototypeProperties(BehaviorInstance, null, {
    created: {
      value: function (context) {
        if (this.behaviorType.handlesCreated) {
          this.executionContext.created(context);
        }
      },
      writable: true,
      enumerable: true,
      configurable: true
    },
    bind: {
      value: function (context) {
        var skipSelfSubscriber = this.behaviorType.handlesBind, boundProperties = this.boundProperties, i, ii, x, observer, selfSubscriber;

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
      enumerable: true,
      configurable: true
    },
    unbind: {
      value: function () {
        var boundProperties = this.boundProperties, i, ii;

        if (this.view) {
          this.view.unbind();
        }

        if (this.behaviorType.handlesUnbind) {
          this.executionContext.unbind();
        }

        for (i = 0, ii = boundProperties.length; i < ii; ++i) {
          boundProperties[i].binding.unbind();
        }
      },
      writable: true,
      enumerable: true,
      configurable: true
    },
    attached: {
      value: function () {
        if (this.behaviorType.handlesAttached) {
          this.executionContext.attached();
        }
      },
      writable: true,
      enumerable: true,
      configurable: true
    },
    detached: {
      value: function () {
        if (this.behaviorType.handlesDetached) {
          this.executionContext.detached();
        }
      },
      writable: true,
      enumerable: true,
      configurable: true
    }
  });

  return BehaviorInstance;
})();

exports.BehaviorInstance = BehaviorInstance;