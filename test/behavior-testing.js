import {bindingEngine} from 'aurelia-binding';
import {Container} from 'aurelia-dependency-injection';
import {TemplatingEngine} from '../src/templating-engine';
import {SimpleAttribute} from './behaviors/simple-attribute';
import {SimpleElement} from './behaviors/simple-element';

describe('testing html behaviors', () => {
  let templatingEngine;
  let container;

  beforeEach(() => {
    container = new Container();
    templatingEngine = container.get(TemplatingEngine);
  });

  it('should set simple custom attribute value', () => {
    var att = templatingEngine.createModelForUnitTest(SimpleAttribute);
    att.value = 'foo';
    expect(att.value).toBe('foo');
  });

  it('should raise value change on simple custom attribute', done => {
    var att = templatingEngine.createModelForUnitTest(SimpleAttribute);
    spyOn(att, 'valueChanged');

    att.value = 'foo';

    setTimeout(() => {
      expect(att.valueChanged).toHaveBeenCalledWith('foo', undefined);
      done();
    });
  });

  it('should raise value change on simple custom element', done => {
    var ele = templatingEngine.createModelForUnitTest(SimpleElement);
    spyOn(ele, 'fooChanged');
    spyOn(ele, 'barChanged');

    ele.foo = 'new foo';
    ele.bar = 'new bar';

    setTimeout(() => {
      expect(ele.fooChanged).toHaveBeenCalledWith('new foo', 'foo');
      expect(ele.barChanged).toHaveBeenCalledWith('new bar', 'bar');
      done();
    });
  });

  it('should set values from HTML on simple custom element', () => {
    var attributesFromHTML = {
      foo:'new foo',
      bar:'new bar'
    };

    var ele = templatingEngine.createModelForUnitTest(SimpleElement, attributesFromHTML);

    expect(ele.foo).toBe(attributesFromHTML.foo);
    expect(ele.bar).toBe(attributesFromHTML.bar);
  });

  it('should set values from bindings on simple custom element', done => {
    var attributesFromHTML = {
      foo:'new foo',
      bar: bindingEngine.createBindingExpression('bar', 'address.city')
    };

    var bindingContext = {
      address: {
        city:'Tallahassee'
      }
    };

    var ele = templatingEngine.createModelForUnitTest(SimpleElement, attributesFromHTML, bindingContext);

    expect(ele.foo).toBe(attributesFromHTML.foo);
    expect(ele.bar).toBe(bindingContext.address.city);

    bindingContext.address.city = 'Jacksonville';

    setTimeout(() => {
      expect(ele.bar).toBe(bindingContext.address.city);
      done();
    });
  });
});
