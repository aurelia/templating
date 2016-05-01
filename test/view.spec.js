import {View} from '../src/view';

describe('View', () => {
  it('binds and unbinds', () => {
    let view;
    let bindingContext = {};
    let overrideContext = {};
    let container = {};
    let viewFactory = { resources: { _invokeHook: jasmine.createSpy('_invokeHook') } };
    let fragment = {};
    let controllers = [{ bind: jasmine.createSpy('bind'), unbind: jasmine.createSpy('unbind') }];
    let bindings = [{
      bind: jasmine.createSpy('bind'),
      unbind: jasmine.createSpy('unbind').and.callFake(function() {
        // the view's bindingContext needs to be preserved while bindings are unbinding.
        expect(view.bindingContext).toBe(bindingContext);
        expect(view.overrideContext).toBe(overrideContext);
      })
    }];
    let children = [{ bind: jasmine.createSpy('bind'), unbind: jasmine.createSpy('unbind') }];
    let contentSelectors = [];
    view = new View(container, viewFactory, fragment, controllers, bindings, children, contentSelectors);
    view.bind(bindingContext, overrideContext);
    expect(viewFactory.resources._invokeHook).toHaveBeenCalledWith('beforeBind', view);
    expect(controllers[0].bind).toHaveBeenCalledWith(view);
    expect(bindings[0].bind).toHaveBeenCalledWith(view);
    expect(children[0].bind).toHaveBeenCalledWith(bindingContext, overrideContext, true);
    view.unbind();
    expect(viewFactory.resources._invokeHook).toHaveBeenCalledWith('beforeUnbind', view);
    expect(controllers[0].unbind).toHaveBeenCalled();
    expect(bindings[0].bind).toHaveBeenCalled();
    expect(children[0].bind).toHaveBeenCalled();
  });
});
