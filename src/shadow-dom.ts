import {DOM} from 'aurelia-pal';
import { SlotMarkedNode } from './type-extension';
import {_isAllWhitespace} from './util';
import { View } from './view';
import { ViewSlot } from './view-slot';

let noNodes = Object.freeze([]) as Node[];

export class SlotCustomAttribute {
  element: any;
  value: any;

  /** @internal */
  static inject() {
    return [DOM.Element];
  }

  constructor(element) {
    this.element = element;
    this.element.auSlotAttribute = this;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  valueChanged(newValue, oldValue) {}
}

export class PassThroughSlot {

  /** @internal */
  anchor: any;

  /** @internal */
  name: any;

  /** @internal */
  destinationName: any;

  /** @internal */
  fallbackFactory: any;

  /** @internal */
  destinationSlot: any;

  /** @internal */
  projections: number;

  /** @internal */
  contentView: View;

  /** @internal */
  ownerView: any;

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
   * @param view
   * @param nodes
   * @param projectionSource
   * @param index
   */
  renderFallbackContent(view: View, nodes: Node[], projectionSource: ViewSlot | ShadowSlot, index?: number) {
    if (this.contentView === null) {
      this.contentView = this.fallbackFactory.create(this.ownerView.container);
      this.contentView.bind(this.ownerView.bindingContext, this.ownerView.overrideContext);

      let slots = Object.create(null);
      slots[this.destinationSlot.name] = this.destinationSlot;

      ShadowDOM.distributeView(this.contentView, slots, projectionSource, index, this.destinationSlot.name);
    }
  }

  passThroughTo(destinationSlot: PassThroughSlot | ShadowSlot) {
    this.destinationSlot = destinationSlot;
  }

  addNode(view: View, node: Node, projectionSource: ViewSlot | ShadowSlot, index: number) {
    if (this.contentView !== null) {
      this.contentView.removeNodes();
      this.contentView.detached();
      this.contentView.unbind();
      this.contentView = null;
    }

    if ((node as SlotMarkedNode).viewSlot instanceof PassThroughSlot) {
      ((node as SlotMarkedNode).viewSlot as PassThroughSlot).passThroughTo(this);
      return;
    }

    this.projections++;
    this.destinationSlot.addNode(view, node, projectionSource, index);
  }

  removeView(view: View, projectionSource: ViewSlot | ShadowSlot) {
    this.projections--;
    this.destinationSlot.removeView(view, projectionSource);

    if (this.needsFallbackRendering) {
      this.renderFallbackContent(null, noNodes, projectionSource);
    }
  }

  removeAll(projectionSource: ViewSlot | ShadowSlot) {
    this.projections = 0;
    this.destinationSlot.removeAll(projectionSource);

    if (this.needsFallbackRendering) {
      this.renderFallbackContent(null, noNodes, projectionSource);
    }
  }

  projectFrom(view: View, projectionSource: ViewSlot | ShadowSlot) {
    this.destinationSlot.projectFrom(view, projectionSource);
  }

  created(ownerView: View) {
    this.ownerView = ownerView;
  }

