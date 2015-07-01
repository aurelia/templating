import {Container} from 'aurelia-dependency-injection';
import {BindingExpression} from 'aurelia-binding';
import {BehaviorInstance} from '../src/behavior-instance';
import {SimpleAttribute} from './behaviors/simple-attribute';
import {SimpleElement} from './behaviors/simple-element';

describe('testing html behaviors', () => {
  beforeEach(() =>{
    new Container().makeGlobal();
  });

  it('should set simple custom attribute value', () => {
    var att = BehaviorInstance.createForUnitTest(SimpleAttribute);
    att.value = 'foo';
    expect(att.value).toBe('foo');
  });

  it('should raise value change on simple custom attribute', done => {
    var att = BehaviorInstance.createForUnitTest(SimpleAttribute);
    spyOn(att, 'valueChanged');

    att.value = 'foo';

    setTimeout(() => {
      expect(att.valueChanged).toHaveBeenCalledWith('foo', undefined);
      done();
    });
  });

  it('should raise value change on simple custom element', done => {
    var ele = BehaviorInstance.createForUnitTest(SimpleElement);
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

    var ele = BehaviorInstance.createForUnitTest(SimpleElement, attributesFromHTML);

    expect(ele.foo).toBe(attributesFromHTML.foo);
    expect(ele.bar).toBe(attributesFromHTML.bar);
  });

  it('should set values from bindings on simple custom element', done => {
    var attributesFromHTML = {
      foo:'new foo',
      bar: BindingExpression.create('bar', 'address.city')
    };

    var bindingContext = {
      address: {
        city:'Tallahassee'
      }
    };

    var ele = BehaviorInstance.createForUnitTest(SimpleElement, attributesFromHTML, bindingContext);

    expect(ele.foo).toBe(attributesFromHTML.foo);
    expect(ele.bar).toBe(bindingContext.address.city);

    bindingContext.address.city = 'Jacksonville';

    setTimeout(() => {
      expect(ele.bar).toBe(bindingContext.address.city);
      done();
    });
  });
});
