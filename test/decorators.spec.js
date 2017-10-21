import './setup';
import {metadata} from 'aurelia-metadata';
import {bindingMode, coerceFunctions, coerceFunctionMap} from 'aurelia-binding';
import {customAttribute, customElement, bindable} from '../src/decorators';
import {HtmlBehaviorResource} from '../src/html-behavior';
import {BindableProperty} from '../src/bindable-property';
import {_hyphenate} from '../src/util'

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

    describe('bindable', () => {
        it('configs correcltly when used on class', () => {
            let propertyName = 'firstName';
            let attributeName = _hyphenate(propertyName);
            class MyClass {}
            bindable(propertyName)(MyClass);
            
            let resource = metadata.getOrCreateOwn(metadata.resource, HtmlBehaviorResource, MyClass);
            let property = resource.attributes[attributeName];
            expect(property instanceof BindableProperty).toBe(true);
            expect(property.name).toBe(propertyName);
            
            propertyName = 'lastName';
            attributeName = _hyphenate(propertyName); 
            bindable({ name: propertyName })(MyClass);
            property = resource.attributes[attributeName];
            expect(property instanceof BindableProperty).toBe(true);
            expect(property.name).toBe(propertyName);
        });

        it('configs correctly when used on class field', () => {
            let classFieldName = 'firstName';
            let classFieldAttributeName = _hyphenate(classFieldName);
            class MyClass {}
            bindable()(MyClass.prototype, classFieldName, { value: 'bigopon' });

            let resource = metadata.getOrCreateOwn(metadata.resource, HtmlBehaviorResource, MyClass);
            let property = resource.attributes[classFieldAttributeName];
            expect(property instanceof BindableProperty).toBe(true);
            expect(property.name).toBe(classFieldName);
            
            classFieldName = 'lastName';
            classFieldAttributeName = _hyphenate(classFieldName);
            bindable()(MyClass.prototype, classFieldName, { value: 'bigopon' });
            property = resource.attributes[classFieldAttributeName];
            
            expect(property instanceof BindableProperty).toBe(true);
            expect(property.name).toBe(classFieldName);
        });

        it('configs coerce correctly when used on class', () => {
            ['string', 'number', 'boolean', 'date'].forEach(type => {
                @bindable[type]('prop')
                @bindable[type]({ name: 'prop1' })
                class MyClass {}
                const coerceFn = coerceFunctions[type];
                const resource = metadata.getOrCreateOwn(metadata.resource, HtmlBehaviorResource, MyClass);

                let property = resource.attributes.prop;
                expect(property instanceof BindableProperty).toBe(true);
                expect(property.name).toBe('prop');
                expect(property.coerce).toBe(type);
                
                property = resource.attributes.prop1;
                expect(property instanceof BindableProperty).toBe(true);
                expect(property.name).toBe('prop1');
                expect(property.coerce).toBe(type);

                /**
                 * Next 2 tests emulate decorators behavior by calling bindable instead of using transpiled code
                 */
                bindable[type]('firstName')(MyClass);
                property = resource.attributes['first-name'];
                expect(property instanceof BindableProperty).toBe(true);
                expect(property.name).toBe('firstName');
                expect(property.coerce).toBe(type);
                
                bindable[type]({ name: 'lastName' })(MyClass);
                property = resource.attributes['last-name'];
                expect(property instanceof BindableProperty).toBe(true);
                expect(property.name).toBe('lastName');
                expect(property.coerce).toBe(type);
            });
        });
        
        it('configs coerce correctly when used on class field', () => {
            ['string', 'number', 'boolean', 'date'].forEach(type => {
                class MyClass {
                    @bindable[type]('firstNameeeeeee1234')
                    firstName

                    @bindable[type]({
                        coerce: 'bamboo',
                        name: 'noNameeeeeee1234'
                    })
                    lastName
                }
                const coerceFn = coerceFunctions[type];
                
                let resource = metadata.getOrCreateOwn(metadata.resource, HtmlBehaviorResource, MyClass);
                let property = resource.attributes['first-name'];
                expect(property instanceof BindableProperty).toBe(true);
                expect(property.name).toBe('firstName');
                expect(property.coerce).toBe(type);

                property = resource.attributes['last-name'];
                expect(property instanceof BindableProperty).toBe(true);
                expect(property.name).toBe('lastName');
                expect(property.coerce).toBe(type);
            });
        });

        it('configs coerce by [PropertyType] correctly when used on Class field', () => {
            [String, Number, Boolean, Date].forEach(propertyTypeClass => {
                bindable.usePropertyType(true);
                class MyClass {
                    @bindable
                    @Reflect.metadata(metadata.propertyType, propertyTypeClass)
                    firstName
                }
                const type = coerceFunctionMap.get(propertyTypeClass);
                
                let resource = metadata.getOrCreateOwn(metadata.resource, HtmlBehaviorResource, MyClass);
                let property = resource.attributes['first-name'];
                expect(property instanceof BindableProperty).toBe(true);
                expect(property.name).toBe('firstName');
                expect(property.coerce).toBe(type);
                bindable.usePropertyType(false);
            });
        });
    });
});

function getBehaviorMetadata(decorator, target) {
  target = target || {};
  decorator(target);
  return metadata.get(metadata.resource, target);
}
