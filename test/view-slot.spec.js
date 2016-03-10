import './setup';
import {Container} from 'aurelia-dependency-injection';
import {ViewSlot} from '../src/view-slot';
import {TemplatingEngine} from '../src/templating-engine';
import {View} from '../src/view';
import {ViewResources} from '../src/view-resources';
import {ViewFactory} from '../src/view-factory';
import {_ContentSelector} from '../src/content-selector';
import {DOM} from 'aurelia-pal';

describe('view-slot', () => {
  let container;
  let templatingEngine;
  let viewSlot;
  let parent;
  let element;
  let comment;

  beforeEach(() => {
    container = new Container();
    parent = DOM.createElement('div');
    comment = DOM.createComment('testing');
    element = DOM.createElement('div');
    parent.appendChild(element);
    viewSlot = new ViewSlot(element, false);
    container.registerInstance(DOM.Element, element);
    templatingEngine = container.get(TemplatingEngine);
  });

  describe('when binding to a bindingContext', () => {
    let context = { name: 'Test Context' };
    let view;
    let compilerInstructions;
    let resources;
    let factory;

    beforeEach(() => {
      compilerInstructions = {};
      resources = container.get(ViewResources);
      factory = new ViewFactory(parent, compilerInstructions, resources);
      view = factory.create();
    });

    describe('.bind', () => {
      it('applies bindingContext if unbound', () => {
        viewSlot.bind(context);
        expect(viewSlot.bindingContext).toEqual(context);
      });

      it('applies new bindingContext if not matching old', () => {
        let newContext = { name: 'New Context' };
        viewSlot.bind(context);
        expect(viewSlot.bindingContext).toEqual(context);
        viewSlot.bind(newContext);
        expect(viewSlot.bindingContext).toEqual(newContext);
      });

      it('applies new bindingContext to all children', () => {
        viewSlot.add(view);
        viewSlot.bind(context);
        expect(view.bindingContext).toEqual(context)
      });

      it('applies override context', () => {
        viewSlot.bind(context, { $index: 0 });
        expect(viewSlot.overrideContext).toEqual({ $index: 0 });
      });
    });

    describe('.unbind', () => {
      it('removes bindingContext if already bound', () => {
        viewSlot.bind(context);
        viewSlot.unbind();
        expect(viewSlot.isBound).toEqual(false);
        expect(viewSlot.bindingContext).toEqual(null);
      });

      it('removes bindingContext from all children', () => {
        viewSlot.add(view);
        viewSlot.bind(context);
        expect(view.bindingContext).toEqual(context);
        viewSlot.unbind();
        expect(view.bindingContext).toEqual(null);
      });

      it('removes override context', () => {
        viewSlot.bind(context, { $index: 0 });
        expect(viewSlot.overrideContext).toEqual({ $index: 0 });
        viewSlot.unbind();
        expect(view.bindingContext).toEqual(null);
        expect(view.overrideContext).toEqual(null);
      });
    });
  });

  describe('when adding or removing views', () => {
    let view;
    let secondView;
    let thirdView;
    let compilerInstructions;
    let resources;
    let factory;

    beforeEach(() => {
      compilerInstructions = {};
      resources = container.get(ViewResources);
      factory = new ViewFactory(parent, compilerInstructions, resources);
      view = factory.create();
      secondView = factory.create();
      thirdView = factory.create();
    });

    describe('.add', () => {
      it('adds a new view to children', () => {
        expect(viewSlot.children.length).toEqual(0);
        viewSlot.add(view);
        expect(viewSlot.children.length).toEqual(1);
      });

      xit('returns a promise if is animatable', () => {
        viewSlot.add(comment)
        let result = viewSlot.add(view);
        expect(result.constructor.name).toEqual('Promise');
      });
    });

    describe('.insert', () => {
      it('inserts a new view to children when empty already', () => {
        viewSlot.insert(0, secondView);
        expect(viewSlot.children.length).toEqual(1);
        expect(viewSlot.children[0]).toEqual(secondView);
      });

      it('inserts a new view to children when contains 1 already', () => {
        viewSlot.add(view);
        viewSlot.insert(1, secondView);
        expect(viewSlot.children.length).toEqual(2);
      });

      it('inserts a new view to children when contains 2 already', () => {
        viewSlot.add(view);
        viewSlot.add(secondView);
        viewSlot.insert(1, thirdView);
        expect(viewSlot.children.length).toEqual(3);
      });

      xit('returns a promise if is animatable', () => {
        viewSlot.add(view);
        view.attached();
        let result = viewSlot.insert(1, view);
        expect(result.constructor.name).toEqual('Promise');
      });
    });

    describe('.remove', () => {
      it('removes a view from children', () => {
        viewSlot.add(view);
        expect(viewSlot.children.length).toEqual(1);
        viewSlot.remove(view);
        expect(viewSlot.children.length).toEqual(0);
      });

      it('calls detached if already attached when removed', () => {
        spyOn(view, 'detached');
        viewSlot.add(view);
        viewSlot.attached();
        viewSlot.remove(view);
        expect(view.detached).toHaveBeenCalled();
      });

      describe('doesnt call return to cache when returnToCache', () => {

        it('is set to false', () => {
          spyOn(view, 'returnToCache');
          viewSlot.add(view);
          viewSlot.remove(view, false);
          expect(view.returnToCache).not.toHaveBeenCalled();
        });

        it('is not set', () => {
          spyOn(view, 'returnToCache');
          viewSlot.add(view);
          viewSlot.remove(view);
          expect(view.returnToCache).not.toHaveBeenCalled();
        });
      });

      it('calls return to cache when returnToCache is true', () => {
        spyOn(view, 'returnToCache');
        viewSlot.add(view);
        viewSlot.remove(view, true);
        expect(view.returnToCache).toHaveBeenCalled();
      });
    });

    describe('.removeAll', () => {
      it('removes all views from children', () => {
        viewSlot.add(view);
        viewSlot.add(secondView);
        expect(viewSlot.children.length).toEqual(2);
        viewSlot.removeAll();
        expect(viewSlot.children.length).toEqual(0);
      });
    });

    describe('.attached', () => {
      it('sets attached on the slot', () => {
        expect(viewSlot.isAttached).toEqual(false);
        viewSlot.attached();
        expect(viewSlot.isAttached).toEqual(true);
      });

      it('sets attached on children', () => {
        expect(view.isAttached).toEqual(false);
        viewSlot.add(view);
        viewSlot.attached();
        expect(view.isAttached).toEqual(true);
      });
    });

    describe('.detached', () => {
      it('sets detached on the slot', () => {
        viewSlot.attached();
        expect(viewSlot.isAttached).toEqual(true);
        viewSlot.detached();
        expect(viewSlot.isAttached).toEqual(false);
      });

      it('sets detached on children', () => {
        viewSlot.attached();
        expect(viewSlot.isAttached).toEqual(true);
        viewSlot.add(view);
        viewSlot.detached();
        expect(view.isAttached).toEqual(false);
      });
    });
  });

  describe('when using contentSelectors', () => {
    let contentSelectors;
    let contentSelectorOne;
    let view;
    let compilerInstructions;
    let resources;
    let factory;

    beforeEach(() => {
      compilerInstructions = {};
      resources = container.get(ViewResources);
      factory = new ViewFactory(parent, compilerInstructions, resources);
      view = factory.create();

      contentSelectors = [];
      contentSelectorOne = new _ContentSelector(parent, '.test');
      contentSelectors.push(contentSelectorOne);
      viewSlot._installContentSelectors(contentSelectors);
    });

    describe('._installContentSelectors', () => {
      it('installs content slots', () => {
        expect(viewSlot.contentSelectors).toEqual(contentSelectors);
      });
    });

    describe('._contentSelectorAdd', () => {
      it ('calls applySelectors when adding a content slot', () => {
        spyOn(_ContentSelector, 'applySelectors');
        viewSlot._contentSelectorAdd(view);
        expect(_ContentSelector.applySelectors).toHaveBeenCalled();
      });

      it ('adds the view to the children', () => {
        expect(viewSlot.children.length).toEqual(0);
        viewSlot._contentSelectorAdd(view);
        expect(viewSlot.children.length).toEqual(1);
      });

      it ('calls attached method on the view if already attached', () => {
        spyOn(view, 'attached');
        viewSlot.attached();
        viewSlot._contentSelectorAdd(view);
        expect(view.attached).toHaveBeenCalled();
      });
    });

    describe('._contentSelectorRemove', () => {
      beforeEach(() => {
        viewSlot._contentSelectorAdd(view);
        expect(viewSlot.children.length).toEqual(1);
      });

      it('removes view from the children', () => {
        viewSlot._contentSelectorRemove(view);
        expect(viewSlot.children.length).toEqual(0);
      });

      it('removes view fragment from view.contentSelectors', () => {
        let firstSlot = viewSlot.contentSelectors[0];
        expect(firstSlot.groups.length).toEqual(1);
        viewSlot._contentSelectorRemove(view);
        expect(firstSlot.groups.length).toEqual(0);
      });

      it ('calls detached method on the view if already attached', () => {
        spyOn(view, 'detached');
        viewSlot.attached();
        viewSlot._contentSelectorRemove(view);
        expect(view.detached).toHaveBeenCalled();
      });
    });
  });
});
