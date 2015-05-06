System.register(['core-js', 'aurelia-metadata', './bindable-property', './children', './element-config', './view-strategy', './html-behavior'], function (_export) {
  var core, Metadata, Decorators, BindableProperty, ChildObserver, ElementConfigResource, ViewStrategy, UseViewStrategy, NoViewStrategy, HtmlBehaviorResource;

  _export('behavior', behavior);

  _export('customElement', customElement);

  _export('customAttribute', customAttribute);

  _export('templateController', templateController);

  _export('bindable', bindable);

  _export('dynamicOptions', dynamicOptions);

  _export('syncChildren', syncChildren);

  _export('useShadowDOM', useShadowDOM);

  _export('skipContentProcessing', skipContentProcessing);

  _export('viewStrategy', viewStrategy);

  _export('useView', useView);

  _export('noView', noView);

  _export('elementConfig', elementConfig);

  function behavior(override) {
    return function (target) {
      if (override instanceof HtmlBehaviorResource) {
        Reflect.defineMetadata(Metadata.resource, override, target);
      } else {
        var resource = Metadata.getOrCreateOwn(Metadata.resource, HtmlBehaviorResource, target);
        Object.assign(resource, override);
      }
    };
  }

  function customElement(name) {
    return function (target) {
      var resource = Metadata.getOrCreateOwn(Metadata.resource, HtmlBehaviorResource, target);
      resource.elementName = name;
    };
  }

  function customAttribute(name) {
    return function (target) {
      var resource = Metadata.getOrCreateOwn(Metadata.resource, HtmlBehaviorResource, target);
      resource.attributeName = name;
    };
  }

  function templateController(target) {
    var deco = function deco(target) {
      var resource = Metadata.getOrCreateOwn(Metadata.resource, HtmlBehaviorResource, target);
      resource.liftsContent = true;
    };

    return target ? deco(target) : deco;
  }

  function bindable(nameOrConfigOrTarget, key, descriptor) {
    var deco = function deco(target, key, descriptor) {
      var actualTarget = key ? target.constructor : target,
          resource = Metadata.getOrCreateOwn(Metadata.resource, HtmlBehaviorResource, actualTarget),
          prop;

      if (key) {
        nameOrConfigOrTarget = nameOrConfigOrTarget || {};
        nameOrConfigOrTarget.name = key;
      }

      prop = new BindableProperty(nameOrConfigOrTarget);
      return prop.registerWith(actualTarget, resource, descriptor);
    };

    if (!nameOrConfigOrTarget) {
      return deco;
    }

    if (key) {
      var target = nameOrConfigOrTarget;
      nameOrConfigOrTarget = null;
      return deco(target, key, descriptor);
    }

    return deco;
  }

  function dynamicOptions(target) {
    var deco = function deco(target) {
      var resource = Metadata.getOrCreateOwn(Metadata.resource, HtmlBehaviorResource, target);
      resource.hasDynamicOptions = true;
    };

    return target ? deco(target) : deco;
  }

  function syncChildren(property, changeHandler, selector) {
    return function (target) {
      var resource = Metadata.getOrCreateOwn(Metadata.resource, HtmlBehaviorResource, target);
      resource.childExpression = new ChildObserver(property, changeHandler, selector);
    };
  }

  function useShadowDOM(target) {
    var deco = function deco(target) {
      var resource = Metadata.getOrCreateOwn(Metadata.resource, HtmlBehaviorResource, target);
      resource.targetShadowDOM = true;
    };

    return target ? deco(target) : deco;
  }

  function skipContentProcessing(target) {
    var deco = function deco(target) {
      var resource = Metadata.getOrCreateOwn(Metadata.resource, HtmlBehaviorResource, target);
      resource.skipContentProcessing = true;
    };

    return target ? deco(target) : deco;
  }

  function viewStrategy(strategy) {
    return function (target) {
      Reflect.defineMetadata(ViewStrategy.metadataKey, strategy, target);
    };
  }

  function useView(path) {
    return viewStrategy(new UseViewStrategy(path));
  }

  function noView(target) {
    var deco = function deco(target) {
      Reflect.defineMetadata(ViewStrategy.metadataKey, new NoViewStrategy(), target);
    };

    return target ? deco(target) : deco;
  }

  function elementConfig(target) {
    var deco = function deco(target) {
      Reflect.defineMetadata(Metadata.resource, new ElementConfigResource(), target);
    };

    return target ? deco(target) : deco;
  }

  return {
    setters: [function (_coreJs) {
      core = _coreJs['default'];
    }, function (_aureliaMetadata) {
      Metadata = _aureliaMetadata.Metadata;
      Decorators = _aureliaMetadata.Decorators;
    }, function (_bindableProperty) {
      BindableProperty = _bindableProperty.BindableProperty;
    }, function (_children) {
      ChildObserver = _children.ChildObserver;
    }, function (_elementConfig) {
      ElementConfigResource = _elementConfig.ElementConfigResource;
    }, function (_viewStrategy) {
      ViewStrategy = _viewStrategy.ViewStrategy;
      UseViewStrategy = _viewStrategy.UseViewStrategy;
      NoViewStrategy = _viewStrategy.NoViewStrategy;
    }, function (_htmlBehavior) {
      HtmlBehaviorResource = _htmlBehavior.HtmlBehaviorResource;
    }],
    execute: function () {
      'use strict';

      Decorators.configure.parameterizedDecorator('behavior', behavior);

      Decorators.configure.parameterizedDecorator('customElement', customElement);

      Decorators.configure.parameterizedDecorator('customAttribute', customAttribute);

      Decorators.configure.simpleDecorator('templateController', templateController);

      Decorators.configure.parameterizedDecorator('bindable', bindable);

      Decorators.configure.simpleDecorator('dynamicOptions', dynamicOptions);

      Decorators.configure.parameterizedDecorator('syncChildren', syncChildren);

      Decorators.configure.simpleDecorator('useShadowDOM', useShadowDOM);

      Decorators.configure.simpleDecorator('skipContentProcessing', skipContentProcessing);

      Decorators.configure.parameterizedDecorator('viewStrategy', useView);

      Decorators.configure.parameterizedDecorator('useView', useView);

      Decorators.configure.simpleDecorator('noView', noView);

      Decorators.configure.simpleDecorator('elementConfig', elementConfig);
    }
  };
});