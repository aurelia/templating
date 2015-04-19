import core from 'core-js';
import {Metadata, Decorators} from 'aurelia-metadata';
import {BindableProperty} from './bindable-property';
import {ChildObserver} from './children';
import {ElementConfigResource} from './element-config';
import {UseViewStrategy, NoViewStrategy} from './view-strategy';
import * as hb from './html-behavior';

export function behavior(override){
  return function(target){
    var meta = Metadata.on(target);

    if(override instanceof hb.HtmlBehaviorResource){
      meta.add(override);
    }else{
      var resource = meta.firstOrAdd(hb.HtmlBehaviorResource);
      Object.assign(resource, override);
    }
  }
}

Decorators.configure.parameterizedDecorator('behavior', behavior);

export function customElement(name){
  return function(target){
    var resource = Metadata.on(target).firstOrAdd(hb.HtmlBehaviorResource);
    resource.elementName = name;
  }
}

Decorators.configure.parameterizedDecorator('customElement', customElement);

export function customAttribute(name){
  return function(target){
    var resource = Metadata.on(target).firstOrAdd(hb.HtmlBehaviorResource);
    resource.attributeName = name;
  }
}

Decorators.configure.parameterizedDecorator('customAttribute', customAttribute);

export function templateController(target){
  var deco = function(target){
    var resource = Metadata.on(target).firstOrAdd(hb.HtmlBehaviorResource);
    resource.liftsContent = true;
  };

  return target ? deco(target) : deco;
}

Decorators.configure.simpleDecorator('templateController', templateController);

export function bindable(nameOrConfigOrTarget, key, descriptor){
  var deco = function(target, key, descriptor){
    var actualTarget = key ? target.constructor : target, //is it on a property or a class?
        resource = Metadata.on(actualTarget).firstOrAdd(hb.HtmlBehaviorResource),
        prop;

    if(key){ //is it on a property or a class?
      nameOrConfigOrTarget = nameOrConfigOrTarget || {};
      nameOrConfigOrTarget.name = key;
    }

    prop = new BindableProperty(nameOrConfigOrTarget);
    prop.registerWith(actualTarget, resource);
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
    var resource = Metadata.on(target).firstOrAdd(hb.HtmlBehaviorResource);
    resource.hasDynamicOptions = true;
  };

  return target ? deco(target) : deco;
}

Decorators.configure.simpleDecorator('dynamicOptions', dynamicOptions);

export function syncChildren(property, changeHandler, selector){
  return function(target){
    var resource = Metadata.on(target).firstOrAdd(hb.HtmlBehaviorResource);
    resource.childExpression = new ChildObserver(property, changeHandler, selector);
  }
}

Decorators.configure.parameterizedDecorator('syncChildren', syncChildren);

export function useShadowDOM(target){
  var deco = function(target){
    var resource = Metadata.on(target).firstOrAdd(hb.HtmlBehaviorResource);
    resource.useShadowDOM = true;
  };

  return target ? deco(target) : deco;
}

Decorators.configure.simpleDecorator('useShadowDOM', useShadowDOM);

export function skipContentProcessing(target){
  var deco = function(target){
    var resource = Metadata.on(target).firstOrAdd(hb.HtmlBehaviorResource);
    resource.skipContentProcessing = true;
  };

  return target ? deco(target) : deco;
}

Decorators.configure.simpleDecorator('skipContentProcessing', skipContentProcessing);

export function useView(path){
  return function(target){
    Metadata.on(target).add(new UseViewStrategy(path));
  }
}

Decorators.configure.parameterizedDecorator('useView', useView);

export function noView(target){
  var deco = function(target){
    Metadata.on(target).add(new NoViewStrategy());
  };

  return target ? deco(target) : deco;
}

Decorators.configure.simpleDecorator('noView', noView);

export function elementConfig(target){
  var deco = function(target){
    Metadata.on(target).add(new ElementConfigResource());
  };

  return target ? deco(target) : deco;
}

Decorators.configure.simpleDecorator('elementConfig', elementConfig);
