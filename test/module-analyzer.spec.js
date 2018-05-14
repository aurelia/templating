import { Container } from 'aurelia-dependency-injection';
import { bindable, customElement, processContent } from '../src/decorators';
import { ModuleAnalyzer } from '../src/module-analyzer';
import './setup';
import { ViewResources } from '../src/view-resources';

describe('ModuleAnalyzer', () => {
  /**@type {Container} */
  let container;
  /**@type {ViewResources} */
  let resources;
  /**@type {ModuleAnalyzer} */
  let moduleAnalyzer;

  beforeEach(() => {
    container = new Container();
    resources = new ViewResources();
    moduleAnalyzer = container.get(ModuleAnalyzer);
  });

  it('analyzes', () => {
    let m = {
      E: class E {
      },
      DCustomAttribute: class {
      }
    };
    let result = moduleAnalyzer.analyze('a.js', m);
    expect(result.mainResource.metadata.elementName).toBe('e');
    expect(result.resources[0].metadata.attributeName).toBe('d');
  });

  it(`uses static resource convention,
    which ignores export name and use class name / explicit config`, () => {

    let m = {
      E: class E {
        static $resource() {
          return 'e1';
        }
      },
      DCustomAttribute: class {
        static $resource() {
          return {
            type: 'attribute'
          };
        }
      }
    };

    let analysis = moduleAnalyzer.analyze('a.js', m);
    expect(analysis.mainResource.metadata.elementName).toBe('e1');
    expect(analysis.resources[0].metadata.attributeName).toBe('d-custom-attribute');
  });

  it('combines metadata for HtmlBehaviorResource', () => {
    @customElement('e1')
    class E {
      static $resource() {
        return 'e1';
      }
    }
    class D {
      static $resource() {
        return {
          type: 'element'
        };
      }

      @bindable() date = new Date()
    }
    class F {
      static $resource() {
        return { type: 'attribute' }
      }
      @bindable() f
    }

    let m = {
      E: E,
      DCustomAttribute: D,
      FCustom: F
    };
    let analysis = moduleAnalyzer.analyze('a.js', m);
    expect(analysis.mainResource.metadata.elementName).toBe('e1');
    expect(analysis.resources[0].metadata.elementName).toBe('d');
    expect(analysis.resources[1].metadata.attributeName).toBe('f');
  });

  describe('inheritance', () => {

    it('analyzes', () => {
      class BaseField {
        static $resource() {
          return {
            bindables: [
              'name',
              {
                name: 'value', 
                defaultBindingMode: 'twoWay'
              }
            ]
          };
        }
      }

      class TextField extends BaseField {
        
        @bindable()
        label
      }

      class DateField extends TextField {
        @bindable()
        format;
      }

      let m1 = {
        a: TextField,
        
      };
      let m2 = {
        b: DateField
      }
      let analysis1 = moduleAnalyzer.analyze('a.js', m1);
      let analysis2 = moduleAnalyzer.analyze('b.js', m2);
      expect(analysis1.mainResource.metadata.elementName).toBe('text-field');
      expect(analysis2.mainResource.metadata.elementName).toBe('date-field');
    });

    // aurelia modules that go through module analyzer will be searched for metadata
    // through the whole class hierarchy. So it's always advised to defined own metadata
    // for inheritance scenario
    it('analyses with base using static config and derived using metadata', () => {
      class BaseField {
        @bindable() name

        @bindable({
          primaryProperty: true,
          defaultBindingMode: 'twoWay'
        })
        value;
      }

      @customElement('text-field')
      class TextField extends BaseField {
        static $resource = {
          bindables: ['label']
        };
      }

      class DateField extends TextField {
        @bindable()
        format;
      }

      @processContent(false)
      class Field extends BaseField {
        static $resource = {
          bindables: ['fieldName']
        }
      }

      class Readonly {
        static $resource = {
          type: 'attribute'
        }
      }

      let m1 = {
        a: TextField,
      };
      let m2 = {
        b: DateField
      };
      let m3 = {
        c: Field,
        r: Readonly
      };
      let analysis1 = moduleAnalyzer.analyze('a.js', m1);
      let analysis2 = moduleAnalyzer.analyze('b.js', m2);
      let analysis3 = moduleAnalyzer.analyze('c.js', m3);
      expect(analysis1.mainResource.metadata.elementName).toBe('text-field');
      expect(analysis2.mainResource.metadata.elementName).toBe('date-field');
      expect(analysis3.mainResource.metadata.elementName).toBe('field');
      expect(analysis3.resources[0].metadata.attributeName).toBe('readonly');

      // intergration with ViewResources test
      // ensure that initialization / registration work with view resources
      // -------------

      analysis1.initialize(container);
      analysis1.register(resources);
      expect(analysis1.mainResource.metadata.properties.length).toBe(3);

      analysis2.initialize(container);
      analysis2.register(resources);
      expect(analysis2.mainResource.metadata.properties.length).toBe(4);

      analysis3.initialize(container);
      analysis3.register(resources);
      expect(analysis3.mainResource.metadata.properties.length).toBe(3);
      expect(analysis3.resources[0].metadata.properties.length).toBe(1);
    });
  });
});
