import {Binding, createOverrideContext} from 'aurelia-binding';
import {Container} from 'aurelia-dependency-injection';

//NOTE: Adding a fragment to the document causes the nodes to be removed from the fragment.
//NOTE: Adding to the fragment, causes the nodes to be removed from the document.

interface ViewNode {
  bind(bindingContext: Object, overrideContext?: Object): void;
  attached(): void;
  detached(): void;
  unbind(): void;
}

export class View {
  constructor(viewFactory: ViewFactory, container: Container, fragment: DocumentFragment, controllers: Controller[], bindings: Binding[], children: ViewNode[], contentSelectors: ContentSelector[]) {
    this.viewFactory = viewFactory;
    this.container = container;
    this.fragment = fragment;
    this.controllers = controllers;
    this.bindings = bindings;
    this.children = children;
    this.contentSelectors = contentSelectors;
    this.firstChild = fragment.firstChild;
    this.lastChild = fragment.lastChild;
    this.isBound = false;
    this.isAttached = false;
    this.fromCache = false;
    this.bindingContext = null;
    this.overrideContext = null;
    this.controller = null;
  }

  returnToCache(): void {
    this.viewFactory.returnViewToCache(this);
  }

  created(): void {
    let i;
    let ii;
    let controllers = this.controllers;

    for (i = 0, ii = controllers.length; i < ii; ++i) {
      controllers[i].created(this);
    }
  }

  bind(bindingContext: Object, overrideContext?: Object, _systemUpdate?: boolean): void {
    let context;
    let oContext;
    let controllers;
    let bindings;
    let children;
    let i;
    let ii;

    if (_systemUpdate) {
      context = this.bindingContext || bindingContext;
      oContext = this.overrideContext || overrideContext;
    } else {
      context = bindingContext || this.bindingContext;
      oContext = overrideContext || this.overrideContext;
    }

    if (this.isBound) {
      if (this.bindingContext === context) {
        return;
      }

      this.unbind();
    }

    this.isBound = true;
    this.bindingContext = context;
    this.overrideContext = oContext || createOverrideContext(context);

    bindings = this.bindings;
    for (i = 0, ii = bindings.length; i < ii; ++i) {
      bindings[i].bind(this);
    }

    controllers = this.controllers;
    for (i = 0, ii = controllers.length; i < ii; ++i) {
      controllers[i].bind(this);
    }

    children = this.children;
    for (i = 0, ii = children.length; i < ii; ++i) {
      children[i].bind(context, oContext, true);
    }
  }

  addBinding(binding: Binding): void {
    this.bindings.push(binding);

    if (this.isBound) {
      binding.bind(this.bindingContext);
    }
  }

  unbind(): void {
    let controllers;
    let bindings;
    let children;
    let i;
    let ii;

    if (this.isBound) {
      this.isBound = false;
      this.bindingContext = null;
      this.overrideContext = null;

      if(this.controller !== null) {
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
    }
  }

  insertNodesBefore(refNode: Node): void {
    let parent = refNode.parentNode;
    parent.insertBefore(this.fragment, refNode);
  }

  appendNodesTo(parent: Element): void {
    parent.appendChild(this.fragment);
  }

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

  attached(): void {
    let controllers;
    let children;
    let i;
    let ii;

    if (this.isAttached) {
      return;
    }

    this.isAttached = true;

    if(this.controller !== null) {
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

  detached(): void {
    let controllers;
    let children;
    let i;
    let ii;

    if (this.isAttached) {
      this.isAttached = false;

      if(this.controller !== null) {
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
