import {ViewResources} from './view-resources';
import {ViewFactory} from './view-factory';
import {BindingLanguage} from './binding-language';
import {ViewCompileInstruction, BehaviorInstruction, TargetInstruction} from './instructions';
import {inject} from 'aurelia-dependency-injection';
import {DOM, FEATURE} from 'aurelia-pal';
import {ShadowDOM} from './shadow-dom';

let nextInjectorId = 0;
function getNextInjectorId() {
  return ++nextInjectorId;
}

let lastAUTargetID = 0;
function getNextAUTargetID() {
  return (++lastAUTargetID).toString();
}

function makeIntoInstructionTarget(element) {
  let value = element.getAttribute('class');
  let auTargetID = getNextAUTargetID();

  element.setAttribute('class', (value ? value + ' au-target' : 'au-target'));
  element.setAttribute('au-target-id', auTargetID);

  return auTargetID;
}

function makeShadowSlot(compiler, resources, node, instructions, parentInjectorId) {
  let auShadowSlot = DOM.createElement('au-shadow-slot');
  DOM.replaceNode(auShadowSlot, node);

  let auTargetID = makeIntoInstructionTarget(auShadowSlot);
  let instruction = TargetInstruction.shadowSlot(parentInjectorId);

  instruction.slotName = node.getAttribute('name') || ShadowDOM.defaultSlotKey;
  instruction.slotDestination = node.getAttribute('slot');

  if (node.innerHTML.trim()) {
    let fragment = DOM.createDocumentFragment();
    let child;

    while (child = node.firstChild) {
      fragment.appendChild(child);
    }

    instruction.slotFallbackFactory = compiler.compile(fragment, resources);
  }

  instructions[auTargetID] = instruction;

  return auShadowSlot;
}

const defaultLetHandler = BindingLanguage.prototype.createLetExpressions;

/**
* Compiles html templates, dom fragments and strings into ViewFactory instances, capable of instantiating Views.
*/
@inject(BindingLanguage, ViewResources)
export class ViewCompiler {
  /**
  * Creates an instance of ViewCompiler.
  * @param bindingLanguage The default data binding language and syntax used during view compilation.
  * @param resources The global resources used during compilation when none are provided for compilation.
  */
  constructor(bindingLanguage: BindingLanguage, resources: ViewResources) {
    this.bindingLanguage = bindingLanguage;
    this.resources = resources;
  }

  /**
  * Compiles an html template, dom fragment or string into ViewFactory instances, capable of instantiating Views.
  * @param source The template, fragment or string to compile.
  * @param resources The view resources used during compilation.
  * @param compileInstruction A set of instructions that customize how compilation occurs.
  * @return The compiled ViewFactory.
  */
  compile(source: Element|DocumentFragment|string, resources?: ViewResources, compileInstruction?: ViewCompileInstruction): ViewFactory {
    resources = resources || this.resources;
    compileInstruction = compileInstruction || ViewCompileInstruction.normal;
    source = typeof source === 'string' ? DOM.createTemplateFromMarkup(source) : source;

    let content;
    let part;
    let cacheSize;

    if (source.content) {
      part = source.getAttribute('part');
      cacheSize = source.getAttribute('view-cache');
      content = DOM.adoptNode(source.content);
    } else {
      content = source;
    }

    compileInstruction.targetShadowDOM = compileInstruction.targetShadowDOM && FEATURE.shadowDOM;
    resources._invokeHook('beforeCompile', content, resources, compileInstruction);

    let instructions = {};
    this._compileNode(content, resources, instructions, source, 'root', !compileInstruction.targetShadowDOM);

    let firstChild = content.firstChild;
    if (firstChild && firstChild.nodeType === 1) {
      let targetId = firstChild.getAttribute('au-target-id');
      if (targetId) {
        let ins = instructions[targetId];

        if (ins.shadowSlot || ins.lifting || (ins.elementInstruction && !ins.elementInstruction.anchorIsContainer)) {
          content.insertBefore(DOM.createComment('view'), firstChild);
        }
      }
    }

    let factory = new ViewFactory(content, instructions, resources);

    factory.surrogateInstruction = compileInstruction.compileSurrogate ? this._compileSurrogate(source, resources) : null;
    factory.part = part;

    if (cacheSize) {
      factory.setCacheSize(cacheSize);
    }

    resources._invokeHook('afterCompile', factory);

    return factory;
  }

