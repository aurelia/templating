import {DOM} from 'aurelia-pal';
import {_isAllWhitespace} from './util';

let noNodes = Object.freeze([]);

export class SlotCustomAttribute {
  static inject() {
    return [DOM.Element];
  }

  constructor(element) {
    this.element = element;
    this.element.auSlotAttribute = this;
  }

  valueChanged(newValue, oldValue) {
    //console.log('au-slot', newValue);
  }
}

export class PassThroughSlot {
  constructor(anchor, name, destinationName, fallbackFactory) {
    this.anchor = anchor;
    this.anchor.viewSlot = this;
    this.name = name;
    this.destinationName = destinationName;
    this.fallbackFactory = fallbackFactory;
    this.destinationSlot = null;
    /**
     * The number of Node that has been projected by this slot
     */
    this.projections = 0;
    /**@type {View} */
    this.contentView = null;

    let attr = new SlotCustomAttribute(this.anchor);
    attr.value = this.destinationName;
  }

  /**
   * Indicate whether this slot should render fallback default slot content
   */
  get needsFallbackRendering() {
    return this.fallbackFactory && this.projections === 0;
  }

  /**
   * @param {View} view
   * @param {Node[]} nodes
   * @param {ViewSlot} projectionSource
   * @param {number} index
   */
  renderFallbackContent(view, nodes, projectionSource, index) {
    if (this.contentView === null) {
      this.contentView = this.fallbackFactory.create(this.ownerView.container);
      this.contentView.bind(this.ownerView.bindingContext, this.ownerView.overrideContext);

      let slots = Object.create(null);
      slots[this.destinationSlot.name] = this.destinationSlot;

      ShadowDOM.distributeView(this.contentView, slots, projectionSource, index, this.destinationSlot.name);
    }
  }

  /**
   * @param {PassThroughSlot | ShadowSlot} destinationSlot
   */
  passThroughTo(destinationSlot) {
    this.destinationSlot = destinationSlot;
  }

  /**
   * @param {View} view
   * @param {Node} node
   * @param {ViewSlot} projectionSource
   * @param {number} index
   */
  addNode(view, node, projectionSource, index) {
    if (this.contentView !== null) {
      this.contentView.removeNodes();
      this.contentView.detached();
      this.contentView.unbind();
      this.contentView = null;
    }

    if (node.viewSlot instanceof PassThroughSlot) {
      node.viewSlot.passThroughTo(this);
      return;
    }

    this.projections++;
    this.destinationSlot.addNode(view, node, projectionSource, index);
  }

  /**
   * @param {View} view
   * @param {ViewSlot} projectionSource
   */
  removeView(view, projectionSource) {
    this.projections--;
    this.destinationSlot.removeView(view, projectionSource);

    if (this.needsFallbackRendering) {
      this.renderFallbackContent(null, noNodes, projectionSource);
    }
  }

  /**
   * @param {ViewSlot} projectionSource
   */
  removeAll(projectionSource) {
    this.projections = 0;
    this.destinationSlot.removeAll(projectionSource);

    if (this.needsFallbackRendering) {
      this.renderFallbackContent(null, noNodes, projectionSource);
    }
  }

  /**
   * @param {View} view
   * @param {ViewSlot} projectionSource
   */
  projectFrom(view, projectionSource) {
    this.destinationSlot.projectFrom(view, projectionSource);
  }

  /**
   * @param {View} ownerView
   */
  created(ownerView) {
    this.ownerView = ownerView;
  }

  /**
   * @param {View} view
   */
  bind(view) {
    if (this.contentView) {
      this.contentView.bind(view.bindingContext, view.overrideContext);
    }
  }

  attached() {
    if (this.contentView) {
      this.contentView.attached();
    }
  }

  detached() {
    if (this.contentView) {
      this.contentView.detached();
    }
  }

  unbind() {
    if (this.contentView) {
      this.contentView.unbind();
    }
  }
}

export class ShadowSlot {
  constructor(anchor, name, fallbackFactory) {
    this.anchor = anchor;
    this.anchor.isContentProjectionSource = true;
    this.anchor.viewSlot = this;
    this.name = name;
    this.fallbackFactory = fallbackFactory;
    this.contentView = null;
    this.projections = 0;
    /**
     * A list of nodes that keeps track of projected nodes through this shadow slot
     * @type {Node[]}
     */
    this.children = [];
    this.projectFromAnchors = null;
    this.destinationSlots = null;
  }

