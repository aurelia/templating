import './setup';
import { createOverrideContext } from 'aurelia-binding';
import { Container } from 'aurelia-dependency-injection';
import { BindingLanguage } from '../src/binding-language';
import { ViewCompiler } from '../src/view-compiler';
import { ViewEngine } from '../src/view-engine';
import { BoundViewFactory } from '../src/view-factory';
import { ViewResources } from '../src/view-resources';
import { ViewSlot } from '../src/view-slot';

class SimpleSlotsElement { // simple <slot> usage
  static $resource = {
    name: 'simple-slots',
    type: 'element'
  };
  static $view = `<template>
    <div class="default-slot">
      <slot>
        <p class="default-slot-fallback"></p>
      </slot>
    </div>
    <div class="named-slot">
      <slot name="named">
        <p class="named-slot-fallback"></p>
      </slot>
    </div>
  </template>`;
  bind() { }
}

class NestedSlotsElement {
  static $resource = {
    name: 'nested-slots',
    type: 'element'
  };
  static $view = `<template>
    <div class="root-slot">
      <slot name="root">
        <p class="root-slot-fallback"></p>
        <slot name="nested">
          <p class="nested-slot-fallback"></p>
        </slot>  
      </slot>
    </div>
  </template>`;
  bind() { }
}

class SlotToSlotElement { // PassThroughSlot to ShadowSlot 
  static $resource = {
    name: 'pass-through-slot-to-slot',
    type: 'element'
  };
  static $view = `<template>
    <simple-slots class="without-fallback">
      <slot name="pass-through-slot-without-fallback" slot="named"></slot>
    </simple-slots>
    <simple-slots class="with-fallback">
      <slot name="pass-through-slot-with-fallback" slot="named">
        <p class="pass-through-slot-fallback"></p>
      </slot>
    </simple-slots>
  </template>`;
  bind() { }
}

function createSUT(markup, compiler, container) {
  return compiler.compile(markup).create(container.createChild());
}

function onPropertySet(target, propertyName, cb) {
  const backing = `__${propertyName}__`;
  target[backing] = target[propertyName];
  Object.defineProperty(target, propertyName, {
    configurable: true,
    get: function () { return this[backing]; },
    set: function (v) { cb(this[backing] = v); }
  });
}

function getFallbackViewBindingContext(slot) {
  return slot.ownerView.bindingContext;
}

function getFallbackViewOverrideContext(slot) {
  return slot.ownerView.overrideContext;
}

