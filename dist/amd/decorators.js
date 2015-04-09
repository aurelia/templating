define(['exports', 'core-js', 'aurelia-metadata', './bindable-property', './children', './element-config', './view-strategy', './html-behavior'], function (exports, _coreJs, _aureliaMetadata, _bindableProperty, _children, _elementConfig, _viewStrategy, _htmlBehavior) {
  'use strict';

  var _interopRequire = function (obj) { return obj && obj.__esModule ? obj['default'] : obj; };

  Object.defineProperty(exports, '__esModule', {
    value: true
  });
  exports.behavior = behavior;
  exports.customElement = customElement;
  exports.customAttribute = customAttribute;
  exports.templateController = templateController;
  exports.bindable = bindable;
  exports.dynamicOptions = dynamicOptions;
  exports.syncChildren = syncChildren;
  exports.useShadowDOM = useShadowDOM;
  exports.skipContentProcessing = skipContentProcessing;
  exports.useView = useView;
  exports.noView = noView;
  exports.elementConfig = elementConfig;

  var _core = _interopRequire(_coreJs);

  function behavior(override) {
    return function (target) {
      var meta = _aureliaMetadata.Metadata.on(target);

      if (override instanceof _htmlBehavior.HtmlBehaviorResource) {
        meta.add(override);
      } else {
        var resource = meta.firstOrAdd(_htmlBehavior.HtmlBehaviorResource);
        Object.assign(resource, override);
      }
    };
  }

  _aureliaMetadata.Decorators.configure.parameterizedDecorator('behavior', behavior);

  function customElement(name) {
    return function (target) {
      var resource = _aureliaMetadata.Metadata.on(target).firstOrAdd(_htmlBehavior.HtmlBehaviorResource);
      resource.elementName = name;
    };
  }

  _aureliaMetadata.Decorators.configure.parameterizedDecorator('customElement', customElement);

  function customAttribute(name) {
    return function (target) {
      var resource = _aureliaMetadata.Metadata.on(target).firstOrAdd(_htmlBehavior.HtmlBehaviorResource);
      resource.attributeName = name;
    };
  }

  _aureliaMetadata.Decorators.configure.parameterizedDecorator('customAttribute', customAttribute);

  function templateController(target) {
    var deco = function deco(target) {
      var resource = _aureliaMetadata.Metadata.on(target).firstOrAdd(_htmlBehavior.HtmlBehaviorResource);
      resource.liftsContent = true;
    };

    return target ? deco(target) : deco;
  }

  _aureliaMetadata.Decorators.configure.simpleDecorator('templateController', templateController);

  function bindable(nameOrConfigOrTarget, key, descriptor) {
    var deco = function deco(target, key, descriptor) {
      var resource = _aureliaMetadata.Metadata.on(target).firstOrAdd(_htmlBehavior.HtmlBehaviorResource),
          prop;

      if (key) {
        nameOrConfigOrTarget = nameOrConfigOrTarget || {};
        nameOrConfigOrTarget.name = key;
      }

      prop = new _bindableProperty.BindableProperty(nameOrConfigOrTarget);
      prop.registerWith(target, resource);
    };

    if (!nameOrConfigOrTarget) {
      return deco;
    }

    if (key) {
      var target = nameOrConfigOrTarget.constructor;
      nameOrConfigOrTarget = null;
      return deco(target, key, descriptor);
    }

    return deco;
  }

  _aureliaMetadata.Decorators.configure.parameterizedDecorator('bindable', bindable);

  function dynamicOptions(target) {
    var deco = function deco(target) {
      var resource = _aureliaMetadata.Metadata.on(target).firstOrAdd(_htmlBehavior.HtmlBehaviorResource);
      resource.hasDynamicOptions = true;
    };

    return target ? deco(target) : deco;
  }

  _aureliaMetadata.Decorators.configure.simpleDecorator('dynamicOptions', dynamicOptions);

  function syncChildren(property, changeHandler, selector) {
    return function (target) {
      var resource = _aureliaMetadata.Metadata.on(target).firstOrAdd(_htmlBehavior.HtmlBehaviorResource);
      resource.childExpression = new _children.ChildObserver(property, changeHandler, selector);
    };
  }

  _aureliaMetadata.Decorators.configure.parameterizedDecorator('syncChildren', syncChildren);

  function useShadowDOM(target) {
    var deco = function deco(target) {
      var resource = _aureliaMetadata.Metadata.on(target).firstOrAdd(_htmlBehavior.HtmlBehaviorResource);
      resource.useShadowDOM = true;
    };

    return target ? deco(target) : deco;
  }

  _aureliaMetadata.Decorators.configure.simpleDecorator('useShadowDOM', useShadowDOM);

  function skipContentProcessing(target) {
    var deco = function deco(target) {
      var resource = _aureliaMetadata.Metadata.on(target).firstOrAdd(_htmlBehavior.HtmlBehaviorResource);
      resource.skipContentProcessing = true;
    };

    return target ? deco(target) : deco;
  }

  _aureliaMetadata.Decorators.configure.simpleDecorator('skipContentProcessing', skipContentProcessing);

  function useView(path) {
    return function (target) {
      _aureliaMetadata.Metadata.on(target).add(new _viewStrategy.UseViewStrategy(path));
    };
  }

  _aureliaMetadata.Decorators.configure.parameterizedDecorator('useView', useView);

  function noView(target) {
    var deco = function deco(target) {
      _aureliaMetadata.Metadata.on(target).add(new _viewStrategy.NoViewStrategy());
    };

    return target ? deco(target) : deco;
  }

  _aureliaMetadata.Decorators.configure.simpleDecorator('noView', noView);

  function elementConfig(target) {
    var deco = function deco(target) {
      _aureliaMetadata.Metadata.on(target).add(new _elementConfig.ElementConfigResource());
    };

    return target ? deco(target) : deco;
  }

  _aureliaMetadata.Decorators.configure.simpleDecorator('elementConfig', elementConfig);
});