  get needsFallbackRendering() {
    return this.fallbackFactory && this.projections === 0;
  }

  /**
   * @param {View} view
   * @param {Node} node
   * @param {ViewSlot} projectionSource
   * @param {number} index
   * @param {string} destination
   */
  addNode(view, node, projectionSource, index, destination) {
    if (this.contentView !== null) {
      this.contentView.removeNodes();
      this.contentView.detached();
      this.contentView.unbind();
      this.contentView = null;
    }

    if (node.viewSlot instanceof PassThroughSlot) {
      node.viewSlot.passThroughTo(this);
      return;
    }

    if (this.destinationSlots !== null) {
      ShadowDOM.distributeNodes(view, [node], this.destinationSlots, this, index);
    } else {
      node.auOwnerView = view;
      node.auProjectionSource = projectionSource;
      node.auAssignedSlot = this;

      let anchor = this._findAnchor(view, node, projectionSource, index);
      let parent = anchor.parentNode;

      parent.insertBefore(node, anchor);
      this.children.push(node);
      this.projections++;
    }
  }

  /**
   * @param {View} view
   * @param {ViewSlot} projectionSource
   */
  removeView(view, projectionSource) {
    if (this.destinationSlots !== null) {
      ShadowDOM.undistributeView(view, this.destinationSlots, this);
    } else if (this.contentView && this.contentView.hasSlots) {
      ShadowDOM.undistributeView(view, this.contentView.slots, projectionSource);
    } else {
      // find the anchor associated with the viewslot of this shadow slot
      let found = this.children.find(x => x.auSlotProjectFrom === projectionSource);
      if (found) {
        let children = found.auProjectionChildren;
        let ownChildren = this.children;

        for (let i = 0, ii = children.length; i < ii; ++i) {
          let child = children[i];

          if (child.auOwnerView === view) {
            children.splice(i, 1);
            view.fragment.appendChild(child);
            i--; ii--;

          // remove track of "unprojected" child
          // thanks to Thomas Darling https://github.com/aurelia/templating-resources/issues/392
            this.projections--;
            let idx = ownChildren.indexOf(child);
            if (idx > -1) {
              ownChildren.splice(idx, 1);
            }
          }
        }

        if (this.needsFallbackRendering) {
          this.renderFallbackContent(view, noNodes, projectionSource);
        }
      }
    }
  }

  /**
   * @param {ViewSlot} projectionSource
   */
  removeAll(projectionSource) {
    if (this.destinationSlots !== null) {
      ShadowDOM.undistributeAll(this.destinationSlots, this);
    } else if (this.contentView && this.contentView.hasSlots) {
      ShadowDOM.undistributeAll(this.contentView.slots, projectionSource);
    } else {
      let found = this.children.find(x => x.auSlotProjectFrom === projectionSource);

      if (found) {
        /**@type {Node} */
        let children = found.auProjectionChildren;
        let ownChildren = this.children;

        for (let i = 0, ii = children.length; i < ii; ++i) {
          let child = children[i];
          child.auOwnerView.fragment.appendChild(child);

          // remove track of "unprojected" child
          // thanks to Thomas Darling https://github.com/aurelia/templating-resources/issues/392
          this.projections--;
          let idx = ownChildren.indexOf(child);
          if (idx > -1) {
            ownChildren.splice(idx, 1);
          }
        }

        found.auProjectionChildren = [];

        if (this.needsFallbackRendering) {
          this.renderFallbackContent(null, noNodes, projectionSource);
        }
      }
    }
  }

