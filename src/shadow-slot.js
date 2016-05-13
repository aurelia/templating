import {inject} from 'aurelia-dependency-injection';
import {DOM} from 'aurelia-pal';

@inject(DOM.Element)
export class SlotCustomAttribute {
  constructor(element) {
    this.element = element;
    this.element.auSlotAttribute = this;
  }

  valueChanged(newValue, oldValue) {
    console.log('au-slot', newValue);
  }
}

export class ShadowSlot {
  static defaultName = '__au-default-slot-key__';

  constructor(anchor, name, fallbackFactory) {
    this.anchor = anchor;
    this.name = name;
    this.fallbackFactory = fallbackFactory;
    this.isDefault = !name;
    this.isProjecting = false;
  }

  add(node) {
    let parent = this.anchor.parentNode;
    node.auAssignedSlot = this;
    parent.insertBefore(node, this.anchor);
    this.isProjecting = true;
  }

  get needsFallbackRendering() {
    return !this.isProjecting && this.fallbackFactory;
  }

  static getSlotName(node) {
    if (node.auSlotAttribute === undefined) {
      return ShadowSlot.defaultName;
    }

    return node.auSlotAttribute.value;
  }

  static distribute(contentView, componentView) {
    let slots = componentView.shadowSlots;
    let currentChild = contentView.fragment.firstChild;
    let nextSibling;
    let nodeType;

    while (currentChild) {
      nextSibling = currentChild.nextSibling;
      nodeType = currentChild.nodeType;

      if (currentChild.isContentProjectionSource) {
        console.log('content projection source', currentChild.viewSlot);
      } else if (nodeType === 1 || nodeType === 3) { //project only elements and text
        let found = slots[ShadowSlot.getSlotName(currentChild)];

        if (found) {
          found.add(currentChild);
        } else {
          console.log('not found', currentChild);
        }
      }

      currentChild = nextSibling;
    }
  }
}
