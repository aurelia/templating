"use strict";

var Metadata = require("aurelia-metadata").Metadata;

var _property = require("./property");

var BehaviorProperty = _property.BehaviorProperty;
var OptionsProperty = _property.OptionsProperty;

var _attachedBehavior = require("./attached-behavior");

var AttachedBehavior = _attachedBehavior.AttachedBehavior;

var _children = require("./children");

var ChildObserver = _children.ChildObserver;

var _customElement = require("./custom-element");

var CustomElement = _customElement.CustomElement;
var UseShadowDOM = _customElement.UseShadowDOM;
var SkipContentProcessing = _customElement.SkipContentProcessing;

var _elementConfig = require("./element-config");

var ElementConfig = _elementConfig.ElementConfig;

var _templateController = require("./template-controller");

var TemplateController = _templateController.TemplateController;

var _viewStrategy = require("./view-strategy");

var UseView = _viewStrategy.UseView;
var NoView = _viewStrategy.NoView;
exports.AttachedBehavior = _attachedBehavior.AttachedBehavior;
exports.BehaviorProperty = _property.BehaviorProperty;
exports.OptionsProperty = _property.OptionsProperty;
exports.ResourceCoordinator = require("./resource-coordinator").ResourceCoordinator;

var _resourceRegistry = require("./resource-registry");

exports.ResourceRegistry = _resourceRegistry.ResourceRegistry;
exports.ViewResources = _resourceRegistry.ViewResources;
exports.ChildObserver = _children.ChildObserver;
exports.CustomElement = _customElement.CustomElement;
exports.UseShadowDOM = _customElement.UseShadowDOM;
exports.SkipContentProcessing = _customElement.SkipContentProcessing;
exports.ElementConfig = _elementConfig.ElementConfig;
exports.TemplateController = _templateController.TemplateController;
exports.ViewStrategy = _viewStrategy.ViewStrategy;
exports.UseView = _viewStrategy.UseView;
exports.ConventionalView = _viewStrategy.ConventionalView;
exports.NoView = _viewStrategy.NoView;
exports.ViewCompiler = require("./view-compiler").ViewCompiler;
exports.ViewEngine = require("./view-engine").ViewEngine;

var _viewFactory = require("./view-factory");

exports.ViewFactory = _viewFactory.ViewFactory;
exports.BoundViewFactory = _viewFactory.BoundViewFactory;
exports.ViewSlot = require("./view-slot").ViewSlot;
exports.BindingLanguage = require("./binding-language").BindingLanguage;
exports.CompositionEngine = require("./composition-engine").CompositionEngine;
exports.Animator = require("./animator").Animator;
var Behavior = exports.Behavior = Metadata;
var Behaviour = exports.Behaviour = Metadata;

Metadata.configure.classHelper("withProperty", BehaviorProperty);
Metadata.configure.classHelper("withOptions", OptionsProperty);
Metadata.configure.classHelper("attachedBehavior", AttachedBehavior);
Metadata.configure.classHelper("syncChildren", ChildObserver);
Metadata.configure.classHelper("customElement", CustomElement);
Metadata.configure.classHelper("useShadowDOM", UseShadowDOM);
Metadata.configure.classHelper("elementConfig", ElementConfig);
Metadata.configure.classHelper("templateController", TemplateController);
Metadata.configure.classHelper("useView", UseView);
Metadata.configure.classHelper("noView", NoView);
Metadata.configure.classHelper("skipContentProcessing", SkipContentProcessing);
Object.defineProperty(exports, "__esModule", {
  value: true
});