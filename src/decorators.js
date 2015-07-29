import core from 'core-js';
import {Metadata, Decorators} from 'aurelia-metadata';
import {BindableProperty} from './bindable-property';
import {ChildObserver} from './children';
import {ElementConfigResource} from './element-config';
import {ViewStrategy, UseViewStrategy, NoViewStrategy, InlineViewStrategy} from './view-strategy';
import {HtmlBehaviorResource} from './html-behavior';

function validateBehaviorName(name, type) {
  if (/[A-Z]/.test(name)) {
    throw new Error(`'${name}' is not a valid ${type} name.  Upper-case letters are not allowed because the DOM is not case-sensitive.`)
  }
}

export function behavior(override){
  return function(target){
    if(override instanceof HtmlBehaviorResource){
      Metadata.define(Metadata.resource, override, target);
    }else{
      var resource = Metadata.getOrCreateOwn(Metadata.resource, HtmlBehaviorResource, target);
      Object.assign(resource, override);
    }
  }
}

Decorators.configure.parameterizedDecorator('behavior', behavior);

export function customElement(name){
  validateBehaviorName(name, 'custom element');
  return function(target){
    var resource = Metadata.getOrCreateOwn(Metadata.resource, HtmlBehaviorResource, target);
    resource.elementName = name;
  }
}

Decorators.configure.parameterizedDecorator('customElement', customElement);

export function customAttribute(name, defaultBindingMode){
  validateBehaviorName(name, 'custom attribute');
  return function(target){
    var resource = Metadata.getOrCreateOwn(Metadata.resource, HtmlBehaviorResource, target);
    resource.attributeName = name;
    resource.attributeDefaultBindingMode = defaultBindingMode;
  }
}

Decorators.configure.parameterizedDecorator('customAttribute', customAttribute);

export function templateController(target){
  var deco = function(target){
    var resource = Metadata.getOrCreateOwn(Metadata.resource, HtmlBehaviorResource, target);
    resource.liftsContent = true;
  };

  return target ? deco(target) : deco;
}

Decorators.configure.simpleDecorator('templateController', templateController);

export function bindable(nameOrConfigOrTarget?, key?, descriptor?){
  var deco = function(target, key, descriptor){
    var actualTarget = key ? target.constructor : target, //is it on a property or a class?
        resource = Metadata.getOrCreateOwn(Metadata.resource, HtmlBehaviorResource, actualTarget),
        prop;

    if(key){ //is it on a property or a class?
      nameOrConfigOrTarget = nameOrConfigOrTarget || {};
      nameOrConfigOrTarget.name = key;
    }

    prop = new BindableProperty(nameOrConfigOrTarget);
    return prop.registerWith(actualTarget, resource, descriptor);
  };

  if(!nameOrConfigOrTarget){ //placed on property initializer with parens
    return deco;
  }

  if(key){ //placed on a property initializer without parens
    var target = nameOrConfigOrTarget;
    nameOrConfigOrTarget = null;
    return deco(target, key, descriptor);
  }

  return deco; //placed on a class
}

Decorators.configure.parameterizedDecorator('bindable', bindable);

export function dynamicOptions(target){
  var deco = function(target){
    var resource = Metadata.getOrCreateOwn(Metadata.resource, HtmlBehaviorResource, target);
    resource.hasDynamicOptions = true;
  };

  return target ? deco(target) : deco;
}

Decorators.configure.simpleDecorator('dynamicOptions', dynamicOptions);

export function sync(selectorOrConfig){
  return function(target, key, descriptor){
    let actualTarget = key ? target.constructor : target, //is it on a property or a class?
        resource = Metadata.getOrCreateOwn(Metadata.resource, HtmlBehaviorResource, actualTarget);

    if(typeof selectorOrConfig === 'string'){
      selectorOrConfig = {
        selector: selectorOrConfig,
        name: key
      };
    }

    resource.addChildBinding(new ChildObserver(selectorOrConfig));
  }
}

Decorators.configure.parameterizedDecorator('sync', sync);

export function useShadowDOM(target){
  var deco = function(target){
    var resource = Metadata.getOrCreateOwn(Metadata.resource, HtmlBehaviorResource, target);
    resource.targetShadowDOM = true;
  };

  return target ? deco(target) : deco;
}

Decorators.configure.simpleDecorator('useShadowDOM', useShadowDOM);

function doNotProcessContent(){
  return false;
}

//this is now deprecated in favor of the processContent decorator
export function skipContentProcessing(target){
  var deco = function(target){
    var resource = Metadata.getOrCreateOwn(Metadata.resource, HtmlBehaviorResource, target);
    resource.processContent = doNotProcessContent;
    console.warn('The @skipContentProcessing decorator is deprecated and will be removed in a future release. Please use @processContent(false) instead.');
  };

  return target ? deco(target) : deco;
}

Decorators.configure.simpleDecorator('skipContentProcessing', skipContentProcessing);

export function processContent(processor){
  return function(target){
    var resource = Metadata.getOrCreateOwn(Metadata.resource, HtmlBehaviorResource, target);
    resource.processContent = processor || doNotProcessContent;
  }
}

Decorators.configure.parameterizedDecorator('processContent', processContent);

export function containerless(target){
  var deco = function(target){
    var resource = Metadata.getOrCreateOwn(Metadata.resource, HtmlBehaviorResource, target);
    resource.containerless = true;
  };

  return target ? deco(target) : deco;
}

Decorators.configure.simpleDecorator('containerless', containerless);

export function viewStrategy(strategy){
  return function(target){
    Metadata.define(ViewStrategy.metadataKey, strategy, target);
  }
}

Decorators.configure.parameterizedDecorator('viewStrategy', useView);

export function useView(path){
  return viewStrategy(new UseViewStrategy(path));
}

Decorators.configure.parameterizedDecorator('useView', useView);

export function inlineView(markup:string, dependencies?:Array<string|Function|Object>, dependencyBaseUrl?:string){
  return viewStrategy(new InlineViewStrategy(markup, dependencies, dependencyBaseUrl));
}

Decorators.configure.parameterizedDecorator('inlineView', inlineView);

export function noView(target){
  var deco = function(target){
    Metadata.define(ViewStrategy.metadataKey, new NoViewStrategy(), target);
  };

  return target ? deco(target) : deco;
}

Decorators.configure.simpleDecorator('noView', noView);

export function elementConfig(target){
  var deco = function(target){
    Metadata.define(Metadata.resource, new ElementConfigResource(), target);
  };

  return target ? deco(target) : deco;
}

Decorators.configure.simpleDecorator('elementConfig', elementConfig);
