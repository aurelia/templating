import { relativeToFile } from 'aurelia-path';
import { metadata } from 'aurelia-metadata';
import * as LogManager from 'aurelia-logging';
import { BindableProperty } from './bindable-property';
import { HtmlBehaviorResource } from './html-behavior';
import { BindingLanguage } from './binding-language';
import { ViewCompileInstruction, ViewCreateInstruction } from './instructions';
import { Container } from 'aurelia-dependency-injection';
import { _hyphenate } from './util';
import { ValueConverterResource, BindingBehaviorResource, camelCase } from 'aurelia-binding';
import { ViewEngineHooksResource } from './view-engine-hooks-resource';

function register(lookup, name, resource, type) {
  if (!name) {
    return;
  }

  let existing = lookup[name];
  if (existing) {
    if (existing !== resource) {
      throw new Error(`Attempted to register ${type} when one with the same name already exists. Name: ${name}.`);
    }

    return;
  }

  lookup[name] = resource;
}

/**
* View engine hooks that enable a view resource to provide custom processing during the compilation or creation of a view.
*/
interface ViewEngineHooks {
  /**
  * Invoked before a template is compiled.
  * @param content The DocumentFragment to compile.
  * @param resources The resources to compile the view against.
  * @param instruction The compilation instruction associated with the compilation process.
  */
  beforeCompile?: (content: DocumentFragment, resources: ViewResources, instruction: ViewCompileInstruction) => void;
  /**
  * Invoked after a template is compiled.
  * @param viewFactory The view factory that was produced from the compilation process.
  */
  afterCompile?: (viewFactory: ViewFactory) => void;
  /**
  * Invoked before a view is created.
  * @param viewFactory The view factory that will be used to create the view.
  * @param container The DI container used during view creation.
  * @param content The cloned document fragment representing the view.
  * @param instruction The view creation instruction associated with this creation process.
  */
  beforeCreate?: (viewFactory: ViewFactory, container: Container, content: DocumentFragment, instruction: ViewCreateInstruction) => void;
  /**
  * Invoked after a view is created.
  * @param view The view that was created by the factory.
  */
  afterCreate?: (view: View) => void;

  /**
  * Invoked after the bindingContext and overrideContext are configured on the view but before the view is bound.
  * @param view The view that was created by the factory.
  */
  beforeBind?: (view: View) => void;

  /**
  * Invoked before the view is unbind. The bindingContext and overrideContext are still available on the view.
  * @param view The view that was created by the factory.
  */
  beforeUnbind?: (view: View) => void;
}

interface IBindablePropertyConfig {
  /**
  * The name of the property.
  */
  name?: string;
  attribute?: string;
  /**
   * The default binding mode of the property. If given string, will use to lookup
   */
  defaultBindingMode?: bindingMode | 'oneTime' | 'oneWay' | 'twoWay' | 'fromView' | 'toView';
  /**
   * The name of a view model method to invoke when the property is updated.
   */
  changeHandler?: string;
  /**
   * A default value for the property.
   */
  defaultValue?: any;
  /**
   * Designates the property as the default bindable property among all the other bindable properties when used in a custom attribute with multiple bindable properties.
   */
  primaryProperty?: boolean;
  // For compatibility and future extension
  [key: string]: any;
}

