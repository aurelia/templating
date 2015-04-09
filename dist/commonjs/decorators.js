'use strict';

var _interopRequireWildcard = function (obj) { return obj && obj.__esModule ? obj : { 'default': obj }; };

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

var _core = require('core-js');

var _core2 = _interopRequireWildcard(_core);

var _Metadata$Decorators = require('aurelia-metadata');

var _BindableProperty = require('./bindable-property');

var _ChildObserver = require('./children');

var _ElementConfigResource = require('./element-config');

var _UseViewStrategy$NoViewStrategy = require('./view-strategy');

var _HtmlBehaviorResource = require('./html-behavior');

function behavior(override) {
  return function (target) {
    var meta = _Metadata$Decorators.Metadata.on(target);

    if (override instanceof _HtmlBehaviorResource.HtmlBehaviorResource) {
      meta.add(override);
    } else {
      var resource = meta.firstOrAdd(_HtmlBehaviorResource.HtmlBehaviorResource);
      Object.assign(resource, override);
    }
  };
}

_Metadata$Decorators.Decorators.configure.parameterizedDecorator('behavior', behavior);

function customElement(name) {
  return function (target) {
    var resource = _Metadata$Decorators.Metadata.on(target).firstOrAdd(_HtmlBehaviorResource.HtmlBehaviorResource);
    resource.elementName = name;
  };
}

_Metadata$Decorators.Decorators.configure.parameterizedDecorator('customElement', customElement);

function customAttribute(name) {
  return function (target) {
    var resource = _Metadata$Decorators.Metadata.on(target).firstOrAdd(_HtmlBehaviorResource.HtmlBehaviorResource);
    resource.attributeName = name;
  };
}

_Metadata$Decorators.Decorators.configure.parameterizedDecorator('customAttribute', customAttribute);

function templateController(target) {
  var deco = function deco(target) {
    var resource = _Metadata$Decorators.Metadata.on(target).firstOrAdd(_HtmlBehaviorResource.HtmlBehaviorResource);
    resource.liftsContent = true;
  };

  return target ? deco(target) : deco;
}

_Metadata$Decorators.Decorators.configure.simpleDecorator('templateController', templateController);

function bindable(nameOrConfigOrTarget, key, descriptor) {
  var deco = function deco(target, key, descriptor) {
    var resource = _Metadata$Decorators.Metadata.on(target).firstOrAdd(_HtmlBehaviorResource.HtmlBehaviorResource),
        prop;

    if (key) {
      nameOrConfigOrTarget = nameOrConfigOrTarget || {};
      nameOrConfigOrTarget.name = key;
    }

    prop = new _BindableProperty.BindableProperty(nameOrConfigOrTarget);
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

_Metadata$Decorators.Decorators.configure.parameterizedDecorator('bindable', bindable);

function dynamicOptions(target) {
  var deco = function deco(target) {
    var resource = _Metadata$Decorators.Metadata.on(target).firstOrAdd(_HtmlBehaviorResource.HtmlBehaviorResource);
    resource.hasDynamicOptions = true;
  };

  return target ? deco(target) : deco;
}

_Metadata$Decorators.Decorators.configure.simpleDecorator('dynamicOptions', dynamicOptions);

function syncChildren(property, changeHandler, selector) {
  return function (target) {
    var resource = _Metadata$Decorators.Metadata.on(target).firstOrAdd(_HtmlBehaviorResource.HtmlBehaviorResource);
    resource.childExpression = new _ChildObserver.ChildObserver(property, changeHandler, selector);
  };
}

_Metadata$Decorators.Decorators.configure.parameterizedDecorator('syncChildren', syncChildren);

function useShadowDOM(target) {
  var deco = function deco(target) {
    var resource = _Metadata$Decorators.Metadata.on(target).firstOrAdd(_HtmlBehaviorResource.HtmlBehaviorResource);
    resource.useShadowDOM = true;
  };

  return target ? deco(target) : deco;
}

_Metadata$Decorators.Decorators.configure.simpleDecorator('useShadowDOM', useShadowDOM);

function skipContentProcessing(target) {
  var deco = function deco(target) {
    var resource = _Metadata$Decorators.Metadata.on(target).firstOrAdd(_HtmlBehaviorResource.HtmlBehaviorResource);
    resource.skipContentProcessing = true;
  };

  return target ? deco(target) : deco;
}

_Metadata$Decorators.Decorators.configure.simpleDecorator('skipContentProcessing', skipContentProcessing);

function useView(path) {
  return function (target) {
    _Metadata$Decorators.Metadata.on(target).add(new _UseViewStrategy$NoViewStrategy.UseViewStrategy(path));
  };
}

_Metadata$Decorators.Decorators.configure.parameterizedDecorator('useView', useView);

function noView(target) {
  var deco = function deco(target) {
    _Metadata$Decorators.Metadata.on(target).add(new _UseViewStrategy$NoViewStrategy.NoViewStrategy());
  };

  return target ? deco(target) : deco;
}

_Metadata$Decorators.Decorators.configure.simpleDecorator('noView', noView);

function elementConfig(target) {
  var deco = function deco(target) {
    _Metadata$Decorators.Metadata.on(target).add(new _ElementConfigResource.ElementConfigResource());
  };

  return target ? deco(target) : deco;
}

_Metadata$Decorators.Decorators.configure.simpleDecorator('elementConfig', elementConfig);