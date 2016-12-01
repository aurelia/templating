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

## [Simple composition](aurelia-doc://section/2/version/1.0.0)

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
        <h1>I was dynamically composed via a `<compose>` element.</h1>
    </template>
  </source-code>
</code-listing>

Inside of our `hello-world.html` template, we are using the `<compose>` element and passing through a view-model (without file extension) to be rendered.

Because Aurelia is a framework that uses conventions, the `<compose>` element knows because we didn't specify a view, to use the default convention of loading the matching view for our view-model. So `compose-
