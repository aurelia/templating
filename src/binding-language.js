function mi(name) {
  throw new Error(`BindingLanguage must implement ${name}().`);
}

/**
* An abstract base class for implementations of a binding language.
*/
export class BindingLanguage {
  /**
  * Inspects an attribute for bindings.
  * @param resources The ViewResources for the view being compiled.
  * @param elementName The element name to inspect.
  * @param attrName The attribute name to inspect.
  * @param attrValue The attribute value to inspect.
  * @return An info object with the results of the inspection.
  */
  inspectAttribute(resources: ViewResources, elementName: string, attrName: string, attrValue: string): Object {
    mi('inspectAttribute');
  }

  /**
  * Creates an attribute behavior instruction.
  * @param resources The ViewResources for the view being compiled.
  * @param element The element that the attribute is defined on.
  * @param info The info object previously returned from inspectAttribute.
  * @param existingInstruction A previously created instruction for this attribute.
  * @return The instruction instance.
  */
  createAttributeInstruction(resources: ViewResources, element: Element, info: Object, existingInstruction?: Object): BehaviorInstruction {
    mi('createAttributeInstruction');
  }

  /**
  * Parses the text for bindings.
  * @param resources The ViewResources for the view being compiled.
  * @param value The value of the text to parse.
  * @return A binding expression.
  */
  inspectTextContent(resources: ViewResources, value: string): Object {
    mi('inspectTextContent');
  }
}
