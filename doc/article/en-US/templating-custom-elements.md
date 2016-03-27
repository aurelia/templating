---
{
  "name": "Templating: Custom Elements Basics",
  "culture": "en-US",
  "description": "An overview of the Aurelia templating engine's custom element functionality basics. Custom Elements are used to add custom components to Aurelia applications.",
  "engines" : { "aurelia-doc" : "^1.0.0" },
  "author": {
  	"name": "Ashley Grant",
  	"url": "http://www.ashleygrant.com"
  },
  "contributors": [],
  "translators": [],
  "keywords": ["JavaScript", "Templating", "Custom Elements", "Basics"]
}
---
## [Introduction](aurelia-doc://section/1/version/1.0.0)

Custom elements are the primary tool an Aurelia application developer will utilize for componentizing an application.

## [HTML Only Custom Element](aurelia-doc://section/2/version/1.0.0)

The simplest way to create an Aurelia custom element is to create an Aurelia view template in an HTML file and then require it in to another Aurelia view template. HTML only custom elements are a highly useful strategy for dealing with functionality that has no need for ViewModel logic but is likely to be reused. The element name will be the same as the HTML file name, without the extension. When requiring an HTML only custom element in to a view, you must include the `.html` extension.  It is even possible to create bindable properties for an HTML only custom element by putting a comma separated list of property names on the `bindable` attribute of the `template` element. The Aurelia convention of converting camelCase bindable properties to dash-case applies to properties provided to the `bindable` attribute, as shown in the following example.

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

      <hello-world first-name="Albert" last-name="Einstein"></hello-world>
    </template>
  </source-code>
</code-listing>

HTML only custom elements may require in other custom elements and attributes as well as utilizing any other view resource just like any other Aurelia component may. HTML only custom elements also support explicit two-way databinding for properties, though it is not possible to create properties that default to two-way databinding with HTML only custom elements. For that type of functionality, you will need to provide a ViewModel for your custom element.

The following example shows an Aurelia view utilzing two-way databinding to an example HTML only custom element. The example HTML only custom element itself requires in other custom elements, and utilizes two-way databinding to those custom elements. Note that it is possible to use the full power of Aurelia's templating engine from an HTML custom element, such as using the `debounce` binding behavior.

<code-listing heading="app.html">
  <source-code lang="HTML">
    <template>
      <require from="./example.html"></require>

      Hello, ${guest}!
      <example name.two-way="guest"></example>
    </template>
  </source-code>
</code-listing>

<code-listing heading="example.html">
  <source-code lang="HTML">
    <template bindable="name">
      <require from="./yes-or-no.html"></require>
      <require from="./say-goodbye.html"></require>

      <p>What is your name? <input type="text" value.bind="name & debounce" /></p>
      <yes-or-no question="Are you leaving?" answer.two-way="sayGoodbye"></yes-or-no>
      <say-goodbye if.bind="sayGoodbye" name.bind="name"></say-goodbye>
    </template>
  </source-code>
</code-listing>

<code-listing heading="yes-or-no.html">
  <source-code lang="HTML">
    <template bindable="question, answer">
      <p>
        ${question} <input type="checkbox" checked.bind="answer" />
      </p>
    </template>
  </source-code>
</code-listing>

<code-listing heading="say-goodbye.html">
  <source-code lang="HTML">
    <template bindable="name">
      Goodbye, ${name}!
    </template>
  </source-code>
</code-listing>

## [Custom Element Basics](aurelia-doc://section/3/version/1.0.0)

 Creating custom elements using Aurelia is extremely simple. Simply creating a JavaScript and HTML file pair with the same name is all that is necessary to create an Aurelia custom element. The HTML file must contain an Aurelia template wrapped in a `template` element. The JavaScript file must export a JavaScript class. Aurelia's standard naming convention for custom element VM classes is to append `CustomElement` to the end of the class name, e.g. `SecretMessageCustomElement`. Aurelia will take the JavaScript class name, strip `CustomElement` from the end, and convert it from InitCaps to dash-case for the custom element's name. Note that this means it is possible for the custom element name to not match the file name. Thus, it is recommended to name your custom element files to match the custom element name. It is acceptable to export more than one class from the JavaScript file for a custom element. Aurelia will use the first class exported from the file as the custom element's view-model (VM). Note that each instance of a custom element will receive its own separate VM instance.


Custom elements are not allowed to be self-closing. This means that `<secret-message />` will not work. When using a custom element, you must provide a closing tag as shown in `app.html` below.

 <code-listing heading="secret-message.${context.language.fileExtension}">
  <source-code lang="ES 2015/2016">
    export class SecretMessageCustomElement {
      secretMessage = 'Be sure to drink your Ovaltine!';
    }
  </source-code>
  <source-code lang="Typescript">
    export class SecretMessageCustomElement {
      secretMessage:string = 'Be sure to drink your Ovaltine!';
    }
  </source-code>
</code-listing>

<code-listing heading="secret-message.html">
  <source-code lang="HTML">
    <template>
      ${secretMessage}
    </template>
  </source-code>
</code-listing>

<code-listing heading="app.html">
  <source-code lang="HTML">
    <template>
      <require from="./secret-message"></require>

      And now, it's time for a secret message: <secret-message></secret-message>
    </template>
  </source-code>