interface IStaticResourceConfig {
  /**
   * Resource type of this class, omit equals to custom element
   */
  type?: 'element' | 'attribute' | 'valueConverter' | 'bindingBehavior' | 'viewEngineHooks';
  /**
   * Name of this resource. Reccommended to explicitly set to works better with minifier
   */
  name?: string;
  /**
   * Used to tell if a custom attribute is a template controller
   */
  templateController?: boolean;
  /**
   * Used to set default binding mode of default custom attribute view model "value" property
   */
  defaultBindingMode?: bindingMode | 'oneTime' | 'oneWay' | 'twoWay' | 'fromView' | 'toView';
  /**
   * Flags a custom attribute has dynamic options
   */
  hasDynamicOptions?: boolean;
  /**
   * Flag if this custom element uses native shadow dom instead of emulation
   */
  usesShadowDOM?: boolean;
  /**
   * Options that will be used if the element is flagged with usesShadowDOM
   */
  shadowDOMOptions?: ShadowRootInit;
  /**
   * Flag a custom element as containerless. Which will remove their render target
   */
  containerless?: boolean;
  /**
   * Custom processing of the attributes on an element before the framework inspects them.
   */
  processAttributes?: (viewCompiler: ViewCompiler, resources: ViewResources, node: Element, attributes: NamedNodeMap, elementInstruction: BehaviorInstruction) => void;
  /**
   * Enables custom processing of the content that is places inside the custom element by its consumer.
   * Pass a boolean to direct the template compiler to not process
   * the content placed inside this element. Alternatively, pass a function which
   * can provide custom processing of the content. This function should then return
   * a boolean indicating whether the compiler should also process the content.
   */
  processContent?: (viewCompiler: ViewCompiler, resources: ViewResources, node: Element, instruction: BehaviorInstruction) => boolean;
  /**
   * List of bindable properties of this custom element / custom attribute, by name or full config object
   */
  bindables?: (string | IBindablePropertyConfig)[];
}

export function validateBehaviorName(name: string, type: string) {
  if (/[A-Z]/.test(name)) {
    let newName = _hyphenate(name);
    LogManager
      .getLogger('templating')
      .warn(`'${name}' is not a valid ${type} name and has been converted to '${newName}'. Upper-case letters are not allowed because the DOM is not case-sensitive.`);
    return newName;
  }
  return name;
}

const conventionMark = '__au_resource__';

/**
 * Represents a collection of resources used during the compilation of a view.
 * Will optinally add information to an existing HtmlBehaviorResource if given
 */
export class ViewResources {

