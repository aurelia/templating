System.register(["aurelia-metadata", "./property", "./attached-behavior", "./children", "./custom-element", "./element-config", "./template-controller", "./view-strategy", "./resource-registry", "./view-compiler", "./view-engine", "./view-factory", "./view-slot", "./binding-language", "./composition-engine", "./animator"], function (_export) {
  var Metadata, BehaviorProperty, OptionsProperty, AttachedBehavior, ChildObserver, CustomElement, UseShadowDOM, SkipContentProcessing, ElementConfig, TemplateController, UseView, NoView, Behavior, Behaviour;
  return {
    setters: [function (_aureliaMetadata) {
      Metadata = _aureliaMetadata.Metadata;
    }, function (_property) {
      BehaviorProperty = _property.BehaviorProperty;
      OptionsProperty = _property.OptionsProperty;

      _export("BehaviorProperty", _property.BehaviorProperty);

      _export("OptionsProperty", _property.OptionsProperty);
    }, function (_attachedBehavior) {
      AttachedBehavior = _attachedBehavior.AttachedBehavior;

      _export("AttachedBehavior", _attachedBehavior.AttachedBehavior);
    }, function (_children) {
      ChildObserver = _children.ChildObserver;

      _export("ChildObserver", _children.ChildObserver);
    }, function (_customElement) {
      CustomElement = _customElement.CustomElement;
      UseShadowDOM = _customElement.UseShadowDOM;
      SkipContentProcessing = _customElement.SkipContentProcessing;

      _export("CustomElement", _customElement.CustomElement);

      _export("UseShadowDOM", _customElement.UseShadowDOM);

      _export("SkipContentProcessing", _customElement.SkipContentProcessing);
    }, function (_elementConfig) {
      ElementConfig = _elementConfig.ElementConfig;

      _export("ElementConfig", _elementConfig.ElementConfig);
    }, function (_templateController) {
      TemplateController = _templateController.TemplateController;

      _export("TemplateController", _templateController.TemplateController);
    }, function (_viewStrategy) {
      UseView = _viewStrategy.UseView;
      NoView = _viewStrategy.NoView;

      _export("ViewStrategy", _viewStrategy.ViewStrategy);

      _export("UseView", _viewStrategy.UseView);

      _export("ConventionalView", _viewStrategy.ConventionalView);

      _export("NoView", _viewStrategy.NoView);
    }, function (_resourceRegistry) {
      _export("ResourceRegistry", _resourceRegistry.ResourceRegistry);

      _export("ViewResources", _resourceRegistry.ViewResources);
    }, function (_viewCompiler) {
      _export("ViewCompiler", _viewCompiler.ViewCompiler);
    }, function (_viewEngine) {
      _export("ViewEngine", _viewEngine.ViewEngine);
    }, function (_viewFactory) {
      _export("ViewFactory", _viewFactory.ViewFactory);

      _export("BoundViewFactory", _viewFactory.BoundViewFactory);
    }, function (_viewSlot) {
      _export("ViewSlot", _viewSlot.ViewSlot);
    }, function (_bindingLanguage) {
      _export("BindingLanguage", _bindingLanguage.BindingLanguage);
    }, function (_compositionEngine) {
      _export("CompositionEngine", _compositionEngine.CompositionEngine);
    }, function (_animator) {
      _export("Animator", _animator.Animator);
    }],
    execute: function () {
      "use strict";

      Behavior = _export("Behavior", Metadata);
      Behaviour = _export("Behaviour", Metadata);

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
    }
  };
});