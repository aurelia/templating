import {bindingMode} from 'aurelia-binding';
import {BindableProperty} from '../src/bindable-property';
import {coerces} from '../src/behavior-property-observer';

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

  it('configures coerces corretly', () => {
  
    let bindableProperty;
  
    bindableProperty = new BindableProperty('test');
    bindableProperty.owner = {};
    expect(bindableProperty.createObserver({}).coerce).toBe(undefined);
  
    bindableProperty = new BindableProperty({ name: 'test', coerce: undefined });
    bindableProperty.owner = {};
    expect(bindableProperty.createObserver({}).coerce).toBe(undefined);
    
    bindableProperty = new BindableProperty({ name: 'test', coerce: null });
    bindableProperty.owner = {};
    expect(bindableProperty.createObserver({}).coerce).toBe(coerces.none);
  
    ['none', 'string', 'boolean', 'number', 'date'].forEach(type => {
      bindableProperty = new BindableProperty({ name: 'test', coerce: type });
      bindableProperty.owner = {};
      expect(bindableProperty.createObserver({}).coerce).toBe(coerces[type]);
    });
  
    const testFn = a => a;
    bindableProperty = new BindableProperty({ name: 'test', coerce: testFn });
    bindableProperty.owner = {};
    expect(bindableProperty.createObserver({}).coerce).toBe(testFn);
  });
});