  /**
   * Checks whether the provided class contains any resource conventions
   * @param target Target class to extract metadata based on convention
   * @param existing If supplied, all custom element / attribute metadata extracted from convention will be apply to this instance
   */
  static convention(target: Function, existing?: HtmlBehaviorResource): HtmlBehaviorResource | ValueConverterResource | BindingBehaviorResource | ViewEngineHooksResource {
    let resource;
    // Use a simple string to mark that an HtmlBehaviorResource instance
    // has been applied all resource information from its target view model class
    // to prevent subsequence call re initialization all info again
    if (existing && conventionMark in existing) {
      return existing;
    }
    if ('$resource' in target) {
      let config = target.$resource;
      // 1. check if resource config is a string
      if (typeof config === 'string') {
        // it's a custom element, with name is the resource variable
        // static $resource = 'my-element'
        resource = existing || new HtmlBehaviorResource();
        resource[conventionMark] = true;
        if (!resource.elementName) {
          // if element name was not specified before
          resource.elementName = validateBehaviorName(config, 'custom element');
        }
      } else {
        // 2. if static config is not a string, normalize into an config object
        if (typeof config === 'function') {
          // static $resource() {  }
          config = config.call(target);
        }
        if (typeof config === 'string') {
          // static $resource() { return 'my-custom-element-name' }
          // though rare case, still needs to handle properly
          config = { name: config };
        }
        // after normalization, copy to another obj
        // as the config could come from a static field, which subject to later reuse
        // it shouldn't be modified
        config = Object.assign({}, config);
        // no type specified = custom element
        let resourceType = config.type || 'element';
        // cannot do name = config.name || target.name
        // depends on resource type, it may need to use different strategies to normalize name
        let name = config.name;
        switch (resourceType) { // eslint-disable-line default-case
        case 'element': case 'attribute':
          // if a metadata is supplied, use it
          resource = existing || new HtmlBehaviorResource();
          resource[conventionMark] = true;
          if (resourceType === 'element') {
            // if element name was defined before applying convention here
            // it's a result from `@customElement` call (or manual modification)
            // need not to redefine name
            // otherwise, fall into following if
            if (!resource.elementName) {
              resource.elementName = name
                ? validateBehaviorName(name, 'custom element')
                : _hyphenate(target.name);
            }
          } else {
            // attribute name was defined before applying convention here
            // it's a result from `@customAttribute` call (or manual modification)
            // need not to redefine name
            // otherwise, fall into following if
            if (!resource.attributeName) {
              resource.attributeName = name
                ? validateBehaviorName(name, 'custom attribute')
                : _hyphenate(target.name);
            }
          }
          if ('templateController' in config) {
            // map templateController to liftsContent
            config.liftsContent = config.templateController;
            delete config.templateController;
          }
          if ('defaultBindingMode' in config && resource.attributeDefaultBindingMode !== undefined) {
            // map defaultBindingMode to attributeDefaultBinding mode
            // custom element doesn't have default binding mode
            config.attributeDefaultBindingMode = config.defaultBindingMode;
            delete config.defaultBindingMode;
          }
          // not bringing over the name.
          delete config.name;
          // just copy over. Devs are responsible for what specified in the config
          Object.assign(resource, config);
          break;
        case 'valueConverter':
          resource = new ValueConverterResource(camelCase(name || target.name));
          break;
        case 'bindingBehavior':
          resource = new BindingBehaviorResource(camelCase(name || target.name));
          break;
        case 'viewEngineHooks':
          resource = new ViewEngineHooksResource();
          break;
        }
      }

      if (resource instanceof HtmlBehaviorResource) {
        // check for bindable registration
        // This will concat bindables specified in static field / method with bindables specified via decorators
        // Which means if `name` is specified in both decorator and static config, it will be duplicated here
        // though it will finally resolves to only 1 `name` attribute
        // Will not break if it's done in that way but probably only happenned in inheritance scenarios.
        let bindables = typeof config === 'string' ? undefined : config.bindables;
        let currentProps = resource.properties;
        if (Array.isArray(bindables)) {
          for (let i = 0, ii = bindables.length; ii > i; ++i) {
            let prop = bindables[i];
            if (!prop || (typeof prop !== 'string' && !prop.name)) {
              throw new Error(`Invalid bindable property at "${i}" for class "${target.name}". Expected either a string or an object with "name" property.`);
            }
            let newProp = new BindableProperty(prop);
            // Bindable properties defined in $resource convention
            // shouldn't override existing prop with the same name
            // as they could be explicitly defined via decorator, thus more trust worthy ?
            let existed = false;
            for (let j = 0, jj = currentProps.length; jj > j; ++j) {
              if (currentProps[j].name === newProp.name) {
                existed = true;
                break;
              }
            }
            if (existed) {
              continue;
            }
            newProp.registerWith(target, resource);
          }
        }
      }
    }
    return resource;
  }

  /**
  * A custom binding language used in the view.
  */
  bindingLanguage = null;

  /**
  * Creates an instance of ViewResources.
  * @param parent The parent resources. This resources can override them, but if a resource is not found, it will be looked up in the parent.
  * @param viewUrl The url of the view to which these resources apply.
  */
  constructor(parent?: ViewResources, viewUrl?: string) {
    this.parent = parent || null;
    this.hasParent = this.parent !== null;
    this.viewUrl = viewUrl || '';
    this.lookupFunctions = {
      valueConverters: this.getValueConverter.bind(this),
      bindingBehaviors: this.getBindingBehavior.bind(this)
    };
    this.attributes = Object.create(null);
    this.elements = Object.create(null);
    this.valueConverters = Object.create(null);
    this.bindingBehaviors = Object.create(null);
    this.attributeMap = Object.create(null);
    this.values = Object.create(null);
    this.beforeCompile = this.afterCompile = this.beforeCreate = this.afterCreate = this.beforeBind = this.beforeUnbind = false;
  }

