System.register(["aurelia-metadata", "./bindable-property", "./children", "./element-config", "./view-strategy", "./html-behavior"], function (_export) {
  var Metadata, Decorators, BindableProperty, ChildObserver, ElementConfigResource, UseViewStrategy, NoViewStrategy, HtmlBehaviorResource;

  _export("behavior", behavior);

  _export("customElement", customElement);

  _export("customAttribute", customAttribute);

  _export("templateController", templateController);

  _export("bindableProperty", bindableProperty);

  _export("dynamicOptions", dynamicOptions);

  _export("syncChildren", syncChildren);

  _export("useShadowDOM", useShadowDOM);

  _export("skipContentProcessing", skipContentProcessing);

  _export("useView", useView);

  _export("noView", noView);

  _export("elementConfig", elementConfig);

  function behavior(override) {
    return function (target) {
      var resource = Metadata.on(target).firstOrAdd(HtmlBehaviorResource);
      Object.assign(resource, override);
      return target;
    };
  }

  function customElement(name) {
    return function (target) {
      var resource = Metadata.on(target).firstOrAdd(HtmlBehaviorResource);
      resource.elementName = name;
      return target;
    };
  }

  function customAttribute(name) {
    return function (target) {
      var resource = Metadata.on(target).firstOrAdd(HtmlBehaviorResource);
      resource.attributeName = name;
      return target;
    };
  }

  function templateController(target) {
    var resource = Metadata.on(target).firstOrAdd(HtmlBehaviorResource);
    resource.liftsContent = true;
    return target;
  }

  function bindableProperty(nameOrConfig) {
    return function (target) {
      var resource = Metadata.on(target).firstOrAdd(HtmlBehaviorResource),
          prop = new BindableProperty(nameOrConfig);

      prop.registerWith(target, resource);

      return target;
    };
  }

  function dynamicOptions(target) {
    var resource = Metadata.on(target).firstOrAdd(HtmlBehaviorResource);
    resource.hasDynamicOptions = true;
    return target;
  }

  function syncChildren(property, changeHandler, selector) {
    return function (target) {
      var resource = Metadata.on(target).firstOrAdd(HtmlBehaviorResource);
      resource.childExpression = new ChildObserver(property, changeHandler, selector);
      return target;
    };
  }

  function useShadowDOM(target) {
    var resource = Metadata.on(target).firstOrAdd(HtmlBehaviorResource);
    resource.useShadowDOM = true;
    return target;
  }

  function skipContentProcessing(target) {
    var resource = Metadata.on(target).firstOrAdd(HtmlBehaviorResource);
    resource.skipContentProcessing = true;
    return target;
  }

  function useView(path) {
    return function (target) {
      Metadata.on(target).add(new UseViewStrategy(path));
      return target;
    };
  }

  function noView(target) {
    Metadata.on(target).add(new NoViewStrategy());
    return target;
  }

  function elementConfig() {
    Metadata.on(target).add(new ElementConfigResource());
    return target;
  }

  return {
    setters: [function (_aureliaMetadata) {
      Metadata = _aureliaMetadata.Metadata;
      Decorators = _aureliaMetadata.Decorators;
    }, function (_bindableProperty) {
      BindableProperty = _bindableProperty.BindableProperty;
    }, function (_children) {
      ChildObserver = _children.ChildObserver;
    }, function (_elementConfig) {
      ElementConfigResource = _elementConfig.ElementConfigResource;
    }, function (_viewStrategy) {
      UseViewStrategy = _viewStrategy.UseViewStrategy;
      NoViewStrategy = _viewStrategy.NoViewStrategy;
    }, function (_htmlBehavior) {
      HtmlBehaviorResource = _htmlBehavior.HtmlBehaviorResource;
    }],
    execute: function () {
      "use strict";

      Decorators.configure.parameterizedDecorator("behavior", behavior);

      Decorators.configure.parameterizedDecorator("customElement", customElement);

      Decorators.configure.parameterizedDecorator("customAttribute", customAttribute);

      Decorators.configure.simpleDecorator("templateController", templateController);

      Decorators.configure.parameterizedDecorator("bindableProperty", bindableProperty);

      Decorators.configure.simpleDecorator("dynamicOptions", dynamicOptions);

      Decorators.configure.parameterizedDecorator("syncChildren", syncChildren);

      Decorators.configure.simpleDecorator("useShadowDOM", useShadowDOM);

      Decorators.configure.simpleDecorator("skipContentProcessing", skipContentProcessing);

      Decorators.configure.parameterizedDecorator("useView", useView);

      Decorators.configure.simpleDecorator("noView", noView);

      Decorators.configure.simpleDecorator("elementConfig", elementConfig);
    }
  };
});