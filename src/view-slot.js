import {Animator} from './animator';
import {View} from './view';
import {ShadowDOM} from './shadow-dom';

function getAnimatableElement(view) {
  if (view.animatableElement !== undefined) {
    return view.animatableElement;
  }

  let current = view.firstChild;

  while (current && current.nodeType !== 1) {
    current = current.nextSibling;
  }

  if (current && current.nodeType === 1) {
    return (view.animatableElement = current.classList.contains('au-animate') ? current : null);
  }

  return (view.animatableElement = null);
}

/**
* Represents a slot or location within the DOM to which views can be added and removed.
* Manages the view lifecycle for its children.
*/
export class ViewSlot {
  /**
  * Creates an instance of ViewSlot.
  * @param anchor The DOM node which will server as the anchor or container for insertion.
  * @param anchorIsContainer Indicates whether the node is a container.
  * @param animator The animator that will controll enter/leave transitions for this slot.
  */
  constructor(anchor: Node, anchorIsContainer: boolean, animator?: Animator = Animator.instance) {
    this.anchor = anchor;
    this.anchorIsContainer = anchorIsContainer;
    this.bindingContext = null;
    this.overrideContext = null;
    this.animator = animator;
    this.children = [];
    this.isBound = false;
    this.isAttached = false;
    this.contentSelectors = null;
    anchor.viewSlot = this;
    anchor.isContentProjectionSource = false;
  }

  /**
   *   Runs the animator against the first animatable element found within the view's fragment
   *   @param  view       The view to use when searching for the element.
   *   @param  direction  The animation direction enter|leave.
   *   @returns An animation complete Promise or undefined if no animation was run.
   */
  animateView(view: View, direction: string = 'enter'): void | Promise<any> {
    let animatableElement = getAnimatableElement(view);

    if (animatableElement !== null) {
      switch (direction) {
      case 'enter':
        return this.animator.enter(animatableElement);
      case 'leave':
        return this.animator.leave(animatableElement);
      default:
        throw new Error('Invalid animation direction: ' + direction);
      }
    }
  }

  /**
  * Takes the child nodes of an existing element that has been converted into a ViewSlot
  * and makes those nodes into a View within the slot.
  */
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

  /**
  * Binds the slot and it's children.
  * @param bindingContext The binding context to bind to.
  * @param overrideContext A secondary binding context that can override the standard context.
  */
  bind(bindingContext: Object, overrideContext: Object): void {
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
    this.overrideContext = overrideContext = overrideContext || this.overrideContext;

    children = this.children;
    for (i = 0, ii = children.length; i < ii; ++i) {
      children[i].bind(bindingContext, overrideContext, true);
    }
  }

  /**
  * Unbinds the slot and its children.
  */
  unbind(): void {
    if (this.isBound) {
      let i;
      let ii;
      let children = this.children;

      this.isBound = false;
      this.bindingContext = null;
      this.overrideContext = null;

      for (i = 0, ii = children.length; i < ii; ++i) {
        children[i].unbind();
      }
    }
  }

  /**
  * Adds a view to the slot.
  * @param view The view to add.
  * @return May return a promise if the view addition triggered an animation.
  */
  add(view: View): void | Promise<any> {
    if (this.anchorIsContainer) {
      view.appendNodesTo(this.anchor);
    } else {
      view.insertNodesBefore(this.anchor);
    }

    this.children.push(view);

    if (this.isAttached) {
      view.attached();
      return this.animateView(view, 'enter');
    }
  }

