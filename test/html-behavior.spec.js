import './setup';
import {Container} from 'aurelia-dependency-injection';
import {ObserverLocator, bindingMode} from 'aurelia-binding';
import {TaskQueue} from 'aurelia-task-queue';
import {HtmlBehaviorResource} from '../src/html-behavior';

describe('html-behavior', () => {
  var defaultBindingMode = bindingMode.oneWay;

  it('should leave BindableProperty defaultBindingMode undefined after initialize when unspecified', () => {
    var resource = new HtmlBehaviorResource();
    resource.attributeName = 'test';

    var container = new Container();
    container.registerInstance(ObserverLocator, {});
    container.registerInstance(TaskQueue, {});

    var target = function() {};

    resource.initialize(container, target);

    expect(resource.attributes['test'].defaultBindingMode).toBe(defaultBindingMode);
  });

  it('should leave set BindableProperty defaultBindingMode after initialize when specified', () => {
    var resource = new HtmlBehaviorResource();
    resource.attributeName = 'test';
    resource.attributeDefaultBindingMode = bindingMode.twoWay;

    var container = new Container();
    container.registerInstance(ObserverLocator, {});
    container.registerInstance(TaskQueue, {});

    var target = function() {};

    resource.initialize(container, target);

    expect(resource.attributes['test'].defaultBindingMode).toBe(bindingMode.twoWay);
  });
});
