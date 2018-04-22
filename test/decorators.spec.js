import './setup';
import { metadata } from 'aurelia-metadata';
import { bindingMode } from 'aurelia-binding';
import { customAttribute, customElement, resource, view } from '../src/decorators';

describe('@customAttribute', () => {
  it('should leave resource attributeDefaultBindingMode as undefined when unspecified', () => {
    var target = {};

    var decorator = customAttribute('test');
    decorator(target);

    var resource = metadata.get(metadata.resource, target);
    expect(resource.attributeName).toBe('test');
    expect(resource.attributeDefaultBindingMode).toBeUndefined();
  });

  it('should set resource attributeDefaultBindingMode when specified', () => {
    var target = {};

    var decorator = customAttribute('test', bindingMode.twoWay);
    decorator(target);

    var resource = metadata.get(metadata.resource, target);
    expect(resource.attributeName).toBe('test');
    expect(resource.attributeDefaultBindingMode).toBe(bindingMode.twoWay);
  });

  it('should validate behavior names', () => {
    expect(getBehaviorMetadata(customAttribute('fooBar')).attributeName).toBe('foo-bar');
    expect(getBehaviorMetadata(customElement('fooBar')).elementName).toBe('foo-bar');
    expect(getBehaviorMetadata(customAttribute('foo')).attributeName).toBe('foo');
    expect(getBehaviorMetadata(customAttribute('foo-bar')).attributeName).toBe('foo-bar');
  });
});

describe('@resources', () => {
  it('should config when using a string', () => {
    @resource('el')
    class El {}
    expect(El.$resource).toBe('el');
  });

  it('should config using a plain object', () => {
    let config = {};
    @resource(config)
    class El {}
    expect(El.$resource).toBe(config);
  });

  it('should define metadata using something else', () => {
    let behaviorResource = new class FakeResource{}();
    @resource(behaviorResource)
    class El {}
    expect(El.$resource).toBe(undefined);
    expect(metadata.getOwn(metadata.resource, El)).toBe(behaviorResource);
  });
});

describe('view strategy decorators', () => {
  let baseTemplate = '<template></template>';
  describe('@view', () => {
    it('should creates static view field on target', () => {
      @view(baseTemplate)
      class El {}

      expect(El.$view).toBe(baseTemplate);

      class El2 {}
      let config = {template: baseTemplate};
      view(config)(El2);
      expect(El2.$view).toBe(config);
    });
  })
});

function getBehaviorMetadata (decorator) {
  let target = {};
  decorator(target);
  return metadata.get(metadata.resource, target);
}
