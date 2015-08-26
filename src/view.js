import {Binding} from 'aurelia-binding';
import {Container} from 'aurelia-dependency-injection';

//NOTE: Adding a fragment to the document causes the nodes to be removed from the fragment.
//NOTE: Adding to the fragment, causes the nodes to be removed from the document.

interface ViewNode {
  bind(bindingContext: Object, systemUpdate?: boolean): void;
  attached(): void;
  detached(): void;
  unbind(): void;
}

export class View {
  constructor(viewFactory: ViewFactory, container: Container, fragment: DocumentFragment, behaviors: BehaviorInstance[], bindings: Binding[], children: ViewNode[], systemControlled: boolean, contentSelectors: ContentSelector[]){
    this.viewFactory = viewFactory;
    this.container = container;
    this.fragment = fragment;
    this.behaviors = behaviors;
    this.bindings = bindings;
    this.children = children;
    this.systemControlled = systemControlled;
    this.contentSelectors = contentSelectors;
    this.firstChild = fragment.firstChild;
    this.lastChild = fragment.lastChild;
    this.isBound = false;
    this.isAttached = false;
    this.fromCache = false;
  }

  returnToCache(): void {
    this.viewFactory.returnViewToCache(this);
  }

  created(): void {
    var i, ii, behaviors = this.behaviors;
    for(i = 0, ii = behaviors.length; i < ii; ++i){
      behaviors[i].created(this);
    }
  }

  bind(bindingContext: Object, systemUpdate?: boolean): void {
    var context, behaviors, bindings, children, i, ii;

    if(systemUpdate && !this.systemControlled){
      context = this.bindingContext || bindingContext;
    }else{
      context = bindingContext || this.bindingContext;
    }

    if(this.isBound){
      if(this.bindingContext === context){
        return;
      }

      this.unbind();
    }

    this.isBound = true;
    this.bindingContext = context;

    if(this.owner){
      this.owner.bind(context);
    }

    bindings = this.bindings;
    for(i = 0, ii = bindings.length; i < ii; ++i){
      bindings[i].bind(context);
    }

    behaviors = this.behaviors;
    for(i = 0, ii = behaviors.length; i < ii; ++i){
      behaviors[i].bind(context);
    }

    children = this.children;
    for(i = 0, ii = children.length; i < ii; ++i){
      children[i].bind(context, true);
    }
  }

  addBinding(binding: Binding): void {
    this.bindings.push(binding);

    if(this.isBound){
      binding.bind(this.bindingContext);
    }
  }

  unbind(): void {
    var behaviors, bindings, children, i, ii;

    if(this.isBound){
      this.isBound = false;

      if(this.owner){
        this.owner.unbind();
      }

      bindings = this.bindings;
      for(i = 0, ii = bindings.length; i < ii; ++i){
        bindings[i].unbind();
      }

      behaviors = this.behaviors;
      for(i = 0, ii = behaviors.length; i < ii; ++i){
        behaviors[i].unbind();
      }

      children = this.children;
      for(i = 0, ii = children.length; i < ii; ++i){
        children[i].unbind();
      }
    }
  }

  insertNodesBefore(refNode: Node): void {
    var parent = refNode.parentNode;
    parent.insertBefore(this.fragment, refNode);
  }

  appendNodesTo(parent: Element): void {
    parent.appendChild(this.fragment);
  }

  removeNodes(): void {
    var start = this.firstChild,
        end = this.lastChild,
        fragment = this.fragment,
        next;

    var current = start,
        loop = true,
        nodes = [];

    while(loop){
      if(current === end){
        loop = false;
      }

      next = current.nextSibling;
      this.fragment.appendChild(current);
      current = next;
    }
  }

  attached(): void {
    var behaviors, children, i, ii;

    if(this.isAttached){
      return;
    }

    this.isAttached = true;

    if(this.owner){
      this.owner.attached();
    }

    behaviors = this.behaviors;
    for(i = 0, ii = behaviors.length; i < ii; ++i){
      behaviors[i].attached();
    }

    children = this.children;
    for(i = 0, ii = children.length; i < ii; ++i){
      children[i].attached();
    }
  }

  detached(): void {
    var behaviors, children, i, ii;

    if(this.isAttached){
      this.isAttached = false;

      if(this.owner){
        this.owner.detached();
      }

      behaviors = this.behaviors;
      for(i = 0, ii = behaviors.length; i < ii; ++i){
        behaviors[i].detached();
      }

      children = this.children;
      for(i = 0, ii = children.length; i < ii; ++i){
        children[i].detached();
      }
    }
  }
}
