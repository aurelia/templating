import {metadata} from 'aurelia-metadata';
import {bindingMode} from 'aurelia-binding';
import {customAttribute} from '../src/decorators';

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
      expect(() => customAttribute('fooBar')).toThrow();
      expect(() => customElement('fooBar')).toThrow();
      expect(() => customAttribute('foo')).not.toThrow();
      expect(() => customAttribute('foo-bar')).not.toThrow();
    });
});