  _compileNode(node, resources, instructions, parentNode, parentInjectorId, targetLightDOM) {
    switch (node.nodeType) {
    case 1: //element node
      return this._compileElement(node, resources, instructions, parentNode, parentInjectorId, targetLightDOM);
    case 3: //text node
      //use wholeText to retrieve the textContent of all adjacent text nodes.
      let expression = resources.getBindingLanguage(this.bindingLanguage).inspectTextContent(resources, node.wholeText);
      if (expression) {
        let marker = DOM.createElement('au-marker');
        let auTargetID = makeIntoInstructionTarget(marker);
        (node.parentNode || parentNode).insertBefore(marker, node);
        node.textContent = ' ';
        instructions[auTargetID] = TargetInstruction.contentExpression(expression);
        //remove adjacent text nodes.
        while (node.nextSibling && node.nextSibling.nodeType === 3) {
          (node.parentNode || parentNode).removeChild(node.nextSibling);
        }
      } else {
        //skip parsing adjacent text nodes.
        while (node.nextSibling && node.nextSibling.nodeType === 3) {
          node = node.nextSibling;
        }
      }
      return node.nextSibling;
    case 11: //document fragment node
      let currentChild = node.firstChild;
      while (currentChild) {
        currentChild = this._compileNode(currentChild, resources, instructions, node, parentInjectorId, targetLightDOM);
      }
      break;
    default:
      break;
    }

    return node.nextSibling;
  }

  _compileSurrogate(node, resources) {
    let tagName = node.tagName.toLowerCase();
    let attributes = node.attributes;
    let bindingLanguage = resources.getBindingLanguage(this.bindingLanguage);
    let knownAttribute;
    let property;
    let instruction;
    let i;
    let ii;
    let attr;
    let attrName;
    let attrValue;
    let info;
    let type;
    let expressions = [];
    let expression;
    let behaviorInstructions = [];
    let values = {};
    let hasValues = false;
    let providers = [];

    for (i = 0, ii = attributes.length; i < ii; ++i) {
      attr = attributes[i];
      attrName = attr.name;
      attrValue = attr.value;

      info = bindingLanguage.inspectAttribute(resources, tagName, attrName, attrValue);
      type = resources.getAttribute(info.attrName);

      if (type) { //do we have an attached behavior?
        knownAttribute = resources.mapAttribute(info.attrName); //map the local name to real name
        if (knownAttribute) {
          property = type.attributes[knownAttribute];

          if (property) { //if there's a defined property
            info.defaultBindingMode = property.defaultBindingMode; //set the default binding mode

            if (!info.command && !info.expression) { // if there is no command or detected expression
              info.command = property.hasOptions ? 'options' : null; //and it is an optons property, set the options command
            }

            // if the attribute itself is bound to a default attribute value then we have to
            // associate the attribute value with the name of the default bindable property
            // (otherwise it will remain associated with "value")
            if (info.command && (info.command !== 'options') && type.primaryProperty) {
              const primaryProperty = type.primaryProperty;
              attrName = info.attrName = primaryProperty.attribute;
              // note that the defaultBindingMode always overrides the attribute bindingMode which is only used for "single-value" custom attributes
              // when using the syntax `<div square.bind="color"></div>`
              info.defaultBindingMode = primaryProperty.defaultBindingMode;
            }
          }
        }
      }

      instruction = bindingLanguage.createAttributeInstruction(resources, node, info, undefined, type);

      if (instruction) { //HAS BINDINGS
        if (instruction.alteredAttr) {
          type = resources.getAttribute(instruction.attrName);
        }

        if (instruction.discrete) { //ref binding or listener binding
          expressions.push(instruction);
        } else { //attribute bindings
          if (type) { //templator or attached behavior found
            instruction.type = type;
            this._configureProperties(instruction, resources);

            if (type.liftsContent) { //template controller
              throw new Error('You cannot place a template controller on a surrogate element.');
            } else { //attached behavior
              behaviorInstructions.push(instruction);
            }
          } else { //standard attribute binding
            expressions.push(instruction.attributes[instruction.attrName]);
          }
        }
      } else { //NO BINDINGS
        if (type) { //templator or attached behavior found
          instruction = BehaviorInstruction.attribute(attrName, type);
          instruction.attributes[resources.mapAttribute(attrName)] = attrValue;

          if (type.liftsContent) { //template controller
            throw new Error('You cannot place a template controller on a surrogate element.');
          } else { //attached behavior
            behaviorInstructions.push(instruction);
          }
        } else if (attrName !== 'id' && attrName !== 'part' && attrName !== 'replace-part') {
          hasValues = true;
          values[attrName] = attrValue;
        }
      }
    }

    if (expressions.length || behaviorInstructions.length || hasValues) {
      for (i = 0, ii = behaviorInstructions.length; i < ii; ++i) {
        instruction = behaviorInstructions[i];
        instruction.type.compile(this, resources, node, instruction);
        providers.push(instruction.type.target);
      }

      for (i = 0, ii = expressions.length; i < ii; ++i) {
        expression =  expressions[i];
        if (expression.attrToRemove !== undefined) {
          node.removeAttribute(expression.attrToRemove);
        }
      }

      return TargetInstruction.surrogate(providers, behaviorInstructions, expressions, values);
    }

    return null;
  }

