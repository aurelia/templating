import {getAllAnnotations, getAnnotation, ResourceType} from 'aurelia-metadata';
import {TaskQueue} from 'aurelia-task-queue';
import {ObserverLocator} from 'aurelia-binding';
import {BehaviorInstance} from './behavior-instance';
import {Children} from './children';

var capitalMatcher = /([A-Z])/g;

function addHyphenAndLower(char){
  return "-" + char.toLowerCase();
}

export function hyphenate(name){
  return (name.charAt(0).toLowerCase() + name.slice(1)).replace(capitalMatcher, addHyphenAndLower);
}

export class Property {
  constructor(name, changeHandler, attribute, defaultValue){
    this.name = name;
    this.changeHandler = changeHandler;
    this.attribute = attribute || hyphenate(name);
    this.defaultValue = defaultValue;
  }

  load(behavior){
    if(!this.changeHandler){
      var handlerName = this.name + 'Changed';
      if(handlerName in behavior.target.prototype){
        this.changeHandler = handlerName;
      }
    }

    behavior.properties.push(this);
    behavior.attributes[this.attribute] = this;
  }
}

export class Behavior extends ResourceType {
  constructor(){
    this.properties = [];
    this.attributes = {};
  }

  setTarget(container, target){
    var proto = target.prototype,
        i, ii, properties;

    this.target = target;
    this.taskQueue = container.get(TaskQueue);
    this.observerLocator = container.get(ObserverLocator);
    
    this.handlesCreated = ('created' in proto);
    this.handlesBind = ('bind' in proto);
    this.handlesUnbind = ('unbind' in proto);
    this.handlesAttached = ('attached' in proto);
    this.handlesDetached = ('detached' in proto);

    properties = getAllAnnotations(target, Property);

    for(i = 0, ii = properties.length; i < ii; ++i){
      properties[i].load(this);
    }

    this.childExpression = getAnnotation(target, Children);
  }

  compile(compiler, resources, node, instruction){
    instruction.suppressBind = true;
    return node;
  }

  create(container, instruction){
    var executionContext = instruction.executionContext || container.get(this.target);
    return new BehaviorInstance(this.taskQueue, this.observerLocator, this, executionContext, instruction);
  }
}