  _tryAddHook(obj, name) {
    if (typeof obj[name] === 'function') {
      let func = obj[name].bind(obj);
      let counter = 1;
      let callbackName;

      while (this[callbackName = name + counter.toString()] !== undefined) {
        counter++;
      }

      this[name] = true;
      this[callbackName] = func;
    }
  }

  _invokeHook(name, one, two, three, four) {
    if (this.hasParent) {
      this.parent._invokeHook(name, one, two, three, four);
    }

    if (this[name]) {
      this[name + '1'](one, two, three, four);

      let callbackName = name + '2';
      if (this[callbackName]) {
        this[callbackName](one, two, three, four);

        callbackName = name + '3';
        if (this[callbackName]) {
          this[callbackName](one, two, three, four);

          let counter = 4;

          while (this[callbackName = name + counter.toString()] !== undefined) {
            this[callbackName](one, two, three, four);
            counter++;
          }
        }
      }
    }
  }

  /**
  * Registers view engine hooks for the view.
  * @param hooks The hooks to register.
  */
  registerViewEngineHooks(hooks: ViewEngineHooks): void {
    this._tryAddHook(hooks, 'beforeCompile');
    this._tryAddHook(hooks, 'afterCompile');
    this._tryAddHook(hooks, 'beforeCreate');
    this._tryAddHook(hooks, 'afterCreate');
    this._tryAddHook(hooks, 'beforeBind');
    this._tryAddHook(hooks, 'beforeUnbind');
  }

  /**
  * Gets the binding language associated with these resources, or return the provided fallback implementation.
  * @param bindingLanguageFallback The fallback binding language implementation to use if no binding language is configured locally.
  * @return The binding language.
  */
  getBindingLanguage(bindingLanguageFallback: BindingLanguage): BindingLanguage {
    return this.bindingLanguage || (this.bindingLanguage = bindingLanguageFallback);
  }

  /**
  * Patches an immediate parent into the view resource resolution hierarchy.
  * @param newParent The new parent resources to patch in.
  */
  patchInParent(newParent: ViewResources): void {
    let originalParent = this.parent;

    this.parent = newParent || null;
    this.hasParent = this.parent !== null;

    if (newParent.parent === null) {
      newParent.parent = originalParent;
      newParent.hasParent = originalParent !== null;
    }
  }

  /**
  * Maps a path relative to the associated view's origin.
  * @param path The relative path.
  * @return The calcualted path.
  */
  relativeToView(path: string): string {
    return relativeToFile(path, this.viewUrl);
  }

  /**
  * Registers an HTML element.
  * @param tagName The name of the custom element.
  * @param behavior The behavior of the element.
  */
  registerElement(tagName: string, behavior: HtmlBehaviorResource): void {
    register(this.elements, tagName, behavior, 'an Element');
  }

  /**
  * Gets an HTML element behavior.
  * @param tagName The tag name to search for.
  * @return The HtmlBehaviorResource for the tag name or null.
  */
  getElement(tagName: string): HtmlBehaviorResource {
    return this.elements[tagName] || (this.hasParent ? this.parent.getElement(tagName) : null);
  }

  /**
  * Gets the known attribute name based on the local attribute name.
  * @param attribute The local attribute name to lookup.
  * @return The known name.
  */
  mapAttribute(attribute: string): string {
    return this.attributeMap[attribute] || (this.hasParent ? this.parent.mapAttribute(attribute) : null);
  }

  /**
  * Registers an HTML attribute.
  * @param attribute The name of the attribute.
  * @param behavior The behavior of the attribute.
  * @param knownAttribute The well-known name of the attribute (in lieu of the local name).
  */
  registerAttribute(attribute: string, behavior: HtmlBehaviorResource, knownAttribute: string): void {
    this.attributeMap[attribute] = knownAttribute;
    register(this.attributes, attribute, behavior, 'an Attribute');
  }

