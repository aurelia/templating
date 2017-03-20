import './setup';
import {Container} from 'aurelia-dependency-injection';
import {ObserverLocator, bindingMode} from 'aurelia-binding';
import {TaskQueue} from 'aurelia-task-queue';
import {HtmlBehaviorResource} from '../src/html-behavior';
import {ViewResources} from '../src/view-resources';

describe('html-behavior', () => {
  let defaultBindingMode = bindingMode.oneWay;

  it('should leave BindableProperty defaultBindingMode undefined after initialize when unspecified', () => {
    let resource = new HtmlBehaviorResource();
    resource.attributeName = 'test';

    let container = new Container();
    container.registerInstance(ObserverLocator, {});
    container.registerInstance(TaskQueue, {});

    let target = function() {};

    resource.initialize(container, target);

    expect(resource.attributes['test'].defaultBindingMode).toBe(defaultBindingMode);
  });

  it('should register aliases for a custom attribute if provided', () => {
    const resources = new ViewResources(new ViewResources(), 'app.html');
    spyOn(resources, 'registerAttribute').and.callThrough();

    const resource = new HtmlBehaviorResource();
    resource.attributeName = 'test';
    resource.aliases = ['foo', 'bar'];

    let target = function() {};

    let container = new Container();
    container.registerInstance(ObserverLocator, {});
    container.registerInstance(TaskQueue, {});
    resource.initialize(container, target);
    resource.register(resources);

    // one call for the base name and 2 for the aliases
    expect(resources.registerAttribute).toHaveBeenCalledTimes(3);
  });

  it('should leave set BindableProperty defaultBindingMode after initialize when specified', () => {
    let resource = new HtmlBehaviorResource();
    resource.attributeName = 'test';
    resource.attributeDefaultBindingMode = bindingMode.twoWay;

    let container = new Container();
    container.registerInstance(ObserverLocator, {});
    container.registerInstance(TaskQueue, {});

    let target = function() {};

    resource.initialize(container, target);

    expect(resource.attributes['test'].defaultBindingMode).toBe(bindingMode.twoWay);
  });
});
