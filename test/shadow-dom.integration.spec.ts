import { Aurelia, TaskQueue } from 'aurelia-framework';
import { inlineView, Controller, bindable, ShadowDOM, ViewSlot, ShadowSlot } from './aurelia-templating';
import 'aurelia-loader-webpack';

// the test in this file is done in integration testing style,
// instead of unit testing style to the rest as it requires higher level of setup complexity
// to ensure correctness at runtime
describe('shadow-dom.integration.spec.js', () => {
  describe('default slot', () => {
    it('works in basic default slot scenario', async () => {
      const Template_App  =
        `<template>
          <parent>
            <child repeat.for="i of itemCount" value.bind="i"></child>
          </parent>
        </template>`;
      const Template_Parent = '<template>This is parent<div><slot></slot></div></template>';
      const Template_Child = '<template><span>${value}</span></template>';

      @inlineView(Template_App)
      // @ts-ignore
      class App {
        itemCount = 10;
      }

      @inlineView(Template_Parent)
      // @ts-ignore
      class Parent {}

      @inlineView(Template_Child)
      // @ts-ignore
      class Child {
        // @ts-ignore
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
        return projectedNode.nodeType === (idx === 0 ? Node.COMMENT_NODE : Node.ELEMENT_NODE);
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

      root.detached();
      root.unbind();
    });

    // in this test, we test 4 varition of default slot usages + default fallback content
    // also ensure that when value is changed dynamically (repeat collection empty/if value turned to false)
    // it will trigger the rendering/un-rendering correctly
    // 1. with repeat
    // 2. with if
    // 3. with empty space (should render default)
    // 4. nothing (should render default content)
    it('works in slot with fallback content scenario', async () => {
      const Template_App  =
        `<template>
          <parent id="parent1">
            <child repeat.for="i of itemCount" value.bind="i"></child>
          </parent>
          <parent id="parent2"><child if.bind="showChild2" value.bind="showChild2"></child></parent>
          <parent id="parent3"> </parent>
          <parent id="parent4"></parent>
        </template>`;
      const Template_Parent = '<template>This is parent<div><slot>Empty parent content</slot></div></template>';
      const Template_Child = '<template><span>${value}</span></template>';

      @inlineView(Template_App)
      // @ts-ignore
      class App {
        itemCount = 10;
        showChild2 = false;
      }

      @inlineView(Template_Parent)
      // @ts-ignore
      class Parent {}

      @inlineView(Template_Child)
      // @ts-ignore
      class Child {
        // @ts-ignore
        @bindable() value
      }

      const {
        aurelia,
        host,
        root,
        rootVm,
      } = await createFixture(App, [Parent, Child]);

      expect(root.view.children.length).toBe(/* 2 child views slot created for (4) <parent/>, last 2 do not have content */2, 'root view should have had 2 child viewslots');
      const [atParent1ViewSlot, atParent2ViewSlot] = root.view.children as ViewSlot[];
      const [parent1, parent2, parent3, parent4] = host.querySelectorAll<HTMLElement>('parent');

      // #parent3 and #parent4 are considered equal
      // content comprising of all empty space nodes === no content
      expect(parent3.textContent.trim()).toBe('This is parentEmpty parent content');
      expect(parent4.textContent.trim()).toBe('This is parentEmpty parent content');

      // assert usage with content
      expect(host.querySelectorAll('#parent1 child').length).toBe(10);
      expect(host.querySelectorAll('#parent1 div child').length).toBe(10);
      expect(parent1.textContent.trim()).toBe('This is parent0123456789');

      expect(atParent1ViewSlot.children.length).toBe(/* 10 views for 10 repeated <child/> */10);
      const parent1Default_ShadowSlot: ShadowSlot = atParent1ViewSlot.projectToSlots[ShadowDOM.defaultSlotKey];
      expect(parent1Default_ShadowSlot.children.length).toBe(/* anchor */1 + /* projection */10);
      expect(parent1Default_ShadowSlot.children.every((projectedNode: Node, idx) => {
        return projectedNode.nodeType === (idx === 0 ? Node.COMMENT_NODE : Node.ELEMENT_NODE);
      }));

      // unrender all content of #parent1
      rootVm.itemCount = 0;
      await new Promise(r => aurelia.container.get(TaskQueue).queueMicroTask(r));
      expect(host.querySelectorAll('#parent1 child').length).toBe(0);
      expect(host.querySelectorAll('#parent1 div child').length).toBe(0);
      expect(parent1.textContent.trim()).toBe('This is parentEmpty parent content', 'it should have had default fallback when setting itemCount to 0 (#parent1)');
      // assertion for issue https://github.com/aurelia/templating-resources/issues/392
      // thanks to Thomas Darling https://github.com/thomas-darling
      expect(parent1Default_ShadowSlot.children.length).toBe(/* anchor */1 + /* projection */0);

      // rerender content of #parent1
      rootVm.itemCount = 10;
      await new Promise(r => aurelia.container.get(TaskQueue).queueMicroTask(r));
      expect(host.querySelectorAll('#parent1 child').length).toBe(10);
      expect(host.querySelectorAll('#parent1 div child').length).toBe(10);
      expect(parent1.textContent.trim()).toBe('This is parent0123456789');

      expect(atParent1ViewSlot.children.length).toBe(/* 10 views for 10 repeated <child/> */10);
      expect(parent1Default_ShadowSlot.children.length).toBe(/* anchor */1 + /* projection */10);
      expect(parent1Default_ShadowSlot.children.every((projectedNode: Node, idx) => {
        return projectedNode.nodeType === (idx === 0 ? Node.COMMENT_NODE : Node.ELEMENT_NODE);
      }));

      // ===================================================================================
      // assert usage WITHOUT content
      expect(host.querySelectorAll('#parent2 child').length).toBe(0);
      expect(parent2.textContent.trim()).toBe('This is parentEmpty parent content');

      expect(atParent2ViewSlot.children.length).toBe(/* 10 views for 10 repeated <child/> */0);
      const parent2Default_ShadowSlot: ShadowSlot = atParent2ViewSlot.projectToSlots[ShadowDOM.defaultSlotKey];
      expect(parent2Default_ShadowSlot.children.length).toBe(/* anchor */1 + /* projection */0);
      expect(parent2Default_ShadowSlot.children.every((projectedNode: Node, idx) => {
        return projectedNode.nodeType === (idx === 0 ? Node.COMMENT_NODE : Node.ELEMENT_NODE);
      }));

      // unrender #parent2 <child/>
      rootVm.showChild2 = true;
      await new Promise(r => aurelia.container.get(TaskQueue).queueMicroTask(r));
      expect(host.querySelectorAll('#parent2 child').length).toBe(1);
      expect(host.querySelectorAll('#parent2 div child').length).toBe(1);
      expect(parent2.textContent.trim()).toBe('This is parenttrue');
      expect(parent2Default_ShadowSlot.children.length).toBe(/* anchor */1 + /* projection node */1);

      // unrender #parent2 child
      rootVm.showChild2 = false;
      await new Promise(r => aurelia.container.get(TaskQueue).queueMicroTask(r));
      expect(host.querySelectorAll('#parent2 child').length).toBe(0);
      expect(host.querySelectorAll('#parent2 div child').length).toBe(0);
      expect(parent2.textContent.trim()).toBe('This is parentEmpty parent content');
      expect(parent2Default_ShadowSlot.children.length).toBe(/* anchor */1 + /* projection node */0);

      root.detached();
      root.unbind();
    });
  });

  describe('named slot', () => {
    it('works in basic named slot scenario', async () => {
      const Template_App  =
        `<template>
          <parent>
            <child repeat.for="i of itemCount" value.bind="i" slot="child-value-display"></child>
          </parent>
        </template>`;
      const Template_Parent = '<template>This is parent<div><slot name="child-value-display"></slot></div></template>';
      const Template_Child = '<template><span>${value}</span></template>';

      @inlineView(Template_App)
      // @ts-ignore
      class App {
        itemCount = 10;
      }

      @inlineView(Template_Parent)
      // @ts-ignore
      class Parent {}

      @inlineView(Template_Child)
      // @ts-ignore
      class Child {
        // @ts-ignore
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

      const slot: ShadowSlot = atParentViewSlot.projectToSlots['child-value-display'];
      expect(slot.children.length).toBe(/* anchor */1 + /* projection */10);
      expect(slot.children.every((projectedNode: Node, idx) => {
        return projectedNode.nodeType === (idx === 0 ? Node.COMMENT_NODE : Node.ELEMENT_NODE);
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

      root.detached();
      root.unbind();
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

    const rootController = aurelia['root'] as Controller;
    
    return {
      aurelia,
      host,
      root: rootController,
      rootVm: rootController.viewModel as T
    }
  }

  interface Constructable<T> {
    new(...args: any[]): T;
  }
});