  /**
  * Inserts a view into the slot.
  * @param index The index to insert the view at.
  * @param view The view to insert.
  * @return May return a promise if the view insertion triggered an animation.
  */
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
      return this.animateView(view, 'enter');
    }
  }

  /**
   * Moves a view across the slot.
   * @param sourceIndex The index the view is currently at.
   * @param targetIndex The index to insert the view at.
   */
  move(sourceIndex, targetIndex) {
    if (sourceIndex === targetIndex) {
      return;
    }

    const children = this.children;
    const view = children[sourceIndex];

    view.removeNodes();
    view.insertNodesBefore(children[targetIndex].firstChild);
    children.splice(sourceIndex, 1);
    children.splice(targetIndex, 0, view);
  }

  /**
  * Removes a view from the slot.
  * @param view The view to remove.
  * @param returnToCache Should the view be returned to the view cache?
  * @param skipAnimation Should the removal animation be skipped?
  * @return May return a promise if the view removal triggered an animation.
  */
  remove(view: View, returnToCache?: boolean, skipAnimation?: boolean): View | Promise<View> {
    return this.removeAt(this.children.indexOf(view), returnToCache, skipAnimation);
  }

  /**
  * Removes many views from the slot.
  * @param viewsToRemove The array of views to remove.
  * @param returnToCache Should the views be returned to the view cache?
  * @param skipAnimation Should the removal animation be skipped?
  * @return May return a promise if the view removal triggered an animation.
  */
  removeMany(viewsToRemove: View[], returnToCache?: boolean, skipAnimation?: boolean): void | Promise<void> {
    const children = this.children;
    let ii = viewsToRemove.length;
    let i;
    let rmPromises = [];

    viewsToRemove.forEach(child => {
      if (skipAnimation) {
        child.removeNodes();
        return;
      }

      let animation = this.animateView(child, 'leave');
      if (animation) {
        rmPromises.push(animation.then(() => child.removeNodes()));
      } else {
        child.removeNodes();
      }
    });

    let removeAction = () => {
      if (this.isAttached) {
        for (i = 0; i < ii; ++i) {
          viewsToRemove[i].detached();
        }
      }

      if (returnToCache) {
        for (i = 0; i < ii; ++i) {
          viewsToRemove[i].returnToCache();
        }
      }

      for (i = 0; i < ii; ++i) {
        const index = children.indexOf(viewsToRemove[i]);
        if (index >= 0) {
          children.splice(index, 1);
        }
      }
    };

    if (rmPromises.length > 0) {
      return Promise.all(rmPromises).then(() => removeAction());
    }

    return removeAction();
  }

  /**
  * Removes a view an a specified index from the slot.
  * @param index The index to remove the view at.
  * @param returnToCache Should the view be returned to the view cache?
  * @param skipAnimation Should the removal animation be skipped?
  * @return May return a promise if the view removal triggered an animation.
  */
  removeAt(index: number, returnToCache?: boolean, skipAnimation?: boolean): View | Promise<View> {
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
      let animation = this.animateView(view, 'leave');
      if (animation) {
        return animation.then(() => removeAction());
      }
    }

    return removeAction();
  }

  /**
  * Removes all views from the slot.
  * @param returnToCache Should the view be returned to the view cache?
  * @param skipAnimation Should the removal animation be skipped?
  * @return May return a promise if the view removals triggered an animation.
  */
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

      let animation = this.animateView(child, 'leave');
      if (animation) {
        rmPromises.push(animation.then(() => child.removeNodes()));
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
          const child = children[i];

          if (child) {
            child.returnToCache();
          }
        }
      }

      this.children = [];
    };

    if (rmPromises.length > 0) {
      return Promise.all(rmPromises).then(() => removeAction());
    }

    return removeAction();
  }

  /**
  * Triggers the attach for the slot and its children.
  */
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
      this.animateView(child, 'enter');
    }
  }

  /**
  * Triggers the detach for the slot and its children.
  */
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

  projectTo(slots: Object): void {
    this.projectToSlots = slots;
    this.add = this._projectionAdd;
    this.insert = this._projectionInsert;
    this.move = this._projectionMove;
    this.remove = this._projectionRemove;
    this.removeAt = this._projectionRemoveAt;
    this.removeMany = this._projectionRemoveMany;
    this.removeAll = this._projectionRemoveAll;
    this.children.forEach(view => ShadowDOM.distributeView(view, slots, this));
  }

  _projectionAdd(view) {
    ShadowDOM.distributeView(view, this.projectToSlots, this);

    this.children.push(view);

    if (this.isAttached) {
      view.attached();
    }
  }

  _projectionInsert(index, view) {
    if ((index === 0 && !this.children.length) || index >= this.children.length) {
      this.add(view);
    } else {
      ShadowDOM.distributeView(view, this.projectToSlots, this, index);

      this.children.splice(index, 0, view);

      if (this.isAttached) {
        view.attached();
      }
    }
  }

  _projectionMove(sourceIndex, targetIndex) {
    if (sourceIndex === targetIndex) {
      return;
    }

    const children = this.children;
    const view = children[sourceIndex];

    ShadowDOM.undistributeView(view, this.projectToSlots, this);
    ShadowDOM.distributeView(view, this.projectToSlots, this, targetIndex);

    children.splice(sourceIndex, 1);
    children.splice(targetIndex, 0, view);
  }

  _projectionRemove(view, returnToCache) {
    ShadowDOM.undistributeView(view, this.projectToSlots, this);
    this.children.splice(this.children.indexOf(view), 1);

    if (this.isAttached) {
      view.detached();
    }
    if (returnToCache) {
      view.returnToCache();
    }
  }

  _projectionRemoveAt(index, returnToCache) {
    let view = this.children[index];

    ShadowDOM.undistributeView(view, this.projectToSlots, this);
    this.children.splice(index, 1);

    if (this.isAttached) {
      view.detached();
    }
    if (returnToCache) {
      view.returnToCache();
    }
  }

  _projectionRemoveMany(viewsToRemove, returnToCache?) {
    viewsToRemove.forEach(view => this.remove(view, returnToCache));
  }

  _projectionRemoveAll(returnToCache) {
    ShadowDOM.undistributeAll(this.projectToSlots, this);

    let children = this.children;
    let ii = children.length;

    for (let i = 0; i < ii; ++i) {
      if (returnToCache) {
        children[i].returnToCache();
      } else if (this.isAttached) {
        children[i].detached();
      }
    }

    this.children = [];
  }
}
