import { Aurelia, TaskQueue } from 'aurelia-framework';
import { inlineView, Controller, bindable, ShadowDOM, ViewSlot, ShadowSlot } from './aurelia-templating';
import 'aurelia-loader-webpack';

// the test in this file is done in integration testing style,
// instead of unit testing style to the rest as it requires higher level of setup complexity
// to ensure correctness at runtime
fdescribe('shadow-dom.integration.spec.js', () => {
  describe('slot emulation', () => {

    const Template_App  =
      `<template>
        <parent>
          <child repeat.for="i of itemCount" value.bind="i"></child>
        </parent>
      </template>`;
    const Template_Parent = '<template>This is parent<div><slot></slot></div></template>';
    const Template_Child = '<template><span>${value}</span></template>';

    it('works in basic default slot scenario', async () => {
      @inlineView(Template_App)
      class App {
        itemCount = 10;
      }

      @inlineView(Template_Parent)
      class Parent {}

      @inlineView(Template_Child)
      class Child {
        @bindable() value
      }

      const {
        aurelia,
        host,
        root,
        rootVm,
      } = await createFixture(App, [Parent, Child]);

      expect(host.querySelectorAll('parent child').length).toBe(10);
      expect(host.querySelectorAll('parent div child').length).toBe(10);
      expect(host.textContent.trim()).toBe('This is parent0123456789');
      expect(root.view.children.length).toBe(/* 1 child view slot created for <parent/> */1);

      const atParentViewSlot: ViewSlot = root.view.children[0];
      expect(atParentViewSlot.children.length).toBe(/* 10 views for 10 repeated <child/> */10);

      const slot: ShadowSlot = atParentViewSlot.projectToSlots[ShadowDOM.defaultSlotKey];
      expect(slot.children.length).toBe(/* anchor */1 + /* projection */10);
      expect(slot.children.every((projectedNode: Node, idx) => {
        return projectedNode.nodeType === idx === 0 ? Node.COMMENT_NODE : Node.ELEMENT_NODE;
      }));

      // unrender all content of <parent/>
      rootVm.itemCount = 0;
      await new Promise(r => aurelia.container.get(TaskQueue).queueMicroTask(r));
      expect(host.querySelectorAll('parent child').length).toBe(0);
      expect(host.querySelectorAll('parent div child').length).toBe(0);
      expect(host.textContent.trim()).toBe('This is parent');
      // assertion for issue https://github.com/aurelia/templating-resources/issues/392
      // thanks to Thomas Darling https://github.com/thomas-darling
      expect(slot.children.length).toBe(/* anchor */1 + /* projection */0);

      aurelia.root.detached();
      aurelia.root.unbind();
    });
  });

  async function createFixture<T>(root: Constructable<T>, resources: any[] = []) {
    const aurelia = new Aurelia();
    aurelia
      .use
      .defaultBindingLanguage()
      .defaultResources()
      .globalResources(resources)

    const host = document.createElement('div');

    await aurelia.start();
    await aurelia.setRoot(root, host);
    
    return {
      aurelia,
      host,
      /**@type {Controller} */
      root: aurelia.root,
      /**@type {T} */
      rootVm: aurelia.root.viewModel
    }
  }


  interface Constructable<T> {
    new(...args: any[]): T;
  }
});
