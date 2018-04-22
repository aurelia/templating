import * as LogManager from 'aurelia-logging';
import {metadata} from 'aurelia-metadata';
import {ViewEngine} from './view-engine';
import {validateBehaviorName} from './view-resources';
import {BindableProperty} from './bindable-property';
import {ElementConfigResource} from './element-config';
import {ViewLocator, RelativeViewStrategy, NoViewStrategy, InlineViewStrategy} from './view-strategy';
import {HtmlBehaviorResource} from './html-behavior';

/**
* Decorator: Specifies a resource instance that describes the decorated class.
* @param instanceOrConfig The resource instance.
*/
export function resource(instanceOrConfig: string | object): any {
  return function(target) {
    let isConfig = typeof instanceOrConfig === 'string' || Object.getPrototypeOf(instanceOrConfig) === Object.prototype;
    if (isConfig) {
      target.$resource = instanceOrConfig;
    } else {
      metadata.define(metadata.resource, instanceOrConfig, target);
    }
  };
}

/**
* Decorator: Specifies a custom HtmlBehaviorResource instance or an object that overrides various implementation details of the default HtmlBehaviorResource.
* @param override The customized HtmlBehaviorResource or an object to override the default with.
*/
export function behavior(override: HtmlBehaviorResource | Object): any {
  return function(target) {
    if (override instanceof HtmlBehaviorResource) {
      metadata.define(metadata.resource, override, target);
    } else {
      let r = metadata.getOrCreateOwn(metadata.resource, HtmlBehaviorResource, target);
      Object.assign(r, override);
    }
  };
}

/**
* Decorator: Indicates that the decorated class is a custom element.
* @param name The name of the custom element.
*/
export function customElement(name: string): any {
  return function(target) {
    let r = metadata.getOrCreateOwn(metadata.resource, HtmlBehaviorResource, target);
    r.elementName = validateBehaviorName(name, 'custom element');
  };
}

/**
* Decorator: Indicates that the decorated class is a custom attribute.
* @param name The name of the custom attribute.
* @param defaultBindingMode The default binding mode to use when the attribute is bound with .bind.
* @param aliases The array of aliases to associate to the custom attribute.
*/
export function customAttribute(name: string, defaultBindingMode?: number, aliases?: string[]): any {
  return function(target) {
    let r = metadata.getOrCreateOwn(metadata.resource, HtmlBehaviorResource, target);
    r.attributeName = validateBehaviorName(name, 'custom attribute');
    r.attributeDefaultBindingMode = defaultBindingMode;
    r.aliases = aliases;
  };
}

/**
* Decorator: Applied to custom attributes. Indicates that whatever element the
* attribute is placed on should be converted into a template and that this
* attribute controls the instantiation of the template.
*/
export function templateController(target?): any {
  let deco = function(t) {
    let r = metadata.getOrCreateOwn(metadata.resource, HtmlBehaviorResource, t);
    r.liftsContent = true;
  };

  return target ? deco(target) : deco;
}

