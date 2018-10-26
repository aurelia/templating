import './setup';
import {ViewCompiler} from '../src/view-compiler';
import {ViewResources} from '../src/view-resources';
import { HtmlBehaviorResource } from '../src/html-behavior';
import { BindingLanguage } from '../src/binding-language';

class MockBindingLanguage {
  inspectAttribute(resources, elementName, attrName, attrValue) {
    return { attrName, attrValue };
  }

  createAttributeInstruction(resources, element, info, existingInstruction) {
  }

  createLetExpressions(resources, element, existingExpressions) {
    existingExpressions = existingExpressions || [];
    existingExpressions.push({ createBinding() {} });
    return existingExpressions;
  }

  inspectTextContent(resources, value) {
  }
}

describe('ViewCompiler', () => {
  var viewCompiler, language, resources;
  beforeEach(() => {
    language = new MockBindingLanguage();
    viewCompiler = new ViewCompiler(language);
    resources = new ViewResources(new ViewResources(), 'app.html');
  });

  describe('compile', () => {
    it('compiles an empty template', () => {
      var template = document.createElement('template'),
        node = document.createDocumentFragment(),
        factory;
      template.appendChild(node);
      factory = viewCompiler.compile(template, resources, null);
      expect(factory).not.toBe(null);
    });

    it('throws on compile template within svg namespace', () => {
      var template = document.createElementNS("http://www.w3.org/2000/svg", 'template'),
        node = document.createDocumentFragment();
      template.appendChild(node);

      var compileFunc = () => {
        viewCompiler.compile(template, resources, null)
      };

      expect(compileFunc).toThrow();
    });
  });

  describe('compileNode', () => {
    it('concatenates adjacent text nodes', () => {
      var instructions = [], parentInjectorId = 'root', targetLightDOM = true,
        node, parentNode;

      parentNode = document.createElement('div');
      node = document.createTextNode('Hello');
      parentNode.appendChild(node);
      parentNode.appendChild(document.createTextNode(' '));
      parentNode.appendChild(document.createTextNode('World'));
      parentNode.appendChild(document.createTextNode('!'));
      spyOn(language, 'inspectTextContent');

      node = viewCompiler._compileNode(node, resources, instructions, parentNode, parentInjectorId, targetLightDOM);
      expect(language.inspectTextContent).toHaveBeenCalledWith(resources, 'Hello World!');
      expect(node).toBe(null);
    });

    it('does not concatenate non-adjacent text nodes', () => {
      var instructions = [], parentInjectorId = 'root', targetLightDOM = true,
        node, parentNode, nextNode;

      parentNode = document.createElement('div');
      node = document.createTextNode('Hello');
      parentNode.appendChild(node);
      parentNode.appendChild(document.createTextNode(' '));
      nextNode = document.createElement('em');
      nextNode.textContent = 'World';
      parentNode.appendChild(nextNode);
      parentNode.appendChild(document.createTextNode('!'));
      spyOn(language, 'inspectTextContent');

      node = viewCompiler._compileNode(node, resources, instructions, parentNode, parentInjectorId, targetLightDOM);
      expect(language.inspectTextContent).toHaveBeenCalledWith(resources, 'Hello ');
      expect(node).toBe(nextNode);
    });

    it('clears class attributes containing interpolation expressions', () => {
      var instructions = [], parentInjectorId = 'root', targetLightDOM = true,
        node = document.createElement('div'), parentNode = null;
      node.setAttribute('class', 'foo ${bar} baz');
      spyOn(language, 'inspectAttribute').and.returnValue({
        attrName: 'class',
        expression: {attrToRemove: 'class'},
        command: null
      });
      spyOn(language, 'createAttributeInstruction').and.returnValue({
        attributes: {
          'class': {
            discrete: true,
            attrToRemove: 'class'
          }
        }, attrName: 'class'
      });
      viewCompiler._compileNode(node, resources, instructions, parentNode, parentInjectorId, targetLightDOM);
      expect(node.className).toBe('au-target');
    });

    it('does not clear class attributes with no interpolation expressions', () => {
      var instructions = [], parentInjectorId = 'root', targetLightDOM = true,
        node = document.createElement('div'), parentNode = null;

      node.setAttribute('class', 'foo bar baz');
      node.setAttribute('class.bind', 'someProperty');

      spyOn(language, 'inspectAttribute').and.callFake((resources, attrName, attrValue) => {
        if (attrName === 'class') {
          return {attrName: 'class', expression: null, command: null}
        } else {
          return {attrName: 'class', expression: null, command: 'bind'};
        }
      });

      spyOn(language, 'createAttributeInstruction').and.callFake((resources, node, info) => {
        if (info.command) {
          return {attributes: {'class': {discrete: true}}, attrName: 'class'};
        } else {
          return null;
        }
      });

      viewCompiler._compileNode(node, resources, instructions, parentNode, parentInjectorId, targetLightDOM);
      expect(node.className).toBe('foo bar baz au-target');
    });

    describe('<let/>', () => {

      it('treats like normal element when there is no binding language', () => {
        const fragment = createFragment('<div><let>');
        let instructions = { };
        
        spyOn(viewCompiler.bindingLanguage, 'createLetExpressions').and.callThrough();
        viewCompiler._compileNode(fragment, resources, instructions, null, 'root', true);
        expect(Object.keys(instructions).length).toBe(1, 'It should have had 1 instruction');
        expect(viewCompiler.bindingLanguage.createLetExpressions).toHaveBeenCalled();
      });

      it('marks as target instruction after creating expressions', () => {
        const fragment = createFragment('<div><let>');
        let instructions = { };
        let count = 0;
        viewCompiler.bindingLanguage.createLetExpressions = function(resources, letElement) {
          count++;
          expect(letElement.tagName).toBe('LET');
          expect(letElement.classList.contains('au-target')).toBe(false, 'It should not have had .au-target');
          expect(letElement.hasAttribute('au-target-id')).toBe(false, 'It should not have had [au-target-id]');
          return {};
        };
        spyOn(viewCompiler.bindingLanguage, 'createLetExpressions').and.callThrough();
        viewCompiler._compileNode(fragment, resources, instructions, null, 'root', true);
        expect(Object.keys(instructions).length).toBe(1, 'It should have had 1 instruction');
        expect(viewCompiler.bindingLanguage.createLetExpressions).toHaveBeenCalled();
        const $letEl =fragment.querySelector('let');
        expect(count).toBe(1, 'It should have had called the right fn');
        expect($letEl).not.toBeNull();
        expect($letEl.classList.contains('au-target')).toBe(true, 'It should have had .au-target');
        expect($letEl.hasAttribute('au-target-id')).toBe(true, 'It should have had [au-target-id]');
      });

      describe('backward compat', () => {
        it('does nothing if there is custom <let/> element', () => {
          let instructions = { };
          const fragment = createFragment('<div><let foo="bar">');
          const letMeta = new HtmlBehaviorResource();
          
          resources.getElement = name => name === 'let' ? letMeta : null;

          viewCompiler._compileNode(fragment, resources, instructions, null, 'root', true);
          expect(Object.keys(instructions).length).toBe(1, 'It should have had 1 instruction with let ce');
          let instruction;
          for (let id in instructions) {
            // ensure instruction ids are valid
            // there was a bug in compliation that caused id to be undefined
            expect(parseInt(id, 10)).not.toBeNaN();
            instruction = instructions[id];
            break;
          }
          expect(instruction.letElement).toBe(false, 'It should have not been let Element instruction');
          expect(instruction.behaviorInstructions[0].type).toBe(letMeta, 'It should have been the letMeta instance');
        });

        it('does nothing if there is no binding language implementation for <let/>', () => {
          let instructions = { };
          const fragment = createFragment('<div><let>');

          resources.getBindingLanguage = () => Object.assign(
            viewCompiler.bindingLanguage,
            {
              createLetExpressions: BindingLanguage.prototype.createLetExpressions
            });

          viewCompiler._compileNode(fragment, resources, instructions, null, 'root', true);
          expect(Object.keys(instructions).length).toBe(0, 'It should have had no instruction');
        });
      });
    });

  });

  function createFragment(html) {
    const parser = document.createElement('div');
    parser.innerHTML = `<template>${html}</template>`;
    return parser.firstElementChild.content;
  }

});