</code-listing>

It is also possible to explicitly name your custom element by using the `customElement` decorator on the VM class. Simply pass a string to this decorator with the exact name you wish to use for your custom element. Aurelia will not convert the string you pass it to dash-case. This means that `@customElement('SecretMessage')` is not converted to `secret-message` but to `secretmessage`. If any uppercase letters are passed to the decorator and development logging is enabled, Aurelia will log a message alerting you that it has lowercased the name. This is because the DOM is not case-sensitive. Thus you must be explicit about any dashes in the attribute name when using this decorator, e.g. `@customElement('secret-message')`.

Aurelia custom elements do not need to follow the naming conventions for Web Components custom elements. Namely, Aurelia allows you to create custom elements that do not have a dash in their name. This is because the Web Components specs reserve all single-word element names for the browser. Thus, you are free to create a `foo` custom element with Aurelia; however, it is recommended to refrain from creating single-world custom elements to avoid any chance of a possible naming clash in the future. Also, any Aurelia custom elements that are intended to be used as standalone Web Components custom elements MUST have a dash in their name.

Before we move on, let's discuss just how easy it is to create a custom element in Aurelia and the impact it has on Aurelia's naming conventions for custom element view-model classes. One capability of the Aurelia framework is that it can take components that were originally created for use as a page in an application and use them as custom elements. When this happens, Aurelia will use the component's VM class name, dash-case it and use that as the custom element's name. Let's say there is an Aurelia application that provides various pages, one of which is the `Contact` page. All it takes to use the `Contact` page as a custom element on any page in the application is to `require` it in to the view. At that point, it is available as the `contact` custom element in that view. It is even possible to provide bindable properties for the page that can be used when using the page as a custom element. This means that, if you wish, you may ignore the Aurelia naming convention for your custom elements. In the example above, we could have simply named the class `SecretMessage`. The custom element would still be named `secret-message`. Given this capability, it might be considered wise to utilize Aurelia's naming convention for custom elements or use the `customElement` decorator to be explicit when creating a component that is only meant to be used as a custom element and not as a standalone page.

## [Bindable Properties](aurelia-doc://section/4/version/1.0.0)

Any properties or functions of the VM class may be used for binding within the custom element's view; however, a custom element must specify the properties that will be bindable as attributes on the custom element. This is done by decorating each bindable property with the `bindable` decorator. The default binding mode for bindable properties is one-way. This means that a property value can be bound *in* to your custom element, but any changes the custom element makes to the property value will not be propogated *out* of the custom element. This default may be overridden, if needed, by passing a settings object to the `bindable` decorator with a property named `defaultBindingMode` set. This property should be set to one of the three `bindingMode` options: `oneTime`, `oneWay`, or `twoWay`. Both `bindable and `bindingMode` may be imported from the `aurelia-framework` module. Let's look at an example custom element with a bindable property that defaults to two-way binding.

 <code-listing heading="secret-message.${context.language.fileExtension}">
  <source-code lang="ES 2015/2016">
    import {bindable, bindingMode} from 'aurelia-framework';

    export class SecretMessageCustomElement {
      @bindable({ defaultBindingMode: bindingMode.twoWay }) message;
      @bindable allowDestruction = false;

      constructor() {
        setInterval(() => this.deleteMessage(), 10000 );
      }

      deleteMessage() {
        if(this.allowDestruction === true ) {
          this.message = '';
        }
      }
    }
  </source-code>
  <source-code lang="Typescript">
    import {bindable, bindingMode} from 'aurelia-framework';

    export class SecretMessageCustomElement {
      @bindable({ defaultBindingMode: bindingMode.twoWay }) message: string;
      @bindable allowDestruction: boolean = false;

      constructor() {
        setInterval(() => this.deleteMessage(), 10000 );
      }

      deleteMessage() {
        if(this.allowDestruction === true ) {
          this.message = '';
        }
      }
    }
  </source-code>
</code-listing>

<code-listing heading="secret-message.html">
  <source-code lang="HTML">
    <template>
      <p>
        Urgent, secret message: ${message}
      </p>
      <p>
        This message will ${allowDestruction === false ? 'not ' : '' } self-destruct in less than 10 seconds!
      </p>
    </template>
  </source-code>
</code-listing>

<code-listing heading="app.html">
  <source-code lang="HTML">
    <template>
      <require from="./secret-message"></require>

      <p>
        Secret Message: <input type="text" value.bind="message" />
      </p>
      <p>
        Allow Message to Destruct? <input type="checkbox" checked.bind="allowDestruction" />
      </p>
      <secret-message message.bind="message" allow-destruction.bind="allowDestruction" ></secret-message>
    </template>
  </source-code>
</code-listing>

In this example, the `secret-message` custom element will check every ten seconds to see if it needs to destroy (set to an empty string) the message it receives via databinding. When told to destroy the message, Aurelia's databinding system will update the bound property of the component using the custom element, thanks to the custom element specifying that this property's default binding mode is two-way. Thus, the text box will be cleared when the message "self destructs."  Of course, the component using the custom element is free to override this default by explicitly specifying the binding direction via the `one-way`, `two-way`, or `one-time` binding commands.

Whether a secret message that is only shown to the person who writes the message is very useful is for you to decide.
