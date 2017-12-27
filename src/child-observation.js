import {DOM} from 'aurelia-pal';
import {metadata} from 'aurelia-metadata';
import {HtmlBehaviorResource} from './html-behavior';

function createChildObserverDecorator(selectorOrConfig, all) {
  return function(target, key, descriptor) {
    let actualTarget = typeof key === 'string' ? target.constructor : target; //is it on a property or a class?
    let r = metadata.getOrCreateOwn(metadata.resource, HtmlBehaviorResource, actualTarget);

    if (typeof selectorOrConfig === 'string') {
      selectorOrConfig = {
        selector: selectorOrConfig,
        name: key
      };
    }

    if (descriptor) {
      descriptor.writable = true;
      descriptor.configurable = true;
    }

    selectorOrConfig.all = all;
    r.addChildBinding(new ChildObserver(selectorOrConfig));
  };
}

/**
* Creates a behavior property that references an array of immediate content child elements that matches the provided selector.
*/
export function children(selectorOrConfig: string | Object): any {
  return createChildObserverDecorator(selectorOrConfig, true);
}

/**
* Creates a behavior property that references an immediate content child element that matches the provided selector.
*/
export function child(selectorOrConfig: string | Object): any {
  return createChildObserverDecorator(selectorOrConfig, false);
}

class ChildObserver {
  constructor(config) {
    this.name = config.name;
    this.changeHandler = config.changeHandler || this.name + 'Changed';
    this.selector = config.selector;
    this.all = config.all;
  }

  create(viewHost, viewModel, controller) {
    return new ChildObserverBinder(this.selector, viewHost, this.name, viewModel, controller, this.changeHandler, this.all);
  }
}

const noMutations = [];

function trackMutation(groupedMutations, binder, record) {
  let mutations = groupedMutations.get(binder);

  if (!mutations) {
    mutations = [];
    groupedMutations.set(binder, mutations);
  }

  mutations.push(record);
}

function onChildChange(mutations, observer) {
  let binders = observer.binders;
  let bindersLength = binders.length;
  let groupedMutations = new Map();

  for (let i = 0, ii = mutations.length; i < ii; ++i) {
    let record = mutations[i];
    let added = record.addedNodes;
    let removed = record.removedNodes;

    for (let j = 0, jj = removed.length; j < jj; ++j) {
      let node = removed[j];
      if (node.nodeType === 1) {
        for (let k = 0; k < bindersLength; ++k) {
          let binder = binders[k];
          if (binder.onRemove(node)) {
            trackMutation(groupedMutations, binder, record);
          }
        }
      }
    }

    for (let j = 0, jj = added.length; j < jj; ++j) {
      let node = added[j];
      if (node.nodeType === 1) {
        for (let k = 0; k < bindersLength; ++k) {
          let binder = binders[k];
          if (binder.onAdd(node)) {
            trackMutation(groupedMutations, binder, record);
          }
        }
      }
    }
  }

  groupedMutations.forEach((value, key) => {
    if (key.changeHandler !== null) {
      key.viewModel[key.changeHandler](value);
    }
  });
}

class ChildObserverBinder {
  constructor(selector, viewHost, property, viewModel, controller, changeHandler, all) {
    this.selector = selector;
    this.viewHost = viewHost;
    this.property = property;
    this.viewModel = viewModel;
    this.controller = controller;
    this.changeHandler = changeHandler in viewModel ? changeHandler : null;
    this.usesShadowDOM = controller.behavior.usesShadowDOM;
    this.all = all;

    if (!this.usesShadowDOM && controller.view && controller.view.contentView) {
      this.contentView = controller.view.contentView;
    } else {
      this.contentView = null;
    }
  }

  matches(element) {
    if (element.matches(this.selector)) {
      if (this.contentView === null) {
        return true;
      }

      let contentView = this.contentView;
      let assignedSlot = element.auAssignedSlot;

      if (assignedSlot && assignedSlot.projectFromAnchors) {
        let anchors = assignedSlot.projectFromAnchors;

        for (let i = 0, ii = anchors.length; i < ii; ++i) {
          if (anchors[i].auOwnerView === contentView) {
            return true;
          }
        }

        return false;
      }

      return element.auOwnerView === contentView;
    }

    return false;
  }

  bind(source) {
    let viewHost = this.viewHost;
    let viewModel = this.viewModel;
    let observer = viewHost.__childObserver__;

    if (!observer) {
      observer = viewHost.__childObserver__ = DOM.createMutationObserver(onChildChange);

      let options = {
        childList: true,
        subtree: !this.usesShadowDOM
      };

      observer.observe(viewHost, options);
      observer.binders = [];
    }

    observer.binders.push(this);

    if (this.usesShadowDOM) { //if using shadow dom, the content is already present, so sync the items
      let current = viewHost.firstElementChild;

      if (this.all) {
        let items = viewModel[this.property];
        if (!items) {
          items = viewModel[this.property] = [];
        } else {
          // The existing array may alread be observed in other bindings
          // Setting length to 0 will not work properly, unless we intercept it
          items.splice(0);
        }

        while (current) {
          if (this.matches(current)) {
            items.push(current.au && current.au.controller ? current.au.controller.viewModel : current);
          }

          current = current.nextElementSibling;
        }

        if (this.changeHandler !== null) {
          this.viewModel[this.changeHandler](noMutations);
        }
      } else {
        while (current) {
          if (this.matches(current)) {
            let value = current.au && current.au.controller ? current.au.controller.viewModel : current;
            this.viewModel[this.property] = value;

            if (this.changeHandler !== null) {
              this.viewModel[this.changeHandler](value);
            }

            break;
          }

          current = current.nextElementSibling;
        }
      }
    }
  }

  onRemove(element) {
    if (this.matches(element)) {
      let value = element.au && element.au.controller ? element.au.controller.viewModel : element;

      if (this.all) {
        let items = (this.viewModel[this.property] || (this.viewModel[this.property] = []));
        let index = items.indexOf(value);

        if (index !== -1) {
          items.splice(index, 1);
        }

        return true;
      }

      return false;
    }

    return false;
  }

  onAdd(element) {
    if (this.matches(element)) {
      let value = element.au && element.au.controller ? element.au.controller.viewModel : element;

      if (this.all) {
        let items = (this.viewModel[this.property] || (this.viewModel[this.property] = []));

        if (this.selector === '*') {
          items.push(value);
          return true;
        }

        let index = 0;
        let prev = element.previousElementSibling;

        while (prev) {
          if (this.matches(prev)) {
            index++;
          }

          prev = prev.previousElementSibling;
        }

        items.splice(index, 0, value);
        return true;
      }

      this.viewModel[this.property] = value;

      if (this.changeHandler !== null) {
        this.viewModel[this.changeHandler](value);
      }
    }

    return false;
  }

  unbind() {
    if (this.viewHost.__childObserver__) {
      this.viewHost.__childObserver__.disconnect();
      this.viewHost.__childObserver__ = null;
      this.viewModel[this.property] = null;
    }
  }
}
