import {ContentSelector} from './content-selector';
import {Animator} from './animator';
import {View} from './view';
import {DOM} from 'aurelia-pal';

function getAnimatableElement(view) {
  let firstChild = view.firstChild;

  if (firstChild !== null && firstChild !== undefined && firstChild.nodeType === 8) {
    let element = DOM.nextElementSibling(firstChild);

    if (element !== null && element !== undefined &&
      element.nodeType === 1 &&
      element.classList.contains('au-animate')) {
      return element;
    }
  }

  return null;
}

export class ViewSlot {
  constructor(anchor: Node, anchorIsContainer: boolean, animator?: Animator = Animator.instance) {
    this.anchor = anchor;
    this.viewAddMethod = anchorIsContainer ? 'appendNodesTo' : 'insertNodesBefore';
    this.bindingContext = null;
    this.animator = animator;
    this.children = [];
    this.isBound = false;
    this.isAttached = false;
    this.contentSelectors = null;
    anchor.viewSlot = this;
  }

  transformChildNodesIntoView(): void {
    let parent = this.anchor;

    this.children.push({
      fragment: parent,
      firstChild: parent.firstChild,
      lastChild: parent.lastChild,
      returnToCache() {},
      removeNodes() {
        let last;

        while (last = parent.lastChild) {
          parent.removeChild(last);
        }
      },
      created() {},
      bind() {},
      unbind() {},
      attached() {},
      detached() {}
    });
  }

  bind(bindingContext: Object): void {
    let i;
    let ii;
    let children;

    if (this.isBound) {
      if (this.bindingContext === bindingContext) {
        return;
      }

      this.unbind();
    }

    this.isBound = true;
    this.bindingContext = bindingContext = bindingContext || this.bindingContext;

    children = this.children;
    for (i = 0, ii = children.length; i < ii; ++i) {
      children[i].bind(bindingContext, true);
    }
  }

  unbind(): void {
    let i;
    let ii;
    let children = this.children;

    this.isBound = false;

    for (i = 0, ii = children.length; i < ii; ++i) {
      children[i].unbind();
    }
  }

  add(view: View): void {
    view[this.viewAddMethod](this.anchor);
    this.children.push(view);

    if (this.isAttached) {
      view.attached();

      let animatableElement = getAnimatableElement(view);
      if (animatableElement !== null) {
        return this.animator.enter(animatableElement);
      }
    }
  }

  insert(index: number, view: View): void | Promise<any> {
    let children = this.children;
    let length = children.length;

    if ((index === 0 && length === 0) || index >= length) {
      return this.add(view);
    }

    view.insertNodesBefore(children[index].firstChild);
    children.splice(index, 0, view);

    if (this.isAttached) {
      view.attached();

      let animatableElement = getAnimatableElement(view);
      if (animatableElement !== null) {
        return this.animator.enter(animatableElement);
      }
    }
  }

  remove(view: View, returnToCache?: boolean, skipAnimation?: boolean): void | Promise<View> {
    return this.removeAt(this.children.indexOf(view), returnToCache, skipAnimation);
  }

  removeAt(index: number, returnToCache?: boolean, skipAnimation?: boolean): void | Promise<View> {
    let view = this.children[index];

    let removeAction = () => {
      index = this.children.indexOf(view);
      view.removeNodes();
      this.children.splice(index, 1);

      if (this.isAttached) {
        view.detached();
      }

      if (returnToCache) {
        view.returnToCache();
      }

      return view;
    };

    if (!skipAnimation) {
      let animatableElement = getAnimatableElement(view);
      if (animatableElement !== null) {
        return this.animator.leave(animatableElement).then(() => removeAction());
      }
    }

    return removeAction();
  }

  removeAll(returnToCache?: boolean, skipAnimation?: boolean): void | Promise<any> {
    let children = this.children;
    let ii = children.length;
    let i;
    let rmPromises = [];

    children.forEach(child => {
      if (skipAnimation) {
        child.removeNodes();
        return;
      }

      let animatableElement = getAnimatableElement(child);
      if (animatableElement !== null) {
        rmPromises.push(this.animator.leave(animatableElement).then(() => child.removeNodes()));
      } else {
        child.removeNodes();
      }
    });

    let removeAction = () => {
      if (this.isAttached) {
        for (i = 0; i < ii; ++i) {
          children[i].detached();
        }
      }

      if (returnToCache) {
        for (i = 0; i < ii; ++i) {
          children[i].returnToCache();
        }
      }

      this.children = [];
    };

    if (rmPromises.length > 0) {
      return Promise.all(rmPromises).then(() => removeAction());
    }

    removeAction();
  }

  attached(): void {
    let i;
    let ii;
    let children;
    let child;

    if (this.isAttached) {
      return;
    }

    this.isAttached = true;

    children = this.children;
    for (i = 0, ii = children.length; i < ii; ++i) {
      child = children[i];
      child.attached();

      let element = child.firstChild ? DOM.nextElementSibling(child.firstChild) : null;
      if (child.firstChild &&
        child.firstChild.nodeType === 8 &&
         element &&
         element.nodeType === 1 &&
         element.classList.contains('au-animate')) {
        this.animator.enter(element);
      }
    }
  }

  detached(): void {
    let i;
    let ii;
    let children;

    if (this.isAttached) {
      this.isAttached = false;
      children = this.children;
      for (i = 0, ii = children.length; i < ii; ++i) {
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

  _contentSelectorAdd(view) {
    ContentSelector.applySelectors(
      view,
      this.contentSelectors,
      (contentSelector, group) => contentSelector.add(group)
      );

    this.children.push(view);

    if (this.isAttached) {
      view.attached();
    }
  }

  _contentSelectorInsert(index, view) {
    if ((index === 0 && !this.children.length) || index >= this.children.length) {
      this.add(view);
    } else {
      ContentSelector.applySelectors(
        view,
        this.contentSelectors,
        (contentSelector, group) => contentSelector.insert(index, group)
      );

      this.children.splice(index, 0, view);

      if (this.isAttached) {
        view.attached();
      }
    }
  }

  _contentSelectorRemove(view) {
    let index = this.children.indexOf(view);
    let contentSelectors = this.contentSelectors;
    let i;
    let ii;

    for (i = 0, ii = contentSelectors.length; i < ii; ++i) {
      contentSelectors[i].removeAt(index, view.fragment);
    }

    this.children.splice(index, 1);

    if (this.isAttached) {
      view.detached();
    }
  }

  _contentSelectorRemoveAt(index) {
    let view = this.children[index];
    let contentSelectors = this.contentSelectors;
    let i;
    let ii;

    for (i = 0, ii = contentSelectors.length; i < ii; ++i) {
      contentSelectors[i].removeAt(index, view.fragment);
    }

    this.children.splice(index, 1);

    if (this.isAttached) {
      view.detached();
    }

    return view;
  }

  _contentSelectorRemoveAll() {
    let children = this.children;
    let contentSelectors = this.contentSelectors;
    let ii = children.length;
    let jj = contentSelectors.length;
    let i;
    let j;
    let view;

    for (i = 0; i < ii; ++i) {
      view = children[i];

      for (j = 0; j < jj; ++j) {
        contentSelectors[j].removeAt(0, view.fragment);
      }
    }

    if (this.isAttached) {
      for (i = 0; i < ii; ++i) {
        children[i].detached();
      }
    }

    this.children = [];
  }
}
