import {metadata} from 'aurelia-metadata';

export class ViewEngineHooksResource {
  /** @internal */
  private instance: any;

  initialize(container, target) {
    this.instance = container.get(target);
  }

  register(registry, name) {
    registry.registerViewEngineHooks(this.instance);
  }

  load(container, target) {}

  static convention(name) { // eslint-disable-line
    if (name.endsWith('ViewEngineHooks')) {
      return new ViewEngineHooksResource();
    }
  }
}

export function viewEngineHooks(target) { // eslint-disable-line
  let deco = function(t) {
    metadata.define(metadata.resource, new ViewEngineHooksResource(), t);
  };

  return target ? deco(target) : deco;
}
