define(["exports", "aurelia-metadata", "./property", "./attached-behavior", "./children", "./custom-element", "./element-config", "./template-controller", "./view-strategy", "./resource-coordinator", "./resource-registry", "./view-compiler", "./view-engine", "./view-factory", "./view-slot", "./binding-language", "./composition-engine", "./animator"], function (exports, _aureliaMetadata, _property, _attachedBehavior, _children, _customElement, _elementConfig, _templateController, _viewStrategy, _resourceCoordinator, _resourceRegistry, _viewCompiler, _viewEngine, _viewFactory, _viewSlot, _bindingLanguage, _compositionEngine, _animator) {
  "use strict";

  var Metadata = _aureliaMetadata.Metadata;
  var BehaviorProperty = _property.BehaviorProperty;
  var OptionsProperty = _property.OptionsProperty;
  var AttachedBehavior = _attachedBehavior.AttachedBehavior;
  var ChildObserver = _children.ChildObserver;
  var CustomElement = _customElement.CustomElement;
  var UseShadowDOM = _customElement.UseShadowDOM;
  var SkipContentProcessing = _customElement.SkipContentProcessing;
  var ElementConfig = _elementConfig.ElementConfig;
  var TemplateController = _templateController.TemplateController;
  var UseView = _viewStrategy.UseView;
  var NoView = _viewStrategy.NoView;
  exports.AttachedBehavior = _attachedBehavior.AttachedBehavior;
  exports.BehaviorProperty = _property.BehaviorProperty;
  exports.OptionsProperty = _property.OptionsProperty;
  exports.ResourceCoordinator = _resourceCoordinator.ResourceCoordinator;
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
  exports.ViewCompiler = _viewCompiler.ViewCompiler;
  exports.ViewEngine = _viewEngine.ViewEngine;
  exports.ViewFactory = _viewFactory.ViewFactory;
  exports.BoundViewFactory = _viewFactory.BoundViewFactory;
  exports.ViewSlot = _viewSlot.ViewSlot;
  exports.BindingLanguage = _bindingLanguage.BindingLanguage;
  exports.CompositionEngine = _compositionEngine.CompositionEngine;
  exports.Animator = _animator.Animator;
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
});