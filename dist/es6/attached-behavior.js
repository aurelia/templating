import {ResourceType} from 'aurelia-metadata';
import {BehaviorInstance} from './behavior-instance';
import {configureBehavior} from './behaviors';
import {Property} from './property';
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

  load(container, target){
    configureBehavior(this, container, target);

    if(this.properties.length === 0 && 'valueChanged' in target.prototype){
      new Property('value', 'valueChanged', this.name).configureBehavior(this);
    }

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
        behaviorInstance = new BehaviorInstance(this.taskQueue, this.observerLocator, this, executionContext, instruction);

    if(this.childExpression){
      bindings.push(this.childExpression.createBinding(element, behaviorInstance.executionContext));
    }

    return behaviorInstance;
  }
}