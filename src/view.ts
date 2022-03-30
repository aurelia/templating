/* eslint no-unused-vars: 0, no-constant-condition: 0 */
import {Binding, createOverrideContext} from 'aurelia-binding';
import {Container} from 'aurelia-dependency-injection';
import {ShadowDOM} from './shadow-dom';

/**
* Represents a node in the view hierarchy.
*/
interface ViewNode {
  /**
  * Binds the node and it's children.
  * @param bindingContext The binding context to bind to.
  * @param overrideContext A secondary binding context that can override the standard context.
  */
  bind(bindingContext: Object, overrideContext?: Object): void;
  /**
  * Triggers the attach for the node and its children.
  */
  attached(): void;
  /**
  * Triggers the detach for the node and its children.
  */
  detached(): void;
  /**
  * Unbinds the node and its children.
  */
  unbind(): void;
}

export class View {
  /**
  * The Dependency Injection Container that was used to create this View instance.
  */
  container: Container;

  /**
  * The ViewFactory that built this View instance.
  */
  viewFactory: ViewFactory;

  /**
  * Contains the DOM Nodes which represent this View. If the view was created via the "enhance" API, this will be an Element, otherwise it will be a DocumentFragment. If not created via "enhance" then the fragment will only contain nodes when the View is detached from the DOM.
  */
  fragment: DocumentFragment | Element;

  /**
  * The primary binding context that this view is data-bound to.
  */
  bindingContext: Object;

  /**
  * The override context which contains properties capable of overriding those found on the binding context.
  */
  overrideContext: Object;

  /**
  * The Controller instance that owns this View.
  */
  controller: Controller;

  /**
  * Creates a View instance.
  * @param container The container from which the view was created.
  * @param viewFactory The factory that created this view.
  * @param fragment The DOM fragement representing the view.
  * @param controllers The controllers inside this view.
  * @param bindings The bindings inside this view.
  * @param children The children of this view.
  */
  constructor(container: Container, viewFactory: ViewFactory, fragment: DocumentFragment, controllers: Controller[], bindings: Binding[], children: ViewNode[], slots: Object) {
    this.container = container;
    this.viewFactory = viewFactory;
    this.resources = viewFactory.resources;
    this.fragment = fragment;
    this.firstChild = fragment.firstChild;
    this.lastChild = fragment.lastChild;
    this.controllers = controllers;
    this.bindings = bindings;
    this.children = children;
    this.slots = slots;
    this.hasSlots = false;
    this.fromCache = false;
    this.isBound = false;
    this.isAttached = false;
    this.bindingContext = null;
    this.overrideContext = null;
    this.controller = null;
    this.viewModelScope = null;
    this.animatableElement = undefined;
    this._isUserControlled = false;
    this.contentView = null;

    for (let key in slots) {
      this.hasSlots = true;
      break;
    }
  }

  /**
  * Returns this view to the appropriate view cache.
  */
  returnToCache(): void {
    this.viewFactory.returnViewToCache(this);
  }

  /**
  * Triggers the created callback for this view and its children.
  */
  created(): void {
    let i;
    let ii;
    let controllers = this.controllers;

    for (i = 0, ii = controllers.length; i < ii; ++i) {
      controllers[i].created(this);
    }
  }

  /**
  * Binds the view and it's children.
  * @param bindingContext The binding context to bind to.
  * @param overrideContext A secondary binding context that can override the standard context.
  */
  bind(bindingContext: Object, overrideContext?: Object, _systemUpdate?: boolean): void {
    let controllers;
    let bindings;
    let children;
    let i;
    let ii;

    if (_systemUpdate && this._isUserControlled) {
      return;
    }

    if (this.isBound) {
      if (this.bindingContext === bindingContext) {
        return;
      }

      this.unbind();
    }

    this.isBound = true;
    this.bindingContext = bindingContext;
    this.overrideContext = overrideContext || createOverrideContext(bindingContext);

    this.resources._invokeHook('beforeBind', this);

    bindings = this.bindings;
    for (i = 0, ii = bindings.length; i < ii; ++i) {
      bindings[i].bind(this);
    }

    if (this.viewModelScope !== null) {
      bindingContext.bind(this.viewModelScope.bindingContext, this.viewModelScope.overrideContext);
      this.viewModelScope = null;
    }

    controllers = this.controllers;
    for (i = 0, ii = controllers.length; i < ii; ++i) {
      controllers[i].bind(this);
    }

    children = this.children;
    for (i = 0, ii = children.length; i < ii; ++i) {
      children[i].bind(bindingContext, overrideContext, true);
    }

    if (this.hasSlots) {
      ShadowDOM.distributeView(this.contentView, this.slots);
    }
  }

  /**
  * Adds a binding instance to this view.
  * @param binding The binding instance.
  */
  addBinding(binding: Object): void {
    this.bindings.push(binding);

    if (this.isBound) {
      binding.bind(this);
    }
  }

  /**
  * Unbinds the view and its children.
  */
  unbind(): void {
    let controllers;
    let bindings;
    let children;
    let i;
    let ii;

    if (this.isBound) {
      this.isBound = false;
      this.resources._invokeHook('beforeUnbind', this);

      if (this.controller !== null) {
        this.controller.unbind();
      }

      bindings = this.bindings;
      for (i = 0, ii = bindings.length; i < ii; ++i) {
        bindings[i].unbind();
      }

      controllers = this.controllers;
      for (i = 0, ii = controllers.length; i < ii; ++i) {
        controllers[i].unbind();
      }

      children = this.children;
      for (i = 0, ii = children.length; i < ii; ++i) {
        children[i].unbind();
      }

      this.bindingContext = null;
      this.overrideContext = null;
    }
  }

  /**
  * Inserts this view's nodes before the specified DOM node.
  * @param refNode The node to insert this view's nodes before.
  */
  insertNodesBefore(refNode: Node): void {
    refNode.parentNode.insertBefore(this.fragment, refNode);
  }

  /**
  * Appends this view's to the specified DOM node.
  * @param parent The parent element to append this view's nodes to.
  */
  appendNodesTo(parent: Element): void {
    parent.appendChild(this.fragment);
  }

  /**
  * Removes this view's nodes from the DOM.
  */
  removeNodes(): void {
    let fragment = this.fragment;
    let current = this.firstChild;
    let end = this.lastChild;
    let next;

    while (current) {
      next = current.nextSibling;
      fragment.appendChild(current);

      if (current === end) {
        break;
      }

      current = next;
    }
  }

  /**
  * Triggers the attach for the view and its children.
  */
  attached(): void {
    let controllers;
    let children;
    let i;
    let ii;

    if (this.isAttached) {
      return;
    }

    this.isAttached = true;

    if (this.controller !== null) {
      this.controller.attached();
    }

    controllers = this.controllers;
    for (i = 0, ii = controllers.length; i < ii; ++i) {
      controllers[i].attached();
    }

    children = this.children;
    for (i = 0, ii = children.length; i < ii; ++i) {
      children[i].attached();
    }
  }

  /**
  * Triggers the detach for the view and its children.
  */
  detached(): void {
    let controllers;
    let children;
    let i;
    let ii;

    if (this.isAttached) {
      this.isAttached = false;

      if (this.controller !== null) {
        this.controller.detached();
      }

      controllers = this.controllers;
      for (i = 0, ii = controllers.length; i < ii; ++i) {
        controllers[i].detached();
      }

      children = this.children;
      for (i = 0, ii = children.length; i < ii; ++i) {
        children[i].detached();
      }
    }
  }
}
