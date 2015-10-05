import {EventManager} from 'aurelia-binding';

export class ElementConfigResource {
  load(container, Target) {
    let config = new Target();
    let eventManager = container.get(EventManager);
    eventManager.registerElementConfig(config);
    return Promise.resolve(this);
  }

  register() {}
}
