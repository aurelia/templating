import {hyphenate} from './util';

export class Property {
  constructor(name, changeHandler, attribute, defaultValue){
    this.name = name;
    this.changeHandler = changeHandler;
    this.attribute = attribute || hyphenate(name);
    this.defaultValue = defaultValue;
  }

  configureBehavior(behavior){
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