  _compileElement(node: Node, resources: ViewResources, instructions: any, parentNode: Node, parentInjectorId: number, targetLightDOM: boolean) {
    let tagName = node.tagName.toLowerCase();
    let attributes = node.attributes;
    let expressions = [];
    let expression;
    let behaviorInstructions = [];
    let providers = [];
    let bindingLanguage = resources.getBindingLanguage(this.bindingLanguage);
    let liftingInstruction;
    let viewFactory;
    let type;
    let elementInstruction;
    let elementProperty;
    let i;
    let ii;
    let attr;
    let attrName;
    let attrValue;
    let originalAttrName;
    let instruction;
    let info;
    let property;
    let knownAttribute;
    let auTargetID;
    let injectorId;

    if (tagName === 'slot') {
      if (targetLightDOM) {
        node = makeShadowSlot(this, resources, node, instructions, parentInjectorId);
      }
      return node.nextSibling;
    } else if (tagName === 'template') {
      if (!('content' in node)) {
        throw new Error('You cannot place a template element within ' + node.namespaceURI + ' namespace');
      }
      viewFactory = this.compile(node, resources);
      viewFactory.part = node.getAttribute('part');
    } else {
      type = resources.getElement(node.getAttribute('as-element') || tagName);
      // Only attempt to process a <let/> when it's not a custom element,
      // and the binding language has an implementation for it
      // This is an backward compat move
      if (tagName === 'let' && !type && bindingLanguage.createLetExpressions !== defaultLetHandler) {
        expressions = bindingLanguage.createLetExpressions(resources, node);
        auTargetID = makeIntoInstructionTarget(node);
        instructions[auTargetID] = TargetInstruction.letElement(expressions);
        return node.nextSibling;
      }
      if (type) {
        elementInstruction = BehaviorInstruction.element(node, type);
        type.processAttributes(this, resources, node, attributes, elementInstruction);
        behaviorInstructions.push(elementInstruction);
      }
    }

    for (i = 0, ii = attributes.length; i < ii; ++i) {
      attr = attributes[i];
      originalAttrName = attrName = attr.name;
      attrValue = attr.value;
      info = bindingLanguage.inspectAttribute(resources, tagName, attrName, attrValue);

      if (targetLightDOM && info.attrName === 'slot') {
        info.attrName = attrName = 'au-slot';
      }

      type = resources.getAttribute(info.attrName);
      elementProperty = null;

      if (type) { //do we have an attached behavior?
        knownAttribute = resources.mapAttribute(info.attrName); //map the local name to real name
        if (knownAttribute) {
          property = type.attributes[knownAttribute];

          if (property) { //if there's a defined property
            info.defaultBindingMode = property.defaultBindingMode; //set the default binding mode

            if (!info.command && !info.expression) { // if there is no command or detected expression
              info.command = property.hasOptions ? 'options' : null; //and it is an optons property, set the options command
            }

            // if the attribute itself is bound to a default attribute value then we have to
            // associate the attribute value with the name of the default bindable property
            // (otherwise it will remain associated with "value")
            if (info.command && (info.command !== 'options') && type.primaryProperty) {
              const primaryProperty = type.primaryProperty;
              attrName = info.attrName = primaryProperty.attribute;
              // note that the defaultBindingMode always overrides the attribute bindingMode which is only used for "single-value" custom attributes
              // when using the syntax `<div square.bind="color"></div>`
              info.defaultBindingMode = primaryProperty.defaultBindingMode;
            }
          }
        }
      } else if (elementInstruction) { //or if this is on a custom element
        elementProperty = elementInstruction.type.attributes[info.attrName];
        if (elementProperty) { //and this attribute is a custom property
          info.defaultBindingMode = elementProperty.defaultBindingMode; //set the default binding mode
        }
      }

      if (elementProperty) {
        instruction = bindingLanguage.createAttributeInstruction(resources, node, info, elementInstruction);
      } else {
        instruction = bindingLanguage.createAttributeInstruction(resources, node, info, undefined, type);
      }

      if (instruction) { //HAS BINDINGS
        if (instruction.alteredAttr) {
          type = resources.getAttribute(instruction.attrName);
        }

        if (instruction.discrete) { //ref binding or listener binding
          expressions.push(instruction);
        } else { //attribute bindings
          if (type) { //templator or attached behavior found
            instruction.type = type;
            this._configureProperties(instruction, resources);

            if (type.liftsContent) { //template controller
              instruction.originalAttrName = originalAttrName;
              liftingInstruction = instruction;
              break;
            } else { //attached behavior
              behaviorInstructions.push(instruction);
            }
          } else if (elementProperty) { //custom element attribute
            elementInstruction.attributes[info.attrName].targetProperty = elementProperty.name;
          } else { //standard attribute binding
            expressions.push(instruction.attributes[instruction.attrName]);
          }
        }
      } else { //NO BINDINGS
        if (type) { //templator or attached behavior found
          instruction = BehaviorInstruction.attribute(attrName, type);
          instruction.attributes[resources.mapAttribute(attrName)] = attrValue;

          if (type.liftsContent) { //template controller
            instruction.originalAttrName = originalAttrName;
            liftingInstruction = instruction;
            break;
          } else { //attached behavior
            behaviorInstructions.push(instruction);
          }
        } else if (elementProperty) { //custom element attribute
          elementInstruction.attributes[attrName] = attrValue;
        }

        //else; normal attribute; do nothing
      }
    }

    if (liftingInstruction) {
      liftingInstruction.viewFactory = viewFactory;
      node = liftingInstruction.type.compile(this, resources, node, liftingInstruction, parentNode);
      auTargetID = makeIntoInstructionTarget(node);
      instructions[auTargetID] = TargetInstruction.lifting(parentInjectorId, liftingInstruction);
    } else {
      let skipContentProcessing = false;

      if (expressions.length || behaviorInstructions.length) {
        injectorId = behaviorInstructions.length ? getNextInjectorId() : false;

        for (i = 0, ii = behaviorInstructions.length; i < ii; ++i) {
          instruction = behaviorInstructions[i];
          instruction.type.compile(this, resources, node, instruction, parentNode);
          providers.push(instruction.type.target);
          skipContentProcessing = skipContentProcessing || instruction.skipContentProcessing;
        }

        for (i = 0, ii = expressions.length; i < ii; ++i) {
          expression =  expressions[i];
          if (expression.attrToRemove !== undefined) {
            node.removeAttribute(expression.attrToRemove);
          }
        }

        auTargetID = makeIntoInstructionTarget(node);
        instructions[auTargetID] = TargetInstruction.normal(
          injectorId,
          parentInjectorId,
          providers,
          behaviorInstructions,
          expressions,
          elementInstruction
        );
      }

      if (skipContentProcessing) {
        return node.nextSibling;
      }

      let currentChild = node.firstChild;
      while (currentChild) {
        currentChild = this._compileNode(currentChild, resources, instructions, node, injectorId || parentInjectorId, targetLightDOM);
      }
    }

    return node.nextSibling;
  }

  _configureProperties(instruction, resources) {
    let type = instruction.type;
    let attrName = instruction.attrName;
    let attributes = instruction.attributes;
    let property;
    let key;
    let value;

    let knownAttribute = resources.mapAttribute(attrName);
    if (knownAttribute && attrName in attributes && knownAttribute !== attrName) {
      attributes[knownAttribute] = attributes[attrName];
      delete attributes[attrName];
    }

    for (key in attributes) {
      value = attributes[key];

      if (value !== null && typeof value === 'object') {
        property = type.attributes[key];

        if (property !== undefined) {
          value.targetProperty = property.name;
        } else {
          value.targetProperty = key;
        }
      }
    }
  }
}
