import './setup';
import {ViewCompiler} from '../src/view-compiler';
import {ViewResources} from '../src/view-resources';
import {BindingExpression, CallExpression} from 'aurelia-binding';
import {Container} from 'aurelia-dependency-injection';
import {TemplatingBindingLanguage} from 'aurelia-templating-binding';
import {BindingLanguage} from '../src/binding-language';
import {HtmlBehaviorResource} from '../src/html-behavior';
import {BindableProperty} from '../src/bindable-property';

describe('Custom Attribute', () => {
  let viewCompiler, language, container;

  let runCommonCustomAttributeTest = function(attrRootName, attrSpecification, attrValue, expectCallback ) {
      const behavior = new HtmlBehaviorResource();
      behavior.attributeName = attrRootName;
      behavior.properties.push(new BindableProperty({ name: 'foo' }));
      behavior.properties.push(new BindableProperty({ name: 'bar', defaultBindable: true }));
      behavior.initialize(container, function() { this.foo = "fooValue"; this.bar = "barValue"; });

      viewCompiler.resources.registerAttribute(attrRootName, behavior, attrRootName);
      
      const template = document.createElement('template');
      const div = document.createElement('div');
      template.appendChild(div);

      div.setAttribute(attrSpecification, attrValue);

      let configurePropertiesSpy = spyOn(viewCompiler, '_configureProperties').and.callThrough();

      viewCompiler._compileElement(div, viewCompiler.resources, template);

      return (configurePropertiesSpy.calls.count() === 1) ? configurePropertiesSpy.calls.argsFor(0)[0] : null;
    }  

  beforeAll(() => {

    container = new Container();
    container.registerSingleton(BindingLanguage, TemplatingBindingLanguage);
    container.registerAlias(BindingLanguage, TemplatingBindingLanguage);

    viewCompiler = container.get(ViewCompiler);
    language = container.get(BindingLanguage);
  });

  describe('With Options', () => {
    
    it('detects when unbound options are given', () => {
        const attrName = 'custom-options-attribute-1';
        let instruction = runCommonCustomAttributeTest(attrName, attrName, 'foo:fooValue;bar:barValue');
        expect().not.toBeNull();
        expect(instruction.attributes['foo']).toBe('fooValue');
        expect(instruction.attributes['bar']).toBe('barValue');
    });

    it('detects when bound options are given', () => {
        const attrName = 'custom-options-attribute-2';
        let instruction = runCommonCustomAttributeTest(attrName, attrName, 'foo.bind:fooProperty;bar:barValue');
        expect().not.toBeNull();
        expect(instruction.attributes['bar']).toBe('barValue');
        expect(instruction.attributes['foo'] instanceof BindingExpression).toBeTruthy();
        expect(instruction.attributes['foo'].targetProperty).toBe('foo');
        expect(instruction.attributes['foo'].sourceExpression.name).toBe('fooProperty');
    });

    it('detects that unbound default but named option is given', () => {
        const attrName = 'custom-options-attribute-3';
        let instruction = runCommonCustomAttributeTest(attrName, attrName, 'bar:barValue');
        expect().not.toBeNull();
        expect(instruction.attributes['bar']).toBe('barValue');
    });

    it('detects that bound default but named option is given', () => {
        const attrName = 'custom-options-attribute-4';
        let instruction = runCommonCustomAttributeTest(attrName, attrName, 'bar.bind:barProperty');
        expect().not.toBeNull();
        expect(instruction.attributes['bar'] instanceof BindingExpression).toBeTruthy();
        expect(instruction.attributes['bar'].targetProperty).toBe('bar');
        expect(instruction.attributes['bar'].sourceExpression.name).toBe('barProperty');
    });


    it('detects that unbound default option is given', () => {
        const attrName = 'custom-options-attribute-5';
        let instruction = runCommonCustomAttributeTest(attrName, attrName, 'barValue');
        expect().not.toBeNull();
        expect(instruction.attributes['bar']).toBe('barValue');
    });

    it('detects that default option is given to bind', () => {
        const attrName = 'custom-options-attribute-6';
        let instruction = runCommonCustomAttributeTest(attrName, attrName + '.bind', 'barProperty');
        expect().not.toBeNull();
        expect(instruction.attributes['bar'] instanceof BindingExpression).toBeTruthy();
        expect(instruction.attributes['bar'].targetProperty).toBe('bar');
        expect(instruction.attributes['bar'].sourceExpression.name).toBe('barProperty');
    });

    it('detects that default option is given to call', () => {
        const attrName = 'custom-options-attribute-7';
        let instruction = runCommonCustomAttributeTest(attrName, attrName + '.call', 'barCall()');
        expect().not.toBeNull();
        expect(instruction.attributes['bar'] instanceof CallExpression).toBeTruthy();
        expect(instruction.attributes['bar'].targetProperty).toBe('bar');
        expect(instruction.attributes['bar'].sourceExpression.name).toBe('barCall');
    });
  });
});
