import { bindingMode } from 'aurelia-binding';
import { BindableProperty } from '../src/bindable-property';

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

  it('understands defaultBindingMode as string', () => {
    expect(new BindableProperty({ name: 'test', defaultBindingMode: 'twoWay' }).defaultBindingMode).toBe(bindingMode.twoWay);
    expect(new BindableProperty({ name: 'test', defaultBindingMode: 'threeWay' }).defaultBindingMode).toBe(bindingMode.oneWay);
  });
});