  bind(view: View) {
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
  /** @internal */
  private anchor: any;
  /** @internal */
  private name: any;
  /** @internal */
  private fallbackFactory: any;
  /** @internal */
  private contentView: any;
  /** @internal */
  private projections: number;
  /**
   * A list of nodes that keeps track of projected nodes through this shadow slot
   * @internal
   */
  children: SlotMarkedNode[];
  /** @internal */
  projectFromAnchors: any;
  /** @internal */
  private destinationSlots: any;
  /** @internal */
  private ownerView: any;
  /** @internal */
  private fallbackSlots: any;

  constructor(anchor, name, fallbackFactory) {
    this.anchor = anchor;
    this.anchor.isContentProjectionSource = true;
    this.anchor.viewSlot = this;
    this.name = name;
    this.fallbackFactory = fallbackFactory;
    this.contentView = null;
    this.projections = 0;
    this.children = [];
    this.projectFromAnchors = null;
    this.destinationSlots = null;
  }

  get needsFallbackRendering() {
    return this.fallbackFactory && this.projections === 0;
  }

  /**
   * @param view
   * @param node
   * @param projectionSource
   * @param index
   * @param destination
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  addNode(view: View, node: Node, projectionSource: ViewSlot | ShadowSlot, index?: number, destination?: string) {
    let $node = node as SlotMarkedNode;
    if (this.contentView !== null) {
      this.contentView.removeNodes();
      this.contentView.detached();
      this.contentView.unbind();
      this.contentView = null;
    }

    if ($node.viewSlot instanceof PassThroughSlot) {
      $node.viewSlot.passThroughTo(this);
      return;
    }

    if (this.destinationSlots !== null) {
      ShadowDOM.distributeNodes(view, [$node], this.destinationSlots, this, index);
    } else {
      $node.auOwnerView = view;
      $node.auProjectionSource = projectionSource;
      $node.auAssignedSlot = this;

      let anchor = this._findAnchor(view, $node, projectionSource, index);
      let parent = anchor.parentNode;

      parent.insertBefore($node, anchor);
      this.children.push($node);
      this.projections++;
    }
  }

  removeView(view: View, projectionSource: ViewSlot | ShadowSlot) {
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

  removeAll(projectionSource: ViewSlot | ShadowSlot) {
    if (this.destinationSlots !== null) {
      ShadowDOM.undistributeAll(this.destinationSlots, this);
    } else if (this.contentView && this.contentView.hasSlots) {
      ShadowDOM.undistributeAll(this.contentView.slots, projectionSource);
    } else {
      let found = this.children.find(x => x.auSlotProjectFrom === projectionSource);

      if (found) {
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

  /** @internal */
  _findAnchor(view: View, node: Node, projectionSource?: ViewSlot | ShadowSlot, index?: number) {
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

  projectTo(slots: Record<string, ShadowSlot | PassThroughSlot>) {
    this.destinationSlots = slots;
  }

  projectFrom(view: View, projectionSource: ViewSlot | ShadowSlot) {
    let anchor = DOM.createComment('anchor') as SlotMarkedNode;
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

  renderFallbackContent(view: View, nodes: Node[], projectionSource: ViewSlot | ShadowSlot, index?: number) {
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
   * @param ownerView
   */
  created(ownerView: View) {
    this.ownerView = ownerView;
  }

  /**
   * @param view
   */
  bind(view: View) {
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
  static defaultSlotKey = '__au-default-slot-key__' as const;

  static getSlotName(node) {
    if (node.auSlotAttribute === undefined) {
      return ShadowDOM.defaultSlotKey;
    }

    return node.auSlotAttribute.value;
  }

  /**
   * Project the nodes of a view to a record of slots
   * @param destinationOverride the override name of the slot to distribute to
   */
  static distributeView(
    view: View,
    slots: Record<string, PassThroughSlot | ShadowSlot>,
    projectionSource?: ViewSlot | ShadowSlot,
    index?: number,
    destinationOverride?: string
  ): void {
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

  static undistributeView(view: View, slots: Record<string, PassThroughSlot | ShadowSlot>, projectionSource: ViewSlot | ShadowSlot) {
    for (let slotName in slots) {
      slots[slotName].removeView(view, projectionSource);
    }
  }

  /**
   * @param {Record<string, ShadowSlot | PassThroughSlot>} slots
   * @param {ViewSlot} projectionSource
   */
  static undistributeAll(slots: Record<string, ShadowSlot | PassThroughSlot>, projectionSource: ViewSlot | ShadowSlot) {
    for (let slotName in slots) {
      slots[slotName].removeAll(projectionSource);
    }
  }

  /**
   * Distrbiute nodes of a projected view based on the given slots
   * @param view
   * @param nodes
   * @param slots
   * @param projectionSource
   * @param index
   * @param destinationOverride
   */
  static distributeNodes(
    view: View,
    nodes: Node[],
    slots: Record<string, PassThroughSlot | ShadowSlot>,
    projectionSource?: ViewSlot | ShadowSlot,
    index?: number,
    destinationOverride?: string
  ): void {
    for (let i = 0, ii = nodes.length; i < ii; ++i) {
      let currentNode = nodes[i] as SlotMarkedNode;
      let nodeType = currentNode.nodeType;

      if (currentNode.isContentProjectionSource) {
        (currentNode.viewSlot as ViewSlot | ShadowSlot).projectTo(slots);

        for (let slotName in slots) {
          slots[slotName].projectFrom(view, currentNode.viewSlot as ViewSlot | ShadowSlot);
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