  /**
  * Gets an HTML attribute behavior.
  * @param attribute The name of the attribute to lookup.
  * @return The HtmlBehaviorResource for the attribute or null.
  */
  getAttribute(attribute: string): HtmlBehaviorResource {
    return this.attributes[attribute] || (this.hasParent ? this.parent.getAttribute(attribute) : null);
  }

  /**
  * Registers a value converter.
  * @param name The name of the value converter.
  * @param valueConverter The value converter instance.
  */
  registerValueConverter(name: string, valueConverter: Object): void {
    register(this.valueConverters, name, valueConverter, 'a ValueConverter');
  }

  /**
  * Gets a value converter.
  * @param name The name of the value converter.
  * @return The value converter instance.
  */
  getValueConverter(name: string): Object {
    return this.valueConverters[name] || (this.hasParent ? this.parent.getValueConverter(name) : null);
  }

  /**
  * Registers a binding behavior.
  * @param name The name of the binding behavior.
  * @param bindingBehavior The binding behavior instance.
  */
  registerBindingBehavior(name: string, bindingBehavior: Object): void {
    register(this.bindingBehaviors, name, bindingBehavior, 'a BindingBehavior');
  }

  /**
  * Gets a binding behavior.
  * @param name The name of the binding behavior.
  * @return The binding behavior instance.
  */
  getBindingBehavior(name: string): Object {
    return this.bindingBehaviors[name] || (this.hasParent ? this.parent.getBindingBehavior(name) : null);
  }

  /**
  * Registers a value.
  * @param name The name of the value.
  * @param value The value.
  */
  registerValue(name: string, value: any): void {
    register(this.values, name, value, 'a value');
  }

  /**
  * Gets a value.
  * @param name The name of the value.
  * @return The value.
  */
  getValue(name: string): any {
    return this.values[name] || (this.hasParent ? this.parent.getValue(name) : null);
  }

  /**
   * @internal
   * Not supported for public use. Can be changed without warning.
   *
   * Auto register a resources based on its metadata or convention
   * Will fallback to custom element if no metadata found and all conventions fail
   * @param {Container} container
   * @param {Function} impl
   * @returns {HtmlBehaviorResource | ValueConverterResource | BindingBehaviorResource | ViewEngineHooksResource}
   */
  autoRegister(container, impl) {
    let resourceTypeMeta = metadata.getOwn(metadata.resource, impl);
    if (resourceTypeMeta) {
      if (resourceTypeMeta instanceof HtmlBehaviorResource) {
        // first use static resource
        ViewResources.convention(impl, resourceTypeMeta);

        // then fallback to traditional convention
        if (resourceTypeMeta.attributeName === null && resourceTypeMeta.elementName === null) {
          //no customeElement or customAttribute but behavior added by other metadata
          HtmlBehaviorResource.convention(impl.name, resourceTypeMeta);
        }
        if (resourceTypeMeta.attributeName === null && resourceTypeMeta.elementName === null) {
          //no convention and no customeElement or customAttribute but behavior added by other metadata
          resourceTypeMeta.elementName = _hyphenate(impl.name);
        }
      }
    } else {
      resourceTypeMeta = ViewResources.convention(impl)
        || HtmlBehaviorResource.convention(impl.name)
        || ValueConverterResource.convention(impl.name)
        || BindingBehaviorResource.convention(impl.name)
        || ViewEngineHooksResource.convention(impl.name);
      if (!resourceTypeMeta) {
        // doesn't match any convention, and is an exported value => custom element
        resourceTypeMeta = new HtmlBehaviorResource();
        resourceTypeMeta.elementName = _hyphenate(impl.name);
      }
      metadata.define(metadata.resource, resourceTypeMeta, impl);
    }
    resourceTypeMeta.initialize(container, impl);
    resourceTypeMeta.register(this);
    return resourceTypeMeta;
  }
}
