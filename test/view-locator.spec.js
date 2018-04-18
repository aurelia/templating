import './setup';
import {metadata} from 'aurelia-metadata';
import {bindingMode, valueConverter, bindingBehavior, ValueConverterResource, BindingBehaviorResource} from 'aurelia-binding';
import {Container} from 'aurelia-dependency-injection';
import { customElement, customAttribute } from '../src/decorators';
import {ViewResources} from '../src/view-resources';
import { HtmlBehaviorResource } from '../src/html-behavior';
import { viewEngineHooks } from '../src/view-engine-hooks-resource';
import { ViewLocator } from '../src/view-locator';
import { StaticViewStrategy } from '../src/view-strategy';

describe('ViewLocator', () => {
  /**@type {Container} */
  let container;
  /**@type {ViewLocator} */
  let viewLocator;

  beforeEach(() => {
    container = new Container();
    viewLocator = new ViewLocator();
  });

  describe('static view strategy', () => {
    it('works with static field and raw string', () => {
      class El {
        static view = '<template></template>';
      }
      let strategy = viewLocator.getViewStrategy(El);
      expect(strategy instanceof StaticViewStrategy).toBe(true);
      expect(strategy.template).toBe(El.view);
    });

    it('works with static field', () => {
      class El {
        static view = {
          template: '<template></template>'
        }
      }
      let strategy = viewLocator.getViewStrategy(El);
      expect(strategy instanceof StaticViewStrategy).toBe(true);
      expect(strategy.template).toBe(El.view.template);
    });

    it('works with static method', () => {
      class El {
        static view() {
          return {
            template: '<template></template>'
          };
        }
      }
      let strategy = viewLocator.getViewStrategy(El);
      expect(strategy instanceof StaticViewStrategy).toBe(true);
      expect(strategy.template).toBe('<template></template>');
    });

    it('works with static method and raw string', () => {
      class El {
        static view() {
          return '<template></template>';
        }
      }
      let strategy = viewLocator.getViewStrategy(El);
      expect(strategy instanceof StaticViewStrategy).toBe(true);
      expect(strategy.template).toBe('<template></template>');
    })
  });
});
