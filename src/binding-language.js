export class BindingLanguage {
  inspectAttribute(resources, attrName, attrValue){
    throw new Error('A BindingLanguage must implement inspectAttribute(...)');
  }

  createAttributeInstruction(resources, element, info, existingInstruction){
    throw new Error('A BindingLanguage must implement createAttributeInstruction(...)');
  }

  parseText(resources, value){
    throw new Error('A BindingLanguage must implement parseText(...)');
  }
}