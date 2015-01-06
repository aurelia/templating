System.register(["aurelia-metadata", "aurelia-task-queue", "aurelia-binding", "./behavior-instance", "./children"], function (_export) {
  "use strict";

  var getAllAnnotations, getAnnotation, ResourceType, TaskQueue, ObserverLocator, BehaviorInstance, Children, _inherits, capitalMatcher, Property, Behavior;
  _export("hyphenate", hyphenate);

  function addHyphenAndLower(char) {
    return "-" + char.toLowerCase();
  }

  function hyphenate(name) {
    return (name.charAt(0).toLowerCase() + name.slice(1)).replace(capitalMatcher, addHyphenAndLower);
  }

  return {
    setters: [function (_aureliaMetadata) {
      getAllAnnotations = _aureliaMetadata.getAllAnnotations;
      getAnnotation = _aureliaMetadata.getAnnotation;
      ResourceType = _aureliaMetadata.ResourceType;
    }, function (_aureliaTaskQueue) {
      TaskQueue = _aureliaTaskQueue.TaskQueue;
    }, function (_aureliaBinding) {
      ObserverLocator = _aureliaBinding.ObserverLocator;
    }, function (_behaviorInstance) {
      BehaviorInstance = _behaviorInstance.BehaviorInstance;
    }, function (_children) {
      Children = _children.Children;
    }],
    execute: function () {
      _inherits = function (child, parent) {
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

      capitalMatcher = /([A-Z])/g;
      Property = function Property(name, changeHandler, attribute, defaultValue) {
        this.name = name;
        this.changeHandler = changeHandler;
        this.attribute = attribute || hyphenate(name);
        this.defaultValue = defaultValue;
      };

      _export("Property", Property);

      Behavior = (function () {
        var _ResourceType = ResourceType;
        var Behavior = function Behavior() {
          this.properties = [];
          this.propertyLookupByAttribute = {};
        };

        _inherits(Behavior, _ResourceType);

        Behavior.prototype.setTarget = function (container, target) {
          var proto = target.prototype, i, ii, properties;

          this.target = target;
          this.taskQueue = container.get(TaskQueue);
          this.observerLocator = container.get(ObserverLocator);

          this.handlesCreated = "created" in proto;
          this.handlesBind = "bind" in proto;
          this.handlesUnbind = "unbind" in proto;
          this.handlesAttached = "attached" in proto;
          this.handlesDetached = "detached" in proto;

          properties = getAllAnnotations(target, Property);

          for (i = 0, ii = properties.length; i < ii; ++i) {
            this.configureProperty(properties[i]);
          }

          this.childExpression = getAnnotation(target, Children);
        };

        Behavior.prototype.getPropertyForAttribute = function (attribute) {
          return this.propertyLookupByAttribute[attribute];
        };

        Behavior.prototype.configureProperty = function (property) {
          if (!property.changeHandler) {
            var handlerName = property.name + "Changed";
            if (handlerName in this.target.prototype) {
              property.changeHandler = handlerName;
            }
          }

          this.properties.push(property);
          this.propertyLookupByAttribute[property.attribute] = property;
        };

        Behavior.prototype.compile = function (compiler, resources, node, instruction) {
          instruction.suppressBind = true;
          return node;
        };

        Behavior.prototype.create = function (container, instruction) {
          var executionContext = instruction.executionContext || container.get(this.target);
          return new BehaviorInstance(this.taskQueue, this.observerLocator, this, executionContext, instruction);
        };

        return Behavior;
      })();
      _export("Behavior", Behavior);
    }
  };
});