System.register(['./html-behavior', './bindable-property', './resource-registry', './children', './element-config', './view-strategy', './view-compiler', './view-engine', './view-factory', './view-slot', './binding-language', './composition-engine', './animator', './decorators'], function (_export) {
  return {
    setters: [function (_htmlBehavior) {
      _export('HtmlBehaviorResource', _htmlBehavior.HtmlBehaviorResource);
    }, function (_bindableProperty) {
      _export('BindableProperty', _bindableProperty.BindableProperty);
    }, function (_resourceRegistry) {
      _export('ResourceRegistry', _resourceRegistry.ResourceRegistry);

      _export('ViewResources', _resourceRegistry.ViewResources);
    }, function (_children) {
      _export('ChildObserver', _children.ChildObserver);
    }, function (_elementConfig) {
      _export('ElementConfigResource', _elementConfig.ElementConfigResource);
    }, function (_viewStrategy) {
      _export('ViewStrategy', _viewStrategy.ViewStrategy);

      _export('UseViewStrategy', _viewStrategy.UseViewStrategy);

      _export('ConventionalViewStrategy', _viewStrategy.ConventionalViewStrategy);

      _export('NoViewStrategy', _viewStrategy.NoViewStrategy);
    }, function (_viewCompiler) {
      _export('ViewCompiler', _viewCompiler.ViewCompiler);
    }, function (_viewEngine) {
      _export('ViewEngine', _viewEngine.ViewEngine);
    }, function (_viewFactory) {
      _export('ViewFactory', _viewFactory.ViewFactory);

      _export('BoundViewFactory', _viewFactory.BoundViewFactory);
    }, function (_viewSlot) {
      _export('ViewSlot', _viewSlot.ViewSlot);
    }, function (_bindingLanguage) {
      _export('BindingLanguage', _bindingLanguage.BindingLanguage);
    }, function (_compositionEngine) {
      _export('CompositionEngine', _compositionEngine.CompositionEngine);
    }, function (_animator) {
      _export('Animator', _animator.Animator);
    }, function (_decorators) {
      for (var _key in _decorators) {
        _export(_key, _decorators[_key]);
      }
    }],
    execute: function () {
      'use strict';
    }
  };
});