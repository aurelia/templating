import {ResourceType} from 'aurelia-metadata';
import {EventManager} from 'aurelia-binding';

export class ElementConfig extends ResourceType {
  constructor(tagName){
    this.tagName = tagName;
  }

  load(container, target){
    var config = target(),
        eventManager = container.get(EventManager);

    eventManager.registerElementConfig(this.tagName, config);
  }

  register(){}
}