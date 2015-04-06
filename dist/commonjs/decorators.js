"use strict";

exports.behavior = behavior;
exports.customElement = customElement;
exports.customAttribute = customAttribute;
exports.templateController = templateController;
exports.bindableProperty = bindableProperty;
exports.dynamicOptions = dynamicOptions;
exports.syncChildren = syncChildren;
exports.useShadowDOM = useShadowDOM;
exports.skipContentProcessing = skipContentProcessing;
exports.useView = useView;
exports.noView = noView;
exports.elementConfig = elementConfig;

var _aureliaMetadata = require("aurelia-metadata");

var Metadata = _aureliaMetadata.Metadata;
var Decorators = _aureliaMetadata.Decorators;

var BindableProperty = require("./bindable-property").BindableProperty;

var ChildObserver = require("./children").ChildObserver;

var ElementConfigResource = require("./element-config").ElementConfigResource;

var _viewStrategy = require("./view-strategy");

var UseViewStrategy = _viewStrategy.UseViewStrategy;
var NoViewStrategy = _viewStrategy.NoViewStrategy;

var HtmlBehaviorResource = require("./html-behavior").HtmlBehaviorResource;

function behavior(override) {
  return function (target) {
    var resource = Metadata.on(target).firstOrAdd(HtmlBehaviorResource);
    Object.assign(resource, override);
    return target;
  };
}

Decorators.configure.parameterizedDecorator("behavior", behavior);

function customElement(name) {
  return function (target) {
    var resource = Metadata.on(target).firstOrAdd(HtmlBehaviorResource);
    resource.elementName = name;
    return target;
  };
}

Decorators.configure.parameterizedDecorator("customElement", customElement);

function customAttribute(name) {
  return function (target) {
    var resource = Metadata.on(target).firstOrAdd(HtmlBehaviorResource);
    resource.attributeName = name;
    return target;
  };
}

Decorators.configure.parameterizedDecorator("customAttribute", customAttribute);

function templateController(target) {
  var resource = Metadata.on(target).firstOrAdd(HtmlBehaviorResource);
  resource.liftsContent = true;
  return target;
}

Decorators.configure.simpleDecorator("templateController", templateController);

function bindableProperty(nameOrConfig) {
  return function (target) {
    var resource = Metadata.on(target).firstOrAdd(HtmlBehaviorResource),
        prop = new BindableProperty(nameOrConfig);

    prop.registerWith(target, resource);

    return target;
  };
}

Decorators.configure.parameterizedDecorator("bindableProperty", bindableProperty);

function dynamicOptions(target) {
  var resource = Metadata.on(target).firstOrAdd(HtmlBehaviorResource);
  resource.hasDynamicOptions = true;
  return target;
}

Decorators.configure.simpleDecorator("dynamicOptions", dynamicOptions);

function syncChildren(property, changeHandler, selector) {
  return function (target) {
    var resource = Metadata.on(target).firstOrAdd(HtmlBehaviorResource);
    resource.childExpression = new ChildObserver(property, changeHandler, selector);
    return target;
  };
}

Decorators.configure.parameterizedDecorator("syncChildren", syncChildren);

function useShadowDOM(target) {
  var resource = Metadata.on(target).firstOrAdd(HtmlBehaviorResource);
  resource.useShadowDOM = true;
  return target;
}

Decorators.configure.simpleDecorator("useShadowDOM", useShadowDOM);

function skipContentProcessing(target) {
  var resource = Metadata.on(target).firstOrAdd(HtmlBehaviorResource);
  resource.skipContentProcessing = true;
  return target;
}

Decorators.configure.simpleDecorator("skipContentProcessing", skipContentProcessing);

function useView(path) {
  return function (target) {
    Metadata.on(target).add(new UseViewStrategy(path));
    return target;
  };
}

Decorators.configure.parameterizedDecorator("useView", useView);

function noView(target) {
  Metadata.on(target).add(new NoViewStrategy());
  return target;
}

Decorators.configure.simpleDecorator("noView", noView);

function elementConfig() {
  Metadata.on(target).add(new ElementConfigResource());
  return target;
}

Decorators.configure.simpleDecorator("elementConfig", elementConfig);
Object.defineProperty(exports, "__esModule", {
  value: true
});