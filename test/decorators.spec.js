import './setup';
import {metadata} from 'aurelia-metadata';
import {bindingMode} from 'aurelia-binding';
import {customAttribute, customElement} from '../src/decorators';

describe('decorators', () => {
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

function getBehaviorMetadata(decorator) {
  let target = {};
  decorator(target);
  return metadata.get(metadata.resource, target);
}
