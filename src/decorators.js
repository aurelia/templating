import 'core-js';
import {metadata, decorators} from 'aurelia-metadata';
import {BindableProperty} from './bindable-property';
import {ChildObserver} from './children';
import {ElementConfigResource} from './element-config';
import {ViewStrategy, UseViewStrategy, NoViewStrategy, InlineViewStrategy} from './view-strategy';
import {HtmlBehaviorResource} from './html-behavior';

function validateBehaviorName(name, type) {
  if (/[A-Z]/.test(name)) {
    throw new Error(`'${name}' is not a valid ${type} name.  Upper-case letters are not allowed because the DOM is not case-sensitive.`);
  }
}

export function resource(instance) {
  return function(target) {
    metadata.define(metadata.resource, instance, target);
  };
}

decorators.configure.parameterizedDecorator('resource', resource);

export function behavior(override) {
  return function(target) {
    if (override instanceof HtmlBehaviorResource) {
      metadata.define(metadata.resource, override, target);
    } else {
      let r = metadata.getOrCreateOwn(metadata.resource, HtmlBehaviorResource, target);
      Object.assign(r, override);
    }
  };
}

decorators.configure.parameterizedDecorator('behavior', behavior);

export function customElement(name) {
  validateBehaviorName(name, 'custom element');
  return function(target) {
    let r = metadata.getOrCreateOwn(metadata.resource, HtmlBehaviorResource, target);
    r.elementName = name;
  };
}

decorators.configure.parameterizedDecorator('customElement', customElement);

export function customAttribute(name, defaultBindingMode?) {
  validateBehaviorName(name, 'custom attribute');
  return function(target) {
    let r = metadata.getOrCreateOwn(metadata.resource, HtmlBehaviorResource, target);
    r.attributeName = name;
    r.attributeDefaultBindingMode = defaultBindingMode;
  };
}

decorators.configure.parameterizedDecorator('customAttribute', customAttribute);

export function templateController(target) {
  let deco = function(t) {
    let r = metadata.getOrCreateOwn(metadata.resource, HtmlBehaviorResource, t);
    r.liftsContent = true;
  };

  return target ? deco(target) : deco;
}

decorators.configure.simpleDecorator('templateController', templateController);

export function bindable(nameOrConfigOrTarget?, key?, descriptor?) {
  let deco = function(target, key2, descriptor2) {
    let actualTarget = key2 ? target.constructor : target; //is it on a property or a class?
    let r = metadata.getOrCreateOwn(metadata.resource, HtmlBehaviorResource, actualTarget);
    let prop;

    if (key2) { //is it on a property or a class?
      nameOrConfigOrTarget = nameOrConfigOrTarget || {};
      nameOrConfigOrTarget.name = key2;
    }

    prop = new BindableProperty(nameOrConfigOrTarget);
    return prop.registerWith(actualTarget, r, descriptor2);
  };

  if (!nameOrConfigOrTarget) { //placed on property initializer with parens
    return deco;
  }

  if (key) { //placed on a property initializer without parens
    let target = nameOrConfigOrTarget;
    nameOrConfigOrTarget = null;
    return deco(target, key, descriptor);
  }

  return deco; //placed on a class
}

decorators.configure.parameterizedDecorator('bindable', bindable);

export function dynamicOptions(target) {
  let deco = function(t) {
    let r = metadata.getOrCreateOwn(metadata.resource, HtmlBehaviorResource, t);
    r.hasDynamicOptions = true;
  };

  return target ? deco(target) : deco;
}

decorators.configure.simpleDecorator('dynamicOptions', dynamicOptions);

export function sync(selectorOrConfig) {
  return function(target, key, descriptor) {
    let actualTarget = key ? target.constructor : target; //is it on a property or a class?
    let r = metadata.getOrCreateOwn(metadata.resource, HtmlBehaviorResource, actualTarget);

    if (typeof selectorOrConfig === 'string') {
      selectorOrConfig = {
        selector: selectorOrConfig,
        name: key
      };
    }

    r.addChildBinding(new ChildObserver(selectorOrConfig));
  };
}

decorators.configure.parameterizedDecorator('sync', sync);

export function useShadowDOM(target) {
  let deco = function(t) {
    let r = metadata.getOrCreateOwn(metadata.resource, HtmlBehaviorResource, t);
    r.targetShadowDOM = true;
  };

  return target ? deco(target) : deco;
}

decorators.configure.simpleDecorator('useShadowDOM', useShadowDOM);

function doNotProcessContent() {
  return false;
}

export function processContent(processor) {
  return function(t) {
    let r = metadata.getOrCreateOwn(metadata.resource, HtmlBehaviorResource, t);
    r.processContent = processor || doNotProcessContent;
  };
}

decorators.configure.parameterizedDecorator('processContent', processContent);

export function containerless(target) {
  let deco = function(t) {
    let r = metadata.getOrCreateOwn(metadata.resource, HtmlBehaviorResource, t);
    r.containerless = true;
  };

  return target ? deco(target) : deco;
}

decorators.configure.simpleDecorator('containerless', containerless);

export function viewStrategy(strategy) {
  return function(target) {
    metadata.define(ViewStrategy.metadataKey, strategy, target);
  };
}

decorators.configure.parameterizedDecorator('viewStrategy', useView);

export function useView(path) {
  return viewStrategy(new UseViewStrategy(path));
}

decorators.configure.parameterizedDecorator('useView', useView);

export function inlineView(markup:string, dependencies?:Array<string|Function|Object>, dependencyBaseUrl?:string) {
  return viewStrategy(new InlineViewStrategy(markup, dependencies, dependencyBaseUrl));
}

decorators.configure.parameterizedDecorator('inlineView', inlineView);

export function noView(target) {
  let deco = function(t) {
    metadata.define(ViewStrategy.metadataKey, new NoViewStrategy(), t);
  };

  return target ? deco(target) : deco;
}

decorators.configure.simpleDecorator('noView', noView);

export function elementConfig(target) {
  let deco = function(t) {
    metadata.define(metadata.resource, new ElementConfigResource(), t);
  };

  return target ? deco(target) : deco;
}

decorators.configure.simpleDecorator('elementConfig', elementConfig);
