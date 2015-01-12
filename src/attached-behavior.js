import {Behavior} from './behavior';
import {Property} from './property';
import {hyphenate} from './util';

export class AttachedBehavior extends Behavior {
  constructor(attribute){
    super();
    this.attribute = attribute;
  }

  static convention(name){
    if(name.endsWith('AttachedBehavior')){
      return new AttachedBehavior(hyphenate(name.substring(0, name.length-16)));
    }
  }

  load(container, target){
    this.setTarget(container, target);

    if(!this.attribute){
      this.attribute = hyphenate(target.name);
    }

    if(this.properties.length === 0 && 'valueChanged' in target.prototype){
      new Property('value', 'valueChanged', this.attribute).load(this);
    }

    return Promise.resolve(this);
  }

  register(registry, name){
    registry.registerAttribute(name || this.attribute, this, this.attribute);
  }

  create(container, instruction, element, bindings){
    var behaviorInstance = super.create(container, instruction);

    if(this.childExpression){
      bindings.push(this.childExpression.createBinding(element, behaviorInstance.executionContext));
    }

    return behaviorInstance;
  }
}