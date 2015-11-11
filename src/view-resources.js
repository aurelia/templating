import {relativeToFile} from 'aurelia-path';
import {HtmlBehaviorResource} from './html-behavior';
import {BindingLanguage} from './binding-language';
import {PLATFORM} from 'aurelia-pal';
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
    this.attributes = {};
    this.elements = {};
    this.valueConverters = {};
    this.bindingBehaviors = {};
    this.attributeMap = {};
    this.hook1 = null;
    this.hook2 = null;
    this.hook3 = null;
    this.additionalHooks = null;
  }

  _onBeforeCompile(content: DocumentFragment, resources: ViewResources, instruction: ViewCompileInstruction): void {
    if (this.hasParent) {
      this.parent._onBeforeCompile(content, resources, instruction);
    }

    if (this.hook1 !== null) {
      this.hook1.beforeCompile(content, resources, instruction);

      if (this.hook2 !== null) {
        this.hook2.beforeCompile(content, resources, instruction);

        if (this.hook3 !== null) {
          this.hook3.beforeCompile(content, resources, instruction);

          if (this.additionalHooks !== null) {
            let hooks = this.additionalHooks;
            for (let i = 0, length = hooks.length; i < length; ++i) {
              hooks[i].beforeCompile(content, resources, instruction);
            }
          }
        }
      }
    }
  }

  _onAfterCompile(viewFactory: ViewFactory): void {
    if (this.hasParent) {
      this.parent._onAfterCompile(viewFactory);
    }

    if (this.hook1 !== null) {
      this.hook1.afterCompile(viewFactory);

      if (this.hook2 !== null) {
        this.hook2.afterCompile(viewFactory);

        if (this.hook3 !== null) {
          this.hook3.afterCompile(viewFactory);

          if (this.additionalHooks !== null) {
            let hooks = this.additionalHooks;
            for (let i = 0, length = hooks.length; i < length; ++i) {
              hooks[i].afterCompile(viewFactory);
            }
          }
        }
      }
    }
  }

  _onBeforeCreate(viewFactory: ViewFactory, container: Container, content: DocumentFragment, instruction: ViewCreateInstruction, bindingContext?:Object): void {
    if (this.hasParent) {
      this.parent._onBeforeCreate(viewFactory, container, content, instruction, bindingContext);
    }

    if (this.hook1 !== null) {
      this.hook1.beforeCreate(viewFactory, container, content, instruction, bindingContext);

      if (this.hook2 !== null) {
        this.hook2.beforeCreate(viewFactory, container, content, instruction, bindingContext);

        if (this.hook3 !== null) {
          this.hook3.beforeCreate(viewFactory, container, content, instruction, bindingContext);

          if (this.additionalHooks !== null) {
            let hooks = this.additionalHooks;
            for (let i = 0, length = hooks.length; i < length; ++i) {
              hooks[i].beforeCreate(viewFactory, container, content, instruction, bindingContext);
            }
          }
        }
      }
    }
  }

  _onAfterCreate(view: View): void {
    if (this.hasParent) {
      this.parent._onAfterCreate(view);
    }

    if (this.hook1 !== null) {
      this.hook1.afterCreate(view);

      if (this.hook2 !== null) {
        this.hook2.afterCreate(view);

        if (this.hook3 !== null) {
          this.hook3.afterCreate(view);

          if (this.additionalHooks !== null) {
            let hooks = this.additionalHooks;
            for (let i = 0, length = hooks.length; i < length; ++i) {
              hooks[i].afterCreate(view);
            }
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
    if (hooks.beforeCompile === undefined) hooks.beforeCompile = PLATFORM.noop;
    if (hooks.afterCompile === undefined) hooks.afterCompile = PLATFORM.noop;
    if (hooks.beforeCreate === undefined) hooks.beforeCreate = PLATFORM.noop;
    if (hooks.afterCreate === undefined) hooks.afterCreate = PLATFORM.noop;

    if (this.hook1 === null) this.hook1 = hooks;
    else if (this.hook2 === null) this.hook2 = hooks;
    else if (this.hook3 === null) this.hook3 = hooks;
    else {
      if (this.additionalHooks === null) {
        this.additionalHooks = [];
      }

      this.additionalHooks.push(hooks);
    }
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
}
