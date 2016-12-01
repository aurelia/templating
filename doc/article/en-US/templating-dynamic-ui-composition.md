---
{
  "name": "Templating: Dynamic UI Composition",
  "culture": "en-US",
  "description": "An overview of Aurelia's dynamic template composition functionality.",
  "engines" : { "aurelia-doc" : "^1.0.0" },
  "author": {
   	"name": "Dwayne Charrington",
	"url": "http://www.ilikekillnerds.com"
  },
  "contributors": [],
  "translators": [],
  "keywords": ["JavaScript", "Templating", "Composition", "Dynamic", "Compose", "UI"]
}
---

## [Introduction](aurelia-doc://section/1/version/1.0.0)

In this section, we are going to be learning how you can dynamically compose inside of your applications utilising Aurelia's dynamic composition functionality.

In many aspects, dynamic composition closely resembles that of how Aurelia's routing works. The big exception of course is dynamic composition allows you to dynamically render views and view-models after the page has loaded.

When using Aurelia's `<compose>` element, inside of the view-model being used, you have access to all of Aurelia's standard lifecycle events such as `activate` and `attached`, as well as the other callback hooks.

## [Basic composition](aurelia-doc://section/2/version/1.0.0)

Using the `<compose>` element, we are going to be dynamically composing a view.

<code-listing heading="hello-world.html">
  <source-code lang="HTML">
    <template>
        <compose view-model="./compose-me"></compose>
    </template>
  </source-code>
</code-listing>

<code-listing heading="compose-me${context.language.fileExtension}">
  <source-code lang="ES 2016">
    export class ComposeMe {
    }
  </source-code>
</code-listing>

<code-listing heading="compose-me.html">
  <source-code lang="HTML">
    <template>
        <p>Hello World!!</p>
    </template>
  </source-code>
</code-listing>

Inside of our `hello-world.html` template, we are using the `<compose>` element and passing through a view-model (without file extension) to be rendered. The view-model is just a standard class, like you create elsewhere in an Aurelia application.

Because Aurelia is a convention based framework, the `<compose>` element knows because we didn't specify a view, to use the default convention of loading the matching view for our view-model of the same name.

## [Composing without a view-model](aurelia-doc://section/3/version/1.0.0)
If you're wanting to dynamically compose just a view template without specifying a view-model, all you need to do is omit the `view-model` property and supply a view. What will happen is the current view-model will be used as the binding context for our view, allowing you to create HTML partials that take the current properties and methods.

<code-listing heading="hello-world.html">
  <source-code lang="HTML">
    <template>
        <compose view="./compose-me.html"></compose>
    </template>
  </source-code>
</code-listing>

<code-listing heading="compose-me.html">
  <source-code lang="HTML">
    <template>
        <p>Hello World!!</p>
    </template>
  </source-code>
</code-listing>

For the view property, we need to specify a file extension, unlike the view-model property, which does not have an extension. The above example will work the same way as our first example, except we're not supplying our own view-model.

## [Passing through data](aurelia-doc://section/4/version/1.0.0)
Using what we learned above, we can dynamically compose view-models and views and pass through additional data via the `model` property on the `<compose>` element.

We are going to be building an example which will dynamically render a view/view-model pair and accept an object of provided values.

<code-listing heading="hello-world${context.language.fileExtension}">
  <source-code lang="ES 2016">
    export class HelloWorld {
        constructor() {
          this.data = {
            name: 'Rob Eisenberg',
            company: 'Durandal',
            likes: ['Javascript', 'fruit', 'jelly']
          };
        }
    }
  </source-code>
  <source-code lang="Typescript">
    export class HelloWorld {
        private data = {
          name: 'Rob Eisenberg',
          company: 'Durandal',
          likes: ['Javascript', 'fruit', 'jelly']
        };
    }
  </source-code>
</code-listing>

<code-listing heading="hello-world.html">
  <source-code lang="HTML">
    <template>
        <compose view-model="./compose-me" model.bind="data"></compose>
    </template>
  </source-code>
</code-listing>

<code-listing heading="compose-me${context.language.fileExtension}">
  <source-code lang="ES 2016">
    export class ComposeMe {
      activate(model) {
        this.data = model;
      }
    }
  </source-code>
  <source-code lang="Typescript">
    export class ComposeMe {
      private data: any = {};
      
      activate(model) {
        this.data = model;
      }
    }
  </source-code>
</code-listing>

If you have worked with the Aurelia router before and router parameters, you will notice we obtain the provided model object the same way: as the first argument of the `activate` method. We then store the object on our class itself, making it available in our HTML view under a property called `data`.

<code-listing heading="compose-me.html">
  <source-code lang="HTML">
    <template>
        <p>Hello, I am ${data.name} and my company is ${data.company}</p>
        <p>My likes include:</p>
        <ol>
          <li repeat.for="like of data.likes">${like}</li>
        </ol>
    </template>
  </source-code>
</code-listing>

Notice how we are referencing values on our provided object; `name`, `company` and then looping over an array of provided strings for `likes`?
