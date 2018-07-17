import './setup';
import {Container} from 'aurelia-dependency-injection';
import {HtmlBehaviorResource} from '../src/html-behavior';
import {CompositionEngine} from '../src/composition-engine';
import {CompositionTransactionOwnershipToken} from '../src/composition-transaction';
import {ViewResources} from '../src/view-resources';
import {DOM} from 'aurelia-pal';
import { ViewSlot } from '../src/view-slot';

describe('CompositionEngine', () => {
  /**@type {Container} */
  let container;
  let mockModule;
  /**@type {CompositionEngine} */
  let compositionEngine;

  function createCompositionContext(viewModel) {
    let host = document.createElement('div');
    let compositionContext = new CompositionContext({
      host: host,
      viewSlot: new ViewSlot(host, true),
      container: container,
      viewModel: viewModel
    });
    return compositionContext;
  }

  beforeEach(() => {
    container = new Container();
    compositionEngine = container.get(CompositionEngine);
  });

  describe('ensureViewModel()', () => {

    it('ensures view model when view model\'s a string', done => {
      class MyClass {
        message = 'My class';
      }

      mockModule = {
        MyClass: MyClass
      };
      spyOn(compositionEngine.viewEngine.loader, 'loadModule')
        .and
        .callFake(() => new Promise(resolve => setTimeout(() => resolve(mockModule), 50)));

      let compositionContext = createCompositionContext('');
      container.registerInstance(DOM.Element, compositionContext.host);

      compositionEngine.ensureViewModel(compositionContext).then((context) => {
        expect(context).toBe(compositionContext);
        expect(context.viewModel instanceof MyClass).toBe(true);
        done();
      });
    });

    it('ensures view model when view model is a class', done => {
      class MyClass {
        message = 'My class';
      }

      let compositionContext = createCompositionContext(MyClass);
      container.registerInstance(DOM.Element, compositionContext.host);

      compositionEngine.ensureViewModel(compositionContext).then((context) => {
        expect(context).toBe(compositionContext);
        expect(context.viewModel instanceof MyClass).toBe(true);
      }).then(done).catch(done.fail);
    });

    it('registers instances with the "childContainer" only', done => {
      // instances are scoped to their own container
      class MyClass {
        message = 'My class';
      }

      Promise.all([
        compositionEngine.ensureViewModel(createCompositionContext(MyClass)),
        compositionEngine.ensureViewModel(createCompositionContext(MyClass))
      ]).then(contexts => {
        let childContainerOne = contexts[0].childContainer;
        let childContainerTwo = contexts[1].childContainer;

        expect(childContainerOne.hasResolver(MyClass)).toBe(true);
        expect(childContainerTwo.hasResolver(MyClass)).toBe(true);
        expect(container.hasResolver(MyClass)).toBe(false);
        expect(childContainerOne.get(MyClass)).not.toBe(childContainerTwo.get(MyClass));
        done();
      }).catch(done.fail);
    });
    
    it('ensures view model when view model is an object', done => {
      class MyClass {
        message = 'My class';
      }

      let compositionContext = createCompositionContext(new MyClass());
      container.registerInstance(DOM.Element, compositionContext.host);

      compositionEngine.ensureViewModel(compositionContext).then((context) => {
        expect(context).toBe(compositionContext);
        expect(context.viewModel).toBe(compositionContext.viewModel);
        expect(container.hasResolver(MyClass)).toBe(false);
        expect(context.viewModel instanceof MyClass).toBe(true);
        done();
      });
    });
  });

  describe('compose', () => {

    describe('when viewModel is specified', () => {
      
      it('composes', done => {
        class MyClass {
          static $view = '<template></template>';
        }

        compositionEngine
          .compose(createCompositionContext(MyClass))
          .then(controller => {
            expect(controller.viewModel instanceof MyClass).toBe(true);
            done();
          })
          .catch(done.fail);
      });

      it('waits for composition transaction to complete before binding. Fixes https://github.com/aurelia/templating/issues/632', done => {
        let track = 0;

        const originalWait = CompositionTransactionOwnershipToken.prototype.waitForCompositionComplete;
        CompositionTransactionOwnershipToken.prototype.waitForCompositionComplete = function() {
          track = 1;
          return originalWait.apply(this, arguments);
        }

        class MyClass {
          static $view = '<template></template>';

          bind() {
            expect(track).toBe(1);
          }
        }

        compositionEngine
          .compose(createCompositionContext(MyClass))
          .then(controller => {
            CompositionTransactionOwnershipToken.prototype.waitForCompositionComplete = originalWait;
            expect(track).not.toBe(0);
            done();
          })
          .catch((ex) => {
            CompositionTransactionOwnershipToken.prototype.waitForCompositionComplete = originalWait;
            done.fail(ex);
          })
      });
    });
  });


  /**
  * Instructs the composition engine how to dynamically compose a component.
  */
  class CompositionContext {
    /**
     * @param {Partial<CompositionContext>} context
     */
    constructor(context) {
      
      /**
        * The parent Container for the component creation.
        * @type {Container}
        */
      this.container = undefined;
      
      /**
        * The child Container for the component creation. One will be created from the parent if not provided.
        * @type {Container}
        */
      this.childContainer = undefined;
      
      /**
        * The context in which the view model is executed in.
        */
      this.bindingContext = undefined;
      
      /**
        * A secondary binding context that can override the standard context.
        * @type {OverrideContext}
        */
      this.overrideContext = undefined;
      
      /**
       * The view model url or instance for the component.
       * @type {string | object}
       */
      this.viewModel = undefined;
      
      /**
       * Data to be passed to the "activate" hook on the view model.
       */
      this.model = undefined;
      
      /**
        * The HtmlBehaviorResource for the component.
        * @type {HtmlBehaviorResource}
        */
      this.viewModelResource = undefined;
      
      /**
        * The view resources for the view in which the component should be created.
        * @type {ViewResources}
        */
      this.viewResources = undefined;
      
      /**
        * The view inside which this composition is happening.
        * @type {View}
        */
      this.owningView = undefined;
      
      /**
        * The view url or view strategy to override the default view location convention.
        * @type {string | ViewStrategy}
        */
      this.view = undefined;
      
      /**
        * The slot to push the dynamically composed component into.
        * @type {ViewSlot}
        */
      this.viewSlot = undefined;
      
      /**
        * Should the composition system skip calling the "activate" hook on the view model.
        */
      this.skipActivation = false;
      
      /**
        * The element that will parent the dynamic component.
        * It will be registered in the child container of this composition.
        * @type {Element}
        */
      this.host = null;
      Object.assign(this, context);
    }
  }
});
