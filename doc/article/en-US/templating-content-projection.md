---
name: "Templating: Content Projection"
description: An overview of the Aurelia templating engine's custom element content projection functionality.
author: Ashley Grant (http://www.ashleygrant.com)
---
## Introduction

Most of the standard HTML elements allow for content inside them. Custom Elements would be of limited use if we couldn't put content inside them. Thus, we need a way to take this content and place it inside our custom element's template. The Shadow DOM spec provides the `slot` processing instruction for doing this. Let's explore the various strategies available for utilizing content projection.

## Basic Content Projection

Let's create a name tag custom element. When the `name-tag` element is used, it will take the name it will display as content in the element.

<code-listing heading="Name Tag Element Usage">
  <source-code lang="HTML">
    <name-tag>
      Ralphie
    </name-tag>
  </source-code>
</code-listing>

Aurelia custom elements utilize the "slot based" content projection standard from the Web Component specifications. Let's look at how this will work with our `name-tag` element. This custom element utilizes a single slot, so we simply need to add a `<slot></slot>` element in our template where we would like content to be projected.

<code-listing heading="name-tag.html">
  <source-code lang="HTML">
    <template>
      <div class="header">
        Hello, my name is
      </div>
      <div class="name">
        <slot></slot>
      </div>
    </template>
  </source-code>
</code-listing>

Aurelia will project the element's content in to the template where the `<slot></slot>` element is located.

## Named Slots

The scenario above uses a "default" slot because the `slot` has no `name` attribute. In Shadow DOM, you can create as many slots as you want, provided that you give them different names. Then, the content that gets projected into the Shadow DOM must specify which slot it wants using a `slot` attribute. If it indicates no particular slot (or is plain text) it will get projected into the default slot. Here's an example of named slots:

<code-listing heading="named-slot.html">
  <source-code lang="HTML">
    <template>
      <div>
        The first slot:
        <div>
          <slot name="slot1"></slot>
        </div>
        The second slot:
        <div>
          <slot name="slot2"></slot>
        </div>
      </div>
    </template>
  </source-code>
</code-listing>

<code-listing heading="Usage">
  <source-code lang="HTML">
    <named-slot>
      <div slot="slot1">
        This Goes in Slot 1
      </div>

      <div slot="slot2">
        This Goes in Slot 2
      </div>
    </named-slot>
  </source-code>
</code-listing>

<code-listing heading="The Composed Visual Tree">
  <source-code lang="HTML">
    <named-slot>
      <div>
        The first slot:
        <div>
          <div slot="slot1">
            This Goes in Slot 1
          </div>
        </div>
        The second slot:
        <div>
          <div slot="slot2">
            This Goes in Slot 2
          </div>
        </div>
      </div>
    </named-slot>
  </source-code>
</code-listing>

## Fallback Slots

A nice feature of slots is that they can have fallback content. If nothing gets projected into the slot, the slot will render its fallback content:

<code-listing heading="fallback-content.html">
  <source-code lang="HTML">
    <template>
      <div>
        The first slot:
        <div>
          <slot name="slot1"></slot>
        </div>
        The second slot:
        <div>
          <slot name="slot2">This is some fallback content for slot 2...</slot>
        </div>
      </div>
    </template>
  </source-code>
</code-listing>

<code-listing heading="Usage">
  <source-code lang="HTML">
    <fallback-content>
      <div slot="slot1">
        This Goes in Slot 1
      </div>
    </fallback-content>
  </source-code>
</code-listing>

<code-listing heading="The Composed Visual Tree">
  <source-code lang="HTML">
    <named-slot>
      <div>
        The first slot:
        <div>
          <div slot="slot1">
            This Goes in Slot 1
          </div>
        </div>
        The second slot:
        <div>
          This is some fallback content for slot 2...
        </div>
      </div>
    </named-slot>
  </source-code>
</code-listing>

Ok, now it's time to get crazy. What if the fallback content generates more slots!? Those fallback slots can be targeted by the content. Here's an example based on [a post from the WebKit team](https://webkit.org/blog/4096/introducing-shadow-dom-api/):

<code-listing heading="contact-card.html">
  <source-code lang="HTML">
    <template>
      <b>Name</b>:
      <slot name="fullName">
        <slot name="firstName"></slot>
        <slot name="lastName"></slot>
      </slot><br>

      <b>Email</b>:
      <slot name="email">Unknown</slot><br>

      <b>Address</b>:
      <slot name="address">Unknown</slot>
    </template>
  </source-code>
</code-listing>


<code-listing heading="Usage">
  <source-code lang="HTML">
    <contact-card>
      <span slot="fullName">John Doe</span>
      <span slot="address">123 Main Street</span>
    </contact-card>

    <contact-card>
      <span slot="firstName">Billy</span>
      <span slot="lastName">Bob</span>
      <span slot="email">billy@bob.com</span>
    </contact-card>
  </source-code>
</code-listing>

<code-listing heading="The Composed Visual Tree">
  <source-code lang="HTML">
    <contact-card>
      <b>Name</b>:
      <span slot="fullName">John Doe</span><br>

      <b>Email</b>:
      Unknown<br>

      <b>Address</b>:
      <span slot="address">123 Main Street</span>
    </contact-card>

    <contact-card>
      <b>Name</b>:
      <span slot="firstName">Billy</span>
      <span slot="lastName">Bob</span><br>

      <b>Email</b>:
      <span slot="email">billy@bob.com</span><br>

      <b>Address</b>:
      Unknown
    </contact-card>
  </source-code>
</code-listing>

That was fun! But we can go deeper. What about slots, that target other slots with fallback content that generates slots...

<code-listing heading="mixed-slot.html">
  <source-code lang="HTML">
    <template>
      <div>
        The first slot:
        <div>
          <slot name="slot1">
            Default content for Slot 1
          </slot>
        </div>
        The default slot:
        <div>
          <slot>
            Default Content for the Default Slot
          </slot>
        </div>
        The second slot:
        <div>
          <slot name="slot2">
            The first fallback slot:
            <div>
              <slot name="fallbackSlot1">
                Default Content for Fallback Slot 1
              </slot>
            </div>
            The second fallback slot:
            <div>
              <slot name="fallbackSlot2"></slot>
            </div>
          </slot>
        </div>
      </div>
    </template>
  </source-code>
</code-listing>

<code-listing heading="slot-to-mixed-slot.html">
  <source-code lang="HTML">
    <template>
      <require from="./mixed-slot"></require>

      <div>
        <mixed-slot>
          <slot name="slot1" slot="slot1">Fallback Content for Projected Slot 1</slot>
          <slot name="slot2" slot="fallbackSlot2">Fallback Content for Projected Slot 2</slot>
        </mixed-slot>
      </div>
    </template>
  </source-code>
</code-listing>

<code-listing heading="Usage">
  <source-code lang="HTML">
    <slot-to-mixed-slot>
      <div slot="slot2">This is user content for slot 2. (should appear in fallbackSlot2)</div>
    </slot-to-mixed-slot>
  </source-code>
</code-listing>

<code-listing heading="The Composed Visual Tree">
  <source-code lang="HTML">
    <slot-to-mixed-slot>
      <div>
        The first slot:
        <div>
          Fallback Content for Projected Slot 1
        </div>
        The default slot:
        <div>
          Default Content for the Default Slot
        </div>
        The second slot:
        <div>
          <slot name="slot2">
            The first fallback slot:
            <div>
              Default Content for Fallback Slot 1
            </div>
            The second fallback slot:
            <div>
              <div slot="slot2">This is user content for slot 2. (appearing in fallbackSlot2)</div>
            </div>
          </slot>
        </div>
      </div>
    </slot-to-mixed-slot>
  </source-code>
</code-listing>

## Slot Implementation Limitations

At the time this document is written, no browser supports [Shadow DOM](https://w3c.github.io/webcomponents/spec/shadow/) v1 slots. Thus, Aurelia has implemented the specification. We haven't attempted to create a "generic" polyfill designed to be used outside of Aurelia. Our slots implementation is baked into Aurelia's templating compiler and renderer so that it can provide maximum performance and meet the needs of our community. We haven't attempted to implement all the APIs of the spec, but rather to emulate the declarative rendering capabilities of slots. By programming against Aurelia in this way, you don't need to worry about whether or not your browser does or does not support slots natively. Aurelia will take care of it for you.

Known limitations of our implementation are as follows:

* You cannot data-bind the slot's `name` attribute.
* You cannot data-bind the `slot` attribute.
* You cannot dynamically generate `slot` elements inside a component's view.

For example, the following would fail because the slot cannot be dynamic, however `show.bind` would be okay as the slot is generated but show hides it using css. Using template parts would be another alternative or applying `if.bind` to the content inside the slot.

<code-listing heading="Invalid Slot Usage">
  <source-code lang="HTML">
    <template>
      <div if.bind="something">
        <slot></slot>
      </div>
    </template>
  </source-code>
</code-listing>
