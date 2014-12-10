//NOTE: Adding a fragment to the document causes the nodes to be removed from the fragment.
//NOTE: Adding to the fragment, causes the nodes to be removed from the document.

export class View {
  constructor(fragment, behaviors, bindings, children, systemControlled, contentSelectors){
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
  }

  created(executionContext){
    this.behaviors.forEach(x => x.created(executionContext));
  }

  bind(executionContext, systemUpdate){
    var context;

    if(systemUpdate && !this.systemControlled){
      context = this.executionContext || executionContext;
    }else{
      context = executionContext || this.executionContext;
    }

    if(this.isBound){
      if(this.executionContext === context){
        return;
      }

      this.unbind();
    }

    this.isBound = true;
    this.executionContext = context;

    if(this.owner){
      this.owner.bind(context);
    }

    this.behaviors.forEach(x => x.bind(context));
    this.bindings.forEach(x => x.bind(context));
    this.children.forEach(x => x.bind(context, true));
  }

  addBinding(binding){
    this.bindings.push(binding);

    if(this.isBound){
      binding.bind(this.executionContext);
    }
  }

  unbind(){
    if(this.isBound){
      this.isBound = false;

      if(this.owner){
        this.owner.unbind();
      }

      this.behaviors.forEach(x => x.unbind());
      this.bindings.forEach(x => x.unbind());
      this.children.forEach(x => x.unbind());
    }
  }

  insertNodesBefore(refNode){
    var parent = refNode.parentNode;
    parent.insertBefore(this.fragment, refNode); 
  }

  appendNodesTo(parent){
    parent.appendChild(this.fragment);
  }

  removeNodes(){
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

  attached(){
    if(this.isAttached){
      return;
    }

    this.isAttached = true;

    if(this.owner){
      this.owner.attached();
    }

    this.behaviors.forEach(x => x.attached());
    this.children.forEach(x => x.attached());
  }

  detached(){
    if(this.isAttached){
      this.isAttached = false;

      if(this.owner){
        this.owner.detached();
      }

      this.behaviors.forEach(x => x.detached());
      this.children.forEach(x => x.detached());    
    }
  }
}