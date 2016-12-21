import './setup';
import {ViewCompiler} from '../src/view-compiler';
import {ViewResources} from '../src/view-resources';
import {Container} from 'aurelia-dependency-injection';
import {TemplatingBindingLanguage} from 'aurelia-templating-binding';
import {BindingLanguage} from '../src/binding-language';
import {HtmlBehaviorResource} from '../src/html-behavior';
import {BindableProperty} from '../src/bindable-property';

describe('Custom Attribute', () => {
  var viewCompiler, language, container;

  var runCommonCustomAttributeTest = function(attrRootName, attrSpecification, attrValue, expect ) {
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

      let createAttributeInstructionSpy = spyOn(language, 'createAttributeInstruction');

      viewCompiler._compileElement(div, viewCompiler.resources, template);

      let info = createAttributeInstructionSpy.calls.argsFor(0)[2];

      expect(info);
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
        runCommonCustomAttributeTest(attrName, attrName, 'foo: foo; bar: barValue', (info) =>
        {
          expect(info.command).toBe('options');
        });
    });

    it('detects when bound options are given', () => {
        const attrName = 'custom-options-attribute-2';
        runCommonCustomAttributeTest(attrName, attrName, 'foo.bind: foo; bar: barValue', (info) =>
        {
          expect(info.command).toBe('options');
        });
    });

    it('detects that default unnamed, unbound option is given', () => {
        const attrName = 'custom-options-attribute-3';
        runCommonCustomAttributeTest(attrName, attrName, 'barValue', (info) =>
        {
          expect(info.command).toBe('options');
          expect(info.attrValue).toBe('bar:barValue');
        });
    });

    it('detects that default unnamed, bound option is given', () => {
        const attrName = 'custom-options-attribute-4';
        runCommonCustomAttributeTest(attrName, attrName + '.bind', 'barValue', (info) =>
        {
          expect(info.command).toBe('bind');
          expect(info.attrName).toBe('bar');
          expect(info.attrValue).toBe('barValue');
        });
    });

    it('detects that default unnamed, call option is given', () => {
        const attrName = 'custom-options-attribute-5';
        runCommonCustomAttributeTest(attrName, attrName + '.call', 'barValue()', (info) =>
        {
          expect(info.command).toBe('call');
          expect(info.attrName).toBe('bar');
          expect(info.attrValue).toBe('barValue()');
        });
    });

  });
});
