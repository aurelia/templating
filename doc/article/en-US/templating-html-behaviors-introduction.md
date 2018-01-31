---
name: "Templating: HTML Behaviors Introduction"
description: An overview of the Aurelia templating engine's custom attribute and custom element functionality, including not only how to create basic versions, but how to use them both locally and globally in your application.
author: Ashley Grant (http://www.ashleygrant.com)
---
## Introduction

The term "HTML Behavior" in Aurelia encompasses two basic concepts: Custom Elements and Custom Attributes. HTML Behaviors are a fundamental part of nearly every Aurelia application. They help to create componentized applications with highly reusable code. In this introductory document, we will explore some basic topics to help you build an understanding of working with these concepts in an Aurelia application.

## What is an HTML Behavior?

HTML Behaviors are how you extend HTML with Custom Elements and Custom Attributes in an Aurelia application. Custom Elements are, as their name suggests, their own element in your markup. They generally have a view with some markup that will be rendered as part of a page in your application. Custom Attributes, on the other hand, can be used on standard HTML elements (such as `div` or `button`) or Custom Elements to change the behavior of the element. Both Custom Elements and Custom Attributes support Aurelia's strong data-binding.

HTML Behaviors, with one exception, require you to create a class for the behavior. This class is called a "ViewModel" for both Custom Elements and Custom Attributes. A Custom Element's ViewModel is typically paired with an HTML "View". A Custom Attribute's ViewModel is not paired with a view. Aurelia provides a naming convention for classes that allows you to tell the framework that a class is a ViewModel for a Custom Element or a Custom Attribute. This naming convention is very simple: append `CustomElement` or `CustomAttribute` to your ViewModel's name. It really is that simple.

> Info: Custom Elements as Default
> Actually, you don't even need to append `CustomElement` to a class to turn it into a custom element. The reason for this is that if Aurelia can't match any other convention, and finds no explicit configuration, it will assume that the class is a custom element.

If you are using the naming convention for your HTML Behavior's class, then Aurelia will use the class's name to determine the name your behavior will have in an HTML view. The standard naming convention for JavaScript classes is `InitCaps`, meaning you start each word with a capital letter; however, HTML is case-insensitive, usually normalized to lower-case. To bridge this gap, Aurelia will take the class name, strip the `CustomElement` or `CustomAttribute` postfix from it, and then convert the class name to `dash-case`. This means that `HelloWorldCustomElement` becomes `hello-world` and `RedSquareCustomAttribute` becomes `red-square` when you use it in a template.

You can override the naming convention and explicitly name your HTML Behavior by using a `@customAttribute` or `@customElement` decorator on your HTML Behavior's ViewModel. You pass a string to the decorator and this becomes the name your behavior will use. Aurelia will not alter this string in any way. This means that `@customElement('helloworld')` will give you a custom element named `<helloworld>`. These two decorators can be imported from the `aurelia-framework` module. When you use one of these decorators, there is no need to follow the naming convention mentioned above, as the use of the decorator tells Aurelia that you are creating a Custom Element or Custom Attribute. In fact, when you're using these decorators, the name of your class doesn't matter to Aurelia! Let's look at an example of using the `@customAttribute` decorator to explicitly name a custom attribute.

<code-listing heading="red-square${context.language.fileExtension}">
  <source-code lang="ES 2015/2016/Typescript">
    import {customAttribute} from 'aurelia-framework';

    @customAttribute('red-square')
    export class BlueSquare {
    }
  </source-code>
</code-listing>

As you see here, the custom attribute's name will be `red-square` even though the class is named `BlueSquare`. You obviously would not want to give a contradictory name like this in real code, but it's done here to show that the class name doesn't matter when you use the decorator to explicitly name your behavior.

> Info: Naming Practices
> It's generally recommended that custom elements and custom attributes be named so that the HTML behavior has a hyphen in the name. Use `hello-world` as apposed to `helloworld`. While nothing in Aurelia or the browser is going to stop you, in order to be forward compatible with Web Components, we recommend always using a hyphenated name. A common practice is to adopt a two-letter prefix and use it throughout your company or application.

## Getting the DOM Element for your Behavior

When you are creating an HTML Behavior, there will be many instances where you will need to perform some manipulation of the DOM Element associated with your behavior. Initially, you might think, "No big deal! I'll just use `document.querySelector` or jQuery to get the DOM Element." But this would fall apart very quickly, as an HTML Behavior is likely to be used repeatedly on a page. How would you figure out exactly which element to query for? Well, luckily, Aurelia gives you an extremely easy way to get a reference to the element your Behavior is associated with: just have it injected in to your ViewModel.

When you tell Aurelia to inject an instance of the `Element` class in to your class, Aurelia will inject the DOM Element your HTML Behavior is associated with. So no need to futz around with DOM queries! Let's take our `red-square` attribute and have it actually set it's element to be a red square. Just assign the passed in object to a property on your class, and you're good to go.

<code-listing heading="red-square${context.language.fileExtension}">
  <source-code lang="ES 2015">
    export class RedSquareCustomAttribute {
      static inject() { return [Element]; };

      constructor(element){
        this.element = element;

        this.element.style.width = this.element.style.height = '100px';
        this.element.backgroundColor = 'red';
      }
    }
  </source-code>
  <source-code lang="ES 2016">
    import {inject} from 'aurelia-framework';

    @inject(Element)
    export class RedSquareCustomAttribute {
      constructor(element){
        this.element = element;

        this.element.style.width = this.element.style.height = '100px';
        this.element.backgroundColor = 'red';
      }
    }
  </source-code>
  <source-code lang="TypeScript">
    import {autoinject} from 'aurelia-framework';

    @autoinject
    export class RedSquareCustomAttribute {
      constructor(private element: Element){
        this.element.style.width = this.element.style.height = '100px';
        this.element.backgroundColor = 'red';
      }
    }
  </source-code>
</code-listing>

Remember, you don't need jQuery to get the Element your HTML Behavior is attached to. Aurelia can provide it to you!

> Warning: Try to Avoid Browser Globals
> In the above examples, we used a browser global: `Element`. Sometimes using browser globals can cause testing issues. That's not the case here. However, should you desire to leverage server-side rendering, you'll need to have a codebase free of browser globals. You may want to prepare for this in advance. To help you avoid browser globals, Aurelia provides a Platform Abstraction Layer (PAL) that provides three exports `DOM`, `FEATURE` and `PLATFORM`. In the case above, you could substitute `Element` for `DOM.Element`.

## Making an HTML Behavior Available in a View

So far, we've merely talked about creating HTML Behaviors, but creating a behavior isn't very useful if you can't use it. So how do you use one? Well, first we have to make it available in a view. HTML Behaviors (and other view resources) are not available globally by default. This means that you must let Aurelia know which resources will be available in each view. This is done using the `require` element. The `require` element has two attributes `from` and `as`. You *must* supply a value for the `from` attribute, while `as` is optional. You cannot use data-binding with the `from` or `as` attributes on `require`.  When you "require in" a view resource with a `require` element, Aurelia will make it available for use in your view.

<code-listing heading="Require an External Resource">
  <source-code lang="HTML">
    <template>
      <require from="my-custom-element"></require>

      <my-custom-element></my-custom-element>
    </template>
  </source-code>
</code-listing>

The path you supply in the `from` attribute can take one of two forms: It can be relative to the root of your application or relative to the path of the view you are currently in. A path that does not have a `./` or `../` to start the path will be relative to the root of your application, while a path with `./` or `../` will be relative to your view's path. Note that you can use multiple `..`s to traverse up a directory tree as needed.

<code-listing heading="Relative Paths for External Resources">
  <source-code lang="HTML">
    <template>
      <require from="./my-custom-element-one"></require>
      <require from="../another-dir/my-custom-attribute"></require>

      <my-custom-element-one></my-custom-element-one>
      <div my-custom-attribute></div>
    </template>
  </source-code>
</code-listing>

The name the resource will take in your view is determined in one of three ways: by Aurelia convention, by explicit naming in the resource, or by being overridden using the `as` attribute. If you happen to be using multiple resources that have the same name, you must provide a value for the `as` attribute for all but one of the conflicting resources. The `as` attribute can also be used whenever you would like to alias the name of a resource. Perhaps the standard name for an HTML Behavior is really long and you want to give it a shorter name. The `as` attribute can help you out.

<code-listing heading="Overriding a Resource Name">
  <source-code lang="HTML">
    <template>
      <require from="my-custom-element-one"></require>
      <require from="../another-dir/my-custom-element-one" as="override-the-name"></require>

      <my-custom-element-one></my-custom-element-one>
      <override-the-name></override-the-name>
    </template>
  </source-code>
</code-listing>

You will typically not provide a file extension to the `from` attribute. There are multiple reasons for this. First, the file extension for files in your development environment may be different from the file extension the browser runs (such as `.ts` files when using TypeScript). Second, most (but not all) custom elements will require Aurelia to pull in both a javascript ViewModel as well as an HTML View. Aurelia's loader will determine which file extension needs to be appended to the file name you provide. There is one exception to this rule, though, Aurelia provides for "HTML-only Custom Elements." You must tell Aurelia that you are utilizing an HTML-only custom element by providing the `.html` extension in the `from` attribute. This is common source of confusion for Aurelia developers, so it is important to remember this nuance to using the `require` element!

<code-listing heading="Sample Template With External Resources">
  <source-code lang="HTML">
    <template>
      <require from="my-custom-element"></require>
      <require from="./my-html-only-custom-element.html"></require>

      <my-custom-element></my-custom-element>
      <my-html-only-custom-element></my-html-only-custom-element>
    </template>
  </source-code>
</code-listing>

> Info: The Inspiration for Require
> Aurelia's `require` element was inspired by the `import` statement in ES 2015. In the same way that modern JavaScript has modules which contain imports, so Aurelia's views are also modularized and can contain imports, which we accomplish via `require`. You may wonder why we didn't just name our element `import` instead of `require`. Those who have been using Aurelia for a while may remember that the initial name was in fact 'import'. The name was changed in order to enable compatibility with older version of Internet Explorer, which didn't like the use of `import`.

## Global Resources

You are likely to have certain resources that you will use in multiple views while developing an Aurelia application. In these instances it might be wise to make these resources available globally in your application. Luckily, Aurelia provides you with this capability in a simple fashion. This is typically done at application startup in your `main.js` file (or whatever you call your application startup file). The `FrameworkConfiguration` class provides the `globalResources` which takes one or more strings that are paths to a resource as parameters. Globalized resources do not need to be required into a template.

The file you use to configure Aurelia will have a `configure` method. Aurelia will call this method and pass an instance of the `Aurelia` class to it. This class provides a fluent interface for accessing the `FrameworkConfiguration` object via its `use` property. The methods on the `FrameworkConfiguration` object return the `FrameworkConfiguration` object to allow you to chain multiple calls together as shown below.

<code-listing heading="main${context.language.fileExtension}">
  <source-code lang="ES 2015/2016">
    export function configure(aurelia) {
      aurelia.use
        .standardConfiguration()
        .developmentLogging()
        .globalResources('custom-element`, 'another-directory/custom-attribute');

      aurelia.start().then(() => aurelia.setRoot());
    }
  </source-code>
  <source-code lang="Typescript">
    import {Aurelia} from 'aurelia-framework';

    export function configure(aurelia: Aurelia) {
      aurelia.use
        .standardConfiguration()
        .developmentLogging()
        .globalResources('custom-element', 'another-directory/custom-attribute');

      aurelia.start().then(() => aurelia.setRoot());
    }
  </source-code>
</code-listing>

Note that the same rules regarding file extensions (only include it for HTML-only custom elements) apply for the paths passed to `globalResources`.  You can globalize anything you would use the `require` element for, including Custom Elements, HTML-only Custom Elements, Custom Attributes, Value Converters and Binding Behaviors.

## Creating Bindable Properties on an HTML Behavior

As you likely know by now, one of Aurelia's key features is its strong data-bind system, and I'm sure you're itching to know how to create bindable properties on your HTML Behaviors. Well, you're in luck, as we're now ready to discuss the `@bindable` decorator. One last thing though: this section is a very basic introduction to creating bindable properties, and does not fully explore the topic. For a full explanation, we encourage you to check out the Custom Element and Custom Attribute documentation.

The `@bindable` decorator can be imported from the `aurelia-framework` module. When you put the `@bindable` decorator on a property in your ViewModel, Aurelia will now allow you to bind to this property using all the binding commands Aurelia offers (`bind`, `two-way`, `one-way`, `one-time`, etc.). Let's look at a simple example in a Custom Element.

<code-listing heading="greet-customer${context.language.fileExtension}">
  <source-code lang="ES 2015/2016/Typescript">
    import {bindable} from 'aurelia-framework';

    export class GreetCustomerCustomElement {
      @bindable customerName = '';
    }
  </source-code>
</code-listing>

<code-listing heading="greet-customer.html">
  <source-code lang="HTML">
    <template>
      Welcome to Pizza Planet, ${customerName}!
    </template>
  </source-code>
</code-listing>

<code-listing heading="Binding to the Custom Element">
  <source-code lang="HTML">
    <template>
      <require from="./greet-customer"></require>

      <greet-customer customer-name.bind="name"></greet-customer>
    </template>
  </source-code>
</code-listing>

The page's `name` property will be bound to the `customerName` property of the `greet-customer` Custom Element. Note that the previously mentioned convention of converting JavaScript names to dash-case applies with bindable property names. They are converted from `camelCase` to `dash-case` when they appear as attributes in HTML.

By default, bindable properties only allow `one-way` data binding. This means that data will flow *into* the HTML Behavior, but not *out of* the custom element. Luckily, this can be overridden, or be made explicit by passing a configuration object to the `@bindable` decorator with a property named `defaultBindingMode` set to one of the values of the `bindingMode` enumeration. This enumeration is located in the `aurelia-framework` module and has three values: `oneWay`, `twoWay`, and `oneTime`. Here is a quick example of how to set the default binding mode for a property to `two-way`:

<code-listing heading="greet-customer${context.language.fileExtension}">
  <source-code lang="ES 2015/2016/Typescript">
    import {bindable, bindingMode} from 'aurelia-framework';

    export class GreetCustomerCustomElement {
      @bindable({ defaultBindingMode: bindingMode.twoWay }) customerName = '';
    }
  </source-code>
</code-listing>

Binding with Custom Attributes is a bit more nuanced than Custom Elements in that Custom Attributes support three types of binding: single value, options binding, and dynamic options binding. In this document, we will only look at single value binding. Please check out the Custom Attribute documentation for examples of how to implement and use all three types of bindings.

The `@bindable` decorator isn't used when doing single value binding with a Custom Attribute because all attributes have a `value` property by default. This is ensured by Aurelia. Instead, we implement a `valueChanged` callback function that Aurelia calls to alert us that the bound value of the Custom Attribute has changed. Aurelia will set the value to the `value` property of the Custom Attribute's ViewModel, and will pass two parameters to the `valueChanged` callback: the new value and the old value. Let's look at an example.

<code-listing heading="square${context.language.fileExtension}">
  <source-code lang="ES 2015">
    export class SquareCustomAttribute {
      static inject() { return [Element]; }

      constructor(element){
        this.element = element;
        this.element.style.width = this.element.style.height = '100px';
      }

      valueChanged(newValue, oldValue){
        this.element.style.backgroundColor = newValue;
      }
    }
  </source-code>
  <source-code lang="ES 2016">
    import {inject} from 'aurelia-framework';

    @inject(Element)
    export class SquareCustomAttribute {
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

<code-listing heading="Simple Attribute Value Binding">
  <source-code lang="HTML">
    <template>
      <require from="./square"></require>

      <div square.bind="color"></div>
    </template>
  </source-code>
</code-listing>

Aurelia will call the `valueChanged` callback whenever the bound value changes. This gives the attribute a chance to change the background color of the element. In this example, we don't even need to use the `value` property that Aurelia has set for us.

## Inheritance with HTML Behaviors

For developers who want to leverage inheritance, bindable properties can be inherited through the class hierarchy for custom elements only (not custom attributes).

In the following example we create a generic icon button component, `icon-button`, that is integrated with [font awesome](http://fontawesome.io/).

<code-listing heading="icon-button.js">
  <source-code lang="ES 2015">
    import {bindable} from 'aurelia-templating';

    export class IconButton{
      @bindable icon = 'ban';

      onClick(){
        alert("Default method");
      }
    }
  </source-code>
</code-listing>

<code-listing heading="icon-button.html">
  <source-code lang="HTML">
    <template>
      <button click.delegate="onClick">
        <i class="fa fa-${icon}"></i>
      </button>
    </template>
  </source-code>
</code-listing>

The next component extends the generic button, setting its default icon as well as a different `onClick` behavior.

<code-listing heading="add-button.js">
  <source-code lang="ES 2015">
    import {useView, customElement} from 'aurelia-templating';
    import {IconButton} from './icon-button';

    @useView('./icon-button.html')
    @customElement()
    export class AddButton extends IconButton {
      constructor(){
        super();
        this.icon = 'plus';
        this.onClick = this.add;
      }

      add(){
        alert('Base add button');
      }
    }
  </source-code>
</code-listing>

First, notice that in the above example, we declared `@useView('./icon-button.html')` to use the same view as the base class. If we had not supplied this, the framework would look for `./add-button.html` instead. Second, notice that we explicitly declared `@customElement()`. *Any time you inherit a custom element, you must add the `customElement` decorator.* Here's how these components would be used in a view:

<code-listing heading="view.html">
  <source-code lang="HTML">
    <template>
      <require from="./icon-button"></require>
      <require from="./add-button"></require>

      <icon-button></icon-button>
      <icon-button icon="cogs"></icon-button>

      <add-button></add-button>
      <add-button icon="plus-square-o"></add-button>
    </template>
  </source-code>
</code-listing>

## HTML-Only Custom Elements

Earlier, we said that there is one exception to the rule that all HTML Behaviors must have a JavaScript class to act as a ViewModel, but we never explained just what that exception is. The exception is HTML Only Custom Elements. Aurelia provides you with the ability to create Custom Elements without needing to create a ViewModel class. This is great for those cases where you want to encapsulate something in to its own Custom Element, but whatever you are encapsulating isn't complex enough to need any complex logic and doesn't have any dependencies like data services.

Creating an HTML Only Custom Element is as simple as creating an HTML view file and then requiring it in to your view with the `.html` extension, as mentioned in the "Making an HTML Behavior Available in a View" section above. You can even have bindable properties on your HTML Only Custom Element. These properties default to `one-way` databinding, but you can't change the default, though you are still free to explicitly set the binding direction when you bind to the Custom Element. To create bindable properties, just supply a comma separated list of property names to the `bindable` attribute on the `template` element as shown below.

<code-listing heading="hello-world.html">
  <source-code lang="HTML">
    <template bindable="firstName, lastName">
      Hello, ${firstName} ${lastName}!
    </template>
  </source-code>
</code-listing>

<code-listing heading="app.html">
  <source-code lang="HTML">
    <template>
      <require from="./hello-world.html"></require>

      <hello-world first-name.bind="firstName" last-name.two-way="lastName"></hello-world>
    </template>
  </source-code>
</code-listing>

## HTML Behavior Lifecycle

All HTML Behaviors have a well defined lifecycle. Using this lifecycle, you can tap in and trigger code to run when appropriate. Below is a listing of the standard lifecycle callbacks:

1. `constructor()` - The view-model's constructor is called first.
2. `created(owningView: View, myView: View)` - If the view-model implements the `created` callback it is invoked next. If your behavior is a custom element, it's view has also been created and both the view-model and the view are connected to their controller. The created callback will receive the instance of the "owningView". This is the view that the component is declared inside of. If the component itself has a view, this will be passed second.
3. `bind(bindingContext: Object, overrideContext: Object)` - Databinding is then activated on the view and view-model. If the view-model has a `bind` callback, it will be invoked at this time. The "binding context" to which the component is being bound will be passed first. An "override context" will be passed second. The override context contains information used to traverse the parent hierarchy and can also be used to add any contextual properties that the component wants to add. It should be noted that when the view-model has implemented the `bind` callback, the databinding framework will not invoke the changed handlers for the view-model's bindable properties until the "next" time those properties are updated. If you need to perform specific post-processing on your bindable properties, when implementing the `bind` callback, you should do so manually within the callback itself.
4. `attached()` - Next, the component is attached to the DOM (in document). If the view-model has an `attached` callback, it will be invoked at this time.
5. `detached()` - At some point in the future, the component may be removed from the DOM. If/When this happens, and if the view-model has a `detached` callback, this is when it will be invoked.
6. `unbind()` - After a component is detached, it's usually unbound. If your view-model has the `unbind` callback, it will be invoked during this process.

> Info: Bind callback stops initial "Changed" callbacks
> It should be noted that when the view-model has implemented the `bind` callback, the databinding framework will not invoke the changed handlers for the view-model's bindable properties until the "next" time those properties are updated. If you need to perform specific post-processing on your bindable properties, when implementing the `bind` callback, you should do so manually within the callback itself. For example, if you have a bindable property `foo`, implement the `fooChanged` callback, and you want `fooChanged` to be called on initial binding, then you will need to call it from within your `bind()` callback.

Tapping into a lifecycle event is as simple as implementing any of the above methods on the behavior's view-model class. Here's an example of a custom attribute that uses the attached and detached callbacks, something common when wrapping jQuery plugins:

<code-listing heading="some-plugin${context.language.fileExtension}">
  <source-code lang="ES 2015">
    export class SomePlugginCustomAttribute {
      static inject() { return [Element]; }

      constructor(element){
        this.element = element;
      }

      attached() {
        this.plugin = jQuery(this.element).somePlugin();
      }

      detached() {
        this.plugin.destroy();
      }
    }
  </source-code>
  <source-code lang="ES 2016">
    import {inject} from 'aurelia-framework';

    @inject(Element)
    export class SomePlugginCustomAttribute {
      constructor(element){
        this.element = element;
      }

      attached() {
        this.plugin = jQuery(this.element).somePlugin();
      }

      detached() {
        this.plugin.destroy();
      }
    }
  </source-code>
  <source-code lang="TypeScript">
    import {autoinject} from 'aurelia-framework';

    @autoinject
    export class SomePlugginCustomAttribute {
      plugin;

      constructor(private element: Element){ }

      attached() {
        this.plugin = jQuery(this.element).somePlugin();
      }

      detached() {
        this.plugin.destroy();
      }
    }
  </source-code>
</code-listing>

## Conclusion

If you've made it this far, you should have the basics down of creating HTML Behaviors. HTML Behaviors in Aurelia can be a Custom Element or a Custom Attribute. Both of these have ViewModels, while only Custom Elements can have Views. There is no need to use jQuery or `document.querySelector` to get the DOM Element your behavior is associated with, as you can simply have Aurelia inject it in to your ViewModel. You must make sure that an HTML Behavior is accessible to the template you are using it in, either by using the `require` element or by making the behavior a global resource. When doing either of these, you do not provide a file extension in the path for the behavior, unless you are specifying an HTML Only Custom Element.

You can create bindable properties for your Custom Elements by using the `@bindable` decorator, while Aurelia will call the `valueChanged` callback on your CustomAttribute's ViewModel if you are doing single-value binding to your Custom Attribute. And finally, HTML Only Custom Elements can have bindable properties if you specify them in the `bindable` attribute on the `template` element.

Now that you've got a solid foundation, we encourage you to read the more advanced and in-depth documentation regarding both Custom Elements and Custom Attributes! Happy Coding!
