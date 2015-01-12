System.register(["aurelia-metadata", "aurelia-task-queue", "aurelia-binding", "./children", "./property", "./util"], function (_export) {
  "use strict";

  var getAllAnnotations, getAnnotation, ResourceType, TaskQueue, ObserverLocator, Children, Property, hyphenate;
  _export("configureBehavior", configureBehavior);

  function configureBehavior(behavior, container, target) {
    var proto = target.prototype, i, ii, properties;

    if (!behavior.name) {
      behavior.name = hyphenate(target.name);
    }

    behavior.target = target;
    behavior.taskQueue = container.get(TaskQueue);
    behavior.observerLocator = container.get(ObserverLocator);

    behavior.handlesCreated = "created" in proto;
    behavior.handlesBind = "bind" in proto;
    behavior.handlesUnbind = "unbind" in proto;
    behavior.handlesAttached = "attached" in proto;
    behavior.handlesDetached = "detached" in proto;

    properties = getAllAnnotations(target, Property);

    for (i = 0, ii = properties.length; i < ii; ++i) {
      properties[i].configureBehavior(behavior);
    }

    behavior.childExpression = getAnnotation(target, Children);
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
    }, function (_children) {
      Children = _children.Children;
    }, function (_property) {
      Property = _property.Property;
    }, function (_util) {
      hyphenate = _util.hyphenate;
    }],
    execute: function () {}
  };
});