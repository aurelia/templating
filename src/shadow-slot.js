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
  constructor(anchor, name) {
    this.anchor = anchor;
    this.name = name;
    this.isDefault = !name;
  }

  matches(node) {
    if (node.auSlotAttribute === undefined) {
      return this.isDefault;
    }

    return node.auSlotAttribute.value === this.name;
  }

  add(node) {
    let parent = this.anchor.parentNode;
    node.auAssignedSlot = this;
    parent.insertBefore(node, this.anchor);
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
        let found = false;

        for (let i = 0, ii = slots.length; i < ii; i++) {
          let slot = slots[i];

          if (slot.matches(currentChild)) {
            slot.add(currentChild);
            found = true;
            break;
          }
        }

        if (!found) {
          console.log('not found', currentChild);
        }
      }

      currentChild = nextSibling;
    }
  }
}
