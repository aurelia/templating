define(["exports", "aurelia-metadata", "aurelia-task-queue", "aurelia-binding", "./children", "./property", "./util"], function (exports, _aureliaMetadata, _aureliaTaskQueue, _aureliaBinding, _children, _property, _util) {
  "use strict";

  exports.configureBehavior = configureBehavior;
  var getAllAnnotations = _aureliaMetadata.getAllAnnotations;
  var getAnnotation = _aureliaMetadata.getAnnotation;
  var ResourceType = _aureliaMetadata.ResourceType;
  var TaskQueue = _aureliaTaskQueue.TaskQueue;
  var ObserverLocator = _aureliaBinding.ObserverLocator;
  var Children = _children.Children;
  var Property = _property.Property;
  var hyphenate = _util.hyphenate;
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
});