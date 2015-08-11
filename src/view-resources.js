import {relativeToFile} from 'aurelia-path';
import {HtmlBehaviorResource} from './html-behavior';
import {ValueConverter} from 'aurelia-binding';

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
    this.baseResourceUrl = '';
    this.bindingLanguage = null;
  }

  getBindingLanguage(bindingLanguageFallback){
    return this.bindingLanguage || (this.bindingLanguage = bindingLanguageFallback);
  }

  patchInParent(newParent:ViewResources):void{
    let originalParent = this.parent;

    this.parent = newParent || null;
    this.hasParent = this.parent !== null;

    if(newParent.parent === null){
      newParent.parent = originalParent;
      newParent.hasParent = originalParent !== null;
    }
  }

  relativeToView(path:string):string{
    return relativeToFile(path, this.viewUrl);
  }

  registerElement(tagName:string, behavior:HtmlBehaviorResource):void{
    register(this.elements, tagName, behavior, 'an Element');
  }

  getElement(tagName:string):HtmlBehaviorResource{
    return this.elements[tagName] || (this.hasParent ? this.parent.getElement(tagName) : null);
  }

  mapAttribute(attribute:string):string{
    return this.attributeMap[attribute] || (this.hasParent ? this.parent.mapAttribute(attribute) : null);
  }

  registerAttribute(attribute:string, behavior:HtmlBehaviorResource, knownAttribute:string):void{
    this.attributeMap[attribute] = knownAttribute;
    register(this.attributes, attribute, behavior, 'an Attribute');
  }

  getAttribute(attribute:string):HtmlBehaviorResource{
    return this.attributes[attribute] || (this.hasParent ? this.parent.getAttribute(attribute) : null);
  }

  registerValueConverter(name:string, valueConverter:ValueConverter):void{
    register(this.valueConverters, name, valueConverter, 'a ValueConverter');
  }

  getValueConverter(name:string):ValueConverter{
    return this.valueConverters[name] || (this.hasParent ? this.parent.getValueConverter(name) : null);
  }
}
