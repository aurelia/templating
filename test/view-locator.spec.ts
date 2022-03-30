import { Container } from 'aurelia-dependency-injection';
import { StaticViewStrategy, ViewLocator } from '../src/aurelia-templating';

describe('ViewLocator', () => {
  let container: Container;
  let viewLocator: ViewLocator;

  beforeEach(() => {
    container = new Container();
    viewLocator = new ViewLocator();
  });

  describe('static $view strategy', () => {
    it('works with static field and raw string', () => {
      class El {
        static $view = '<template></template>';
      }
      let strategy = viewLocator.getViewStrategy(El) as StaticViewStrategy;
      expect(strategy instanceof StaticViewStrategy).toBe(true);
      expect(strategy.template).toBe(El.$view);
    });

    it('works with static field', () => {
      class El {
        static $view = {
          template: '<template></template>'
        }
      }
      let strategy = viewLocator.getViewStrategy(El) as StaticViewStrategy;
      expect(strategy instanceof StaticViewStrategy).toBe(true);
      expect(strategy.template).toBe(El.$view.template);
    });

    it('works with static method', () => {
      class El {
        static $view() {
          return {
            template: '<template></template>'
          };
        }
      }
      let strategy = viewLocator.getViewStrategy(El) as StaticViewStrategy;
      expect(strategy instanceof StaticViewStrategy).toBe(true);
      expect(strategy.template).toBe('<template></template>');
    });

    it('works with static method and raw string', () => {
      class El {
        static $view() {
          return '<template></template>';
        }
      }
      let strategy = viewLocator.getViewStrategy(El) as StaticViewStrategy;
      expect(strategy instanceof StaticViewStrategy).toBe(true);
      expect(strategy.template).toBe('<template></template>');
    });

    it('invokes static method with correct scope', () => {
      class Base {
        static template = '<template><div></div></template>';
        static $view() {
          return this.template;
        }
      }
      class El extends Base{
      }
      let strategy = viewLocator.getViewStrategy(El) as StaticViewStrategy;
      expect(strategy instanceof StaticViewStrategy).toBe(true);
      expect(strategy.template).toBe(Base.template);

      class El1 extends Base {
        static template = '<template>11</template>';
      }
      strategy = viewLocator.getViewStrategy(El1) as StaticViewStrategy;
      expect(strategy.template).toBe(El1.template);
    });
  });
});
