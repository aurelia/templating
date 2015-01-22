import {ResourceType} from 'aurelia-metadata';
import {EventManager} from 'aurelia-binding';

export class ElementConfig extends ResourceType {
  load(container, target){
    var config = new target(),
        eventManager = container.get(EventManager);

    eventManager.registerElementConfig(config);
  }

  register(){}
}