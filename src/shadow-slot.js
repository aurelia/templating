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

  addNode(node, groupId, projectionSource, index) {
    if (this.contentView) {
      this.contentView.removeNodes();
      this.contentView.detached();
      this.contentView.unbind();
      this.contentView = null;
    }

    node.auShadowGroupId = groupId;
    node.auProjectionSource = projectionSource;
    node.auAssignedSlot = this;

    let anchor = this._findAnchor(projectionSource, index, node);
    let parent = anchor.parentNode;

    parent.insertBefore(node, anchor);
    this.children.push(node);
    this.isProjecting = true;
  }

  _findAnchor(projectionSource, index, node) {
    if (projectionSource) {
      //find the anchor associated with the projected view slot
      let found = this.children.find(x => x.auSlotProjectFrom === projectionSource);
      if (found) {
        if (index !== undefined) {
          let children = found.auProjectionChildren;
          let groupIndex = -1;
          let lastGroupId;

          for (let i = 0, ii = children.length; i < ii; ++i) {
            let current = children[i];

            if (current.auShadowGroupId !== lastGroupId) {
              groupIndex++;
              lastGroupId = current.auShadowGroupId;

              if (groupIndex === index) {
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

  projectFrom(groupId, projectionSource) {
    let anchor = DOM.createComment('anchor');
    let parent = this.anchor.parentNode;
    anchor.auSlotProjectFrom = projectionSource;
    anchor.auShadowGroupId = groupId;
    anchor.auProjectionChildren = [];
    parent.insertBefore(anchor, this.anchor);
    this.children.push(anchor);
  }

  created(ownerView) {
    this.ownerView = ownerView;
  }

  renderFallbackContent(nodes, groupId, projectionSource) {
    if (!this.contentView) {
      this.contentView = this.fallbackFactory.create(this.ownerView.container);
      this.contentView.bind(this.ownerView.bindingContext, this.ownerView.overrideContext);
      this.contentView.insertNodesBefore(this.anchor);
    }

    if(this.contentView.hasSlots) {
      _distributeNodes(nodes, this.contentView.slots, groupId, projectionSource);
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

  static distribute(contentView, slots, groupId, projectionSource, index) {
    _distributeNodes(
      slice.call(contentView.fragment.childNodes),
      slots,
      groupId || contentView.id,
      projectionSource,
      index
    );
  }
}

function _findInsertionPoint(children, view, index) {
  //return node anchor and children index
}

function _distributeNodes(nodes, slots, groupId, projectionSource, index) {
  for(let i = 0, ii = nodes.length; i < ii; ++i) {
    let currentNode = nodes[i];
    let nodeType = currentNode.nodeType;

    if (currentNode.isContentProjectionSource) {
      currentNode.viewSlot.projectTo(slots);

      for(let slotName in slots) {
        slots[slotName].projectFrom(groupId, currentNode.viewSlot);
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
          found.addNode(currentNode, groupId, projectionSource, index);
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
      slot.renderFallbackContent(nodes, groupId, projectionSource);
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
