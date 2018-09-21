import { Container } from 'aurelia-dependency-injection';
import { BindingLanguage } from '../src/binding-language';
import { ResourceLoadContext, ViewCompileInstruction } from '../src/instructions';
import { ViewCompiler } from '../src/view-compiler';
import { ViewEngine } from '../src/view-engine';
import { ViewResources } from '../src/view-resources';
import { StaticViewStrategy } from '../src/view-strategy';
import './setup';
import { ViewEngineHooksResource } from '../src/view-engine-hooks-resource';

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
        template: '<template><input value.bind="value" /></template>',
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
      const strategy = new StaticViewStrategy('<template><input value.bind="value" /></template>');
      expect(strategy.moduleId).toBeDefined();
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
      template: '<template><input value.bind="value" /></template>',
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
      template: '<template><input value.bind="value" /></template>',
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
});
