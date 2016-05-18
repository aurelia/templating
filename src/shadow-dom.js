import {inject} from 'aurelia-dependency-injection';
import {DOM} from 'aurelia-pal';
import {_isAllWhitespace} from './util';

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
  constructor(anchor, name, fallbackFactory, slotDestination) {
    this.anchor = anchor;
    this.name = name;
    this.fallbackFactory = fallbackFactory;
    this.isDefault = !name;
    this.projections = 0;
    this.children = [];
    this.projectFromAnchors = null;
    this.contentView = null;
    this.anchor.isContentProjectionSource = true;
    this.anchor.viewSlot = this;
    this.destinationSlots = null;

    if (slotDestination) {
      let slotAttr = anchor.auSlotAttribute = new SlotCustomAttribute(anchor);
      slotAttr.value = slotDestination;
      slotAttr.passthrough = true;
    }
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

    if (this.destinationSlots !== null) {
      ShadowDOM.distributeNodes(view, [node], this.destinationSlots, this, index)
      return;
    }

    node.auOwnerView = view;
    node.auProjectionSource = projectionSource;
    node.auAssignedSlot = this;

    let anchor = this._findAnchor(view, node, projectionSource, index);
    let parent = anchor.parentNode;

    parent.insertBefore(node, anchor);
    this.children.push(node);
    this.projections++;
  }

  removeView(view, projectionSource) {
    if (this.destinationSlots !== null) {
      ShadowDOM.undistributeView(view, this.destinationSlots, this)
    } else if (this.contentView && this.contentView.hasSlots) {
      ShadowDOM.undistributeView(view, this.contentView.slots, projectionSource)
    } else {
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
  }

  removeAll(projectionSource) {
    if (this.destinationSlots !== null) {
      ShadowDOM.undistributeAll(this.destinationSlots, this)
    } else if (this.contentView && this.contentView.hasSlots) {
      ShadowDOM.undistributeAll(this.contentView.slots, projectionSource)
    } else {
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
  }

  _findAnchor(view, node, projectionSource, index) {
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

              if (viewIndex >= index && lastView !== view) {
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

  projectTo(slots) {
    this.destinationSlots = slots;
  }

  projectFrom(view, projectionSource) {
    let anchor = DOM.createComment('anchor');
    let parent = this.anchor.parentNode;
    anchor.auSlotProjectFrom = projectionSource;
    anchor.auOwnerView = view;
    anchor.auProjectionChildren = [];
    parent.insertBefore(anchor, this.anchor);
    this.children.push(anchor);

    if (this.projectFromAnchors === null) {
      this.projectFromAnchors = [];
    }

    this.projectFromAnchors.push(anchor);
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
      let slots = this.contentView.slots;

      if (this.projectFromAnchors !== null) {
        for (let slotName in slots) {
          this.projectFromAnchors.forEach(anchor => slots[slotName].projectFrom(anchor.auOwnerView, anchor.auSlotProjectFrom));
        }
      }

      ShadowDOM.distributeNodes(view, nodes, slots, projectionSource, index);
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
}

export class ShadowDOM {
  static defaultSlotKey = '__au-default-slot-key__';

  static getSlotName(node) {
    if (node.auSlotAttribute === undefined) {
      return ShadowDOM.defaultSlotKey;
    }

    return node.auSlotAttribute.value;
  }

  static distributeView(view, slots, projectionSource, index) {
    ShadowDOM.distributeNodes(
      view,
      view.childNodes,
      slots,
      projectionSource,
      index
    );
  }

  static undistributeView(view, slots, projectionSource) {
    for (let slotName in slots) {
      slots[slotName].removeView(view, projectionSource);
    }
  }

  static undistributeAll(slots, projectionSource) {
    for (let slotName in slots) {
      slots[slotName].removeAll(projectionSource);
    }
  }

  static distributeNodes(view, nodes, slots, projectionSource, index) {
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
        if(nodeType === 3 && _isAllWhitespace(currentNode)) {
          nodes.splice(i, 1);
          ii--; i--;
        } else {
          let found = slots[ShadowDOM.getSlotName(currentNode)];

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
}
