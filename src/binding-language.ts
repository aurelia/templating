/* eslint-disable @typescript-eslint/no-unused-vars */
import { Scope, Expression } from 'aurelia-binding';
import { HtmlBehaviorResource } from './html-behavior';
import { BehaviorInstruction } from './instructions';
import { ViewResources } from './view-resources';

function mi(name): never {
  throw new Error(`BindingLanguage must implement ${name}().`);
}

export interface LetExpression {
  createBinding(): LetBinding;
}

export interface LetBinding {
  source: Scope;
  isBound: boolean;
  /**
   * The expression to access/assign/connect the binding source property.
   */
  sourceExpression: Expression;
  /**
   * Assigns a value to the target.
   */
  updateTarget(value: any): void;
  /**
   * Connects the binding to a scope.
   */
  bind(source: Scope): void;
  /**
   * Disconnects the binding from a scope.
   */
  unbind(): void;
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
  * @param context HtmlBehaviorResource
  * @return The instruction instance.
  */
  createAttributeInstruction(resources: ViewResources, element: Element, info: Object, existingInstruction?: Object, context?: HtmlBehaviorResource): BehaviorInstruction {
    mi('createAttributeInstruction');
  }

  /**
   * Creates let expressions from a <let/> element
   * @param resources The ViewResources for the view being compiled
   * @param element the let element in the view template
   * @param existingExpressions the array that will hold compiled let expressions from the let element
   * @return the expression array created from the <let/> element
   */
  createLetExpressions(resources: ViewResources, element: Element): LetExpression[] {
    mi('createLetExpressions');
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
