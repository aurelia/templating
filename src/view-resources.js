import {relativeToFile} from 'aurelia-path';
import {HtmlBehaviorResource} from './html-behavior';
import {BindingLanguage} from './binding-language';
import {ViewCompileInstruction, ViewCreateInstruction} from './instructions';

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

/**
* Represents a collection of resources used during the compilation of a view.
*/
export class ViewResources {
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
  registerViewEngineHooks(hooks:ViewEngineHooks): void {
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
}
