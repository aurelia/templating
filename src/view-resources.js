import {relativeToFile} from 'aurelia-path';
import {HtmlBehaviorResource} from './html-behavior';
import {ValueConverter} from 'aurelia-binding';
import {BindingLanguage} from './binding-language';
import {Metadata} from 'aurelia-metadata';
import {ViewCompileInstruction, ViewCreateInstruction} from './instructions';

function register(lookup, name, resource, type){
  if(!name){
    return;
  }

  var existing = lookup[name];
  if(existing){
    if(existing !== resource) {
      throw new Error(`Attempted to register ${type} when one with the same name already exists. Name: ${name}.`);
    }

    return;
  }

  lookup[name] = resource;
}

interface ViewEngineHooks {
  beforeCompile?: (content: DocumentFragment, resources: ViewResources, instruction: ViewCompileInstruction) => void;
  afterCompile?: (viewFactory: ViewFactory) => void;
  beforeCreate?: (viewFactory: ViewFactory, container: Container, content: DocumentFragment, instruction: ViewCreateInstruction, bindingContext?:Object) => void;
  afterCreate?: (view: View) => void;
}

export class ViewResources {
  constructor(parent?:ViewResources, viewUrl?:string){
    this.parent = parent || null;
    this.hasParent = this.parent !== null;
    this.viewUrl = viewUrl || '';
    this.valueConverterLookupFunction = this.getValueConverter.bind(this);
    this.attributes = {};
    this.elements = {};
    this.valueConverters = {};
    this.attributeMap = {};
    this.bindingLanguage = null;
    this.hook1 = null;
    this.hook2 = null;
    this.hook3 = null;
    this.additionalHooks = null;
  }

  onBeforeCompile(content: DocumentFragment, resources: ViewResources, instruction: ViewCompileInstruction): void {
    if(this.hasParent){
      this.parent.onBeforeCompile(content, resources, instruction);
    }

    if(this.hook1 !== null){
      this.hook1.beforeCompile(content, resources, instruction);

      if(this.hook2 !== null){
        this.hook2.beforeCompile(content, resources, instruction);

        if(this.hook3 !== null){
          this.hook3.beforeCompile(content, resources, instruction);

          if(this.additionalHooks !== null){
            let hooks = this.additionalHooks;
            for(let i = 0, length = hooks.length; i < length; ++i){
              hooks[i].beforeCompile(content, resources, instruction);
            }
          }
        }
      }
    }
  }

  onAfterCompile(viewFactory: ViewFactory): void {
    if(this.hasParent){
      this.parent.onAfterCompile(viewFactory);
    }

    if(this.hook1 !== null){
      this.hook1.afterCompile(viewFactory);

      if(this.hook2 !== null){
        this.hook2.afterCompile(viewFactory);

        if(this.hook3 !== null){
          this.hook3.afterCompile(viewFactory);

          if(this.additionalHooks !== null){
            let hooks = this.additionalHooks;
            for(let i = 0, length = hooks.length; i < length; ++i){
              hooks[i].afterCompile(viewFactory);
            }
          }
        }
      }
    }
  }

  onBeforeCreate(viewFactory: ViewFactory, container: Container, content: DocumentFragment, instruction: ViewCreateInstruction, bindingContext?:Object): void {
    if(this.hasParent){
      this.parent.onBeforeCreate(viewFactory, container, content, instruction, bindingContext);
    }

    if(this.hook1 !== null){
      this.hook1.beforeCreate(viewFactory, container, content, instruction, bindingContext);

      if(this.hook2 !== null){
        this.hook2.beforeCreate(viewFactory, container, content, instruction, bindingContext);

        if(this.hook3 !== null){
          this.hook3.beforeCreate(viewFactory, container, content, instruction, bindingContext);

          if(this.additionalHooks !== null){
            let hooks = this.additionalHooks;
            for(let i = 0, length = hooks.length; i < length; ++i){
              hooks[i].beforeCreate(viewFactory, container, content, instruction, bindingContext);
            }
          }
        }
      }
    }
  }

  onAfterCreate(view: View): void {
    if(this.hasParent){
      this.parent.onAfterCreate(view);
    }

    if(this.hook1 !== null){
      this.hook1.afterCreate(view);

      if(this.hook2 !== null){
        this.hook2.afterCreate(view);

        if(this.hook3 !== null){
          this.hook3.afterCreate(view);

          if(this.additionalHooks !== null){
            let hooks = this.additionalHooks;
            for(let i = 0, length = hooks.length; i < length; ++i){
              hooks[i].afterCreate(view);
            }
          }
        }
      }
    }
  }

  registerViewEngineHooks(hooks:ViewEngineHooks): void {
    if(hooks.beforeCompile === undefined) hooks.beforeCompile = Metadata.noop;
    if(hooks.afterCompile === undefined) hooks.afterCompile = Metadata.noop;
    if(hooks.beforeCreate === undefined) hooks.beforeCreate = Metadata.noop;
    if(hooks.afterCreate === undefined) hooks.afterCreate = Metadata.noop;

    if(this.hook1 === null) this.hook1 = hooks;
    else if(this.hook2 === null) this.hook2 = hooks;
    else if(this.hook3 === null) this.hook3 = hooks;
    else {
      if(this.additionalHooks === null){
        this.additionalHooks = [];
      }

      this.additionalHooks.push(hooks);
    }
  }

  getBindingLanguage(bindingLanguageFallback: BindingLanguage): BindingLanguage {
    return this.bindingLanguage || (this.bindingLanguage = bindingLanguageFallback);
  }

  patchInParent(newParent:ViewResources): void {
    let originalParent = this.parent;

    this.parent = newParent || null;
    this.hasParent = this.parent !== null;

    if(newParent.parent === null){
      newParent.parent = originalParent;
      newParent.hasParent = originalParent !== null;
    }
  }

  relativeToView(path:string): string {
    return relativeToFile(path, this.viewUrl);
  }

  registerElement(tagName:string, behavior:HtmlBehaviorResource): void {
    register(this.elements, tagName, behavior, 'an Element');
  }

  getElement(tagName:string): HtmlBehaviorResource {
    return this.elements[tagName] || (this.hasParent ? this.parent.getElement(tagName) : null);
  }

  mapAttribute(attribute:string): string{
    return this.attributeMap[attribute] || (this.hasParent ? this.parent.mapAttribute(attribute) : null);
  }

  registerAttribute(attribute:string, behavior:HtmlBehaviorResource, knownAttribute:string): void {
    this.attributeMap[attribute] = knownAttribute;
    register(this.attributes, attribute, behavior, 'an Attribute');
  }

  getAttribute(attribute:string): HtmlBehaviorResource {
    return this.attributes[attribute] || (this.hasParent ? this.parent.getAttribute(attribute) : null);
  }

  registerValueConverter(name:string, valueConverter:ValueConverter): void {
    register(this.valueConverters, name, valueConverter, 'a ValueConverter');
  }

  getValueConverter(name:string): ValueConverter {
    return this.valueConverters[name] || (this.hasParent ? this.parent.getValueConverter(name) : null);
  }
}
