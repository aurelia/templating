import './setup';
import {metadata} from 'aurelia-metadata';
import {bindingMode, valueConverter, bindingBehavior} from 'aurelia-binding';
import {Container} from 'aurelia-dependency-injection';
import { customElement, customAttribute } from '../src/decorators';
import {ViewResources} from '../src/view-resources';
import { HtmlBehaviorResource } from '../src/html-behavior';
import { viewEngineHooks } from '../src/view-engine-hooks-resource';

describe('ViewResources', () => {
  /**@type {Container} */
  let container;
  /**@type {ViewResources} */
  let resources;

  beforeEach(() => {
    container = new Container();
    resources = new ViewResources();
  });

  it('auto register', () => {
    let resourceMetaType;
    class El {}

    let eMeta = resources.autoRegister(container, El);
    resourceMetaType = metadata.get(metadata.resource, El);

    expect(eMeta).toBe(resourceMetaType);
    expect(resourceMetaType.target).toBe(El);
    expect(resourceMetaType instanceof HtmlBehaviorResource).toBe(true);

    class ElCustomElement {}
    expect(() => resources.autoRegister(container, ElCustomElement)).toThrow();

    @customElement('el')
    class Ell {}
    expect(() => resources.autoRegister(container, Ell)).toThrow();

    // =========

    class ACustomAttribute {}

    let aMeta = resources.autoRegister(container, ACustomAttribute);
    resourceMetaType = metadata.get(metadata.resource, ACustomAttribute);

    expect(aMeta).toBe(resourceMetaType);
    expect(aMeta.target).toBe(ACustomAttribute);
    expect(aMeta instanceof HtmlBehaviorResource).toBe(true);

    @customAttribute('a')
    class AA {}

    expect(() => resources.autoRegister(container, AA)).toThrow();

    // =========

    class VValueConverter {}
    let vMeta = resources.autoRegister(container, VValueConverter);
    resourceMetaType = metadata.get(metadata.resource, VValueConverter);
    
    expect(vMeta).toBe(resourceMetaType);

    @valueConverter('v')
    class V {}
    expect(() => resources.autoRegister(container, V)).toThrow();

    // =========
    
    class BBindingBehavior {}
    let bMeta = resources.autoRegister(container, BBindingBehavior);
    resourceMetaType = metadata.get(metadata.resource, BBindingBehavior);

    expect(bMeta).toBe(resourceMetaType);

    @bindingBehavior('b')
    class B {}

    expect(() => resources.autoRegister(container, B)).toThrow();

    // ========

    class HViewEngineHooks {
      beforeCompile() {}
    }
    let hMeta = resources.autoRegister(container, HViewEngineHooks);
    resourceMetaType = metadata.get(metadata.resource, HViewEngineHooks);

    expect(hMeta).toBe(resourceMetaType);
    expect(resources.beforeCompile).toBe(true);

    @viewEngineHooks()
    class H {
      beforeCompile() {}
      afterCompile() {}
    }
    resources.autoRegister(container, H);

    expect(resources.afterCompile).toBe(true);
    expect(resources.beforeCompile1).toBeDefined();
    expect(resources.beforeCompile2).toBeDefined();
  });
});
