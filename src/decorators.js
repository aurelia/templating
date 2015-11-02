import 'core-js';
import {metadata} from 'aurelia-metadata';
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

export function customElement(name) {
  validateBehaviorName(name, 'custom element');
  return function(target) {
    let r = metadata.getOrCreateOwn(metadata.resource, HtmlBehaviorResource, target);
    r.elementName = name;
  };
}

export function customAttribute(name, defaultBindingMode?) {
  validateBehaviorName(name, 'custom attribute');
  return function(target) {
    let r = metadata.getOrCreateOwn(metadata.resource, HtmlBehaviorResource, target);
    r.attributeName = name;
    r.attributeDefaultBindingMode = defaultBindingMode;
  };
}

export function templateController(target) {
  let deco = function(t) {
    let r = metadata.getOrCreateOwn(metadata.resource, HtmlBehaviorResource, t);
    r.liftsContent = true;
  };

  return target ? deco(target) : deco;
}

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

export function dynamicOptions(target) {
  let deco = function(t) {
    let r = metadata.getOrCreateOwn(metadata.resource, HtmlBehaviorResource, t);
    r.hasDynamicOptions = true;
  };

  return target ? deco(target) : deco;
}

export function useShadowDOM(target) {
  let deco = function(t) {
    let r = metadata.getOrCreateOwn(metadata.resource, HtmlBehaviorResource, t);
    r.targetShadowDOM = true;
  };

  return target ? deco(target) : deco;
}

function doNotProcessContent() {
  return false;
}

export function processContent(processor) {
  return function(t) {
    let r = metadata.getOrCreateOwn(metadata.resource, HtmlBehaviorResource, t);
    r.processContent = processor || doNotProcessContent;
  };
}

export function containerless(target) {
  let deco = function(t) {
    let r = metadata.getOrCreateOwn(metadata.resource, HtmlBehaviorResource, t);
    r.containerless = true;
  };

  return target ? deco(target) : deco;
}

export function viewStrategy(strategy) {
  return function(target) {
    metadata.define(ViewStrategy.metadataKey, strategy, target);
  };
}

export function useView(path) {
  return viewStrategy(new UseViewStrategy(path));
}

export function inlineView(markup:string, dependencies?:Array<string|Function|Object>, dependencyBaseUrl?:string) {
  return viewStrategy(new InlineViewStrategy(markup, dependencies, dependencyBaseUrl));
}

export function noView(target) {
  let deco = function(t) {
    metadata.define(ViewStrategy.metadataKey, new NoViewStrategy(), t);
  };

  return target ? deco(target) : deco;
}

export function elementConfig(target) {
  let deco = function(t) {
    metadata.define(metadata.resource, new ElementConfigResource(), t);
  };

  return target ? deco(target) : deco;
}
