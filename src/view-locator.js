import {metadata, Origin} from 'aurelia-metadata';
import {RelativeViewStrategy, ConventionalViewStrategy, viewStrategy} from './view-strategy';

export class ViewLocator {
  static viewStrategyMetadataKey = 'aurelia:view-strategy';

  getViewStrategy(value: any): ViewStategy {
    if (!value) {
      return null;
    }

    if (typeof value === 'object' && 'getViewStrategy' in value) {
      let origin = Origin.get(value.constructor);

      value = value.getViewStrategy();

      if (typeof value === 'string') {
        value = new RelativeViewStrategy(value);
      }

      viewStategy.assert(value);

      if (origin) {
        value.makeRelativeTo(origin.moduleId);
      }

      return value;
    }

    if (typeof value === 'string') {
      value = new RelativeViewStrategy(value);
    }

    if (viewStrategy.validate(value)) {
      return value;
    }

    if (typeof value !== 'function') {
      value = value.constructor;
    }

    let origin = Origin.get(value);
    let strategy = metadata.get(ViewLocator.viewStrategyMetadataKey, value);

    if (!strategy) {
      if (!origin) {
        throw new Error('Cannot determinte default view strategy for object.', value);
      }

      strategy = this.createConventionalViewStrategy(origin);
    } else if (origin) {
      strategy.moduleId = origin.moduleId;
    }

    return strategy;
  }

  createConventionalViewStrategy(origin: Origin): ViewStategy {
    return new ConventionalViewStrategy(this, origin);
  }

  convertOriginToViewUrl(origin: Origin): string {
    let moduleId = origin.moduleId;
    let id = (moduleId.endsWith('.js') || moduleId.endsWith('.ts')) ? moduleId.substring(0, moduleId.length - 3) : moduleId;
    return id + '.html';
  }
}
