import {bindingMode} from 'aurelia-binding';
import {BindableProperty} from '../src/bindable-property';

describe('BindableProperty', () => {
  it('configures default binding mode', () => {
    let oneTime = bindingMode.oneTime;
    let oneWay = bindingMode.oneWay;
    let twoWay = bindingMode.twoWay;
    expect(new BindableProperty('test').defaultBindingMode).toBe(oneWay);
    expect(new BindableProperty({ name: 'test', defaultBindingMode: oneTime }).defaultBindingMode).toBe(oneTime);
    expect(new BindableProperty({ name: 'test', defaultBindingMode: oneWay }).defaultBindingMode).toBe(oneWay);
    expect(new BindableProperty({ name: 'test', defaultBindingMode: twoWay }).defaultBindingMode).toBe(twoWay);
    expect(new BindableProperty({ name: 'test', defaultBindingMode: null }).defaultBindingMode).toBe(oneWay);
    expect(new BindableProperty({ name: 'test', defaultBindingMode: undefined }).defaultBindingMode).toBe(oneWay);
  });

  describe('reflects to attribute', () => {
    let viewModel;
    let element;
    let observer;
    beforeEach(() => {
      element = document.createElement('div');
      viewModel = { __observers__: { __element__: element } };
    });

    it('should reflect prop as string', () => {
      let prop = new BindableProperty({
        reflectToAttribute: 'string',
        name: 'prop'
      });
      prop.owner = {};
      observer = prop.createObserver(viewModel);
      observer.selfSubscriber('Hello');
      expect(element.getAttribute('prop')).toBe('Hello');
    });

    it('should reflect prop as boolean', () => {
      let prop = new BindableProperty({
        reflectToAttribute: 'boolean',
        name: 'prop'
      });
      prop.owner = {};
      observer = prop.createObserver(viewModel);
      observer.selfSubscriber('Hello');
      expect(element.getAttribute('prop')).toBe('');
      ['', NaN, 0, false, null, undefined].forEach(v => {
        observer.selfSubscriber(v);
        expect(element.hasAttribute('prop')).toBe(false);
        element.setAttribute('prop', 'Hello');
      });
    });
  });
});
