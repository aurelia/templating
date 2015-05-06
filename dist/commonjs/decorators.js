'use strict';

var _interopRequireDefault = function (obj) { return obj && obj.__esModule ? obj : { 'default': obj }; };

exports.__esModule = true;
exports.behavior = behavior;
exports.customElement = customElement;
exports.customAttribute = customAttribute;
exports.templateController = templateController;
exports.bindable = bindable;
exports.dynamicOptions = dynamicOptions;
exports.syncChildren = syncChildren;
exports.useShadowDOM = useShadowDOM;
exports.skipContentProcessing = skipContentProcessing;
exports.viewStrategy = viewStrategy;
exports.useView = useView;
exports.noView = noView;
exports.elementConfig = elementConfig;

var _core = require('core-js');

var _core2 = _interopRequireDefault(_core);

var _Metadata$Decorators = require('aurelia-metadata');

var _BindableProperty = require('./bindable-property');

var _ChildObserver = require('./children');

var _ElementConfigResource = require('./element-config');

var _ViewStrategy$UseViewStrategy$NoViewStrategy = require('./view-strategy');

var _HtmlBehaviorResource = require('./html-behavior');

function behavior(override) {
  return function (target) {
    if (override instanceof _HtmlBehaviorResource.HtmlBehaviorResource) {
      Reflect.defineMetadata(_Metadata$Decorators.Metadata.resource, override, target);
    } else {
      var resource = _Metadata$Decorators.Metadata.getOrCreateOwn(_Metadata$Decorators.Metadata.resource, _HtmlBehaviorResource.HtmlBehaviorResource, target);
      Object.assign(resource, override);
    }
  };
}

_Metadata$Decorators.Decorators.configure.parameterizedDecorator('behavior', behavior);

function customElement(name) {
  return function (target) {
    var resource = _Metadata$Decorators.Metadata.getOrCreateOwn(_Metadata$Decorators.Metadata.resource, _HtmlBehaviorResource.HtmlBehaviorResource, target);
    resource.elementName = name;
  };
}

_Metadata$Decorators.Decorators.configure.parameterizedDecorator('customElement', customElement);

function customAttribute(name) {
  return function (target) {
    var resource = _Metadata$Decorators.Metadata.getOrCreateOwn(_Metadata$Decorators.Metadata.resource, _HtmlBehaviorResource.HtmlBehaviorResource, target);
    resource.attributeName = name;
  };
}

_Metadata$Decorators.Decorators.configure.parameterizedDecorator('customAttribute', customAttribute);

function templateController(target) {
  var deco = function deco(target) {
    var resource = _Metadata$Decorators.Metadata.getOrCreateOwn(_Metadata$Decorators.Metadata.resource, _HtmlBehaviorResource.HtmlBehaviorResource, target);
    resource.liftsContent = true;
  };

  return target ? deco(target) : deco;
}

_Metadata$Decorators.Decorators.configure.simpleDecorator('templateController', templateController);

function bindable(nameOrConfigOrTarget, key, descriptor) {
  var deco = function deco(target, key, descriptor) {
    var actualTarget = key ? target.constructor : target,
        resource = _Metadata$Decorators.Metadata.getOrCreateOwn(_Metadata$Decorators.Metadata.resource, _HtmlBehaviorResource.HtmlBehaviorResource, actualTarget),
        prop;

    if (key) {
      nameOrConfigOrTarget = nameOrConfigOrTarget || {};
      nameOrConfigOrTarget.name = key;
    }

    prop = new _BindableProperty.BindableProperty(nameOrConfigOrTarget);
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

_Metadata$Decorators.Decorators.configure.parameterizedDecorator('bindable', bindable);

function dynamicOptions(target) {
  var deco = function deco(target) {
    var resource = _Metadata$Decorators.Metadata.getOrCreateOwn(_Metadata$Decorators.Metadata.resource, _HtmlBehaviorResource.HtmlBehaviorResource, target);
    resource.hasDynamicOptions = true;
  };

  return target ? deco(target) : deco;
}

_Metadata$Decorators.Decorators.configure.simpleDecorator('dynamicOptions', dynamicOptions);

function syncChildren(property, changeHandler, selector) {
  return function (target) {
    var resource = _Metadata$Decorators.Metadata.getOrCreateOwn(_Metadata$Decorators.Metadata.resource, _HtmlBehaviorResource.HtmlBehaviorResource, target);
    resource.childExpression = new _ChildObserver.ChildObserver(property, changeHandler, selector);
  };
}

_Metadata$Decorators.Decorators.configure.parameterizedDecorator('syncChildren', syncChildren);

function useShadowDOM(target) {
  var deco = function deco(target) {
    var resource = _Metadata$Decorators.Metadata.getOrCreateOwn(_Metadata$Decorators.Metadata.resource, _HtmlBehaviorResource.HtmlBehaviorResource, target);
    resource.targetShadowDOM = true;
  };

  return target ? deco(target) : deco;
}

_Metadata$Decorators.Decorators.configure.simpleDecorator('useShadowDOM', useShadowDOM);

function skipContentProcessing(target) {
  var deco = function deco(target) {
    var resource = _Metadata$Decorators.Metadata.getOrCreateOwn(_Metadata$Decorators.Metadata.resource, _HtmlBehaviorResource.HtmlBehaviorResource, target);
    resource.skipContentProcessing = true;
  };

  return target ? deco(target) : deco;
}

_Metadata$Decorators.Decorators.configure.simpleDecorator('skipContentProcessing', skipContentProcessing);

function viewStrategy(strategy) {
  return function (target) {
    Reflect.defineMetadata(_ViewStrategy$UseViewStrategy$NoViewStrategy.ViewStrategy.metadataKey, strategy, target);
  };
}

_Metadata$Decorators.Decorators.configure.parameterizedDecorator('viewStrategy', useView);

function useView(path) {
  return viewStrategy(new _ViewStrategy$UseViewStrategy$NoViewStrategy.UseViewStrategy(path));
}

_Metadata$Decorators.Decorators.configure.parameterizedDecorator('useView', useView);

function noView(target) {
  var deco = function deco(target) {
    Reflect.defineMetadata(_ViewStrategy$UseViewStrategy$NoViewStrategy.ViewStrategy.metadataKey, new _ViewStrategy$UseViewStrategy$NoViewStrategy.NoViewStrategy(), target);
  };

  return target ? deco(target) : deco;
}

_Metadata$Decorators.Decorators.configure.simpleDecorator('noView', noView);

function elementConfig(target) {
  var deco = function deco(target) {
    Reflect.defineMetadata(_Metadata$Decorators.Metadata.resource, new _ElementConfigResource.ElementConfigResource(), target);
  };

  return target ? deco(target) : deco;
}

_Metadata$Decorators.Decorators.configure.simpleDecorator('elementConfig', elementConfig);