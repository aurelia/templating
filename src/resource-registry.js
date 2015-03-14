import {relativeToFile} from 'aurelia-path';

function register(lookup, name, resource, type){
  if(!name){
    return;
  }

  var existing = lookup[name];
  if(existing){
    if(existing != resource) {
      throw new Error(`Attempted to register ${type} when one with the same name already exists. Name: ${name}.`);
    }

    return;
  }

  lookup[name] = resource;
}

export class ResourceRegistry {
  constructor(){
    this.attributes = {};
    this.elements = {};
    this.valueConverters = {};
    this.attributeMap = {};
    this.baseResourceUrl = '';
  }

  registerElement(tagName, behavior){
    register(this.elements, tagName, behavior, 'an Element');
  }

  getElement(tagName){
    return this.elements[tagName];
  }

  registerAttribute(attribute, behavior, knownAttribute){
    this.attributeMap[attribute] = knownAttribute;
    register(this.attributes, attribute, behavior, 'an Attribute');
  }

  getAttribute(attribute){
    return this.attributes[attribute];
  }

  registerValueConverter(name, valueConverter){
    register(this.valueConverters, name, valueConverter, 'a ValueConverter');
  }

  getValueConverter(name){
    return this.valueConverters[name];
  }
}

export class ViewResources extends ResourceRegistry {
  constructor(parent, viewUrl){
    super();
    this.parent = parent;
    this.viewUrl = viewUrl;
    this.valueConverterLookupFunction = this.getValueConverter.bind(this);
  }

  relativeToView(path){
    return relativeToFile(path, this.viewUrl);
  }

  getElement(tagName){
    return this.elements[tagName] || this.parent.getElement(tagName);
  }

  mapAttribute(attribute){
    return this.attributeMap[attribute] || this.parent.attributeMap[attribute];
  }

  getAttribute(attribute){
    return this.attributes[attribute] || this.parent.getAttribute(attribute);
  }

  getValueConverter(name){
    return this.valueConverters[name] ||  this.parent.getValueConverter(name);
  }
}
