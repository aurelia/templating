"use strict";

exports.configureBehavior = configureBehavior;
var getAllAnnotations = require("aurelia-metadata").getAllAnnotations;
var getAnnotation = require("aurelia-metadata").getAnnotation;
var ResourceType = require("aurelia-metadata").ResourceType;
var TaskQueue = require("aurelia-task-queue").TaskQueue;
var ObserverLocator = require("aurelia-binding").ObserverLocator;
var Children = require("./children").Children;
var Property = require("./property").Property;
var hyphenate = require("./util").hyphenate;
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