System.register(["./attached-behavior", "./behavior", "./resource-coordinator", "./resource-registry", "./children", "./custom-element", "./element-config", "./template-controller", "./view-strategy", "./view-compiler", "./view-engine", "./view-factory", "./view-slot", "./binding-language", "./composition-engine"], function (_export) {
  "use strict";

  return {
    setters: [function (_attachedBehavior) {
      _export("AttachedBehavior", _attachedBehavior.AttachedBehavior);
    }, function (_behavior) {
      _export("Property", _behavior.Property);

      _export("Behavior", _behavior.Behavior);
    }, function (_resourceCoordinator) {
      _export("ResourceCoordinator", _resourceCoordinator.ResourceCoordinator);
    }, function (_resourceRegistry) {
      _export("ResourceRegistry", _resourceRegistry.ResourceRegistry);

      _export("ViewResources", _resourceRegistry.ViewResources);
    }, function (_children) {
      _export("Children", _children.Children);
    }, function (_customElement) {
      _export("CustomElement", _customElement.CustomElement);

      _export("UseShadowDOM", _customElement.UseShadowDOM);
    }, function (_elementConfig) {
      _export("ElementConfig", _elementConfig.ElementConfig);
    }, function (_templateController) {
      _export("TemplateController", _templateController.TemplateController);
    }, function (_viewStrategy) {
      _export("ViewStrategy", _viewStrategy.ViewStrategy);

      _export("UseView", _viewStrategy.UseView);

      _export("ConventionalView", _viewStrategy.ConventionalView);

      _export("NoView", _viewStrategy.NoView);
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
    }],
    execute: function () {}
  };
});