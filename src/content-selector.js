let placeholder = [];

function findInsertionPoint(groups, index) {
  let insertionPoint;

  while (!insertionPoint && index >= 0) {
    insertionPoint = groups[index][0];
    index--;
  }

  return insertionPoint;
}

export class _ContentSelector {
  static applySelectors(view, contentSelectors, callback) {
    let currentChild = view.fragment.firstChild;
    let contentMap = new Map();
    let nextSibling;
    let i;
    let ii;
    let contentSelector;

    while (currentChild) {
      nextSibling = currentChild.nextSibling;

      if (currentChild.isContentProjectionSource) {
        let viewSlotSelectors = contentSelectors.map(x => x.copyForViewSlot());
        currentChild.viewSlot._installContentSelectors(viewSlotSelectors);
      } else {
        for (i = 0, ii = contentSelectors.length; i < ii; i++) {
          contentSelector = contentSelectors[i];
          if (contentSelector.matches(currentChild)) {
            let elements = contentMap.get(contentSelector);
            if (!elements) {
              elements = [];
              contentMap.set(contentSelector, elements);
            }

            elements.push(currentChild);
            break;
          }
        }
      }

      currentChild = nextSibling;
    }

    for (i = 0, ii = contentSelectors.length; i < ii; ++i) {
      contentSelector = contentSelectors[i];
      callback(contentSelector, contentMap.get(contentSelector) || placeholder);
    }
  }

  constructor(anchor, selector) {
    this.anchor = anchor;
    this.selector = selector;
    this.all = !this.selector;
    this.groups = [];
  }

  copyForViewSlot() {
    return new _ContentSelector(this.anchor, this.selector);
  }

  matches(node) {
    return this.all || (node.nodeType === 1 && node.matches(this.selector));
  }

  add(group) {
    let anchor = this.anchor;
    let parent = anchor.parentNode;
    let i;
    let ii;

    for (i = 0, ii = group.length; i < ii; ++i) {
      parent.insertBefore(group[i], anchor);
    }

    this.groups.push(group);
  }

  insert(index, group) {
    if (group.length) {
      let anchor = findInsertionPoint(this.groups, index) || this.anchor;
      let parent = anchor.parentNode;
      let i;
      let ii;

      for (i = 0, ii = group.length; i < ii; ++i) {
        parent.insertBefore(group[i], anchor);
      }
    }

    this.groups.splice(index, 0, group);
  }

  removeAt(index, fragment) {
    let group = this.groups[index];
    let i;
    let ii;

    for (i = 0, ii = group.length; i < ii; ++i) {
      fragment.appendChild(group[i]);
    }

    this.groups.splice(index, 1);
  }
}
