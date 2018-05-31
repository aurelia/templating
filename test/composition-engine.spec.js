import './setup';
import {Container} from 'aurelia-dependency-injection';
import {createOverrideContext, OverrideContext} from 'aurelia-binding';
import {HtmlBehaviorResource} from '../src/html-behavior';
import {CompositionEngine} from '../src/composition-engine';
import {TemplatingEngine} from '../src/templating-engine';
import {inlineView, noView} from '../src/decorators';
import {ViewResources} from '../src/view-resources';
import {DOM} from 'aurelia-pal';
import { ViewSlot } from '../src/view-slot';

describe('enhance', () => {
  /**@type {Container} */
  let container;
  let element;
  let mockModule;
  /**@type {CompositionEngine} */
  let compositionEngine;
  /**@type {CompositionContext} */
  let compositionContext;

  beforeEach(() => {
    container = new Container();
    element = DOM.createElement('div');
    compositionEngine = container.get(CompositionEngine);
    compositionContext = new CompositionContext({});
  });

  describe('ensureViewModel()', () => {

    it('ensures view model when view model\'s a string', done => {
      class MyClass {
        message = 'My class';
      }

      mockModule = {
        MyClass: MyClass
      };
      compositionEngine.viewEngine.loader.loadModule = () => new Promise(resolve => setTimeout(() => resolve(mockModule), 50));

      compositionContext.host = document.createElement('div');
      compositionContext.viewSlot = new ViewSlot(compositionContext.host, true);
      compositionContext.container = container;
      compositionContext.viewModel = '';
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

      compositionContext.host = document.createElement('div');
      compositionContext.viewSlot = new ViewSlot(compositionContext.host, true);
      compositionContext.container = container;
      compositionContext.viewModel = MyClass;
      container.registerInstance(DOM.Element, compositionContext.host);

      compositionEngine.ensureViewModel(compositionContext).then((context) => {
        expect(context).toBe(compositionContext);
        expect(container.hasResolver(MyClass)).toBe(true);
        expect(context.viewModel instanceof MyClass).toBe(true);
        done();
      });
    });
    
    it('ensures view model when view model is an object', done => {
      class MyClass {
        message = 'My class';
      }

      compositionContext.host = document.createElement('div');
      compositionContext.viewSlot = new ViewSlot(compositionContext.host, true);
      compositionContext.container = container;
      compositionContext.viewModel = new MyClass();
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
