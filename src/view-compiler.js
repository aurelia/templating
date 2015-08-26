import {ViewResources} from './view-resources';
import {ViewFactory} from './view-factory';
import {BindingLanguage} from './binding-language';
import {ViewCompileInstruction} from './instructions';
import {createTemplateFromMarkup, hasShadowDOM} from './dom';
import {BehaviorInstruction, TargetInstruction} from './instructions';
import {inject} from 'aurelia-dependency-injection';

let nextInjectorId = 0;
function getNextInjectorId(){
  return ++nextInjectorId;
}

function configureProperties(instruction, resources){
  var type = instruction.type,
      attrName = instruction.attrName,
      attributes = instruction.attributes,
      property, key, value;

  var knownAttribute = resources.mapAttribute(attrName);
  if(knownAttribute && attrName in attributes && knownAttribute !== attrName){
    attributes[knownAttribute] = attributes[attrName];
    delete attributes[attrName];
  }

  for(key in attributes){
    value = attributes[key];

    if(value !== null && typeof value === 'object'){
      property = type.attributes[key];

      if(property !== undefined){
        value.targetProperty = property.name;
      }else{
        value.targetProperty = key;
      }
    }
  }
}

let lastAUTargetID = 0;
function getNextAUTargetID(){
  return (++lastAUTargetID).toString();
}

function makeIntoInstructionTarget(element){
  let value = element.getAttribute('class'),
      auTargetID = getNextAUTargetID();

  element.setAttribute('class', (value ? value += ' au-target' : 'au-target'));
  element.setAttribute('au-target-id', auTargetID);

  return auTargetID;
}

@inject(BindingLanguage, ViewResources)
export class ViewCompiler {
  constructor(bindingLanguage:BindingLanguage, resources:ViewResources){
    this.bindingLanguage = bindingLanguage;
    this.resources = resources;
  }

  compile(source: Element|DocumentFragment|string, resources?: ViewResources, compileInstruction?: ViewCompileInstruction): ViewFactory{
    resources = resources || this.resources;
    compileInstruction = compileInstruction || ViewCompileInstruction.normal;
    source = typeof source === 'string' ? createTemplateFromMarkup(source) : source;

    let content, part, cacheSize;

    if(source.content){
      part = source.getAttribute('part');
      cacheSize = source.getAttribute('view-cache');
      content = document.adoptNode(source.content, true);
    }else{
      content = source;
    }

    compileInstruction.targetShadowDOM = compileInstruction.targetShadowDOM && hasShadowDOM;
    resources.onBeforeCompile(content, resources, compileInstruction);

    let instructions = {};
    this.compileNode(content, resources, instructions, source, 'root', !compileInstruction.targetShadowDOM);
    content.insertBefore(document.createComment('<view>'), content.firstChild);
    content.appendChild(document.createComment('</view>'));

    let factory = new ViewFactory(content, instructions, resources);

    factory.surrogateInstruction = compileInstruction.compileSurrogate ? this.compileSurrogate(source, resources) : null;
    factory.part = part;

    if(cacheSize){
      factory.setCacheSize(cacheSize);
    }

    resources.onAfterCompile(factory);

    return factory;
  }

  compileNode(node, resources, instructions, parentNode, parentInjectorId, targetLightDOM){
    switch(node.nodeType){
      case 1: //element node
        return this.compileElement(node, resources, instructions, parentNode, parentInjectorId, targetLightDOM);
      case 3: //text node
        //use wholeText to retrieve the textContent of all adjacent text nodes.
        var expression = resources.getBindingLanguage(this.bindingLanguage).parseText(resources, node.wholeText);
        if(expression){
          let marker = document.createElement('au-marker'),
              auTargetID = makeIntoInstructionTarget(marker);
          (node.parentNode || parentNode).insertBefore(marker, node);
          node.textContent = ' ';
          instructions[auTargetID] = TargetInstruction.contentExpression(expression);
          //remove adjacent text nodes.
          while(node.nextSibling && node.nextSibling.nodeType === 3) {
            (node.parentNode || parentNode).removeChild(node.nextSibling);
          }
        } else {
          //skip parsing adjacent text nodes.
          while(node.nextSibling && node.nextSibling.nodeType === 3) {
            node = node.nextSibling;
          }
        }
        return node.nextSibling;
      case 11: //document fragment node
        var currentChild = node.firstChild;
        while (currentChild) {
          currentChild = this.compileNode(currentChild, resources, instructions, node, parentInjectorId, targetLightDOM);
        }
        break;
    }

    return node.nextSibling;
  }

