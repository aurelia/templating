import {ResourceType} from 'aurelia-metadata';
import {EventManager} from 'aurelia-binding';

export class ElementConfigResource extends ResourceType {
  load(container, target){
    var config = new target(),
        eventManager = container.get(EventManager);

    eventManager.registerElementConfig(config);
    return Promise.resolve(this);
  }

  register(){}
}