describe('Shadow DOM <slot> emulation', () => {
  let rootContainer, appResources, viewCompiler, host, hostSlot;
  let expectedBC, expectedOC;
  let sut;

  beforeAll(done => {
    rootContainer = new Container();
    appResources = new ViewResources(null, 'app.html');
    rootContainer.registerInstance(ViewResources, appResources);

    const language = new class extends BindingLanguage {
      createAttributeInstruction() { }
      inspectAttribute(resources, tagName, attrName, attrValue) {
        return { attrName, attrValue };
      }
      inspectTextContent() { }
    };
    rootContainer.registerInstance(BindingLanguage, language);

    viewCompiler = new ViewCompiler(language, appResources);

    rootContainer.registerInstance(ViewEngine, new ViewEngine(null, rootContainer, viewCompiler, null, appResources));

    host = document.createElement('div');
    document.body.appendChild(host);
    hostSlot = new ViewSlot(host, true);
    hostSlot.attached();

    // SlotCustomAttribute is registered when ViewEngine is instantiated
    return Promise.all([
      appResources.autoRegister(rootContainer, SimpleSlotsElement),
      appResources.autoRegister(rootContainer, NestedSlotsElement),
      appResources.autoRegister(rootContainer, SlotToSlotElement)
    ].map(b => b.load(rootContainer, b.target))).then(done, done.fail);
  });

  beforeEach(() => {
    expectedBC = {};
    expectedOC = createOverrideContext(expectedBC);
  });

  it('renders the fallback content when there are no slotables', () => {
    const markup = `
      <template>
        <simple-slots></simple-slots>
      </template>
    `;

    sut = createSUT(markup, viewCompiler, rootContainer);
    const slots = sut.controllers[0].view.slots;
    const defaultSlot = slots['__au-default-slot-key__'];
    const namedSlot = slots['named'];

    // fallback views should be created during binding
    expect(defaultSlot.contentView).toBeNull();
    expect(namedSlot.contentView).toBeNull();

    // wire-up bind spy
    // .contentView is created during bind
    onPropertySet(defaultSlot, 'contentView', view => spyOn(view, 'bind').and.callThrough());
    onPropertySet(namedSlot, 'contentView', view => spyOn(view, 'bind').and.callThrough());

    sut.bind(expectedBC, expectedOC);
    // assert fallback view is created
    expect(defaultSlot.contentView).not.toBeNull();
    expect(namedSlot.contentView).not.toBeNull();

    expect(defaultSlot.contentView.bind).toHaveBeenCalledTimes(1);
    expect(defaultSlot.contentView.bind).toHaveBeenCalledWith(
      getFallbackViewBindingContext(defaultSlot),
      getFallbackViewOverrideContext(defaultSlot)
    );

    expect(namedSlot.contentView.bind).toHaveBeenCalledTimes(1);
    expect(namedSlot.contentView.bind).toHaveBeenCalledWith(
      getFallbackViewBindingContext(namedSlot),
      getFallbackViewOverrideContext(namedSlot)
    );

    spyOn(defaultSlot.contentView, 'attached').and.callThrough();
    spyOn(namedSlot.contentView, 'attached').and.callThrough();
    hostSlot.add(sut);
    // assert fallback view is attached and in the correct place in the DOM
    expect(defaultSlot.contentView.attached).toHaveBeenCalled();
    expect(namedSlot.contentView.attached).toHaveBeenCalled();
    expect(host.querySelector('simple-slots .default-slot .default-slot-fallback')).not.toBeNull();
    expect(host.querySelector('simple-slots .named-slot .named-slot-fallback')).not.toBeNull();

    spyOn(defaultSlot.contentView, 'detached').and.callThrough();
    spyOn(namedSlot.contentView, 'detached').and.callThrough();
    hostSlot.remove(sut);
    // assert fallback view is detached
    expect(defaultSlot.contentView.detached).toHaveBeenCalled();
    expect(namedSlot.contentView.detached).toHaveBeenCalled();

    spyOn(defaultSlot.contentView, 'unbind').and.callThrough();
    spyOn(namedSlot.contentView, 'unbind').and.callThrough();
    sut.unbind();
    // assert fallback view is unbound
    expect(defaultSlot.contentView.unbind).toHaveBeenCalled();
    expect(namedSlot.contentView.unbind).toHaveBeenCalled();
    sut = undefined;
  });

  it('projects slotables to the default slot', () => {
    const markup = `
      <template>
        <simple-slots>
          <div class="project-to-default"></div>
        </simple-slots>
      </template>
    `;

    sut = createSUT(markup, viewCompiler, rootContainer);
    const defaultSlot = sut.controllers[0].view.slots['__au-default-slot-key__'];

    spyOn(defaultSlot, 'renderFallbackContent').and.callThrough();

    sut.bind(expectedBC, expectedOC);
    // assert fallback view is not created
    expect(defaultSlot.renderFallbackContent).not.toHaveBeenCalled();
    expect(defaultSlot.contentView).toBeNull();

    hostSlot.add(sut);
    hostSlot.attached();
    const projection = host.querySelector('simple-slots .default-slot .project-to-default');
    // assert fallback view is not created
    expect(projection).not.toBeNull();
  });

  it('projects slotables to a named slot', () => {
    const markup = `
      <template>
        <simple-slots>
          <div slot="named" class="project-to-named"></div>
        </simple-slots>
      </template>
    `;
    sut = createSUT(markup, viewCompiler, rootContainer);
    const namedSlot = sut.controllers[0].view.slots['named'];

    spyOn(namedSlot, 'renderFallbackContent').and.callThrough();

    sut.bind(expectedBC, expectedOC);
    // assert fallback view is not created
    expect(namedSlot.renderFallbackContent).not.toHaveBeenCalled();
    expect(namedSlot.contentView).toBeNull();

    hostSlot.add(sut);
    hostSlot.attached();
    const projection = host.querySelector('simple-slots .named-slot .project-to-named');
    // assert fallback view is not created
    expect(projection).not.toBeNull();
  });

  it('renders fallback for the root and nested <slot> when there are not slotables', () => {
    const markup = `
      <template>
        <nested-slots></nested-slots>
      </template>
    `;
    sut = createSUT(markup, viewCompiler, rootContainer);
    const slots = sut.controllers[0].view.slots;
    const rootSlot = slots['root'];
    let nestedSlot;

    spyOn(rootSlot, 'renderFallbackContent').and.callThrough();
    // wire-up bind spy
    // .contentView is created during bind
    // acquire nested <slot>
    onPropertySet(rootSlot, 'contentView', view => {
      nestedSlot = view.slots['nested'];
      spyOn(nestedSlot, 'renderFallbackContent').and.callThrough();

      expect(nestedSlot.contentView).toBeNull();

      spyOn(view, 'bind').and.callThrough();
      // wire-up bind spy for nested <slot>s fallback view
      // .contentView is created during bind
      onPropertySet(nestedSlot, 'contentView', view => spyOn(view, 'bind').and.callThrough());
    });

    expect(rootSlot.contentView).toBeNull();

    sut.bind(expectedBC, expectedOC);

    expect(rootSlot.contentView).not.toBeNull();
    expect(rootSlot.renderFallbackContent).toHaveBeenCalledTimes(1);
    expect(rootSlot.contentView.bind).toHaveBeenCalledWith(
      getFallbackViewBindingContext(rootSlot),
      getFallbackViewOverrideContext(rootSlot)
    );

    expect(nestedSlot.contentView).not.toBeNull();

    // TODO: see #639 and #640
    // fails - it gets called 2 time
    // expect(nestedSlot.renderFallbackContent).toHaveBeenCalledTimes(1);
    
    expect(nestedSlot.contentView.bind).toHaveBeenCalledWith(
      getFallbackViewBindingContext(nestedSlot),
      getFallbackViewOverrideContext(nestedSlot)
    );

    hostSlot.add(sut);

    // assert that the root and nested fallback views are in the correct place in the DOM
    expect(host.querySelector('nested-slots .root-slot .root-slot-fallback')).not.toBeNull();
    expect(host.querySelector('nested-slots .nested-slot-fallback')).not.toBeNull();
  });

  it('projects slotables to a nested <slot>', () => {
    const markup = `
      <template>
        <nested-slots>
          <p slot="nested" class="project-to-nested"></p>
        </nested-slots>
      </template>
    `;
    sut = createSUT(markup, viewCompiler, rootContainer);
    const slots = sut.controllers[0].view.slots;
    const rootSlot = slots['root'];
    let nestedSlot;

    spyOn(rootSlot, 'renderFallbackContent').and.callThrough();
    // wire-up bind spy
    // .contentView is created during bind
    // acquire nested <slot>
    onPropertySet(rootSlot, 'contentView', view => {
      nestedSlot = view.slots['nested'];
      spyOn(nestedSlot, 'renderFallbackContent').and.callThrough();
      expect(nestedSlot.contentView).toBeNull();
      spyOn(view, 'bind').and.callThrough();
    });

    expect(rootSlot.contentView).toBeNull();

    sut.bind(expectedBC, expectedOC);

    expect(rootSlot.contentView).not.toBeNull();
    expect(rootSlot.renderFallbackContent).toHaveBeenCalledTimes(1);
    expect(rootSlot.contentView.bind).toHaveBeenCalledWith(
      getFallbackViewBindingContext(rootSlot),
      getFallbackViewOverrideContext(rootSlot)
    );

    expect(nestedSlot.contentView).toBeNull();

    // TODO: see #639 and #640
    // fails - it gets called 1 time
    // expect(nestedSlot.renderFallbackContent).toHaveBeenCalledTimes(0);

    hostSlot.add(sut);

    // assert fallback view and projection to nested <slot> are in the correct place in the DOM
    expect(host.querySelector('nested-slots .root-slot .root-slot-fallback')).not.toBeNull();
    expect(host.querySelector('nested-slots .project-to-nested')).not.toBeNull();
  });

  it('renders the fallback of the destination <slot> when the pass through <slot> has no fallback and there are no slotables', () => {
    const markup = `
      <template>
        <pass-through-slot-to-slot></pass-through-slot-to-slot>
      </template>
    `;
    sut = createSUT(markup, viewCompiler, rootContainer);
    const noFallbackPassThroughSlot = sut.controllers[0].view.slots['pass-through-slot-without-fallback'];
    let destinationSlot;

    expect(noFallbackPassThroughSlot.contentView).toBeNull();
    expect(noFallbackPassThroughSlot.destinationSlot).toBeNull(); // set during bind

    spyOn(noFallbackPassThroughSlot, 'renderFallbackContent').and.callThrough();
    onPropertySet(noFallbackPassThroughSlot, 'destinationSlot', slot => {
      destinationSlot = slot;
      spyOn(slot, 'renderFallbackContent').and.callThrough();
      // set during bind
      onPropertySet(destinationSlot, 'contentView', view => {
        expect(slot.contentView).not.toBeNull();
        spyOn(view, 'bind').and.callThrough();
      });
    });

    sut.bind(expectedBC, expectedOC);

    expect(noFallbackPassThroughSlot.contentView).toBeNull();
    expect(noFallbackPassThroughSlot.renderFallbackContent).not.toHaveBeenCalled();
    expect(noFallbackPassThroughSlot.destinationSlot).not.toBeNull();
    expect(destinationSlot.contentView.bind).toHaveBeenCalledWith(
      getFallbackViewBindingContext(destinationSlot),
      getFallbackViewOverrideContext(destinationSlot)
    );
    expect(destinationSlot.renderFallbackContent).toHaveBeenCalledTimes(1);

    hostSlot.add(sut);

    expect(host.querySelector('pass-through-slot-to-slot simple-slots.without-fallback .named-slot .named-slot-fallback')).not.toBeNull();
  });

  it('renders the fallback of the pass through <slot> when there are no slotables', () => { // with fallbackFactory delegation
    const markup = `
      <template>
        <pass-through-slot-to-slot></pass-through-slot-to-slot>
      </template>
    `;
    sut = createSUT(markup, viewCompiler, rootContainer);
    const fallbackPassThroughSlot = sut.controllers[0].view.slots['pass-through-slot-with-fallback'];
    let destinationSlot;

    expect(fallbackPassThroughSlot.contentView).toBeNull();
    expect(fallbackPassThroughSlot.destinationSlot).toBeNull(); // set during bind

    spyOn(fallbackPassThroughSlot, 'renderFallbackContent').and.callThrough();
    onPropertySet(fallbackPassThroughSlot, 'destinationSlot', slot => {
      destinationSlot = slot;
      spyOn(slot, 'renderFallbackContent').and.callThrough();
    });

    sut.bind(expectedBC, expectedOC);

    expect(fallbackPassThroughSlot.contentView).not.toBeNull();
    expect(fallbackPassThroughSlot.renderFallbackContent).toHaveBeenCalledTimes(1);
    expect(fallbackPassThroughSlot.destinationSlot).not.toBeNull();

    // TODO: similar to #639
    // fails - it gets called 1 time
    // that slot is being targeted statically for projection, so it should not render its fallback
    // expect(destinationSlot.renderFallbackContent).not.toHaveBeenCalled();

    hostSlot.add(sut);

    expect(host.querySelector('pass-through-slot-to-slot simple-slots.with-fallback .named-slot .pass-through-slot-fallback')).not.toBeNull();
  });

  it('does not render the fallback of the pass through <slot> when assigned slotables', () => { // with fallbackFactory delegation
    const markup = `
      <template>
        <pass-through-slot-to-slot>
          <p class="project-through-pass-through" slot="pass-through-slot-with-fallback"></p>
        </pass-through-slot-to-slot>
      </template>
    `;
    sut = createSUT(markup, viewCompiler, rootContainer);
    const fallbackPassThroughSlot = sut.controllers[0].view.slots['pass-through-slot-with-fallback'];
    let destinationSlot;

    expect(fallbackPassThroughSlot.contentView).toBeNull();
    expect(fallbackPassThroughSlot.destinationSlot).toBeNull(); // set during bind

    spyOn(fallbackPassThroughSlot, 'renderFallbackContent').and.callThrough();
    onPropertySet(fallbackPassThroughSlot, 'destinationSlot', slot => {
      destinationSlot = slot;
      spyOn(slot, 'renderFallbackContent').and.callThrough();
    });

    sut.bind(expectedBC, expectedOC);

    expect(fallbackPassThroughSlot.contentView).toBeNull();
    expect(fallbackPassThroughSlot.renderFallbackContent).not.toHaveBeenCalled();
    expect(fallbackPassThroughSlot.destinationSlot).not.toBeNull();
    // TODO: similar to #639
    // fails - it gets called 1 time
    // that slot is being targeted for projection, so it should not render its fallback
    // expect(destinationSlot.renderFallbackContent).not.toHaveBeenCalled();

    hostSlot.add(sut);

    expect(host.querySelector('pass-through-slot-to-slot simple-slots.with-fallback .named-slot .project-through-pass-through')).not.toBeNull();
  });

  it('does not render the fallback of the destination <slot> when it has assigned slotables and the pass through <slot> has no fallback', () => { // with fallbackFactory delegation
    const markup = `
      <template>
        <pass-through-slot-to-slot>
          <p class="project-through-pass-through" slot="pass-through-slot-without-fallback"></p>
        </pass-through-slot-to-slot>
      </template>
    `;
    sut = createSUT(markup, viewCompiler, rootContainer);
    const fallbackPassThroughSlot = sut.controllers[0].view.slots['pass-through-slot-without-fallback'];
    let destinationSlot;

    expect(fallbackPassThroughSlot.contentView).toBeNull();
    expect(fallbackPassThroughSlot.destinationSlot).toBeNull(); // set during bind

    spyOn(fallbackPassThroughSlot, 'renderFallbackContent').and.callThrough();
    onPropertySet(fallbackPassThroughSlot, 'destinationSlot', slot => {
      destinationSlot = slot;
      spyOn(slot, 'renderFallbackContent').and.callThrough();
    });

    sut.bind(expectedBC, expectedOC);

    expect(fallbackPassThroughSlot.contentView).toBeNull();
    expect(fallbackPassThroughSlot.renderFallbackContent).not.toHaveBeenCalled();
    expect(fallbackPassThroughSlot.destinationSlot).not.toBeNull();
    // TODO: similar to #639
    // fails - it gets called 1 time
    // that slot is being targeted for projection, so it should not render its fallback
    // expect(destinationSlot.renderFallbackContent).not.toHaveBeenCalled();

    hostSlot.add(sut);

    expect(host.querySelector('pass-through-slot-to-slot simple-slots.without-fallback .named-slot .project-through-pass-through')).not.toBeNull();
  });

  afterEach(() => {
    if (sut) {
      hostSlot.remove(sut);
      hostSlot.detached();
      sut.unbind();
      sut = undefined;
    }
  });

  afterAll(() => {
    hostSlot.detached();
    document.body.removeChild(host);
  });
});
