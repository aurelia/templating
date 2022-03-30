import { Binding, Scope } from 'aurelia-binding';
import { Container } from 'aurelia-dependency-injection';
import {Controller, View, ViewFactory} from '../src/aurelia-templating';

describe('View', () => {
  it('binds and unbinds', () => {
    let view;
    let bindingContext = {} as Scope;
    let overrideContext = {} as Scope;
    let container = {} as Container;
    let viewFactory = { resources: { _invokeHook: jasmine.createSpy('_invokeHook') } } as unknown as ViewFactory;
    let fragment = {} as DocumentFragment;
    let controllers = [{ bind: jasmine.createSpy('bind'), unbind: jasmine.createSpy('unbind') }] as unknown as Controller[];
    let bindings = [{
      bind: jasmine.createSpy('bind'),
      unbind: jasmine.createSpy('unbind').and.callFake(function() {
        // the view's bindingContext needs to be preserved while bindings are unbinding.
        expect(view.bindingContext).toBe(bindingContext);
        expect(view.overrideContext).toBe(overrideContext);
      })
    }] as unknown as Binding[];
    let children = [{ bind: jasmine.createSpy('bind'), unbind: jasmine.createSpy('unbind') }] as unknown as Binding[];
    let contentSelectors = [];
    view = new View(container, viewFactory, fragment, controllers, bindings, children, contentSelectors);
    view.bind(bindingContext, overrideContext);
    expect(viewFactory.resources._invokeHook).toHaveBeenCalledWith('beforeBind', view);
    expect(controllers[0].bind).toHaveBeenCalledWith(view);
    expect(bindings[0].bind).toHaveBeenCalledWith(view);
    expect(children[0].bind as any).toHaveBeenCalledWith(bindingContext, overrideContext, true);
    view.unbind();
    expect(viewFactory.resources._invokeHook).toHaveBeenCalledWith('beforeUnbind', view);
    expect(controllers[0].unbind).toHaveBeenCalled();
    expect(bindings[0].bind).toHaveBeenCalled();
    expect(children[0].bind).toHaveBeenCalled();
  });
});
