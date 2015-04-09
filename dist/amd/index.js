define(['exports', './html-behavior', './bindable-property', './resource-registry', './children', './element-config', './view-strategy', './view-compiler', './view-engine', './view-factory', './view-slot', './binding-language', './composition-engine', './animator', './decorators'], function (exports, _htmlBehavior, _bindableProperty, _resourceRegistry, _children, _elementConfig, _viewStrategy, _viewCompiler, _viewEngine, _viewFactory, _viewSlot, _bindingLanguage, _compositionEngine, _animator, _decorators) {
  'use strict';

  var _interopRequireWildcard = function (obj) { return obj && obj.__esModule ? obj : { 'default': obj }; };

  var _defaults = function (obj, defaults) { var keys = Object.getOwnPropertyNames(defaults); for (var i = 0; i < keys.length; i++) { var key = keys[i]; var value = Object.getOwnPropertyDescriptor(defaults, key); if (value && value.configurable && obj[key] === undefined) { Object.defineProperty(obj, key, value); } } return obj; };

  Object.defineProperty(exports, '__esModule', {
    value: true
  });
  Object.defineProperty(exports, 'HtmlBehaviorResource', {
    enumerable: true,
    get: function get() {
      return _htmlBehavior.HtmlBehaviorResource;
    }
  });
  Object.defineProperty(exports, 'BindableProperty', {
    enumerable: true,
    get: function get() {
      return _bindableProperty.BindableProperty;
    }
  });
  Object.defineProperty(exports, 'ResourceRegistry', {
    enumerable: true,
    get: function get() {
      return _resourceRegistry.ResourceRegistry;
    }
  });
  Object.defineProperty(exports, 'ViewResources', {
    enumerable: true,
    get: function get() {
      return _resourceRegistry.ViewResources;
    }
  });
  Object.defineProperty(exports, 'ChildObserver', {
    enumerable: true,
    get: function get() {
      return _children.ChildObserver;
    }
  });
  Object.defineProperty(exports, 'ElementConfigResource', {
    enumerable: true,
    get: function get() {
      return _elementConfig.ElementConfigResource;
    }
  });
  Object.defineProperty(exports, 'ViewStrategy', {
    enumerable: true,
    get: function get() {
      return _viewStrategy.ViewStrategy;
    }
  });
  Object.defineProperty(exports, 'UseViewStrategy', {
    enumerable: true,
    get: function get() {
      return _viewStrategy.UseViewStrategy;
    }
  });
  Object.defineProperty(exports, 'ConventionalViewStrategy', {
    enumerable: true,
    get: function get() {
      return _viewStrategy.ConventionalViewStrategy;
    }
  });
  Object.defineProperty(exports, 'NoViewStrategy', {
    enumerable: true,
    get: function get() {
      return _viewStrategy.NoViewStrategy;
    }
  });
  Object.defineProperty(exports, 'ViewCompiler', {
    enumerable: true,
    get: function get() {
      return _viewCompiler.ViewCompiler;
    }
  });
  Object.defineProperty(exports, 'ViewEngine', {
    enumerable: true,
    get: function get() {
      return _viewEngine.ViewEngine;
    }
  });
  Object.defineProperty(exports, 'ViewFactory', {
    enumerable: true,
    get: function get() {
      return _viewFactory.ViewFactory;
    }
  });
  Object.defineProperty(exports, 'BoundViewFactory', {
    enumerable: true,
    get: function get() {
      return _viewFactory.BoundViewFactory;
    }
  });
  Object.defineProperty(exports, 'ViewSlot', {
    enumerable: true,
    get: function get() {
      return _viewSlot.ViewSlot;
    }
  });
  Object.defineProperty(exports, 'BindingLanguage', {
    enumerable: true,
    get: function get() {
      return _bindingLanguage.BindingLanguage;
    }
  });
  Object.defineProperty(exports, 'CompositionEngine', {
    enumerable: true,
    get: function get() {
      return _compositionEngine.CompositionEngine;
    }
  });
  Object.defineProperty(exports, 'Animator', {
    enumerable: true,
    get: function get() {
      return _animator.Animator;
    }
  });

  _defaults(exports, _interopRequireWildcard(_decorators));
});