  compileSurrogate(node, resources){
    let attributes = node.attributes,
        bindingLanguage = resources.getBindingLanguage(this.bindingLanguage),
        knownAttribute, property, instruction,
        i, ii, attr, attrName, attrValue, info, type,
        expressions = [], expression,
        behaviorInstructions = [],
        values = {}, hasValues = false,
        providers = [];

    for(i = 0, ii = attributes.length; i < ii; ++i){
      attr = attributes[i];
      attrName = attr.name;
      attrValue = attr.value;

      info = bindingLanguage.inspectAttribute(resources, attrName, attrValue);
      type = resources.getAttribute(info.attrName);

      if(type){ //do we have an attached behavior?
        knownAttribute = resources.mapAttribute(info.attrName); //map the local name to real name
        if(knownAttribute){
          property = type.attributes[knownAttribute];

          if(property){ //if there's a defined property
            info.defaultBindingMode = property.defaultBindingMode; //set the default binding mode

            if(!info.command && !info.expression){ // if there is no command or detected expression
              info.command = property.hasOptions ? 'options' : null; //and it is an optons property, set the options command
            }
          }
        }
      }

      instruction = bindingLanguage.createAttributeInstruction(resources, node, info);

      if(instruction){ //HAS BINDINGS
        if(instruction.alteredAttr){
          type = resources.getAttribute(instruction.attrName);
        }

        if(instruction.discrete){ //ref binding or listener binding
          expressions.push(instruction);
        }else{ //attribute bindings
          if(type){ //templator or attached behavior found
            instruction.type = type;
            configureProperties(instruction, resources);

            if(type.liftsContent){ //template controller
              throw new Error('You cannot place a template controller on a surrogate element.');
            }else{ //attached behavior
              behaviorInstructions.push(instruction);
            }
          } else{ //standard attribute binding
            expressions.push(instruction.attributes[instruction.attrName]);
          }
        }
      }else{ //NO BINDINGS
        if(type){ //templator or attached behavior found
          instruction = BehaviorInstruction.attribute(attrName, type);
          instruction.attributes[resources.mapAttribute(attrName)] = attrValue;

          if(type.liftsContent){ //template controller
            throw new Error('You cannot place a template controller on a surrogate element.');
          }else{ //attached behavior
            behaviorInstructions.push(instruction);
          }
        }else if(attrName !== 'id' && attrName !== 'part' && attrName !== 'replace-part'){
          hasValues = true;
          values[attrName] = attrValue;
        }
      }
    }

    if(expressions.length || behaviorInstructions.length || hasValues){
      for(i = 0, ii = behaviorInstructions.length; i < ii; ++i){
        instruction = behaviorInstructions[i];
        instruction.type.compile(this, resources, node, instruction);
        providers.push(instruction.type.target);
      }

      for(i = 0, ii = expressions.length; i < ii; ++i){
        expression =  expressions[i];
        if(expression.attrToRemove !== undefined){
          node.removeAttribute(expression.attrToRemove);
        }
      }

      return TargetInstruction.surrogate(providers, behaviorInstructions, expressions, values);
    }

    return null;
  }

