import {ResourceType} from 'aurelia-metadata';
import {BehaviorInstance} from './behavior-instance';
import {configureBehavior} from './behaviors';
import {hyphenate} from './util';

export class AttachedBehavior extends ResourceType {
  constructor(attribute){
    this.name = attribute;
    this.properties = [];
    this.attributes = {};
  }

  static convention(name){
    if(name.endsWith('AttachedBehavior')){
      return new AttachedBehavior(hyphenate(name.substring(0, name.length-16)));
    }
  }

  analyze(container, target){
    configureBehavior(container, this, target);
  }

  load(container, target){
    return Promise.resolve(this);
  }

  register(registry, name){
    registry.registerAttribute(name || this.name, this, this.name);
  }

  compile(compiler, resources, node, instruction){
    instruction.suppressBind = true;
    return node;
  }

  create(container, instruction, element, bindings){
    var executionContext = instruction.executionContext || container.get(this.target),
        behaviorInstance = new BehaviorInstance(this, executionContext, instruction);

    if(!(this.apiName in element)){
      element[this.apiName] = behaviorInstance.executionContext;
    }

    if(this.childExpression){
      bindings.push(this.childExpression.createBinding(element, behaviorInstance.executionContext));
    }

    return behaviorInstance;
  }
}
