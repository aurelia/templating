import { bindingBehavior, BindingBehaviorResource, bindingMode, valueConverter, ValueConverterResource } from 'aurelia-binding';
import { Container } from 'aurelia-dependency-injection';
import { Logger } from 'aurelia-logging';
import { metadata } from 'aurelia-metadata';
import { bindable, customAttribute, customElement, HtmlBehaviorResource, IStaticResourceConfig, viewEngineHooks, ViewResources } from '../src/aurelia-templating';

describe('ViewResources', () => {
  let container: Container;
  let resources: ViewResources;

  beforeEach(() => {
    container = new Container();
    resources = new ViewResources();
  });

  describe('convention', () => {
    it('recognizes convention', () => {
      class El {
        static $resource() {
          return 'el1';
        }
      }
  
      let meta = ViewResources.convention(El) as HtmlBehaviorResource;
      expect(meta.elementName).toBe('el1');
  
      class A {
        static $resource = {
          type: 'attribute',
        } as const
      }
  
      meta = ViewResources.convention(A) as HtmlBehaviorResource;
      expect(meta.attributeName).toBe('a');
  
      class ElOrA {
        static $resource = {
          type: 'element',
          bindables: ['b', 'c', { name: 'd', defaultBindingMode: 'twoWay' }]
        } as IStaticResourceConfig
      }

      meta = ViewResources.convention(ElOrA) as HtmlBehaviorResource;
      expect(meta.properties.length).toBe(3);
      expect(meta.attributes.d.defaultBindingMode).toBe(bindingMode.twoWay);

      class Vc {
        static $resource = {
          type: 'valueConverter'
        } as const
      }
      const vcMeta = ViewResources.convention(Vc) as ValueConverterResource;
      expect(vcMeta instanceof ValueConverterResource).toBe(true);
      expect(vcMeta.name).toBe('vc');

      class Bb {
        static $resource = {
          type: 'bindingBehavior'
        } as const
      }

      const bbMeta = ViewResources.convention(Bb) as BindingBehaviorResource;
      expect(bbMeta instanceof BindingBehaviorResource).toBe(true);
      expect(bbMeta.name).toBe('bb');
    });

    it('warns when using uppercase letters in custom element / attribute name', () => {
      let spy = spyOn(Logger.prototype, 'warn').and.callThrough();
      class ElEl {
        static $resource() {
          return 'ElEl';
        }
      }
  
      let meta = ViewResources.convention(ElEl) as HtmlBehaviorResource;
      expect(meta.elementName).toBe('el-el');
      expect(spy).toHaveBeenCalledWith(`'ElEl' is not a valid custom element name and has been converted to 'el-el'. Upper-case letters are not allowed because the DOM is not case-sensitive.`);
    });

    it('invokes static method with correct context', () => {
      class Base {
        static get elName() {
          return 'base';
        }
        static $resource() {
          return this.elName;
        }
      }

      class El extends Base {

      }
      let meta = ViewResources.convention(El) as HtmlBehaviorResource;
      expect(meta.elementName).toBe('base');

      class El1 extends Base {
        static get elName() {
          return 'el';
        }
      }
      meta = ViewResources.convention(El1) as HtmlBehaviorResource;
      expect(meta.elementName).toBe('el');
    });

    it('does not reapply convention', () => {
      class El  {
        static $resource = {
          bindables: ['value']
        }
      }
      let meta = metadata.getOrCreateOwn(metadata.resource, HtmlBehaviorResource, El) as HtmlBehaviorResource;
      ViewResources.convention(El, meta);
      expect(meta.elementName).toBe('el');
      expect(meta.properties.length).toBe(1);
      expect(meta['__au_resource__']).toBe(true);

      El.$resource.bindables.push('name', 'label', 'type');
      ViewResources.convention(El, meta);
      expect(meta.properties.length).toBe(1);
    });
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

    let aMeta = resources.autoRegister(container, ACustomAttribute) as HtmlBehaviorResource;
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
    expect((resources as any).beforeCompile1).toBeDefined();
    expect((resources as any).beforeCompile2).toBeDefined();

  });

  it('auto register with static `resource` convention ', () => {
    class El3 {
      static $resource = 'el3'
    }
    resources.autoRegister(container, El3);
    expect(resources.getElement('el3').target).toBe(El3);
  });

  describe('interop', () => {
    it('uses existing HtmlBehaviorResource metadata for naming', () => {

      @customElement('a')
      class El {
        static $resource = 'b'
      }

      resources.autoRegister(container, El);
      expect(resources.getElement('a').target).toBe(El);

      @customAttribute('b')
      class At {
        static $resource = {
          type: 'attribute',
          name: 'c'
        }
      }
      resources.autoRegister(container, At);
      expect(resources.getAttribute('b').target).toBe(At)
    });

    // it('adds bindables', () => {

    //   class El {
    //     static $resource() {
    //       return {
    //         bindables: ['name', 'value']
    //       }
    //     }
    //     @bindable() name
    //     @bindable() value
    //   }
    //   resources.autoRegister(container, El);
    //   expect(resources.getElement('el').properties.length).toBe(4);
    // });

    describe('with inheritance', () => {

      it('works with base class using static config and derived class using decorator', () => {
        class Base {
          static $resource = {
            bindables: ['name', 'value']
          }
        }

        class Field extends Base {
          @bindable()
          label;
        }

        resources.autoRegister(container, Field);
        expect(resources.getElement('field').properties.length).toBe(3);
      });

      it('works with base class using decorators and derivde class using static config', () => {
        class Base {
          @bindable() name
          @bindable() value;
        }

        class Field extends Base {
          static $resource = {
            bindables: ['label']
          }
        }

        const meta = resources.autoRegister(container, Field);
        expect(resources.getElement('field').properties.length).toBe(3);
        // Just a little check to ensure metadata are 
        expect(resources.getElement('base')).toBeFalsy();
        expect(meta).toBe(resources.getElement('field'));
        expect(metadata.getOwn(metadata.resource, Base)).not.toBe(meta);
      });
      
    });
  });
});

declare module 'aurelia-binding' {
  interface ValueConverterResource {
    name: string;
  }

  interface BindingBehaviorResource {
    name: string;
  }
}
