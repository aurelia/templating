import {ContentSelector} from './content-selector';
import {Animator} from './animator';
import {nextElementSibling} from './dom';
import {View} from './view';

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
  constructor(anchor: Node, anchorIsContainer: boolean, bindingContext?: Object, animator?: Animator = Animator.instance){
    this.anchor = anchor;
    this.viewAddMethod = anchorIsContainer ? 'appendNodesTo' : 'insertNodesBefore';
    this.bindingContext = bindingContext;
    this.animator = animator;
    this.children = [];
    this.isBound = false;
    this.isAttached = false;
    this.contentSelectors = null;
    anchor.viewSlot = this;
  }

  transformChildNodesIntoView(): void {
    var parent = this.anchor;

    this.children.push({
      fragment:parent,
      firstChild:parent.firstChild,
      lastChild:parent.lastChild,
      returnToCache(){},
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

  bind(bindingContext: Object): void {
    var i, ii, children;

    if(this.isBound){
      if(this.bindingContext === bindingContext){
        return;
      }

      this.unbind();
    }

    this.isBound = true;
    this.bindingContext = bindingContext = bindingContext || this.bindingContext;

    children = this.children;
    for(i = 0, ii = children.length; i < ii; ++i){
      children[i].bind(bindingContext, true);
    }
  }

  unbind(): void {
    var i, ii, children = this.children;
    this.isBound = false;

    for(i = 0, ii = children.length; i < ii; ++i){
      children[i].unbind();
    }
  }

  add(view: View): void {
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

  insert(index: number, view: View): void | Promise<any> {
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

  remove(view: View, returnToCache?: boolean, skipAnimation?: boolean): void | Promise<View> {
    return this.removeAt(this.children.indexOf(view), returnToCache, skipAnimation);
  }

  removeAt(index: number, returnToCache?: boolean, skipAnimation?: boolean): void | Promise<View> {
    var view = this.children[index];

    var removeAction = () => {
      view.removeNodes();
      this.children.splice(index, 1);

      if(this.isAttached){
        view.detached();
      }

      if(returnToCache){
        view.returnToCache();
      }

      return view;
    };

    if(!skipAnimation){
      let animatableElement = getAnimatableElement(view);
      if(animatableElement !== null){
        return this.animator.leave(animatableElement).then(() => removeAction());
      }
    }

    return removeAction();
  }

  removeAll(returnToCache?: boolean, skipAnimation?: boolean): void | Promise<any> {
    var children = this.children,
        ii = children.length,
        i;

    var rmPromises = [];

    children.forEach(child => {
      if(skipAnimation){
        child.removeNodes();
        return;
      }

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

      if(returnToCache){
        for(i = 0; i < ii; ++i){
          children[i].returnToCache();
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

  swap(view: View, returnToCache?: boolean): void | Promise<any> {
    var removeResponse = this.removeAll(returnToCache);

    if(removeResponse instanceof Promise){
      return removeResponse.then(() => this.add(view));
    } else{
      return this.add(view);
    }
  }

  attached(): void {
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

  detached(): void {
    var i, ii, children;

    if(this.isAttached){
      this.isAttached = false;
      children = this.children;
      for(i = 0, ii = children.length; i < ii; ++i){
        children[i].detached();
      }
    }
  }

  installContentSelectors(contentSelectors: ContentSelector[]): void {
    this.contentSelectors = contentSelectors;
    this.add = this._contentSelectorAdd;
    this.insert = this._contentSelectorInsert;
    this.remove = this._contentSelectorRemove;
    this.removeAt = this._contentSelectorRemoveAt;
    this.removeAll = this._contentSelectorRemoveAll;
  }

  _contentSelectorAdd(view){
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

  _contentSelectorInsert(index, view){
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

  _contentSelectorRemove(view){
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

  _contentSelectorRemoveAt(index){
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

  _contentSelectorRemoveAll(){
    var children = this.children,
        contentSelectors = this.contentSelectors,
        ii = children.length,
        jj = contentSelectors.length,
        i, j, view;

    for(i = 0; i < ii; ++i){
      view = children[i];

      for(j = 0; j < jj; ++j){
        contentSelectors[j].removeAt(0, view.fragment);
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
