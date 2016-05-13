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
    this.children = [];
    this.contentView = null;
  }

  get needsFallbackRendering() {
    return !this.isProjecting && this.fallbackFactory;
  }

  addNode(node, projectionSource) {
    if (this.contentView) {
      this.contentView.removeNodes();
    }

    node.auAssignedSlot = this;

    let anchor = this._findAnchor(projectionSource);
    let parent = anchor.parentNode;

    parent.insertBefore(node, anchor);
    this.children.push(node);
    this.isProjecting = true;
  }

  _findAnchor(projectionSource) {
    if (projectionSource) {
      let found = this.children.find(x => x.auSlotProjectFrom === projectionSource);
      if (found) {
        return found;
      }
    }

    return this.anchor;
  }

  projectFrom(projectionSource) {
    let anchor = DOM.createComment('anchor');
    let parent = this.anchor.parentNode;
    anchor.auSlotProjectFrom = projectionSource;
    parent.insertBefore(anchor, this.anchor);
    this.children.push(anchor);
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

  static distribute(contentView, slots, projectionSource) {
    _distributeNodes(
      slice.call(contentView.fragment.childNodes),
      slots,
      projectionSource
    );
  }
}

function _distributeNodes(nodes, slots, projectionSource) {
  for(let i = 0, ii = nodes.length; i < ii; ++i) {
    let currentNode = nodes[i];
    let nodeType = currentNode.nodeType;

    if (currentNode.isContentProjectionSource) {
      currentNode.viewSlot.projectTo(slots);

      for(let slotName in slots) {
        slots[slotName].projectFrom(currentNode.viewSlot);
      }

      nodes.splice(i, 1);
      ii--; i--;
    } else if (nodeType === 1 || nodeType === 3) { //project only elements and text
      if(nodeType === 3 && isAllWhitespace(currentNode)) {
        nodes.splice(i, 1);
        ii--; i--;
      } else {
        let found = slots[ShadowSlot.getSlotName(currentNode)];

        if (found) {
          found.addNode(currentNode, projectionSource);
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
