import {ResourceRegistry} from './resource-registry';
import {ViewFactory} from './view-factory';
import {BindingLanguage} from './binding-language';

var nextInjectorId = 0,
    defaultCompileOptions = { targetShadowDOM:false },
    hasShadowDOM = !!HTMLElement.prototype.createShadowRoot;

function getNextInjectorId(){
  return (++nextInjectorId).toString();
}

function configureProperties(instruction){
  var type = instruction.type,
      attributes = instruction.attributes,
      property, key, value;

  for(key in attributes){
    value = attributes[key];

    if(typeof value !== 'string'){
      property = type.getPropertyForAttribute(key);
      value.targetProperty = property.name;
    }
  }
}

export class ViewCompiler {
  static inject() { return [BindingLanguage]; }
  constructor(bindingLanguage){
    this.bindingLanguage = bindingLanguage;
  }

  compile(templateOrFragment, resources, options=defaultCompileOptions){
    var instructions = [],
        targetShadowDOM = options.targetShadowDOM,
        content;

    targetShadowDOM = targetShadowDOM && hasShadowDOM;

    if(templateOrFragment.content){
      content = document.adoptNode(templateOrFragment.content, true);
    }else{
      content = templateOrFragment;
    }

    this.compileNode(content, resources, instructions, templateOrFragment, 'root', !targetShadowDOM);

    content.insertBefore(document.createComment('<view>'), content.firstChild);
    content.appendChild(document.createComment('</view>'));

    return new ViewFactory(content, instructions);
  }

  compileNode(node, resources, instructions, parentNode, parentInjectorId, targetLightDOM){
    switch(node.nodeType){
      case 1: //element node
        return this.compileElement(node, resources, instructions, parentNode, parentInjectorId, targetLightDOM);
      case 3: //text node
        var expression =  this.bindingLanguage.parseText(resources, node.textContent);
        if(expression){
          var marker = document.createElement('ai-marker');
          marker.className = 'ai-target';
          node.parentNode.insertBefore(marker, node);
          node.textContent = ' ';
          instructions.push({ contentExpression:expression });
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

  compileElement(node, resources, instructions, parentNode, parentInjectorId, targetLightDOM){
    var tagName = node.tagName.toLowerCase(),
        attributes = node.attributes, 
        expressions = [], 
        behaviorInstructions = [],
        providers = [],
        bindingLanguage = this.bindingLanguage,
        liftingInstruction, viewFactory, type, elementInstruction, 
        elementProperty, i, ii, attr, attrName, attrValue, instruction;

    if(tagName === 'content'){
      if(targetLightDOM){
        instructions.push({ 
          parentInjectorId: parentInjectorId,
          contentSelector: true, 
          selector:node.getAttribute('select'),
          suppressBind: true 
        });
        node.setAttribute('class', node.getAttribute('class') + ' ' + 'ai-target');
      }
      return node.nextSibling;
    } else if(tagName === 'template'){
      viewFactory = this.compile(node, resources);
    } else{
      type = resources.getElement(tagName);
      if(type){
        elementInstruction = {type:type, attributes:{}};
        behaviorInstructions.push(elementInstruction);
      }
    }

    for(i = 0, ii = attributes.length; i < ii; ++i){
      attr = attributes[i]; 
      attrName = attr.name;
      attrValue = attr.value;
      instruction = bindingLanguage.parseAttribute(resources, node, attrName, attrValue);

      if(instruction){ //HAS BINDINGS
        if(instruction.discrete){ //ref binding or listener binding
          expressions.push(instruction);
        }else{ //attribute bindings
          type = resources.getAttribute(instruction.attrName);

          if(type){ //templator or attached behavior found
            instruction.type = type;
            configureProperties(instruction);

            if(type.liftsContent){ //template controller
              liftingInstruction = instruction;
              break;
            }else{ //attached behavior
              behaviorInstructions.push(instruction);
            }
          }else if(elementInstruction && (elementProperty = elementInstruction.type.getPropertyForAttribute(instruction.attrName))) { //custom element attribute
            elementInstruction.attributes[instruction.attrName] = instruction.attributes[instruction.attrName];
            elementInstruction.attributes[instruction.attrName].targetProperty = elementProperty.name;
          } else{ //standard attribute binding
            expressions.push(instruction.attributes[instruction.attrName]);
          }
        }
      }else{ //NO BINDINGS
        type = resources.getAttribute(attrName);
        if(type){ //templator or attached behavior found
          instruction = { attrName:attrName, type:type, attributes:{} };
          instruction.attributes[attrName] = attrValue;

          if(type.liftsContent){ //template controller
            liftingInstruction = instruction;
            break;
          }else{ //attached behavior
            behaviorInstructions.push(instruction);
          }
        }else if(elementInstruction && elementInstruction.type.getPropertyForAttribute(attrName)){ //custom element attribute
          elementInstruction.attributes[attrName] = attrValue;
        }else{ //normal attribute
          //do nothing
        }
      }
    }

    if(liftingInstruction){
      liftingInstruction.viewFactory = viewFactory;
      node = liftingInstruction.type.compile(this, resources, node, liftingInstruction, parentNode);
      node.setAttribute('class', node.getAttribute('class') + ' ' + 'ai-target');
      instructions.push({
        anchorIsContainer: false,
        parentInjectorId: parentInjectorId,
        expressions: [], 
        behaviorInstructions: [liftingInstruction],
        viewFactory: liftingInstruction.viewFactory,
        providers: [liftingInstruction.type.target]
      });
    }else{
      for(i = 0, ii = behaviorInstructions.length; i < ii; ++i){
        instruction = behaviorInstructions[i];
        instruction.type.compile(this, resources, node, instruction, parentNode);
        providers.push(instruction.type.target);
      }

      var injectorId = behaviorInstructions.length ? getNextInjectorId() : false;

      if(expressions.length || behaviorInstructions.length){
        node.setAttribute('class', node.getAttribute('class') + ' ' + 'ai-target');
        instructions.push({
          anchorIsContainer: true,
          injectorId: injectorId,
          parentInjectorId: parentInjectorId,
          expressions: expressions, 
          behaviorInstructions: behaviorInstructions,
          providers: providers
        });
      }

      var currentChild = node.firstChild;
      while (currentChild) {
        currentChild = this.compileNode(currentChild, resources, instructions, node, injectorId || parentInjectorId, targetLightDOM);
      }
    }

    return node.nextSibling;
  }
}