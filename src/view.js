import {Binding, createOverrideContext} from 'aurelia-binding';

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
  * Creates a View instance.
  * @param viewFactory The factory that created this view.
  * @param fragment The DOM fragement representing the view.
  * @param controllers The controllers inside this view.
  * @param bindings The bindings inside this view.
  * @param children The children of this view.
  */
  constructor(viewFactory: ViewFactory, fragment: DocumentFragment, controllers: Controller[], bindings: Binding[], children: ViewNode[], contentSelectors: Array<Object>) {
    this.viewFactory = viewFactory;
    this.resources = viewFactory.resources;
    this.fragment = fragment;
    this.controllers = controllers;
    this.bindings = bindings;
    this.children = children;
    this.contentSelectors = contentSelectors;
    this.firstChild = fragment.firstChild;
    this.lastChild = fragment.lastChild;
    this.fromCache = false;
    this.isBound = false;
    this.isAttached = false;
    this.fromCache = false;
    this.bindingContext = null;
    this.overrideContext = null;
    this.controller = null;
    this.viewModelScope = null;
    this._isUserControlled = false;
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
    let parent = refNode.parentNode;
    parent.insertBefore(this.fragment, refNode);
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
    let start = this.firstChild;
    let end = this.lastChild;
    let fragment = this.fragment;
    let next;
    let current = start;
    let loop = true;

    while (loop) {
      if (current === end) {
        loop = false;
      }

      next = current.nextSibling;
      fragment.appendChild(current);
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
