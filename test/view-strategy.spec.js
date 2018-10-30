import { Container } from 'aurelia-dependency-injection';
import { BindingLanguage } from '../src/binding-language';
import { ResourceLoadContext, ViewCompileInstruction } from '../src/instructions';
import { ViewCompiler } from '../src/view-compiler';
import { ViewEngine } from '../src/view-engine';
import { ViewResources } from '../src/view-resources';
import { StaticViewStrategy } from '../src/view-strategy';
import './setup';
import { ViewEngineHooksResource } from '../src/view-engine-hooks-resource';
import { metadata } from 'aurelia-metadata';
import { HtmlBehaviorResource } from '../src/html-behavior';
import { _hyphenate } from '../src/util';

describe('ViewLocator', () => {
  /**@type {ViewEngine} */
  let viewEngine;
  let container = new Container();
  let appResources = new ViewResources();

  beforeEach(() => {
    let bindingLanguage = new class extends BindingLanguage {
      createAttributeInstruction () {}
      inspectAttribute (resources, tagName, attrName, attrValue) {
        return { attrName, attrValue};
      }
      inspectTextContent () {}
    };
    container = new Container();
    appResources = new ViewResources();
    viewEngine = {
      container: container,
      appResources: appResources,
      viewCompiler: new ViewCompiler(bindingLanguage, appResources)
    };
  });

  describe('StaticViewStrategy', () => {
    it('loads', (done) => {
      let strategy = new StaticViewStrategy({
        template: '<template><input value.bind="value"></template>',
        dependencies: []
      });
      class El {}
      strategy
        .loadViewFactory(viewEngine, ViewCompileInstruction.normal, new ResourceLoadContext(), El)
        .then((factory) => {
          expect(factory.resources.getElement('el').target).toBe(El);
        }).catch(ex => {
          expect(ex.message).not.toContain('Cannot determine default view strategy for object.');
        }).then(done);
    });

    it('loads dependencies when template is "null"', (done) => {
      class HooksViewEngineHooks {}
      let strategy = new StaticViewStrategy({
        template: null,
        dependencies: [HooksViewEngineHooks]
      });
      class El {}
      spyOn(ViewEngineHooksResource.prototype, 'initialize').and.callThrough();
      spyOn(ViewEngineHooksResource.prototype, 'load').and.callThrough();
      strategy
        .loadViewFactory(viewEngine, ViewCompileInstruction.normal, new ResourceLoadContext(), El)
        .then((factory) => {
          expect(ViewEngineHooksResource.prototype.initialize)
            .toHaveBeenCalledWith(viewEngine.container, HooksViewEngineHooks);
          expect(ViewEngineHooksResource.prototype.load)
            .toHaveBeenCalledTimes(1);
          expect(factory).toBe(null);
          done();
        })
        .catch(done.fail);
    });

    it('sets formal "moduleId"', () => {
      const strategy = new StaticViewStrategy('<template><input value.bind="value"></template>');
      expect(strategy.moduleId).toBeDefined();
    });

    describe('Invalid dependencies', () => {
      const dependencies = [null, undefined, 'a valid dep, NOT', 42, Symbol()];
      for (const dep of dependencies) {
        it('throws when one of dependencies is not a function or a module. Actual: "' + String(dep) + '"', done => {
          class El {}
          let strategy = new StaticViewStrategy({
            template: '<template></template>',
            dependencies: () => [dep]
          });
          strategy
            .loadViewFactory(viewEngine, ViewCompileInstruction.normal, new ResourceLoadContext(), El)
            .then(
              () => {
                done.fail(new Error('It should have failed with dep: ' + String(dep)));
              },
              (ex) => {
                expect(ex.toString()).toContain('dependency neither function nor object');
                done();
              }
            );
        });
      }
    });
  });

  it('loads dependencies', (done) => {
    class EmmaFrost {
    }
    class AquaMan {
      static $resource = {
        type: 'attribute'
      }
    }
    class VentureCapital {
      static $resource = {
        type: 'valueConverter'
      }
    }
    class BabyBoomer {
      static $resource = {
        type: 'bindingBehavior'
      }
    }
    class BlitzCrank {
      static $resource = {
        type: 'viewEngineHooks'
      }

      beforeCompile() {}
    }
    let strategy = new StaticViewStrategy({
      template: '<template><input value.bind="value"></template>',
      dependencies: [AquaMan, VentureCapital, BabyBoomer, BlitzCrank]
    });
    strategy
      .loadViewFactory(viewEngine, ViewCompileInstruction.normal, new ResourceLoadContext(), EmmaFrost)
      .then((factory) => {
        let resources = factory.resources;
        expect(resources.getElement('emma-frost').target).toBe(EmmaFrost);
        expect(resources.getAttribute('aqua-man').target).toBe(AquaMan);
        expect(resources.getValueConverter('ventureCapital') instanceof VentureCapital).toBe(true);
        expect(resources.getBindingBehavior('babyBoomer') instanceof BabyBoomer).toBe(true);
        expect(resources.beforeCompile).toBe(true);
      }).catch(ex => {
        expect(ex.message).not.toContain('Cannot determine default view strategy for object.');
      }).then(done);
  });

  it('loads async dependencies', done => {
    class Ekko {}
    class AureliaSol {
      static $resource = {
        type: 'attribute'
      }
    }
    class Volibear {
      static $resource = {
        type: 'valueConverter'
      }
    }
    class Braum {
      static $resource = {
        type: 'bindingBehavior'
      }
    }
    class Thresh {
      static $resource = {
        type: 'viewEngineHooks'
      }
      beforeCompile() {}
    }

    function mockEsmImport(path) {
      // Note: export name was intenionally made one character to demonstrate static dependencies declaration relies on
      //        the exported value (class), not the export name. This introduces inconsistency with the rest
      return Promise.resolve({
        b: Volibear,
        c: Braum,
        d: Thresh
      });
    }
    let strategy = new StaticViewStrategy({
      template: '<template><input value.bind="value"></template>',
      dependencies: () => [AureliaSol, mockEsmImport()]
    });
    strategy
      .loadViewFactory(viewEngine, ViewCompileInstruction.normal, new ResourceLoadContext(), Ekko)
      .then((factory) => {
        let resources = factory.resources;
        expect(resources.getElement('ekko').target).toBe(Ekko);
        expect(resources.getAttribute('aurelia-sol').target).toBe(AureliaSol);
        expect(resources.getValueConverter('volibear') instanceof Volibear).toBe(true);
        expect(resources.getBindingBehavior('braum') instanceof Braum).toBe(true);
        expect(resources.beforeCompile).toBe(true);
      })
      .catch(ex => {
        expect(ex.message).not.toContain('Cannot determine default view strategy for object.');
      }).then(done);
  });

  it('ignore dependencies that are not function', (done) => {
    class Ekko {}
    function mockEsmImport(path) {
      // Note: export name was intenionally made one character to demonstrate static dependencies declaration relies on
      //        the exported value (class), not the export name. This introduces inconsistency with the rest
      return Promise.resolve({
        b: null,
        c: undefined,
        d: 42,
        e: 'a valid dep, NOT',
        f: Symbol()
      });
    }
    let strategy = new StaticViewStrategy({
      template: '<template></template>',
      dependencies: () => [mockEsmImport()]
    });
    let spy = spyOn(ViewResources.prototype, 'autoRegister').and.callThrough();
    strategy
      .loadViewFactory(viewEngine, ViewCompileInstruction.normal, new ResourceLoadContext(), Ekko)
      .then(
        (factory) => {
          let resources = factory.resources;
          expect(resources.getElement('ekko').target).toBe(Ekko);
          expect(spy).toHaveBeenCalledTimes(1);
          done();
        },
        ex => {
          expect(false).toBe(true, 'It should not have failled');
          done.fail(ex);
        }
      );
  });

  describe('with custom elements', () => {
    it('loads when mixing multiple custom elements and other resource types', done => {
      let loadCount = 0;
      class Ekko {}
      class AureliaSol1 {
        static $resource = { type: 'valueConverter' };
      }
      class AureliaSol2 {
        static $resource = { type: 'valueConverter' };
      }
      class AureliaSol3 {
        static $resource = { type: 'valueConverter' };
      }
      class Volibear {
        static $view = null;
      }
      class Braum {
        static $view = null;
      }
      class Thresh {
        static $view = null;
      }

      [Volibear, Braum, Thresh].forEach(klass => {
        const r = metadata.getOrCreateOwn(metadata.resource, HtmlBehaviorResource, klass);
        r.elementName = _hyphenate(klass.name);
        r.load = function() {
          loadCount++;
        }
      });
  
      function mockEsmImport(path) {
        // Note: export name was intenionally made one character to demonstrate static dependencies declaration relies on
        //        the exported value (class), not the export name. This introduces inconsistency with the rest
        return Promise.resolve({
          b: Volibear,
          b1: AureliaSol1,
          c: Braum,
          c2: AureliaSol2,
          d: Thresh,
          e: AureliaSol3
        });
      }
      let strategy = new StaticViewStrategy({
        template: '<template></template>',
        dependencies: () => [mockEsmImport()]
      });
      strategy
        .loadViewFactory(viewEngine, ViewCompileInstruction.normal, new ResourceLoadContext(), Ekko)
        .then((factory) => {
          let resources = factory.resources;
          expect(resources.getElement('ekko').target).toBe(Ekko);
          expect(resources.getElement('volibear').target).toBe(Volibear);
          expect(resources.getElement('braum').target).toBe(Braum);
          expect(resources.getElement('thresh').target).toBe(Thresh);
          expect(loadCount).toBe(3);
          done();
        })
        .catch(done.fail);
    });

    it('loads multiple custom element dependencies in same module', (done) => {
      let loadCount = 0;
      class Ekko {}
      class AureliaSol {
        static $view = null;
      }
      class Volibear {
        static $view = null;
      }
      class Braum {
        static $view = null;
      }
      class Thresh {
        static $view = null;
      }

      [AureliaSol, Volibear, Braum, Thresh].forEach(klass => {
        const r = metadata.getOrCreateOwn(metadata.resource, HtmlBehaviorResource, klass);
        r.elementName = _hyphenate(klass.name);
        r.load = function() {
          loadCount++;
        }
      });
  
      function mockEsmImport(path) {
        // Note: export name was intenionally made one character to demonstrate static dependencies declaration relies on
        //        the exported value (class), not the export name. This introduces inconsistency with the rest
        return Promise.resolve({
          b: Volibear,
          c: Braum,
          d: Thresh
        });
      }
      let strategy = new StaticViewStrategy({
        template: '<template></template>',
        dependencies: () => [AureliaSol, mockEsmImport()]
      });
      strategy
        .loadViewFactory(viewEngine, ViewCompileInstruction.normal, new ResourceLoadContext(), Ekko)
        .then((factory) => {
          let resources = factory.resources;
          expect(resources.getElement('ekko').target).toBe(Ekko);
          expect(resources.getElement('aurelia-sol').target).toBe(AureliaSol);
          expect(resources.getElement('volibear').target).toBe(Volibear);
          expect(resources.getElement('braum').target).toBe(Braum);
          expect(resources.getElement('thresh').target).toBe(Thresh);
          expect(loadCount).toBe(4);
          done();
        })
        .catch(done.fail);
    });
  });
});
