import { Binding } from "aurelia-binding";
import { Container } from "aurelia-dependency-injection";
import { TargetInstruction, ViewFactory, ViewResources } from "../src/aurelia-templating";
import { createFragment } from './util';

describe('ViewFactory', () => {

  it('constructs', () => {
    [null, undefined, 'string', {}, 1].forEach((v: any) => {
      expect(() => new ViewFactory(v, v, v)).not.toThrow();
    });
  });

  describe('create()', () => {
    let container: Container;
    let viewFactory: ViewFactory;

    beforeEach(() => {
      container = new Container();
      // compiler = container.get(ViewCompiler);
      // compiler.bindingLanguage.inspectTextContent = function() {
      //   return {
      //     createBinding() {
      //       return { bind() {}, unbind() {} };
      //     }
      //   }
      // };
      // compiler.bindingLanguage.inspectAttribute = function inspectAttribute(resources, tagName, attrName, attrValue) {
      //   return { attrName, attrValue };
      // }
    });

    it('creates', () => {
      const binding = {} as Binding & { target: any };
      viewFactory = new ViewFactory(
        createFragment('<div class="au-target" au-target-id="1"></div>'),
        {
          1: {
            behaviorInstructions: [],
            expressions: [
              {
                createBinding(target) {
                  binding.target = target;
                  return binding;
                }
              }
            ],
          }
        },
        container.get(ViewResources)
      );
      const view = viewFactory.create(container);
      expect(view.bindings).toBeDefined();
      expect(view.bindings.length).toBe(1, 'It should have had 1 binding');
      const target = binding.target;
      expect(target instanceof Element).toBe(true, 'It should have had the target');
      expect(target.className).toBe('au-target');
    });

    describe('<let/>', () => {

      it('creates with <let/>', () => {
        const binding = {} as Binding & { target: any; };
        const unset = {};
        viewFactory = new ViewFactory(
          createFragment(`<let class="au-target" au-target-id="1"></let>`),
          {
            1: TargetInstruction.letElement([
              { createBinding(target) {
                binding.target = arguments.length === 0 ? unset : target;
                return binding;
              }}
            ])
          },
          container.get(ViewResources)
        );
        const view = viewFactory.create(container);
        expect(view.bindings).toBeDefined();
        expect(view.bindings.length).toBe(1, 'It should have had 1 binding');
        const target = binding.target;
        expect(target).toBe(unset, 'It should have had no target in createBinding()');
        expect(view.firstChild).toBe(null, '<let/> element should have been removed');
      });

      it('creates with multiple <let/>', () => {
        viewFactory = new ViewFactory(
          createFragment(`
            <let class="au-target" au-target-id="1"></let>
            <div>
              <let class="au-target" au-target-id="2"></let>
            </div>
            <div>
              <let class="au-target" au-target-id="3"></let>
            </div>
          `),
          {
            1: TargetInstruction.letElement([
              createLetExpression({ a: 1 })
            ]),
            2: TargetInstruction.letElement([
              createLetExpression({ a: 2 })
            ]),
            3: TargetInstruction.letElement([
              createLetExpression({ a: 3 })
            ]),
          },
          container.get(ViewResources)
        );
        const view = viewFactory.create(container);
        expect(view.bindings).toBeDefined();
        expect(view.bindings.length).toBe(3, 'It should have had 1 binding');
        expect(view.bindings.every(b => 'a' in b)).toBe(true, 'It should have created multiple let bindings');
      });
    });

    function createLetExpression(binding) {
      return { createBinding() { return binding } };
    }
  });
});
