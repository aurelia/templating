import {Metadata, Decorators} from 'aurelia-metadata';
import {BindableProperty} from './bindable-property';
import {ChildObserver} from './children';
import {ElementConfigResource} from './element-config';
import {UseViewStrategy, NoViewStrategy} from './view-strategy';
import {HtmlBehaviorResource} from './html-behavior';

export function behavior(override){
  return function(target){
    var resource = Metadata.on(target).firstOrAdd(HtmlBehaviorResource);
    Object.assign(resource, override);
    return target;
  }
}

Decorators.configure.parameterizedDecorator('behavior', behavior);

export function customElement(name){
  return function(target){
    var resource = Metadata.on(target).firstOrAdd(HtmlBehaviorResource);
    resource.elementName = name;
    return target;
  }
}

Decorators.configure.parameterizedDecorator('customElement', customElement);

export function customAttribute(name){
  return function(target){
    var resource = Metadata.on(target).firstOrAdd(HtmlBehaviorResource);
    resource.attributeName = name;
    return target;
  }
}

Decorators.configure.parameterizedDecorator('customAttribute', customAttribute);

export function templateController(){
  return function(target){
    var resource = Metadata.on(target).firstOrAdd(HtmlBehaviorResource);
    resource.liftsContent = true;
    return target;
  }
}

Decorators.configure.parameterizedDecorator('templateController', templateController);

export function bindableProperty(nameOrConfig){
  return function(target){
    var resource = Metadata.on(target).firstOrAdd(HtmlBehaviorResource),
        prop = new BindableProperty(nameOrConfig);

    prop.registerWith(target, resource);

    return target;
  }
}

Decorators.configure.parameterizedDecorator('bindableProperty', bindableProperty);

export function dynamicOptions(){
  return function(target){
    var resource = Metadata.on(target).firstOrAdd(HtmlBehaviorResource);
    resource.hasDynamicOptions = true;
    return target;
  }
}

Decorators.configure.parameterizedDecorator('dynamicOptions', dynamicOptions);

export function syncChildren(property, changeHandler, selector){
  return function(target){
    var resource = Metadata.on(target).firstOrAdd(HtmlBehaviorResource);
    resource.childExpression = new ChildObserver(property, changeHandler, selector);
    return target;
  }
}

Decorators.configure.parameterizedDecorator('syncChildren', syncChildren);

export function useShadowDOM(){
  return function(target){
    var resource = Metadata.on(target).firstOrAdd(HtmlBehaviorResource);
    resource.useShadowDOM = true;
    return target;
  }
}

Decorators.configure.parameterizedDecorator('useShadowDOM', useShadowDOM);

export function skipContentProcessing(){
  return function(target){
    var resource = Metadata.on(target).firstOrAdd(HtmlBehaviorResource);
    resource.skipContentProcessing = true;
    return target;
  }
}

Decorators.configure.parameterizedDecorator('skipContentProcessing', skipContentProcessing);

export function useView(path){
  return function(target){
    Metadata.on(target).add(new UseViewStrategy(path));
    return target;
  }
}

Decorators.configure.parameterizedDecorator('useView', useView);

export function noView(){
  return function(target){
    Metadata.on(target).add(new NoViewStrategy());
    return target;
  }
}

Decorators.configure.parameterizedDecorator('noView', noView);

export function elementConfig(){
  return function(target){
    Metadata.on(target).add(new ElementConfigResource());
    return target;
  }
}

Decorators.configure.parameterizedDecorator('elementConfig', elementConfig);