  /**
   * @param {View} view
   * @param {Node} node
   * @param {ViewSlot} projectionSource
   * @param {number} index
   */
  _findAnchor(view, node, projectionSource, index) {
    if (projectionSource) {
      // find the anchor associated with the projected view slot
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

  /**
   * @param {Record<string, ShadowSlot | PassThroughSlot>} slots
   */
  projectTo(slots) {
    this.destinationSlots = slots;
  }

  /**
   * @param {View} view
   * @param {ViewSlot} projectionSource
   */
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

  /**
   * @param {View} view
   * @param {Node[]} nodes
   * @param {ViewSlot} projectionSource
   * @param {number} index
   */
  renderFallbackContent(view, nodes, projectionSource, index) {
    if (this.contentView === null) {
      this.contentView = this.fallbackFactory.create(this.ownerView.container);
      this.contentView.bind(this.ownerView.bindingContext, this.ownerView.overrideContext);
      this.contentView.insertNodesBefore(this.anchor);
    }

    if (this.contentView.hasSlots) {
      let slots = this.contentView.slots;
      let projectFromAnchors = this.projectFromAnchors;

      if (projectFromAnchors !== null) {
        for (let slotName in slots) {
          let slot = slots[slotName];

          for (let i = 0, ii = projectFromAnchors.length; i < ii; ++i) {
            let anchor = projectFromAnchors[i];
            slot.projectFrom(anchor.auOwnerView, anchor.auSlotProjectFrom);
          }
        }
      }

      this.fallbackSlots = slots;
      ShadowDOM.distributeNodes(view, nodes, slots, projectionSource, index);
    }
  }

  /**
   * @param {View} ownerView
   */
  created(ownerView) {
    this.ownerView = ownerView;
  }

  /**
   * @param {View} view
   */
  bind(view) {
    if (this.contentView) {
      this.contentView.bind(view.bindingContext, view.overrideContext);
    }
  }

  attached() {
    if (this.contentView) {
      this.contentView.attached();
    }
  }

  detached() {
    if (this.contentView) {
      this.contentView.detached();
    }
  }

  unbind() {
    if (this.contentView) {
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

  /**
   * @param {View} view
   * @param {Record<string, PassThroughSlot | ShadowSlot>} slots
   * @param {ViewSlot} projectionSource
   * @param {number} index
   * @param {string} destinationOverride
   */
  static distributeView(view, slots, projectionSource, index, destinationOverride) {
    let nodes;

    if (view === null) {
      nodes = noNodes;
    } else {
      let childNodes = view.fragment.childNodes;
      let ii = childNodes.length;
      nodes = new Array(ii);

      for (let i = 0; i < ii; ++i) {
        nodes[i] = childNodes[i];
      }
    }

    ShadowDOM.distributeNodes(
      view,
      nodes,
      slots,
      projectionSource,
      index,
      destinationOverride
    );
  }

  /**
   * @param {View} view
   * @param {Record<string, PassThroughSlot | ShadowSlot>} slots
   * @param {ViewSlot} projectionSource
   */
  static undistributeView(view, slots, projectionSource) {
    for (let slotName in slots) {
      slots[slotName].removeView(view, projectionSource);
    }
  }

  /**
   * @param {Record<string, ShadowSlot | PassThroughSlot>} slots
   * @param {ViewSlot} projectionSource
   */
  static undistributeAll(slots, projectionSource) {
    for (let slotName in slots) {
      slots[slotName].removeAll(projectionSource);
    }
  }

  /**
   * Distrbiute nodes of a projected view based on
   * @param {View} view
   * @param {Node[]} nodes
   * @param {Record<string, PassThroughSlot | ShadowSlot>} slots
   * @param {ViewSlot} projectionSource
   * @param {number} index
   * @param {string} destinationOverride
   */
  static distributeNodes(view, nodes, slots, projectionSource, index, destinationOverride) {
    for (let i = 0, ii = nodes.length; i < ii; ++i) {
      let currentNode = nodes[i];
      let nodeType = currentNode.nodeType;

      if (currentNode.isContentProjectionSource) {
        currentNode.viewSlot.projectTo(slots);

        for (let slotName in slots) {
          slots[slotName].projectFrom(view, currentNode.viewSlot);
        }

        nodes.splice(i, 1);
        ii--; i--;
      } else if (nodeType === 1 || nodeType === 3 || currentNode.viewSlot instanceof PassThroughSlot) { //project only elements and text
        if (nodeType === 3 && _isAllWhitespace(currentNode)) {
          nodes.splice(i, 1);
          ii--; i--;
        } else {
          let found = slots[destinationOverride || ShadowDOM.getSlotName(currentNode)];

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

    for (let slotName in slots) {
      let slot = slots[slotName];

      if (slot.needsFallbackRendering) {
        slot.renderFallbackContent(view, nodes, projectionSource, index);
      }
    }
  }
}
