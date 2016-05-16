import {inject} from 'aurelia-dependency-injection';
import {DOM} from 'aurelia-pal';

let slice = Array.prototype.slice;
let noNodes = Object.freeze([]);

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
    this.projections = 0;
    this.children = [];
    this.contentView = null;
  }

  get needsFallbackRendering() {
    return this.fallbackFactory && this.projections === 0;
  }

  addNode(view, node, projectionSource, index) {
    if (this.contentView) {
      this.contentView.removeNodes();
      this.contentView.detached();
      this.contentView.unbind();
      this.contentView = null;
    }

    node.auOwnerView = view;
    node.auProjectionSource = projectionSource;
    node.auAssignedSlot = this;

    let anchor = this._findAnchor(projectionSource, index, node);
    let parent = anchor.parentNode;

    parent.insertBefore(node, anchor);
    this.children.push(node);
    this.projections++;
  }

  removeView(view, projectionSource) {
    let found = this.children.find(x => x.auSlotProjectFrom === projectionSource);
    if (found) {
      let children = found.auProjectionChildren;

      for (let i = 0, ii = children.length; i < ii; ++i) {
        let child = children[i];

        if (child.auOwnerView === view) {
          children.splice(i, 1);
          view.fragment.appendChild(child);
          i--; ii--;
          this.projections--;
        }
      }

      if (this.needsFallbackRendering) {
        this.renderFallbackContent(view, noNodes, projectionSource);
      }
    }
  }

  removeAll(projectionSource) {
    let found = this.children.find(x => x.auSlotProjectFrom === projectionSource);

    if (found) {
      let children = found.auProjectionChildren;
      for (let i = 0, ii = children.length; i < ii; ++i) {
        let child = children[i];
        child.auOwnerView.fragment.appendChild(child);
        this.projections--;
      }

      found.auProjectionChildren = [];

      if (this.needsFallbackRendering) {
        this.renderFallbackContent(null, noNodes, projectionSource);
      }
    }
  }

  _findAnchor(projectionSource, index, node) {
    if (projectionSource) {
      //find the anchor associated with the projected view slot
      let found = this.children.find(x => x.auSlotProjectFrom === projectionSource);
      if (found) {
        if (index !== undefined) {
          let children = found.auProjectionChildren;
          let viewIndex = -1;
          let lastView;

          for (let i = 0, ii = children.length; i < ii; ++i) {
            let current = children[i];

            if (current.auOwnerView !== lastView) {
              viewIndex++;
              lastView = current.auOwnerView;

              if (viewIndex === index) {
                children.splice(i, 0, node);
                return current;
              }
            }
          }
        }

        found.auProjectionChildren.push(node);
        return found;
      }
    }

    return this.anchor;
  }

  projectFrom(view, projectionSource) {
    let anchor = DOM.createComment('anchor');
    let parent = this.anchor.parentNode;
    anchor.auSlotProjectFrom = projectionSource;
    anchor.auOwnerView = view;
    anchor.auProjectionChildren = [];
    parent.insertBefore(anchor, this.anchor);
    this.children.push(anchor);
  }

  created(ownerView) {
    this.ownerView = ownerView;
  }

  renderFallbackContent(view, nodes, projectionSource, index) {
    if (!this.contentView) {
      this.contentView = this.fallbackFactory.create(this.ownerView.container);
      this.contentView.bind(this.ownerView.bindingContext, this.ownerView.overrideContext);
      this.contentView.insertNodesBefore(this.anchor);
    }

    if (this.contentView.hasSlots) {
      _distributeNodes(view, nodes, this.contentView.slots, projectionSource, index);
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

  static distribute(view, slots, projectionSource, index) {
    _distributeNodes(
      view,
      slice.call(view.fragment.childNodes),
      slots,
      projectionSource,
      index
    );
  }

  static undistribute(view, slots, projectionSource) {
    for (let slotName in slots) {
      slots[slotName].removeView(view, projectionSource);
    }
  }

  static undistributeAll(slots, projectionSource) {
    for (let slotName in slots) {
      slots[slotName].removeAll(projectionSource);
    }
  }
}

function _distributeNodes(view, nodes, slots, projectionSource, index) {
  for(let i = 0, ii = nodes.length; i < ii; ++i) {
    let currentNode = nodes[i];
    let nodeType = currentNode.nodeType;

    if (currentNode.isContentProjectionSource) {
      currentNode.viewSlot.projectTo(slots);

      for(let slotName in slots) {
        slots[slotName].projectFrom(view, currentNode.viewSlot);
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
          found.addNode(view, currentNode, projectionSource, index);
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
      slot.renderFallbackContent(view, nodes, projectionSource, index);
    }
  }
}

//https://developer.mozilla.org/en-US/docs/Web/API/Document_Object_Model/Whitespace_in_the_DOM
//We need to ignore whitespace so we don't mess up fallback rendering
//However, we cannot ignore empty text nodes that container interpolations.
function isAllWhitespace(node) {
  // Use ECMA-262 Edition 3 String and RegExp features
  return !(node.auInterpolationTarget || (/[^\t\n\r ]/.test(node.textContent)));
}
