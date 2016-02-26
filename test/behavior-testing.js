import './setup';
import {BindingEngine} from 'aurelia-binding';
import {Container} from 'aurelia-dependency-injection';
import {TemplatingEngine} from '../src/templating-engine';
import {SimpleAttribute} from './behaviors/simple-attribute';
import {SimpleElement} from './behaviors/simple-element';
import {PlainViewModel} from './behaviors/plain-viewmodel';

describe('testing html behaviors', () => {
  let templatingEngine;
  let container;
  let bindingEngine;

  beforeEach(() => {
    container = new Container();
    templatingEngine = container.get(TemplatingEngine);
    bindingEngine = container.get(BindingEngine);
  });

  it('should set simple custom attribute value', () => {
    var att = templatingEngine.createViewModelForUnitTest(SimpleAttribute);
    att.value = 'foo';
    expect(att.value).toBe('foo');
  });

  it('should raise value change on simple custom attribute', done => {
    var att = templatingEngine.createViewModelForUnitTest(SimpleAttribute);
    spyOn(att, 'valueChanged');

    att.value = 'foo';

    setTimeout(() => {
      expect(att.valueChanged).toHaveBeenCalledWith('foo', undefined);
      done();
    });
  });

  it('can create a plain view model', () => {
    var vm = templatingEngine.createViewModelForUnitTest(PlainViewModel);
    expect(vm.test).toEqual('my test');
  });

  it('should raise value change on simple custom element', done => {
    var ele = templatingEngine.createViewModelForUnitTest(SimpleElement);
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

    var ele = templatingEngine.createViewModelForUnitTest(SimpleElement, attributesFromHTML);

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

    var ele = templatingEngine.createViewModelForUnitTest(SimpleElement, attributesFromHTML, bindingContext);

    expect(ele.foo).toBe(attributesFromHTML.foo);
    expect(ele.bar).toBe(bindingContext.address.city);

    bindingContext.address.city = 'Jacksonville';

    setTimeout(() => {
      expect(ele.bar).toBe(bindingContext.address.city);
      done();
    });
  });
});
