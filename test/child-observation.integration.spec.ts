import { Aurelia, TaskQueue, useShadowDOM } from 'aurelia-framework';
import { inlineView, Controller, bindable, ShadowDOM, ViewSlot, ShadowSlot } from './aurelia-templating';
import 'aurelia-loader-webpack';
import { child, children } from '../src/child-observation';

interface IChildObserver {}

interface IBindableMutationObserver extends MutationObserver {
  binders: IChildObserver[];
}

interface IMutationObserverHost extends Element {
  __childObserver__: IBindableMutationObserver;
}

describe('child-observation.integration.spec.ts', () => {
  beforeAll(() => waitForTicks(10));

  for (const shouldUseShadowDom of [true, false]) {
    describe(`[useShadowDOM(): ${shouldUseShadowDom}]`, () => {

      it('gets the child correctly in basic scenario', async () => {
        const Template_App  =
          `<template>
            <parent-el view-model.ref=parentVm>
              <div class="item"></div>
            </parent-el>
          </template>`;
        const Template_Parent = '<template>This is parent<div><slot></slot></div></template>';

        @inlineView(Template_App)
        class App {
          itemCount = 10;
          parentVm: ParentEl;
        }

        @inlineView(Template_Parent)
        class ParentEl {
          @child('.item') item: HTMLDivElement;
          @children('.item') items: HTMLDivElement[];

          item_changed_call_count = 0;
          items_changed_call_count = 0;

          itemChanged() {
            this.item_changed_call_count++;
          }

          itemsChanged() {
            this.items_changed_call_count++;
          }
        }

        if (shouldUseShadowDom) {
          useShadowDOM({ mode: 'open' })(ParentEl);
        }

        const {
          aurelia,
          host,
          root,
          rootVm,
          dispose,
        } = await createFixture(App, [ParentEl]);

        // right after app has started successfully,
        // it is guaranteed that all child observation is setup & done
        // so there's no difference between native shadowDOM & emulation
        const parentVm = rootVm.parentVm;
        expect(parentVm.item instanceof HTMLDivElement).toBe(true);
        expect(parentVm.items.length).toBe(1, '1 .item');
        expect(parentVm.items[0]).toBe(rootVm.parentVm.item);
        expect(parentVm.item_changed_call_count).toBe(1);
        expect(parentVm.items_changed_call_count).toBe(1);

        const parentEl = host.querySelector('parent-el') as IMutationObserverHost;
        assertIsMutationObserverHost(parentEl);
        const observer = parentEl.__childObserver__;
        expect(observer.binders.length).toBe(/* 1 for @child + 1 for @children */2);

        dispose();

        expect(observer.binders.length).toBe(0);
        expect(parentVm.item_changed_call_count).toBe(1);
        expect(parentVm.items_changed_call_count).toBe(1);
        if (shouldUseShadowDom) {
          // when using shadow DOM, the binder will clear the value on unbind
          expect(parentVm.item).toBe(null);
          expect(parentVm.items).toBe(null);
        } else {
          // when not using shadow DOM, the binder won't clear the value on unbind
          expect(parentVm.item).not.toBe(null);
          expect(parentVm.items).not.toBe(null);
        }
      });

      describe('With [if]', () => {
        // In this test, the assertions are:
        // 1. initially render without any content element
        // 2. showChild = true
        // 3. showChild = false
        // 4. showChild = true
        // 5. dispose
        it('works with [if] on content CHILD elements', async () => {
          const Template_App  =
            `<template>
              <parent-el view-model.ref=parentVm>
                <div class="item" if.bind="showChild"></div>
              </parent-el>
            </template>`;
          const Template_Parent = '<template>This is parent<p><slot></slot></p></template>';

          @inlineView(Template_App)
          class App {
            showChild = false;
            parentVm: ParentEl;
          }

          @inlineView(Template_Parent)
          class ParentEl {
            @child('.item') item: HTMLDivElement;
            @children('.item') items: HTMLDivElement[];

            item_changed_call_count = 0;
            items_changed_call_count = 0;

            itemChanged() {
              this.item_changed_call_count++;
            }

            itemsChanged() {
              this.items_changed_call_count++;
            }
          }

          if (shouldUseShadowDom) {
            useShadowDOM({ mode: 'open' })(ParentEl);
          }

          const {
            aurelia,
            host,
            root,
            rootVm,
            taskQueue,
            dispose,
          } = await createFixture(App, [ParentEl]);

          // Assertion 1 ===========================
          const parentVm = rootVm.parentVm;
          expect(parentVm.item).toBe(undefined);
          if (shouldUseShadowDom) {
            // when using shadowDOM, it's safe to initialize immediately
            // so if theres no items, initialize it to an empty array
            expect(parentVm.items).toEqual([], '0 .item');
          } else {
            expect(parentVm.items).toEqual(undefined, '0 .item');
          }

          const parentEl = host.querySelector('parent-el') as IMutationObserverHost;
          const observer = parentEl.__childObserver__;
          assertIsMutationObserverHost(parentEl);
          expect(observer.binders.length).toBe(/* 1 for @child + 1 for @children */2);
          // IMPORTANT: ==========
          // In native shadow DOM + there's no children
          // items Changed call count is always 1 count ahead of itemChanged call count
          // as it is always call at the start, with empty values
          expect(parentVm.item_changed_call_count).toBe(0, 'item changed() -- 1');
          expect(parentVm.items_changed_call_count).toBe(shouldUseShadowDom ? 1 : 0, 'items changed() -- 1');

          // Assertion 2 ===========================
          rootVm.showChild = true;
          // for mutation observer to fire
          await waitForTicks(2);
          expect(parentVm.item).not.toBe(null);
          expect(parentVm.items.length).toBe(1, '0 .item');
          expect(parentVm.items[0]).toBe(parentVm.item);
          expect(parentVm.item_changed_call_count).toBe(1, 'item changed() -- 2');
          expect(parentVm.items_changed_call_count).toBe(shouldUseShadowDom ? 2 : 1, 'items changed() -- 2');

          // Assertion 3 ===========================
          // Turning show child property back to false
          // =======================================
          rootVm.showChild = false;
          // for mutation observer to fire
          await waitForTicks(2);
          if (shouldUseShadowDom) {
            expect(parentVm.item).toBe(null);
            expect(parentVm.items).toEqual([], '0 .item');
          } else {
            expect(parentVm.item).toBe(null, 'should have no .item after showChild = false');
            expect(parentVm.items.length).toBe(0, '1 .item < after showChild = false');
          }
          expect(parentVm.item_changed_call_count).toBe(2, 'item changed() -- 3');
          expect(parentVm.items_changed_call_count).toBe(shouldUseShadowDom ? 3 : 2, 'items changed() -- 3');

          // Assertion 4 ===========================
          // assert disposing logic with value already populated
          rootVm.showChild = true;
          await waitForTicks(2);
          expect(parentVm.item).not.toBe(null);
          expect(parentVm.items.length).toBe(1, '0 .item');
          expect(parentVm.items[0]).toBe(parentVm.item);
          expect(parentVm.item_changed_call_count).toBe(3, 'item changed() -- 4');
          expect(parentVm.items_changed_call_count).toBe(shouldUseShadowDom ? 4 : 3, 'items changed() -- 4');

          dispose();

          // Assertion 5 ===========================
          expect(observer.binders.length).toBe(0, 'should have no binders after dispose()');
          expect(parentVm.item_changed_call_count).toBe(3, 'item changed() -- 5');
          expect(parentVm.items_changed_call_count).toBe(shouldUseShadowDom ? 4 : 3, 'items changed() -- 5');
          if (shouldUseShadowDom) {
            // when not using shadow DOM, the binder won't clear the value on unbind
            expect(parentVm.item).toBe(null);
            expect(parentVm.items).toBe(null);
          } else {
            // when not using shadow DOM, the binder won't clear the value on unbind
            expect(parentVm.item).not.toBe(null);
            expect(parentVm.items).not.toBe(null);
          }
        });

        // In this test, the assertions are:
        // 1. initially render WITH parent element
        // 2. assign false to if binding value, and remove parent element
        // 3. assign true to if binding value, and show parent element
        // 4. dispose the app
        it('works with [if] on content PARENT elements', async () => {
          const Template_App  =
            `<template>
              <parent-el view-model.ref=parentVm if.bind="showParent">
                <div class="item"></div>
              </parent-el>
            </template>`;
          const Template_Parent = '<template>This is parent<p><slot></slot></p></template>';

          @inlineView(Template_App)
          class App {
            showParent = true;
            parentVm: ParentEl;
          }

          @inlineView(Template_Parent)
          class ParentEl {
            @child('.item') item: HTMLDivElement;
            @children('.item') items: HTMLDivElement[];

            item_changed_call_count = 0;
            items_changed_call_count = 0;

            itemChanged() {
              this.item_changed_call_count++;
            }

            itemsChanged() {
              this.items_changed_call_count++;
            }
          }

          if (shouldUseShadowDom) {
            useShadowDOM({ mode: 'open' })(ParentEl);
          }

          const {
            aurelia,
            host,
            root,
            rootVm,
            taskQueue,
            dispose,
          } = await createFixture(App, [ParentEl]);

          // Assertion 1 =========================================
          // 1. initially render WITH parent element
          const parentVm = rootVm.parentVm;
          expect(parentVm.item instanceof HTMLElement).toBe(true);
          expect(parentVm.items.length).toBe(1, '1 .item');
    
          const parentEl = host.querySelector('parent-el') as IMutationObserverHost;
          let observer = parentEl.__childObserver__;
          assertIsMutationObserverHost(parentEl);
          expect(observer.binders.length).toBe(/* 1 for @child + 1 for @children */2);
          expect(parentVm.item_changed_call_count).toBe(1, 'item changed() -- 1');
          expect(parentVm.items_changed_call_count).toBe(1, 'items changed() -- 1');

          // Assertion 2 =========================================
          // 2. assign false to if binding value, and remove parent element
          rootVm.showParent = false;
          // flush all aurelia bindings, including repeat/if
          await waitForTicks(1);
          // mutation observer is cleaned upon cleaning all binders
          expect(parentEl.__childObserver__).toBe(null);
          expect(observer.binders.length).toBe(0);
          if (shouldUseShadowDom) {
            expect(parentVm.item).toBe(null);
            expect(parentVm.items).toBe(null);
          } else {
            expect(parentVm.item instanceof HTMLElement).toBe(true);
            expect(parentVm.items.length).toBe(1, '1 .item');
            expect(parentVm.items[0]).toBe(parentVm.item);
          }
          // for mutation observer to fire
          await waitForTicks(1);
          if (shouldUseShadowDom) {
            expect(parentVm.item).toBe(null);
            expect(parentVm.items).toBe(null);
          } else {
            expect(parentVm.item).not.toBe(null);
            expect(parentVm.items.length).toBe(1, '0 .item');
            expect(parentVm.items[0]).toBe(parentVm.item);
          }
          // nothing changed, DOM mutation wise
          expect(parentVm.item_changed_call_count).toBe(1, 'item changed() -- 2');
          expect(parentVm.items_changed_call_count).toBe(1, 'items changed() -- 2');

          // Assertion 3 =========================================
          // 3. assign true to if binding value, and show parent element
          rootVm.showParent = true;
          await waitForTicks(1);
          // observer is clean so need to get a new reference
          expect(observer).not.toBe(parentEl.__childObserver__);
          observer = parentEl.__childObserver__;
          expect(observer.binders.length).toBe(2, 'Should have 2 binders after showing parent');
          // when using native shadow DOM
          // whenever the mutation observer binder is bound
          // it will calls the change handler, so it's 1 count ahead of the emulation
          expect(parentVm.item_changed_call_count).toBe(shouldUseShadowDom ? 2 : 1, 'item changed() -- 3');
          expect(parentVm.items_changed_call_count).toBe(shouldUseShadowDom ? 2 : 1, 'items changed() -- 3');

          // Assertion 4 =========================================
          // 4. dispose the app
          dispose();

          expect(observer.binders.length).toBe(0);
          expect(parentEl.__childObserver__).toBe(null);
          if (shouldUseShadowDom) {
            expect(parentVm.item).toBe(null);
            expect(parentVm.items).toBe(null);
          } else {
            // when not using shadow DOM, the binder won't clear the value on unbind
            expect(parentVm.item).not.toBe(null);
            expect(parentVm.items.length).toBe(1, '0 .item');  
            expect(parentVm.items[0]).toBe(parentVm.item);
          }
          expect(parentVm.item_changed_call_count).toBe(shouldUseShadowDom ? 2 : 1, 'item changed() -- 4');
          expect(parentVm.items_changed_call_count).toBe(shouldUseShadowDom ? 2 : 1, 'items changed() -- 4');
        });
      });

      describe('With [repeat]', () => {
        // In this test, the assertions are:
        // 1. initially render without any content element (itemCount = 0)
        // 2. itemCount = 2, and render child content elements
        // 3. itemCount = 0, and remove child content elements
        // 4. itemCount = 2, and render child content elements
        // 5. dispose the app
        it('works with [repeat] on content CHILD elements', async () => {
          const Template_App  =
            `<template>
              <parent-el view-model.ref=parentVm>
                <div id="item-\${i}" class="item" repeat.for="i of itemCount"></div>
              </parent-el>
            </template>`;
          const Template_Parent = '<template>This is parent<p><slot></slot></p></template>';

          @inlineView(Template_App)
          class App {
            itemCount = 0;
            parentVm: ParentEl;
          }

          @inlineView(Template_Parent)
          class ParentEl {
            @child('.item') item: HTMLDivElement;
            @children('.item') items: HTMLDivElement[];

            item_changed_call_count = 0;
            items_changed_call_count = 0;

            itemChanged() {
              this.item_changed_call_count++;
            }

            itemsChanged() {
              this.items_changed_call_count++;
            }
          }

          if (shouldUseShadowDom) {
            useShadowDOM({ mode: 'open' })(ParentEl);
          }

          const {
            aurelia,
            host,
            root,
            rootVm,
            taskQueue,
            dispose,
          } = await createFixture(App, [ParentEl]);

          // Assertion 1 ===========================
          // 1. initially render without any content element (itemCount = 0)
          const parentVm = rootVm.parentVm;
          expect(parentVm.item).toBe(undefined);
          if (shouldUseShadowDom) {
            // when using shadowDOM, it's safe to initialize immediately
            // so if theres no items, initialize it to an empty array
            expect(parentVm.items).toEqual([], '0 .item');
          } else {
            expect(parentVm.items).toEqual(undefined, '0 .item');
          }

          const parentEl = host.querySelector('parent-el') as IMutationObserverHost;
          const observer = parentEl.__childObserver__;
          assertIsMutationObserverHost(parentEl);
          expect(observer.binders.length).toBe(/* 1 for @child + 1 for @children */2);
          expect(parentVm.item_changed_call_count).toBe(0, 'item changed() -- 1');
          expect(parentVm.items_changed_call_count).toBe(shouldUseShadowDom ? 1 : 0, 'items changed() -- 1');

          // Assertion 2 ===========================
          // 2. itemCount = 2, and render child content elements
          rootVm.itemCount = 2;
          // for mutation observer to fire
          await waitForTicks(2);
          expect(parentVm.item).not.toBe(null);
          expect(parentVm.items.length).toBe(2, '0 .item');
          expect(parentVm.items[0]).not.toBe(parentVm.items[1]);
          expect(parentVm.items[1]).toBe(parentVm.item);
          // note: change handler is call for every item when it's @child
          // this could be a surprise, or perf issue
          expect(parentVm.item_changed_call_count).toBe(2, 'item changed() -- 2');
          expect(parentVm.items_changed_call_count).toBe(shouldUseShadowDom ? 2 : 1, 'items changed() -- 2');

          // Assertion 3 ===========================
          // 3. itemCount = 0, and remove child content elements
          rootVm.itemCount = 0;
          // for mutation observer to fire
          await waitForTicks(2);
          if (shouldUseShadowDom) {
            expect(parentVm.item).toBe(null);
            expect(parentVm.items).toEqual([], '0 .item');
          } else {
            expect(parentVm.item).toBe(null, 'should have no .item after showChild = false');
            expect(parentVm.items.length).toBe(0, '1 .item < after showChild = false');
          }
          expect(parentVm.item_changed_call_count).toBe(3, 'item changed() -- 3');
          expect(parentVm.items_changed_call_count).toBe(shouldUseShadowDom ? 3 : 2, 'items changed() -- 3');

          // Assertion 4 ===========================
          // 4. itemCount = 2, and render child content elements
          rootVm.itemCount = 2;
          await waitForTicks(2);
          expect(parentVm.item).not.toBe(null);
          expect(parentVm.items.length).toBe(2, '0 .item');
          expect(parentVm.items[0]).not.toBe(parentVm.items[1]);
          expect(parentVm.items[1]).toBe(parentVm.item);
          expect(parentVm.item_changed_call_count).toBe(5, 'item changed() -- 4');
          expect(parentVm.items_changed_call_count).toBe(shouldUseShadowDom ? 4 : 3, 'items changed() -- 4');

          dispose();

          // Assertion 5 ===========================
          expect(observer.binders.length).toBe(0, 'should have no binders after dispose()');
          expect(parentVm.item_changed_call_count).toBe(5, 'item changed() -- 5');
          expect(parentVm.items_changed_call_count).toBe(shouldUseShadowDom ? 4 : 3, 'items changed() -- 5');
          if (shouldUseShadowDom) {
            // when not using shadow DOM, the binder won't clear the value on unbind
            expect(parentVm.item).toBe(null);
            expect(parentVm.items).toBe(null);
          } else {
            // when not using shadow DOM, the binder won't clear the value on unbind
            expect(parentVm.item).not.toBe(null);
            expect(parentVm.items).not.toBe(null);
            expect(parentVm.items[0]).not.toBe(parentVm.items[1]);
            expect(parentVm.items[1]).toBe(parentVm.item);
          }
        });
      });

      // In this test, the assertions are:
      // 1. showParent = true + itemCount = 0
      // ---- assert [add] while [attached] mutation ----
      // 2. itemCount = 2
      // 2.1 itemCount = 0
      // 2.2 itemCount = 2
      // ---- assert [removal] while [detached] mutation
      // 3. showParent = false
      // 4. itemCount = 0
      // ---- assert [add] while [detached] ----
      // 5. itemCount = 2
      // ---- assert [removal] while [attached] mutation -----
      // 6. showParent = true
      // 7. itemCount = 0
      // ---- final ----
      // 8. dispose
      it('\n\tworks with [if] on content PARENT elements\n\tAnd [repeat] on CHILD elements\n', async () => {
        const Template_App  =
          `<template>
            <parent-el view-model.ref=parentVm if.bind="showParent">
              <div id="item-\${generateId(i)}" class="item" repeat.for="i of itemCount"></div>
            </parent-el>
          </template>`;
        const Template_Parent = '<template>This is parent<p><slot></slot></p></template>';

        @inlineView(Template_App)
        class App {
          showParent = true;
          itemCount = 0;
          parentVm: ParentEl;

          id = 0;
          generateId(i: number) {
            return `item-${i}-${this.id++}`;
          }
        }

        @inlineView(Template_Parent)
        class ParentEl {
          @child('.item') item: HTMLDivElement;
          @children('.item') items: HTMLDivElement[];

          item_changed_call_count = 0;
          items_changed_call_count = 0;

          itemChanged() {
            this.item_changed_call_count++;
          }

          itemsChanged() {
            this.items_changed_call_count++;
          }
        }

        if (shouldUseShadowDom) {
          useShadowDOM({ mode: 'open' })(ParentEl);
        }

        const {
          host,
          rootVm,
          dispose,
        } = await createFixture(App, [ParentEl]);

        // Assertion 1 =========================================
        // 1. initially render WITH parent element
        const parentVm = rootVm.parentVm;
        expect(parentVm.item).toBe(undefined, '0 .item');
        if (shouldUseShadowDom) {
          expect(parentVm.items).toEqual([], '[] .item[]');
        } else {
          expect(parentVm.items).toBe(undefined, '0 .item[]');
        }

        const parentEl = host.querySelector('parent-el') as IMutationObserverHost;
        let observer = parentEl.__childObserver__;
        assertIsMutationObserverHost(parentEl);
        expect(observer.binders.length).toBe(/* 1 for @child + 1 for @children */2);
        expect(parentVm.item_changed_call_count).toBe(0, 'item changed() -- 1');
        // during .bind()
        // change handler is always called when using native shadowDOM
        expect(parentVm.items_changed_call_count).toBe(shouldUseShadowDom ? 1 : 0, 'items changed() -- 1');

        // ---- assert [add] while [attached] mutation ----
        // Assertion 2 =========================================
        // 2. itemCount = 2
        rootVm.itemCount = 2;
        // for mutation observer to fire
        await waitForTicks(2);
        expect(parentVm.item).not.toBe(null);
        expect(parentVm.items).not.toBe(null);
        expect(parentVm.item instanceof HTMLElement).toBe(true);
        expect(parentVm.items.length).toBe(2, '2 .item');
        expect(parentVm.items[1]).toBe(parentVm.item);
        expect(parentVm.item_changed_call_count).toBe(2, 'item changed() -- 2');
        expect(parentVm.items_changed_call_count).toBe(shouldUseShadowDom ? 2 : 1, 'items changed() -- 2');
        // 2.1 itemCount = 0
        rootVm.itemCount = 0;
        await waitForTicks(2);
        expect(parentVm.item).toBe(null);
        expect(parentVm.items).toEqual([]);
        expect(parentVm.item_changed_call_count).toBe(3, 'item changed() -- 2.1');
        expect(parentVm.items_changed_call_count).toBe(shouldUseShadowDom ? 3 : 2, 'items changed() -- 2.1');
        // 2.2 itemCount = 2
        rootVm.itemCount = 2;
        await waitForTicks(2);
        expect(parentVm.item).not.toBe(null);
        expect(parentVm.items).not.toEqual([]);
        expect(parentVm.item_changed_call_count).toBe(5, 'item changed() -- 2.2');
        expect(parentVm.items_changed_call_count).toBe(shouldUseShadowDom ? 4 : 3, 'items changed() -- 2.2');

        // ---- assert [removal] while [detached] mutation
        // Assertion 3 =========================================
        // 3. showParent = false
        rootVm.showParent = false;
        await waitForTicks(1);
        expect(parentVm.item_changed_call_count).toBe(5, 'item changed() -- 3');
        expect(parentVm.items_changed_call_count).toBe(shouldUseShadowDom ? 4 : 3, 'items changed() -- 3');
        // ensure one mutation observer not affecting another
        await waitForTicks(1);

        // Assertion 4 =========================================
        // 4. itemCount = 0
        // This steps corrupts the repeat, and will leave 2 orphaned <div/> inside the 
        rootVm.itemCount = 0;
        await waitForTicks(2);
        if (shouldUseShadowDom) {
          assertSelectorCount(parentEl, '.item', 0);
          expect(parentVm.item).toBe(null, '4. item === null');
          expect(parentVm.items).toBe(null, '4. items === null');
        } else {
          // shadow dom emulation doesn't response to mutation while detached
          assertSelectorCount(parentEl, 'p > .item', 0);
          expect(parentVm.item).not.toBe(null);
          expect(parentVm.items).not.toBe(null);
          expect(parentVm.items.length).toBe(/* 2 orphaned */2);
        }
        expect(parentVm.item_changed_call_count).toBe(5, 'item changed() -- 4');
        expect(parentVm.items_changed_call_count).toBe(shouldUseShadowDom ? 4 : 3, 'items changed() -- 4');

        // ---- assert [add] while [detached] ----
        // Assertion 5 =========================================
        // 5. itemCount = 2
        const old_item = parentVm.item;
        // const old_items_arr = parentVm.items;
        // const old_items = old_items_arr?.slice(0) ?? [];
        rootVm.itemCount = 2;
        await waitForTicks(2);
        if (shouldUseShadowDom) {
          assertSelectorCount(parentEl, '.item', 0);
          expect(parentVm.item).toBe(null, '5. item === null');
          expect(parentVm.item).toBe(old_item, '5. item === old_item');
          expect(parentVm.items).toBe(null, '5. items === null');
        } else {
          // "slotted" content wont be removed when the view is detached
          assertSelectorCount(parentEl, 'p > .item', 0);
          expect(parentVm.item).not.toBe(null);
          expect(parentVm.items).not.toBe(null);
          expect(parentVm.items.length).toBe(/* 2 orphaned */2);
        }
        expect(parentVm.item_changed_call_count).toBe(5, 'item changed() -- 5');
        expect(parentVm.items_changed_call_count).toBe(shouldUseShadowDom ? 4 : 3, 'items changed() -- 5');

        // ---- assert [removal] while [attached] mutation -----
        // 6. showParent = true
        rootVm.showParent = true;
        await waitForTicks(2);
        if (shouldUseShadowDom) {
          assertSelectorCount(parentEl, '.item', 2);
          expect(parentVm.item).not.toBe(null, '6. item !== null');
          expect(parentVm.item).not.toBe(old_item, '6. item !== old_item');
          expect(parentVm.items).not.toBe(null, '6. items !== old_items');
        } else {
          assertSelectorCount(parentEl, 'p > .item', 2);
          expect(parentVm.item).not.toBe(null);
          expect(parentVm.items).not.toBe(null);
          expect(parentVm.items.length).toBe(/* 2 orphaned + 2 from repeat */4);
        }
        expect(parentVm.item_changed_call_count).toBe(7, 'item changed() -- 6');
        // when using shadowDOM
        // 1 call for bind()
        // 1 call for actual mutation change from repeat
        // so +2 more calls in total
        expect(parentVm.items_changed_call_count).toBe(shouldUseShadowDom ? 6 : 4, 'items changed() -- 6');

        // 7. itemCount = 0
        rootVm.itemCount = 0;
        await waitForTicks(2);
        assertSelectorCount(parentEl, '.item', 0);
        if (shouldUseShadowDom) {
          expect(parentVm.item).toBe(null, '7. item === null');
          expect(parentVm.items).toEqual([], '7. items === null');
        } else {
          // shadow dom emulation doesn't response to mutation while detached
          expect(parentVm.item).toBe(null);
          expect(parentVm.items).not.toBe(null);
          expect(parentVm.items.length).toBe(/* 2 orphaned */2);
        }
        expect(parentVm.item_changed_call_count).toBe(8, 'item changed() -- 7');
        expect(parentVm.items_changed_call_count).toBe(shouldUseShadowDom ? 7 : 5, 'items changed() -- 7');

        // ---- final ----
        // 9. dispose
        dispose();

        expect(observer.binders.length).toBe(0);
        expect(parentEl.__childObserver__).toBe(null);
        if (shouldUseShadowDom) {
          expect(parentVm.item).toBe(null);
          expect(parentVm.items).toBe(null);
        } else {
          expect(parentVm.item).toBe(null);
          expect(parentVm.items.length).toBe(/* 2 orphaned */2);  
        }
      });
    });
  }

  async function createFixture<T>(root: Constructable<T>, resources: any[] = []) {
    const aurelia = new Aurelia();
    let $$taskQueue: TaskQueue = createFixture.taskQueue;
    if ($$taskQueue) {
      aurelia.container.registerInstance(TaskQueue, $$taskQueue);
    } else {
      $$taskQueue = createFixture.taskQueue = aurelia.container.get(TaskQueue);
    }
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
      rootVm: rootController.viewModel as T,
      taskQueue: $$taskQueue,
      dispose: () => {
        $$taskQueue.flushMicroTaskQueue();
        $$taskQueue.flushTaskQueue();
        rootController.detached();
        rootController.unbind();
        $$taskQueue.flushMicroTaskQueue();
      }
    }
  }

  createFixture.taskQueue = null;

  function assertIsMutationObserverHost(element: Element): element is IMutationObserverHost {
    const observer = element['__childObserver__'];
    expect(observer instanceof MutationObserver).toBe(true, 'there should be mutation observer on element');
    return true;
  }

  function assertSelectorCount(element: Element, selector: string, count: number): void {
    let childCount = element.querySelectorAll(selector).length;
    expect(childCount).toBe(count, `Expected selecotr: "${selector}" count for <${element.tagName.toLowerCase()}/> to be ${count}, found ${childCount}`);
  }

  async function waitForTicks(count = 0) {
    while (count > 0) {
      await Promise.resolve();
      count--;
    }
  }

  interface Constructable<T> {
    new(...args: any[]): T;
  }
});
