import {ContentSelector} from './content-selector';
import {Animator} from './animator';

export class ViewSlot {
  constructor(anchor, anchorIsContainer, executionContext, animator=Animator.instance){
    this.anchor = anchor;
    this.viewAddMethod = anchorIsContainer ? 'appendNodesTo' : 'insertNodesBefore';
    this.executionContext = executionContext;
    this.animator = animator;
    this.children = [];
    this.isBound = false;
    this.isAttached = false;
    anchor.viewSlot = this;
  }

  transformChildNodesIntoView(){
    var parent = this.anchor;

    this.children.push({
      fragment:parent,
      firstChild:parent.firstChild,
      lastChild:parent.lastChild,
      removeNodes(){
        var last;

        while(last = parent.lastChild) {
          parent.removeChild(last);
        }
      },
      created(){},
      bind(){},
      unbind(){},
      attached(){},
      detached(){}
    });
  }

  bind(executionContext){
    var i, ii, children;

    if(this.isBound){
      if(this.executionContext === executionContext){
        return;
      }

      this.unbind();
    }

    this.isBound = true;
    this.executionContext = executionContext = executionContext || this.executionContext;

    children = this.children;
    for(i = 0, ii = children.length; i < ii; ++i){
      children[i].bind(executionContext, true);
    }
  }

  unbind(){
    var i, ii, children = this.children;
    this.isBound = false;

    for(i = 0, ii = children.length; i < ii; ++i){
      children[i].unbind();
    }
  }

  add(view){
    view[this.viewAddMethod](this.anchor);
    this.children.push(view);

    if(this.isAttached){
      view.attached();
      // Animate page itself
      var element = view.firstChild.nextElementSibling;
      if(view.firstChild.nodeType === 8 &&
        element !== undefined &&
        element.nodeType === 1 &&
        element.classList.contains('au-animate')) {
        this.animator.enter(element);
      }
    }
  }

  insert(index, view){
    if((index === 0 && !this.children.length) || index >= this.children.length){
      this.add(view);
    } else{
      view.insertNodesBefore(this.children[index].firstChild);
      this.children.splice(index, 0, view);

      if(this.isAttached){
        view.attached();
      }
    }
  }

  remove(view){
    view.removeNodes();

    this.children.splice(this.children.indexOf(view), 1);

    if(this.isAttached){
      view.detached();
    }
  }

  removeAt(index){
    var view = this.children[index];

    var removeAction = () => {
      view.removeNodes();
      this.children.splice(index, 1);

      if(this.isAttached){
        view.detached();
      }

      return view;
    };

    var element = view.firstChild.nextElementSibling;
    if(view.firstChild.nodeType === 8 &&
      element !== undefined &&
      element.nodeType === 1 &&
      element.classList.contains('au-animate')) {
      return this.animator.leave(element).then( () => {
        return removeAction();
      })
    } else {
      return removeAction();
    }
  }

  removeAll(){
    var children = this.children,
        ii = children.length,
        i;

    var rmPromises = [];

    children.forEach( (child) => {
      var element = child.firstChild.nextElementSibling;
      if(child.firstChild !== undefined &&
         child.firstChild.nodeType === 8 &&
         element !== undefined &&
         element.nodeType === 1 &&
         element.classList.contains('au-animate')) {
        rmPromises.push(this.animator.leave(element).then( () => {
          child.removeNodes();
        }));
      } else {
        child.removeNodes();
      }
    });

    var removeAction = () => {
      if(this.isAttached){
        for(i = 0; i < ii; ++i){
          children[i].detached();
        }
      }

      this.children = [];
    };

    if(rmPromises.length > 0) {
      return Promise.all(rmPromises).then( () => {
        removeAction();
      });
    } else {
      removeAction();
    }
  }

  swap(view){
    var removeResponse = this.removeAll();
    if(removeResponse !== undefined) {
      removeResponse.then(() => {
        this.add(view);
      });
    } else {
      this.add(view);
    }
  }

  attached(){
    var i, ii, children;

    if(this.isAttached){
      return;
    }

    this.isAttached = true;

    children = this.children;
    for(i = 0, ii = children.length; i < ii; ++i){
      children[i].attached();

      var element = children[i].firstChild.nextElementSibling;
      if(children[i].firstChild.nodeType === 8 &&
         element !== undefined &&
         element.nodeType === 1 &&
         element.classList.contains('au-animate')) {
        this.animator.enter(element);
      }
    }
  }

  detached(){
    var i, ii, children;

    if(this.isAttached){
      this.isAttached = false;
      children = this.children;
      for(i = 0, ii = children.length; i < ii; ++i){
        children[i].detached();
      }
    }
  }

  installContentSelectors(contentSelectors){
    this.contentSelectors = contentSelectors;
    this.add = this.contentSelectorAdd;
    this.insert = this.contentSelectorInsert;
    this.remove = this.contentSelectorRemove;
    this.removeAt = this.contentSelectorRemoveAt;
    this.removeAll = this.contentSelectorRemoveAll;
  }

  contentSelectorAdd(view){
    ContentSelector.applySelectors(
      view,
      this.contentSelectors,
      (contentSelector, group) => contentSelector.add(group)
      );

    this.children.push(view);

    if(this.isAttached){
      view.attached();
    }
  }

  contentSelectorInsert(index, view){
    if((index === 0 && !this.children.length) || index >= this.children.length){
      this.add(view);
    } else{
      ContentSelector.applySelectors(
        view,
        this.contentSelectors,
        (contentSelector, group) => contentSelector.insert(index, group)
      );

      this.children.splice(index, 0, view);

      if(this.isAttached){
        view.attached();
      }
    }
  }

  contentSelectorRemove(view){
    var index = this.children.indexOf(view),
        contentSelectors = this.contentSelectors,
        i, ii;

    for(i = 0, ii = contentSelectors.length; i < ii; ++i){
      contentSelectors[i].removeAt(index, view.fragment);
    }

    this.children.splice(index, 1);

    if(this.isAttached){
      view.detached();
    }
  }

  contentSelectorRemoveAt(index){
    var view = this.children[index],
        contentSelectors = this.contentSelectors,
        i, ii;

    for(i = 0, ii = contentSelectors.length; i < ii; ++i){
      contentSelectors[i].removeAt(index, view.fragment);
    }

    this.children.splice(index, 1);

    if(this.isAttached){
      view.detached();
    }

    return view;
  }

  contentSelectorRemoveAll(){
    var children = this.children,
        contentSelectors = this.contentSelectors,
        ii = children.length,
        jj = contentSelectors.length,
        i, j, view;

    for(i = 0; i < ii; ++i){
      view = children[i];

      for(j = 0; j < jj; ++j){
        contentSelectors[j].removeAt(i, view.fragment);
      }
    }

    if(this.isAttached){
      for(i = 0; i < ii; ++i){
        children[i].detached();
      }
    }

    this.children = [];
  }
}
