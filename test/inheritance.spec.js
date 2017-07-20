import './setup';
import {ObserverLocator} from 'aurelia-binding';
import {Container} from 'aurelia-dependency-injection';
import {metadata} from 'aurelia-metadata';
import {TaskQueue} from 'aurelia-task-queue';
import {MoreDerivedCustomElement, OverrideCustomElement} from './behaviors/derived-element';

describe('Inheritance', () => {
  let container;

  beforeEach(() => {
    container = new Container();
    container.registerInstance(ObserverLocator, {});
    container.registerInstance(TaskQueue, {});
  });

  it('should inherit base bindable properties', () => {
    let behavior = getResource(MoreDerivedCustomElement);
    behavior.initialize(container, MoreDerivedCustomElement);

    expect(behavior.properties.length).toBe(3);
    // On MoreDerivedCustomElement:
    expect(behavior.attributes['frob'].changeHandler).toBe('frobChanged');
    // On SimplElement:
    expect(behavior.attributes['foo'].changeHandler).toBe('fooChanged');
    expect(behavior.attributes['bar'].attribute).toBe('bar');
  });

  it('can override base properties', () => {
    let behavior = getResource(OverrideCustomElement);
    behavior.initialize(container, OverrideCustomElement);

    expect(behavior.attributes['foo'].changeHandler).toBe('handleFoo');
  });
});

function getResource(target) {
  return metadata.getOwn(metadata.resource, target);
}
