'use strict';

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
exports.containerless = containerless;
exports.viewStrategy = viewStrategy;
exports.useView = useView;
exports.noView = noView;
exports.elementConfig = elementConfig;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _coreJs = require('core-js');

var _coreJs2 = _interopRequireDefault(_coreJs);

var _aureliaMetadata = require('aurelia-metadata');

var _bindableProperty = require('./bindable-property');

var _children = require('./children');

var _elementConfig = require('./element-config');

var _viewStrategy = require('./view-strategy');

var _htmlBehavior = require('./html-behavior');

function validateBehaviorName(name, type) {
  if (/[A-Z]/.test(name)) {
    throw new Error('\'' + name + '\' is not a valid ' + type + ' name.  Upper-case letters are not allowed because the DOM is not case-sensitive.');
  }
}

function behavior(override) {
  return function (target) {
    if (override instanceof _htmlBehavior.HtmlBehaviorResource) {
      Reflect.defineMetadata(_aureliaMetadata.Metadata.resource, override, target);
    } else {
      var resource = _aureliaMetadata.Metadata.getOrCreateOwn(_aureliaMetadata.Metadata.resource, _htmlBehavior.HtmlBehaviorResource, target);
      Object.assign(resource, override);
    }
  };
}

_aureliaMetadata.Decorators.configure.parameterizedDecorator('behavior', behavior);

function customElement(name) {
  validateBehaviorName(name, 'custom element');
  return function (target) {
    var resource = _aureliaMetadata.Metadata.getOrCreateOwn(_aureliaMetadata.Metadata.resource, _htmlBehavior.HtmlBehaviorResource, target);
    resource.elementName = name;
  };
}

_aureliaMetadata.Decorators.configure.parameterizedDecorator('customElement', customElement);

function customAttribute(name, defaultBindingMode) {
  validateBehaviorName(name, 'custom attribute');
  return function (target) {
    var resource = _aureliaMetadata.Metadata.getOrCreateOwn(_aureliaMetadata.Metadata.resource, _htmlBehavior.HtmlBehaviorResource, target);
    resource.attributeName = name;
    resource.attributeDefaultBindingMode = defaultBindingMode;
  };
}

_aureliaMetadata.Decorators.configure.parameterizedDecorator('customAttribute', customAttribute);

function templateController(target) {
  var deco = function deco(target) {
    var resource = _aureliaMetadata.Metadata.getOrCreateOwn(_aureliaMetadata.Metadata.resource, _htmlBehavior.HtmlBehaviorResource, target);
    resource.liftsContent = true;
  };

  return target ? deco(target) : deco;
}

_aureliaMetadata.Decorators.configure.simpleDecorator('templateController', templateController);

function bindable(nameOrConfigOrTarget, key, descriptor) {
  var deco = function deco(target, key, descriptor) {
    var actualTarget = key ? target.constructor : target,
        resource = _aureliaMetadata.Metadata.getOrCreateOwn(_aureliaMetadata.Metadata.resource, _htmlBehavior.HtmlBehaviorResource, actualTarget),
        prop;

    if (key) {
      nameOrConfigOrTarget = nameOrConfigOrTarget || {};
      nameOrConfigOrTarget.name = key;
    }

    prop = new _bindableProperty.BindableProperty(nameOrConfigOrTarget);
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

_aureliaMetadata.Decorators.configure.parameterizedDecorator('bindable', bindable);

function dynamicOptions(target) {
  var deco = function deco(target) {
    var resource = _aureliaMetadata.Metadata.getOrCreateOwn(_aureliaMetadata.Metadata.resource, _htmlBehavior.HtmlBehaviorResource, target);
    resource.hasDynamicOptions = true;
  };

  return target ? deco(target) : deco;
}

_aureliaMetadata.Decorators.configure.simpleDecorator('dynamicOptions', dynamicOptions);

function syncChildren(property, changeHandler, selector) {
  return function (target) {
    var resource = _aureliaMetadata.Metadata.getOrCreateOwn(_aureliaMetadata.Metadata.resource, _htmlBehavior.HtmlBehaviorResource, target);
    resource.childExpression = new _children.ChildObserver(property, changeHandler, selector);
  };
}

_aureliaMetadata.Decorators.configure.parameterizedDecorator('syncChildren', syncChildren);

function useShadowDOM(target) {
  var deco = function deco(target) {
    var resource = _aureliaMetadata.Metadata.getOrCreateOwn(_aureliaMetadata.Metadata.resource, _htmlBehavior.HtmlBehaviorResource, target);
    resource.targetShadowDOM = true;
  };

  return target ? deco(target) : deco;
}

_aureliaMetadata.Decorators.configure.simpleDecorator('useShadowDOM', useShadowDOM);

function skipContentProcessing(target) {
  var deco = function deco(target) {
    var resource = _aureliaMetadata.Metadata.getOrCreateOwn(_aureliaMetadata.Metadata.resource, _htmlBehavior.HtmlBehaviorResource, target);
    resource.skipContentProcessing = true;
  };

  return target ? deco(target) : deco;
}

_aureliaMetadata.Decorators.configure.simpleDecorator('skipContentProcessing', skipContentProcessing);

function containerless(target) {
  var deco = function deco(target) {
    var resource = _aureliaMetadata.Metadata.getOrCreateOwn(_aureliaMetadata.Metadata.resource, _htmlBehavior.HtmlBehaviorResource, target);
    resource.containerless = true;
  };

  return target ? deco(target) : deco;
}

_aureliaMetadata.Decorators.configure.simpleDecorator('containerless', containerless);

function viewStrategy(strategy) {
  return function (target) {
    Reflect.defineMetadata(_viewStrategy.ViewStrategy.metadataKey, strategy, target);
  };
}

_aureliaMetadata.Decorators.configure.parameterizedDecorator('viewStrategy', useView);

function useView(path) {
  return viewStrategy(new _viewStrategy.UseViewStrategy(path));
}

_aureliaMetadata.Decorators.configure.parameterizedDecorator('useView', useView);

function noView(target) {
  var deco = function deco(target) {
    Reflect.defineMetadata(_viewStrategy.ViewStrategy.metadataKey, new _viewStrategy.NoViewStrategy(), target);
  };

  return target ? deco(target) : deco;
}

_aureliaMetadata.Decorators.configure.simpleDecorator('noView', noView);

function elementConfig(target) {
  var deco = function deco(target) {
    Reflect.defineMetadata(_aureliaMetadata.Metadata.resource, new _elementConfig.ElementConfigResource(), target);
  };

  return target ? deco(target) : deco;
}

_aureliaMetadata.Decorators.configure.simpleDecorator('elementConfig', elementConfig);