  compileElement(node, resources, instructions, parentNode, parentInjectorId, targetLightDOM){
    var tagName = node.tagName.toLowerCase(),
        attributes = node.attributes,
        expressions = [], expression,
        behaviorInstructions = [],
        providers = [],
        bindingLanguage = resources.getBindingLanguage(this.bindingLanguage),
        liftingInstruction, viewFactory, type, elementInstruction,
        elementProperty, i, ii, attr, attrName, attrValue, instruction, info,
        property, knownAttribute, auTargetID, injectorId;

    if(tagName === 'content'){
      if(targetLightDOM){
        auTargetID = makeIntoInstructionTarget(node);
        instructions[auTargetID] = TargetInstruction.contentSelector(node, parentInjectorId);
      }
      return node.nextSibling;
    } else if(tagName === 'template'){
      viewFactory = this.compile(node, resources);
      viewFactory.part = node.getAttribute('part');
    } else{
      type = resources.getElement(tagName);
      if(type){
        elementInstruction = BehaviorInstruction.element(node, type);
        behaviorInstructions.push(elementInstruction);
      }
    }

    for(i = 0, ii = attributes.length; i < ii; ++i){
      attr = attributes[i];
      attrName = attr.name;
      attrValue = attr.value;
      info = bindingLanguage.inspectAttribute(resources, attrName, attrValue);
      type = resources.getAttribute(info.attrName);
      elementProperty = null;

      if(type){ //do we have an attached behavior?
        knownAttribute = resources.mapAttribute(info.attrName); //map the local name to real name
        if(knownAttribute){
          property = type.attributes[knownAttribute];

          if(property){ //if there's a defined property
            info.defaultBindingMode = property.defaultBindingMode; //set the default binding mode

            if(!info.command && !info.expression){ // if there is no command or detected expression
              info.command = property.hasOptions ? 'options' : null; //and it is an optons property, set the options command
            }
          }
        }
      }else if(elementInstruction){ //or if this is on a custom element
        elementProperty = elementInstruction.type.attributes[info.attrName];
        if(elementProperty){ //and this attribute is a custom property
          info.defaultBindingMode = elementProperty.defaultBindingMode; //set the default binding mode
        }
      }

      if(elementProperty){
        instruction = bindingLanguage.createAttributeInstruction(resources, node, info, elementInstruction);
      }else{
        instruction = bindingLanguage.createAttributeInstruction(resources, node, info);
      }

      if(instruction){ //HAS BINDINGS
        if(instruction.alteredAttr){
          type = resources.getAttribute(instruction.attrName);
        }

        if(instruction.discrete){ //ref binding or listener binding
          expressions.push(instruction);
        }else{ //attribute bindings
          if(type){ //templator or attached behavior found
            instruction.type = type;
            configureProperties(instruction, resources);

            if(type.liftsContent){ //template controller
              instruction.originalAttrName = attrName;
              liftingInstruction = instruction;
              break;
            }else{ //attached behavior
              behaviorInstructions.push(instruction);
            }
          }else if(elementProperty) { //custom element attribute
            elementInstruction.attributes[info.attrName].targetProperty = elementProperty.name;
          } else{ //standard attribute binding
            expressions.push(instruction.attributes[instruction.attrName]);
          }
        }
      }else{ //NO BINDINGS
        if(type){ //templator or attached behavior found
          instruction = BehaviorInstruction.attribute(attrName, type);
          instruction.attributes[resources.mapAttribute(attrName)] = attrValue;

          if(type.liftsContent){ //template controller
            instruction.originalAttrName = attrName;
            liftingInstruction = instruction;
            break;
          }else{ //attached behavior
            behaviorInstructions.push(instruction);
          }
        }else if(elementProperty){ //custom element attribute
          elementInstruction.attributes[attrName] = attrValue;
        }

        //else; normal attribute; do nothing
      }
    }

    if(liftingInstruction){
      liftingInstruction.viewFactory = viewFactory;
      node = liftingInstruction.type.compile(this, resources, node, liftingInstruction, parentNode);
      auTargetID = makeIntoInstructionTarget(node);
      instructions[auTargetID] = TargetInstruction.lifting(parentInjectorId, liftingInstruction);
    }else{
      if(expressions.length || behaviorInstructions.length){
        injectorId = behaviorInstructions.length ? getNextInjectorId() : false;

        for(i = 0, ii = behaviorInstructions.length; i < ii; ++i){
          instruction = behaviorInstructions[i];
          instruction.type.compile(this, resources, node, instruction, parentNode);
          providers.push(instruction.type.target);
        }

        for(i = 0, ii = expressions.length; i < ii; ++i){
          expression =  expressions[i];
          if(expression.attrToRemove !== undefined){
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

      if(elementInstruction && elementInstruction.skipContentProcessing){
        return node.nextSibling;
      }

      var currentChild = node.firstChild;
      while (currentChild) {
        currentChild = this.compileNode(currentChild, resources, instructions, node, injectorId || parentInjectorId, targetLightDOM);
      }
    }

    return node.nextSibling;
  }
}
