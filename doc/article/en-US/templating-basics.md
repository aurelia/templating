---
name: "Templating: Basics"
description: A basic guide to using Aurelia's templating engine.
author: Scott Jackson (http://www.scottmmjackson.com)
---

## Introduction

Aurelia's templating system is simple to learn, and yet powerful enough to build even the most complex applications.
This article will walk you through the construction of a static template, importing that template into parent
templates, binding and manipulating data through the view-model, and the use of conditionals, repeaters, and events.

## A Simple Template

All Aurelia templates must be wrapped with a `<template>` element. The most basic template is a component that prints
"Hello World":

<code-listing heading="hello-world.html">
  <source-code lang="HTML">
    <template>
      <p>
    	  Hello, World!
      </p>
    </template>
  </source-code>
</code-listing>

This template could be a page in an Aurelia application, or it could be the view for a custom element. A template
containing only boilerplate could be useful as a footer containing copyright information or disclaimers, but where's
the fun in a static template?

All Aurelia templates work with a view-model, so let's create one:

<code-listing heading="hello${context.language.fileExtension}">
  <source-code lang="ES2015/ES2016/TypeScript">
    export class Hello {
      constructor() {
        this.name = 'John Doe';
      }
    }
  </source-code>
</code-listing>

Let's bind the `name` property in our view-model into our template using Aurelia's string interpolation:

<code-listing heading="hello.html">
  <source-code lang="HTML">
    <template>
      <p>
    	  Hello, ${name}!
      </p>
    </template>
  </source-code>
</code-listing>

One of the key features of Aurelia's templating system is helping to reduce context switching between your javascript
code and your template markup. String interpolation using the `\${}` operator is a new feature in ES2015 that makes it
 simple to insert values into a string. Thus, Aurelia uses this standard syntax in your templates.

When this template is run, Aurelia will insert the value of the `name` property into the template where `\${name}`
appears. Pretty simple, right? But what if we want logic in our string interpolation. Can we add our own expressions?
 Absolutely!

<code-listing heading="greeter.html">
  <source-code lang="HTML">
    <template>
      <p>
    	  ${arriving ? 'Hello' : 'Goodbye'}, ${name}!
      </p>
    </template>
  </source-code>
</code-listing>

<code-listing heading="greeter${context.language.fileExtension}">
  <source-code lang="ES2015/ES2016/TypeScript">
    export class Greeter {
      constructor() {
        this.name = 'John Doe';
        this.arriving = true;
        setTimeout(
          () => this.arriving = false,
          5000);
      }
    }
  </source-code>
</code-listing>

In our template, when `arriving` is true, the ternary operator makes our result `'Hello'`, but when it's false, it
makes our result `'Goodbye'`. Our view-model code initializes `arriving` to `true` and changes it to `false` after 5
seconds (5000 milliseconds). So when we run the template, it will say "Hello, John Doe!" and after 5 seconds, it will
 say "Goodbye, John Doe!". Aurelia re-evaluates the string interpolation when the value of `arriving` changes!

But don't worry, there is no dirty-checking. Aurelia uses an observable-based binding system that reacts to changes
as they happen without having to do dirty-checking. This means that Aurelia doesn't slow down as you add more complex
 functionality to your template and view-model.

## Binding

Binding in Aurelia allows data from the view-model to drive template behavior. The most basic example of binding
is linking a text box to the view model using `value.bind`. What if we let the user decide who they want to greet,
and whether to say Hello or Goodbye?

<code-listing heading="greeter.html">
  <source-code lang="HTML">
    <template>
      <label for="nameField">
        Who to greet?
      </label>
      <input type="text" value.bind="name" id="nameField">
      <label for="arrivingBox">
        Arriving?
      </label>
      <input type="checkbox" checked.bind="arriving" id="arrivingBox">
      <p>
    	  ${arriving ? 'Hello' : 'Goodbye'}, ${name}!
      </p>
    </template>
  </source-code>
</code-listing>

<code-listing heading="greeter${context.language.fileExtension}">
  <source-code lang="ES2015/ES2016/TypeScript">
    export class Greeter {
      constructor() {
        this.name = 'John Doe';
        this.arriving = true;
      }
    }
  </source-code>
</code-listing>

Above, we have a text box that asks for the name of the person to greet, and a checkbox indicating whether they're
arriving. Because we defined `name` as "John Doe" in our view-model, the initial value of the text-box will be "John
Doe", and with `arriving` set to `true`, our checkbox will start checked. When we change the name, the person we're
greeting will change with it: "Hello, Jane Doe!". If we uncheck the box, the greeting will change: "Goodbye, Jane Doe!"

Notice that the way we set up the binding was by using `value.bind` and `checked.bind`. That `.` within the attribute is important: whenever you see the `.`, Aurelia is going to do something with that attribute. The most important thing to take away from this section is understanding that Aurelia will link attributes to the left of the `.` with actions to the right of the `.`.

You can learn more about data-binding in the Binding section of our docs.

### Binding Focus

We can also use two-way data binding to communicate whether or not an element has focus:

<code-listing heading="bind-focus.html">
  <source-code lang="HTML">
    <template>
      <input focus.bind="hasFocus">
      ${hasFocus}
    </template>
  </source-code>
</code-listing>

When we click the input field, we see "true" printed. When we click elsewhere, it changes to "false".

### Binding Scopes Using `with`

We can also declare that certain parts of our markup will be referencing properties of an object in the view model, as below:

<code-listing heading="bind-with.html">
  <source-code lang="HTML">
    <template>
      <p with.bind="first">
        <input type="text" value.bind="message">
      </p>
      <p with.bind="second">
        <input type="text" value.bind="message">
      </p>
    </template>
  </source-code>
</code-listing>

<code-listing heading="bind-with${context.language.fileExtension}">
  <source-code lang="ES2015/ES2016/TypeScript">
    export class Hello {
      constructor() {
        this.first = {
          message : 'Hello'
        };
        this.second = {
          message : 'Goodbye'
        }
      }
    }
  </source-code>
</code-listing>

Using `with` is basically shorthand for "I'm working on properties of this object", which lets you reuse code as necessary.

## Composition

In order to live by the DRY (Don't Repeat Yourself) Principle, we don't necessarily want to rely on tight coupling
between our view and view-model pairs. Wouldn't it be great if there was a custom element that would arbitrarily combine
an HTML template, a view-model, and maybe even some initialization data for us? As it turns out, we're in luck:


<code-listing heading="compose-template.html">
  <source-code lang="HTML">
    <template>
      <compose view-model="hello"
               view="./hello.html"
               model.bind="{ target : 'World' }" ></compose>
    </template>
  </source-code>
</code-listing>

<code-listing heading="hello.html">
  <source-code lang="HTML">
    <template>
      Hello, ${friend}!
    </template>
  </source-code>
</code-listing>

<code-listing heading="hello${context.language.fileExtension}">
  <source-code lang="ES2015/ES2016/TypeScript">
  export class Hello {
    activate(model) {
      this.friend = model.target;
    }
  }
  </source-code>
</code-listing>

Note that the view-model we're composing into has an `activate` method. When we use `model.bind`, the contents are passed to `activate`. We then pull the exact value that we need out of the passed model and assign it.

## The as-element Attribute

In some cases, especially when creating table rows out of Aurelia custom elements, you may need to have a custom element masquerade as a standard HTML element. For example, if you're trying to fill table rows with data, you may need your custom element to appear as a `<tr>` row or `<td>` cell. This is where the `as-element` attribute comes in handy:

<code-listing heading="as-element.html">
  <source-code lang="HTML">
    <template>
      <require from="./hello-row.html"></require>
      <table>
        <tr as-element="hello-row">
      </table>
    </template>
  </source-code>
</code-listing>

<code-listing heading="hello-row.html">
  <source-code lang="HTML">
    <template>
      <td>Hello</td>
      <td>World</td>
    </template>
  </source-code>
</code-listing>

The `as-element` attribute tells Aurelia that we want the content of the table row to be exactly what our `hello-row` template wraps. The way different browsers render tables means this may be necessary sometimes.

## The View Resource Pipeline

The basic idea behind the View Resource Pipeline is that we're not limited to HTML or JavaScript. A basic example would be pulling in Bootstrap:

<code-listing heading="hello.html">
  <source-code lang="HTML">
    <template>
      <require from="bootstrap/css/bootstrap.min.css"></require>
      <p class="lead">Hello, World!</p>
      <p>Lorem Ipsum...</p>
    </template>
  </source-code>
</code-listing>

Here, the `<require>` tag is taking a CSS file, instead of html or a view model. The View Resource Pipeline is the part of Aurelia that's responsible for recognizing that it's CSS, and handling it appropriately. One of the most powerful features of Aurelia is that the View Resource Pipeline is completely extensible, allowing you to define your own handler for any type of view resource you might want to define!

## View and Compilation Spies

If you've installed the `aurelia-testing` plugin, you have access to two special templating behaviors:

<code-listing heading="hello.html">
  <source-code lang="HTML">
    <template>
      <p view-spy compile-spy>Hello!</p>
    </template>
  </source-code>
</code-listing>

`view-spy` drops Aurelia's copy of the View object into the console, while `compile-spy` emits the compiler's TargetInstruction. This is especially useful for debugging any new View Resources you've created using the View Resource Pipeline.

## Conditionals

Aurelia has two major tools for conditional display: `if`, and `show`. The difference is that `if` removes the element
entirely from the DOM, and `show` toggles the `aurelia-hide` CSS class which controls the element's visibility.

The difference is subtle but important in terms of speed and usability. When the state changes in `if`, the template
and all of its children are deleted from the DOM, which is computationally expensive if it's being done over and over.
However, if `show` is being used for a very large template, such as a dashboard containing thousands of elements with
their own bound data, then keeping those elements loaded-but-hidden may not end up being a useful approach.

Here's our basic "Hello World" that asks the user if they want to greet the world first:

<code-listing heading="if-template.html">
  <source-code lang="HTML">
    <template>
      <label for="greet">Would you like me to greet the world?</label>
      <input type="checkbox" id="greet" checked.bind="greet">
      <div if.bind="greet">
        Hello, World!
      </div>
    </template>
  </source-code>
</code-listing>

However, if we just want to hide the element from view instead of destroying it completely, we should use `show`
instead of `if`.

<code-listing heading="show-template.html">
  <source-code lang="HTML">
    <template>
      <label for="greet">Would you like me to greet the world?</label>
      <input type="checkbox" id="greet" checked.bind="greet">
      <div show.bind="greet">
        Hello, World!
      </div>
    </template>
  </source-code>
</code-listing>

When unchecked, our "Hello World" div will have the `aurelia-hide` class, which sets `display: none` if you're using
Aurelia's CSS libraries. However, if you don't want to do that, you can also define your own CSS rules that treat
`aurelia-hide` differently, like setting `visibility: none` or `height: 0px`.

Conditionals can also be one-time bound, so that parts of the template are fixed when they're instantiated:

<code-listing heading="conditional-one-time-template.html">
  <source-code lang="HTML">
    <template>
      <div if.one-time="greet">
        Hello, World!
      </div>
      <div if.one-time="!greet">
        Some other time.
      </div>
    </template>
  </source-code>
</code-listing>

<code-listing heading="bind-template${context.language.fileExtension}">
  <source-code lang="ES2015/ES2016">
    export class ConditionalOneTimeTemplate {
      greet = (Math.random() > 0.5);
    }
  </source-code>
  <source-code lang="Typescript">
    export class ConditionalOneTimeTemplate {
      greet = (Math.random() > 0.5);
    }
  </source-code>
</code-listing>

There's a 50-50 chance that we'll greet the world, or put it off until later. Once the page loads, this is fixed,
because the data is one-time bound. Why don't we use `show.one-time`? If we think about what `show` does, it doesn't
really make sense. We're saying we want a CSS class to be applied that will hide an element, and that it will never
change. In most cases, we want `if` to refuse to create an element we'll never use.

Complementing `if`, there is `else`. Used in conjunction with `if`, `else` will render its content when `if` does
not evaluate to true.

<code-listing heading="if-else-template.html">
  <source-code lang="HTML">
    <template>
      <div if.bind="showMessage">
        <span>${message}</span>
      </div>
      <div else>
        <span>Nothing to see here</span>
      </div>
    </template>
  </source-code>
</code-listing>

Elements using the `else` template modifier must follow an `if` bound element to make contextual sense and function properly.

## Repeaters

Repeaters can be used on any element, including custom elements, and template elements too! Here are a few different data types that can be iterated with a repeater.

### Arrays

Aurelia is also able to repeat elements for each element in an array.

<code-listing heading="repeater-template.html">
  <source-code lang="HTML">
    <template>
      <p repeat.for="friend of friends">Hello, ${friend}!</p>
    </template>
  </source-code>
</code-listing>

<code-listing heading="repeater-template${context.language.fileExtension}">
  <source-code lang="ES2015/ES2016/TypeScript">
  export class RepeaterTemplate {
    constructor() {
      this.friends = [
        'Alice',
        'Bob',
        'Carol',
        'Dana'
      ];
    }
  }
  </source-code>
</code-listing>

This allows me to list out my friends and greet them one by one, rather than attempting to greet all 7 billion
inhabitants of the world at once.

As mentioned before, we can also use the template element as our repeater - but we have to wrap it in a surrogate `<template>` element:

<code-listing heading="repeater-template.html">
  <source-code lang="HTML">
    <template>
      <template repeat.for="friend of friends">
        <p>Hello, ${friend}!</p>
      </template>
    </template>
  </source-code>
</code-listing>

> Info
> Aurelia will not be able to observe changes to arrays using the `array[index] = value` syntax. To ensure that
Aurelia can observe the changes on your array, make use of the Array methods: `Array.prototype.push`, `Array.prototype.pop` and
`Array.prototype.splice`.

Two-way binding with arrays requires a special syntax due to the nature of the `for-of` loop in javascript. Do not use `repeat.for="item of dataArray"`;doing so will result in one-way binding only - values typed into an input will not be bound back. Instead use the following syntax:

<code-listing heading="repeater-template-input.html">
  <source-code lang="HTML">
	<template>
		<div repeat.for="i of dataArray.length">
		<input type="text" value.bind="$parent.dataArray[i]">
		</div>
	</template>
  </source-code>
</code-listing>



### Range

We can also iterate over a numerical range:

<code-listing heading="repeater-template.html">
  <source-code lang="HTML">
    <template>
      <p repeat.for="i of 10">${10-i}</p>
      <p>Blast off!</p>
    </template>
  </source-code>
</code-listing>

Note that the range will start at 0 with a length of 10, so our countdown really does start at 10 and end at 1 before blast off.

### Sets

I can also use an ES6 Set in the same way:

<code-listing heading="repeater-template.html">
  <source-code lang="HTML">
    <template>
      <p repeat.for="friend of friends">Hello, ${friend}!</p>
    </template>
  </source-code>
</code-listing>

<code-listing heading="repeater-template${context.language.fileExtension}">
  <source-code lang="ES2015/ES2016/TypeScript">
  export class RepeaterTemplate {
    constructor() {
      this.friends = new Set();
      this.friends.add('Alice');
      this.friends.add('Bob');
      this.friends.add('Carol');
      this.friends.add('Dana');
    }
  }
  </source-code>
</code-listing>

We can use repeaters with arrays, which is useful - but we can also use repeaters with other iterable data types, including objects, plus new ES6 standards such as Map and Set.

### Map

One of the more useful iterables is the Map, because you can decompose your key and value into two variables directly in the repeater. Although you can repeat over objects straightforwardly, Maps can be two-way bound much more straightforwardly than Objects, so you should try to use Maps where possible.

<code-listing heading="repeater-template.html">
  <source-code lang="HTML">
    <template>
      <p repeat.for="[greeting, friend] of friends">${greeting}, ${friend.name}!</p>
    </template>
  </source-code>
</code-listing>

<code-listing heading="repeater-template${context.language.fileExtension}">
  <source-code lang="ES2015/ES2016/TypeScript">
  export class RepeaterTemplate {
    constructor() {
      this.friends = new Map();
      this.friends.set('Hello',
        { name : 'Alice' });
      this.friends.set('Hola',
        { name : 'Bob' });
      this.friends.set('Ni Hao',
        { name : 'Carol' });
      this.friends.set('Molo',
        { name : 'Dana' });
    }
  }
  </source-code>
</code-listing>

One thing to notice in the example above is the dereference operator in `[greeting, friend]` - which breaks apart the map's key-value pair into `greeting`, the key, and `friend`, the value. Note that because all of our values are objects with the `name` property set, we can get our friend's name with `\${friend.name}`, just as if we were getting it from JavaScript!

### Objects

Let's do the same thing, except with a traditional JavaScript object in our view-model:

<code-listing heading="repeater-template.html">
  <source-code lang="HTML">
    <template>
      <p repeat.for="greeting of friends | keys">${greeting}, ${friends[greeting].name}!</p>
    </template>
  </source-code>
</code-listing>

<code-listing heading="repeater-template${context.language.fileExtension}">
  <source-code lang="ES2015/ES2016/TypeScript">
  export class RepeaterTemplate {
    constructor() {
      this.friends = {
        'Hello':
          { name : 'Alice' },
        'Hola':
          { name : 'Bob' },
        'Ni Hao':
          { name : 'Carol' },
        'Molo':
          { name : 'Dana' }
      }
    }
  }

  export class KeysValueConverter {
    toView(obj) {
      return Reflect.ownKeys(obj);
    }
  }

  </source-code>
</code-listing>

We just introduced something called a "value converter". Basically, we take the object in our view model, `friends`, and run it through our `keys` value converter. Aurelia looks for a class named `KeysValueConverter` and tries to call its `toView()` method with our `friends` object. That method returns an array of keys- which we can iterate. In a pinch, we can use this to iterate over Objects.

A common question pops up here: Why can't we just dereference the object into `[key, value]` like we did with Maps? The short answer is that JavaScript objects aren't iterable in the same way that Arrays, Maps, and Sets are. So in order to iterate over JavaScript objects, we have to transform them into something that is iterable. The way you approach it will change based on what exactly you want to do with that object. There is also a [plugin](https://github.com/martingust/aurelia-repeat-strategies) that can be included, which will transform Objects to become iterable maps that can be dereferenced using the `[key, value]` syntax.
