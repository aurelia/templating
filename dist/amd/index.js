define(['exports', './html-behavior', './bindable-property', './resource-registry', './children', './element-config', './view-strategy', './view-compiler', './view-engine', './view-factory', './view-slot', './binding-language', './composition-engine', './animator', './decorators'], function (exports, _htmlBehavior, _bindableProperty, _resourceRegistry, _children, _elementConfig, _viewStrategy, _viewCompiler, _viewEngine, _viewFactory, _viewSlot, _bindingLanguage, _compositionEngine, _animator, _decorators) {
  'use strict';

  var _interopRequireWildcard = function (obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (typeof obj === 'object' && obj !== null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj['default'] = obj; return newObj; } };

  var _defaults = function (obj, defaults) { var keys = Object.getOwnPropertyNames(defaults); for (var i = 0; i < keys.length; i++) { var key = keys[i]; var value = Object.getOwnPropertyDescriptor(defaults, key); if (value && value.configurable && obj[key] === undefined) { Object.defineProperty(obj, key, value); } } return obj; };

  exports.__esModule = true;
  exports.HtmlBehaviorResource = _htmlBehavior.HtmlBehaviorResource;
  exports.BindableProperty = _bindableProperty.BindableProperty;
  exports.ResourceRegistry = _resourceRegistry.ResourceRegistry;
  exports.ViewResources = _resourceRegistry.ViewResources;
  exports.ChildObserver = _children.ChildObserver;
  exports.ElementConfigResource = _elementConfig.ElementConfigResource;
  exports.ViewStrategy = _viewStrategy.ViewStrategy;
  exports.UseViewStrategy = _viewStrategy.UseViewStrategy;
  exports.ConventionalViewStrategy = _viewStrategy.ConventionalViewStrategy;
  exports.NoViewStrategy = _viewStrategy.NoViewStrategy;
  exports.ViewCompiler = _viewCompiler.ViewCompiler;
  exports.ViewEngine = _viewEngine.ViewEngine;
  exports.ViewFactory = _viewFactory.ViewFactory;
  exports.BoundViewFactory = _viewFactory.BoundViewFactory;
  exports.ViewSlot = _viewSlot.ViewSlot;
  exports.BindingLanguage = _bindingLanguage.BindingLanguage;
  exports.CompositionEngine = _compositionEngine.CompositionEngine;
  exports.Animator = _animator.Animator;

  _defaults(exports, _interopRequireWildcard(_decorators));
});