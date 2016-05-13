import {inject} from 'aurelia-dependency-injection';
import {DOM} from 'aurelia-pal';

let slice = Array.prototype.slice;

@inject(DOM.Element)
export class SlotCustomAttribute {
  constructor(element) {
    this.element = element;
    this.element.auSlotAttribute = this;
  }

  valueChanged(newValue, oldValue) {
    //console.log('au-slot', newValue);
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

  get needsFallbackRendering() {
    return !this.isProjecting && this.fallbackFactory;
  }

  add(node) {
    let parent = this.anchor.parentNode;
    node.auAssignedSlot = this;
    parent.insertBefore(node, this.anchor);
    this.isProjecting = true;
  }

  created(ownerView) {
    this.ownerView = ownerView;
  }

  renderFallbackContent(nodes) {
    this.contentView = this.fallbackFactory.create(this.ownerView.container);
    this.contentView.bind(this.ownerView.bindingContext, this.ownerView.overrideContext);
    this.contentView.insertNodesBefore(this.anchor);

    if(this.contentView.hasSlots) {
      _distributeNodes(nodes, this.contentView.slots);
    }
  }

  bind(view){
    if(this.contentView) {
      this.contentView.bind(view.bindingContext, view.overrideContext);
    }
  }

  attached() {
    if(this.contentView) {
      this.contentView.attached();
    }
  }

  detached() {
    if(this.contentView) {
      this.contentView.detached();
    }
  }

  unbind() {
    if(this.contentView) {
      this.contentView.unbind();
    }
  }

  static getSlotName(node) {
    if (node.auSlotAttribute === undefined) {
      return ShadowSlot.defaultName;
    }

    return node.auSlotAttribute.value;
  }

  static distribute(contentView, componentView) {
    if (!componentView.hasSlots) {
      return;
    }

    _distributeNodes(
      slice.call(contentView.fragment.childNodes),
      componentView.slots
    );
  }
}

function _distributeNodes(nodes, slots) {
  for(let i = 0, ii = nodes.length; i < ii; ++i) {
    let currentNode = nodes[i];
    let nodeType = currentNode.nodeType;

    if (currentNode.isContentProjectionSource) {
      console.log('content projection source', currentNode.viewSlot);
      nodes.splice(i, 1);
      ii--; i--;
    } else if (nodeType === 1 || nodeType === 3) { //project only elements and text
      if(nodeType === 3 && isAllWhitespace(currentNode)) {
        nodes.splice(i, 1);
        ii--; i--;
      } else {
        let found = slots[ShadowSlot.getSlotName(currentNode)];

        if (found) {
          found.add(currentNode);
          nodes.splice(i, 1);
          ii--; i--;
        }
      }
    } else {
      nodes.splice(i, 1);
      ii--; i--;
    }
  }

  for(let slotName in slots) {
    let slot = slots[slotName];

    if (slot.needsFallbackRendering) {
      slot.renderFallbackContent(nodes);
    }
  }
}

//https://developer.mozilla.org/en-US/docs/Web/API/Document_Object_Model/Whitespace_in_the_DOM
function isAllWhitespace(node) {
  // Use ECMA-262 Edition 3 String and RegExp features
  return !(/[^\t\n\r ]/.test(node.textContent));
}