/**
* Decorator: Specifies that a property is bindable through HTML.
* @param nameOrConfigOrTarget The name of the property, or a configuration object.
*/
export function bindable(nameOrConfigOrTarget?: string | Object, key?, descriptor?): any {
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

/**
* Decorator: Specifies that the decorated custom attribute has options that
* are dynamic, based on their presence in HTML and not statically known.
*/
export function dynamicOptions(target?): any {
  let deco = function(t) {
    let r = metadata.getOrCreateOwn(metadata.resource, HtmlBehaviorResource, t);
    r.hasDynamicOptions = true;
  };

  return target ? deco(target) : deco;
}

const defaultShadowDOMOptions = { mode: 'open' };
/**
* Decorator: Indicates that the custom element should render its view in Shadow
* DOM. This decorator may change slightly when Aurelia updates to Shadow DOM v1.
*/
export function useShadowDOM(targetOrOptions?): any {
  let options = typeof targetOrOptions === 'function' || !targetOrOptions
    ? defaultShadowDOMOptions
    : targetOrOptions;

  let deco = function(t) {
    let r = metadata.getOrCreateOwn(metadata.resource, HtmlBehaviorResource, t);
    r.targetShadowDOM = true;
    r.shadowDOMOptions = options;
  };

  return typeof targetOrOptions === 'function' ? deco(targetOrOptions) : deco;
}

/**
* Decorator: Enables custom processing of the attributes on an element before the framework inspects them.
* @param processor Pass a function which can provide custom processing of the content.
*/
export function processAttributes(processor: Function): any {
  return function(t) {
    let r = metadata.getOrCreateOwn(metadata.resource, HtmlBehaviorResource, t);
    r.processAttributes = function(compiler, resources, node, attributes, elementInstruction) {
      try {
        processor(compiler, resources, node, attributes, elementInstruction);
      } catch (error) {
        LogManager.getLogger('templating').error(error);
      }
    };
  };
}

function doNotProcessContent() { return false; }

/**
* Decorator: Enables custom processing of the content that is places inside the
* custom element by its consumer.
* @param processor Pass a boolean to direct the template compiler to not process
* the content placed inside this element. Alternatively, pass a function which
* can provide custom processing of the content. This function should then return
* a boolean indicating whether the compiler should also process the content.
*/
export function processContent(processor: boolean | Function): any {
  return function(t) {
    let r = metadata.getOrCreateOwn(metadata.resource, HtmlBehaviorResource, t);
    r.processContent = processor ? function(compiler, resources, node, instruction) {
      try {
        return processor(compiler, resources, node, instruction);
      } catch (error) {
        LogManager.getLogger('templating').error(error);
        return false;
      }
    } : doNotProcessContent;
  };
}

/**
* Decorator: Indicates that the custom element should be rendered without its
* element container.
*/
export function containerless(target?): any {
  let deco = function(t) {
    let r = metadata.getOrCreateOwn(metadata.resource, HtmlBehaviorResource, t);
    r.containerless = true;
  };

  return target ? deco(target) : deco;
}

/**
* Decorator: Associates a custom view strategy with the component.
* @param strategy The view strategy instance.
*/
export function useViewStrategy(strategy: Object): any {
  return function(target) {
    metadata.define(ViewLocator.viewStrategyMetadataKey, strategy, target);
  };
}

/**
* Decorator: Provides a relative path to a view for the component.
* @param path The path to the view.
*/
export function useView(path: string): any {
  return useViewStrategy(new RelativeViewStrategy(path));
}

/**
* Decorator: Provides a view template, directly inline, for the component. Be
* sure to wrap the markup in a template element.
* @param markup The markup for the view.
* @param dependencies A list of dependencies that the template has.
* @param dependencyBaseUrl A base url from which the dependencies will be loaded.
*/
export function inlineView(markup:string, dependencies?:Array<string|Function|Object>, dependencyBaseUrl?:string): any {
  return useViewStrategy(new InlineViewStrategy(markup, dependencies, dependencyBaseUrl));
}

/**
* Decorator: Indicates that the component has no view.
*/
export function noView(targetOrDependencies?:Function|Array<any>, dependencyBaseUrl?:string): any {
  let target;
  let dependencies;
  if (typeof targetOrDependencies === 'function') {
    target = targetOrDependencies;
  } else {
    dependencies = targetOrDependencies;
    target = undefined;
  }

  let deco = function(t) {
    metadata.define(ViewLocator.viewStrategyMetadataKey, new NoViewStrategy(dependencies, dependencyBaseUrl), t);
  };

  return target ? deco(target) : deco;
}

interface IStaticViewStrategyConfig {
  template: string | HTMLTemplateElement;
  dependencies?: Function[] | { (): (Promise<Record<string, Function>> | Function)[] }
}

/**
 * Decorator: Indicates that the element use static view
 */
export function view(templateOrConfig:string|HTMLTemplateElement|IStaticViewStrategyConfig): any {
  return function(target) {
    target.$view = templateOrConfig;
  };
}

/**
* Decorator: Indicates that the decorated class provides element configuration
* to the EventManager for one or more Web Components.
*/
export function elementConfig(target?): any {
  let deco = function(t) {
    metadata.define(metadata.resource, new ElementConfigResource(), t);
  };

  return target ? deco(target) : deco;
}

/**
* Decorator: Provides the ability to add resources to the related View
* Same as: <require from="..."></require>
* @param resources Either: strings with moduleIds, Objects with 'src' and optionally 'as' properties or one of the classes of the module to be included.
*/
export function viewResources(...resources) { // eslint-disable-line
  return function(target) {
    metadata.define(ViewEngine.viewModelRequireMetadataKey, resources, target);
  };
}
