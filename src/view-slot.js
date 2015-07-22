import {ContentSelector} from './content-selector';
import {Animator} from './animator';
import {nextElementSibling} from './util';

function getAnimatableElement(view){
  let firstChild = view.firstChild;

  if(firstChild !== null && firstChild !== undefined && firstChild.nodeType === 8){
    let element = nextElementSibling(firstChild);

    if(element !== null && element !== undefined &&
      element.nodeType === 1 &&
      element.classList.contains('au-animate')) {
      return element;
    }
  }

  return null;
}

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

      let animatableElement = getAnimatableElement(view);
      if(animatableElement !== null){
        return this.animator.enter(animatableElement);
      }
    }
  }

  insert(index, view){
    let children = this.children,
        length = children.length;

    if((index === 0 && length === 0) || index >= length){
      return this.add(view);
    } else{
      view.insertNodesBefore(children[index].firstChild);
      children.splice(index, 0, view);

      if(this.isAttached){
        view.attached();

        let animatableElement = getAnimatableElement(view);
        if(animatableElement !== null){
          return this.animator.enter(animatableElement);
        }
      }
    }
  }

  remove(view){
    return this.removeAt(this.children.indexOf(view));
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

    let animatableElement = getAnimatableElement(view);
    if(animatableElement !== null){
      return this.animator.leave(animatableElement).then(() => removeAction());
    }

    return removeAction();
  }

  removeAll(){
    var children = this.children,
        ii = children.length,
        i;

    var rmPromises = [];

    children.forEach(child => {
      let animatableElement = getAnimatableElement(child);
      if(animatableElement !== null){
        rmPromises.push(this.animator.leave(animatableElement).then(() => child.removeNodes()));
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
      return Promise.all(rmPromises).then(() => removeAction());
    } else {
      removeAction();
    }
  }

  swap(view){
    var removeResponse = this.removeAll();

    if(removeResponse !== undefined) {
      return removeResponse.then(() => this.add(view));
    } else {
      return this.add(view);
    }
  }

  attached(){
    var i, ii, children, child;

    if(this.isAttached){
      return;
    }

    this.isAttached = true;

    children = this.children;
    for(i = 0, ii = children.length; i < ii; ++i){
      child = children[i];
      child.attached();

      var element = child.firstChild ? nextElementSibling(child.firstChild) : null;
      if(child.firstChild &&
        child.firstChild.nodeType === 8 &&
         element &&
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
