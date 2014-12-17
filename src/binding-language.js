export class BindingLanguage {
  parseAttribute(resources, element, attrName, attrValue, existingInstruction){
    throw new Error('A BindingLanguage must implement parseAttribute(...)');
  }

  parseText(resources, value){
    throw new Error('A BindingLanguage must implement parseText(...)');
  }
}