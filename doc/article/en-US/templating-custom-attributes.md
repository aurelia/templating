---
name: "Templating: Custom Attributes"
description: An overview of the Aurelia templating engine's custom attribute functionality. Custom Attributes are used to add custom behaviors to DOM elements.
author: Ashley Grant (http://www.ashleygrant.com)
---
## Introduction

Custom attributes are a category of view resource, just like value converters, binding behaviors and custom elements.  Custom attributes provide the ability to alter the behavior or add functionality to any DOM element.

Custom attributes may work by simply being added to a DOM element, or they may require that a value be set for the attribute. The value may be a simple value, or a complex set of options. These options may or may not be known when a custom attribute is developed. Aurelia provides simple APIs to create custom attributes of all of these types, while the Aurelia templating engine provides strong databinding capabilities for custom attributes.

Many custom attributes will work directly on the DOM element they are attached to. It is not necessary to search the DOM for the element a custom attribute is attached to. This is accomplished simply by requesting the element be injected into the attribute by Aurelia's Dependency Injection system. Simply request for an object of type `Element` to be injected in to your attribute. Aurelia will ensure you are provided with the DOM element the attribute has been attached to.

## Simple Custom Attribute

The simplest custom attribute to create is one that changes the behavior of an element merely by being added to the element. The following attribute will make an HTML element be displayed as a 100 pixel square with a red background.

<code-listing heading="red-square${context.language.fileExtension}">
  <source-code lang="ES 2015/2016">
    export class RedSquareCustomAttribute {
      static inject = [Element];

      constructor(element){
        this.element = element;
        this.element.style.width = this.element.style.height = '100px';
        this.element.style.backgroundColor = 'red';
      }
    }
  </source-code>
  <source-code lang="TypeScript">
    import {autoinject} from 'aurelia-framework';

    @autoinject
    export class RedSquareCustomAttribute {
      constructor(private element: Element){
          this.element.style.width = this.element.style.height = '100px';
          this.element.style.backgroundColor = 'red';
      }
    }
  </source-code>
</code-listing>

<code-listing heading="simple-attribute-usage.html">
  <source-code lang="HTML">
    <template>
      <require from="./red-square"></require>
      <div red-square></div>
    </template>
  </source-code>
</code-listing>

The attribute name is inferred via an Aurelia convention. This convention is `\${Name}CustomAttribute` for the ECMAScript class name. The class name is in "init caps" format. Aurelia converts this to "dash-case" format for use in HTML. Thus, `RedSquareCustomAttribute` becomes `red-square`.

## Explicit Attribute Naming

Overriding the default naming convention is possible by utilizing the `@customAttribute` decorator. Provide this decorator with the exact name for your attribute as below. Note that Aurelia does not convert from "init caps" to "dash-case" when using this decorator. It uses the exact value passed to the decorator.

<code-listing heading="red-square${context.language.fileExtension}">
  <source-code lang="ES 2015/ES 2016/TypeScript">
    import {customAttribute} from 'aurelia-framework';

    @customAttribute('red-square')
    export class MyClass {
      // implement custom element here
    }
  </source-code>
</code-listing>


## Single Value Binding

Aurelia custom attributes support three different types of binding: single value binding, options binding, and dynamic options binding. The simplest of the three binding types is single value binding. Aurelia will automatically set the `value` property on the attribute's view-model. Note that this property is not set until databinding is complete. This means the `value` property will not be set in the custom attribute's constructor or in its `created` lifecycle event. It is available in the `bind` and later lifecycle events.

<code-listing heading="square${context.language.fileExtension}">
  <source-code lang="ES 2015/2016">
    export class SquareCustomAttribute {
      static inject = [Element];

      constructor(element){
        this.element = element;
        this.element.style.width = this.element.style.height = '100px';
      }

      bind() {
        this.element.style.backgroundColor = this.value;
      }
    }
  </source-code>
  <source-code lang="TypeScript">
    import {autoinject} from 'aurelia-framework';

    @autoinject
    export class SquareCustomAttribute {
      constructor(private element: Element){
        this.element.style.width = this.element.style.height = '100px';
      }

      bind() {
        this.element.style.backgroundColor = this.value;
      }
    }
  </source-code>
</code-listing>

<code-listing heading="Simple Attribute with Value Usage">
  <source-code lang="HTML">
    <template>
      <require from="./square"></require>

      <div square="red"></div>
      <div square="${color}"></div>
      <div square.bind="color"></div>
    </template>
  </source-code>
</code-listing>


Note that in the above code sample, the color of the square will not be updated, even if the bound value is changed. This is because the attribute is not notified when the `value` property changes. Aurelia can notify a custom attribute when its value has changed, via the `valueChanged(newValue, oldValue)` callback function. The `valueChanged` callback function, if implemented on the view-model, will be called whenever the attribute's value changes. This function has two optional parameters, `newValue` and `oldValue`. These parameters will be set to the new value of the attribute and old value of the attribute, respectively. The `value` property is still set by Aurelia even if the `valueChanged` function is implemented. Note that if you implement both the `bind` and `valueChanged` callbacks, only `bind` will be called when the value is initially bound. If you implement only the `valueChanged` function, then it will be called when the value is initially bound.

<code-listing heading="square${context.language.fileExtension}">
  <source-code lang="ES 2015/2016">
    export class SquareCustomAttribute {
      static inject = [Element];

      constructor(element){
        this.element = element;
        this.element.style.width = this.element.style.height = '100px';
      }

      valueChanged(newValue, oldValue){
        this.element.style.backgroundColor = newValue;
      }
    }
  </source-code>
  <source-code lang="TypeScript">
    import {autoinject} from 'aurelia-framework';

    @autoinject
    export class SquareCustomAttribute {
      constructor(private element: Element){
        this.element.style.width = this.element.style.height = '100px';
      }

      valueChanged(newValue: string, oldValue: string){
        this.element.style.backgroundColor = newValue;
      }
    }
  </source-code>
</code-listing>

<code-listing heading="Simple Attribute with Value Usage">
  <source-code lang="HTML">
    <template>
      <require from="./square"></require>

      <div square="red"></div>
      <div square="${color}"></div>
      <div square.bind="color"></div>

      <input type="text" value.bind="color">
    </template>
  </source-code>
</code-listing>

When the user updates the value of the `color` property via the textbox, Aurelia will call the `valueChanged` method on the custom attribute to alert the custom attribute to the change.

## Options Binding

Options binding provides a custom attribute the ability to have multiple bindable properties. Each bindable property must be specified using the `bindable` decorator. The attribute view-model may implement an optional `\${propertyName}Changed(newValue, oldValue)` callback function for each bindable property. When binding to these options, separate each option with a semicolon and supply a binding command or literal value as in the example below. It is important to note that bindable properties are converted to dash-case when used in the DOM, while the VM property they are bound to are kept with their original casing.

<code-listing heading="square${context.language.fileExtension}">
  <source-code lang="ES 2015/2016">
    import {bindable, inject} from 'aurelia-framework';

    @inject(Element)
    export class SquareCustomAttribute {
      @bindable sideLength;
      @bindable color;

      constructor(element){
        this.element = element;
      }

      sideLengthChanged(newValue, oldValue){
        this.element.style.width = this.element.style.height = `${newValue}px`;
      }

      colorChanged(newValue, oldValue){
        this.element.style.backgroundColor = newValue;
      }
    }
  </source-code>
  <source-code lang="TypeScript">
    import {bindable, autoinject} from 'aurelia-framework';

    @autoinject
    export class SquareCustomAttribute {
      @bindable sideLength: string;
      @bindable color: string;

      constructor(private element: Element){
      }

      sideLengthChanged(newValue:string, oldValue:string){
        this.element.style.width = this.element.style.height = `${newValue}px`;
      }

      colorChanged(newValue:string, oldValue:string){
        this.element.style.backgroundColor = newValue;
      }
    }
  </source-code>
</code-listing>

<code-listing heading="Options Binding Usage">
  <source-code lang="HTML">
    <template>
      <require from="./square"></require>

      <div square="color.bind: squareColor; side-length.bind: squareSize"></div>
    </template>
  </source-code>
</code-listing>

## Default Option

A single bindable property can be made the default among all the options in an options binding.  Thus, when you use a custom attribute that would otherwise require using the options HTML syntax, and you want to provide a value or binding only for the default property, then you can use the simpler HTML syntax of a single value binding.

With options bindings each bindable property must be decorated with the `bindable` decorator.  To specify that you want a bindable property to be the default among all the other bindable properties, use the `primaryProperty` configuration parameter of the `bindable` decorator, as shown below:

<code-listing heading="square${context.language.fileExtension}">
  <source-code lang="ES 2015/2016">
    import {bindable, inject} from 'aurelia-framework';

    @inject(Element)
    export class SquareCustomAttribute {
      @bindable sideLength;
      @bindable({ primaryProperty: true }) color;

      constructor(element){
        this.element = element;
      }
    }
  </source-code>
  <source-code lang="TypeScript">
    import {bindable, autoinject} from 'aurelia-framework';

    @autoinject
    export class SquareCustomAttribute {
      @bindable sideLength: string;
      @bindable({ primaryProperty: true }) color: string;

      constructor(private element: Element){
      }
    }
  </source-code>
</code-listing>

Then when you use the custom attribute, instead of this:

<code-listing heading="Usage when Binding a Single Property using the Options Syntax">
  <source-code lang="HTML">
    <div square="color.bind: squareColor"></div>
 </source-code>
</code-listing>

You can do this:

<code-listing heading="Usage with Simpler Binding Syntax on a Default Bindable Property">
  <source-code lang="HTML">
      <div square.bind="squareColor"></div>
</source-code>
</code-listing>

Or if you don't care about binding, then this:

<code-listing heading="Usage with Simpler Syntax on a Default Bindable Property">
  <source-code lang="HTML">
      <div square="#123456"></div>
</source-code>
</code-listing>

## Dynamic Options Binding

Utilizing dynamic options, a custom attribute may deal with bindable properties where the name of the property is not known when creating the attribute. Simply decorate the attribute's view-model with the `dynamicOptions` decorator and implement the `propertyChanged(name, newValue, oldValue)` callback function. Aurelia will provide the name of the option that has changed along with new and old values for the option. Binding to a dynamic options attribute works exactly the same as binding to an options attribute in the DOM.

<code-listing heading="square${context.language.fileExtension}">
  <source-code lang="ES 2015/2016">
    import {dynamicOptions, inject} from 'aurelia-framework';

    @dynamicOptions
    @inject(Element)
    export class SquareCustomAttribute {
      constructor(element){
        this.element = element;
      }

      propertyChanged(name, newValue, oldValue){
        switch(name){
          case 'fill':
            this.element.style.backgroundColor = newValue;
            break;
          case 'size':
            this.element.style.width = this.element.style.height = `${newValue}px`;
            break;
          default:
            this.element.style[name] = newValue;
            break;
        }
      }
    }
  </source-code>
  <source-code lang="TypeScript">
    import {dynamicOptions, autoinject} from 'aurelia-framework';

    @dynamicOptions
    @autoinject
    export class RedSquareCustomAttribute {
      constructor(private element: Element){
      }

      propertyChanged(name: string, newValue: string, oldValue: string){
        switch(name){
          case 'fill':
            this.element.style.backgroundColor = newValue;
            break;
          case 'size':
            this.element.style.width = this.element.style.height = `${newValue}px`;
            break;
          default:
            this.element.style[name] = value;
            break;
        }
      }
    }
  </source-code>
</code-listing>

<code-listing heading="Single Value Binding Usage">
  <source-code lang="HTML">
    <template>
      <require from="./square"></require>

      <div square="fill.bind: squareColor; size: 100"></div>
    </template>
  </source-code>
</code-listing>

## Globally Accessible Custom Attributes

In all of our examples, we've been using the `require` element to import custom attributes we need into our view.  There's an easier way.  If you have some commonly used custom attributes that you'd like to make globally available, use Aurelia's `globalResources` function to register them.  This will eliminate the need to `require` elements at the top of every view.
