import {EventManager} from 'aurelia-binding';

export class ElementConfigResource {
  initialize() {}

  register() {}

  load(container, Target) {
    let config = new Target();
    let eventManager = container.get(EventManager);
    eventManager.registerElementConfig(config);
  }
}
