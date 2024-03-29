﻿import { createOverrideContext } from 'aurelia-binding';
import { Container } from 'aurelia-dependency-injection';
import { DOM } from 'aurelia-pal';
import { TemplatingEngine, ViewResources } from '../src/aurelia-templating';

describe('enhance', () => {
  let container;
  let element;
  let templatingEngine: TemplatingEngine;

  beforeEach(() => {
    container = new Container();
    element = DOM.createElement('div');
    templatingEngine = container.get(TemplatingEngine);
  });

  it('passes bindingContext and overrideContext to .bind()', () => {
    let bindingContext = { some: 'var' };
    let overrideContext = createOverrideContext(bindingContext);
    overrideContext['foo'] = 'bar';

    let view = templatingEngine.enhance({
      element: element,
      bindingContext: bindingContext,
      overrideContext: overrideContext
    });

    expect(view.bindingContext).toBe(bindingContext);
    expect(view.overrideContext).toBe(overrideContext);
    expect(view.bindingContext['some']).toBe('var');
    expect(view.overrideContext['foo']).toBe('bar');
  });

  it('supports passing of ViewResources to the view-compiler', () => {
    let compileNodeSpy = spyOn(templatingEngine['_viewCompiler'], '_compileNode');
    let resources = new ViewResources();

    templatingEngine.enhance({
      element: element,
      resources: resources
    });

    let r = compileNodeSpy.calls.argsFor(0)[1];

    expect(r).toBe(resources);
  });
});
