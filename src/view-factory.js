import {Container, resolver} from 'aurelia-dependency-injection';
import {View} from './view';
import {ViewSlot} from './view-slot';
import {ShadowSlot, PassThroughSlot} from './shadow-dom';
import {ViewResources} from './view-resources';
import {BehaviorInstruction, TargetInstruction} from './instructions';
import {DOM} from 'aurelia-pal';
import {ElementEvents} from './element-events';
import {CompositionTransaction} from './composition-transaction';

@resolver
class ProviderResolver {
  get(container, key) {
    let id = key.__providerId__;
    return id in container ? container[id] : (container[id] = container.invoke(key));
  }
}

let providerResolverInstance = new ProviderResolver();

function elementContainerGet(key) {
  if (key === DOM.Element) {
    return this.element;
  }

  if (key === BoundViewFactory) {
    if (this.boundViewFactory) {
      return this.boundViewFactory;
    }

    let factory = this.instruction.viewFactory;
    let partReplacements = this.partReplacements;

    if (partReplacements) {
      factory = partReplacements[factory.part] || factory;
    }

    this.boundViewFactory = new BoundViewFactory(this, factory, partReplacements);
    return this.boundViewFactory;
  }

  if (key === ViewSlot) {
    if (this.viewSlot === undefined) {
      this.viewSlot = new ViewSlot(this.element, this.instruction.anchorIsContainer);
      this.element.isContentProjectionSource = this.instruction.lifting;
      this.children.push(this.viewSlot);
    }

    return this.viewSlot;
  }

  if (key === ElementEvents) {
    return this.elementEvents || (this.elementEvents = new ElementEvents(this.element));
  }

  if (key === CompositionTransaction) {
    return this.compositionTransaction || (this.compositionTransaction = this.parent.get(key));
  }

  if (key === ViewResources) {
    return this.viewResources;
  }

  if (key === TargetInstruction) {
    return this.instruction;
  }

  return this.superGet(key);
}

function createElementContainer(parent, element, instruction, children, partReplacements, resources) {
  let container = parent.createChild();
  let providers;
  let i;

  container.element = element;
  container.instruction = instruction;
  container.children = children;
  container.viewResources = resources;
  container.partReplacements = partReplacements;

  providers = instruction.providers;
  i = providers.length;

  while (i--) {
    container._resolvers.set(providers[i], providerResolverInstance);
  }

  container.superGet = container.get;
  container.get = elementContainerGet;

  return container;
}

function hasAttribute(name) {
  return this._element.hasAttribute(name);
}

function getAttribute(name) {
  return this._element.getAttribute(name);
}

function setAttribute(name, value) {
  this._element.setAttribute(name, value);
}

function makeElementIntoAnchor(element, elementInstruction) {
  let anchor = DOM.createComment('anchor');

  if (elementInstruction) {
    let firstChild = element.firstChild;

    if (firstChild && firstChild.tagName === 'AU-CONTENT') {
      anchor.contentElement = firstChild;
    }

    anchor._element = element;

    anchor.hasAttribute = hasAttribute;
    anchor.getAttribute = getAttribute;
    anchor.setAttribute = setAttribute;
  }

  DOM.replaceNode(anchor, element);

  return anchor;
}

/**
 * @param {Container[]} containers
 * @param {Element} element
 * @param {TargetInstruction} instruction
 * @param {Controller[]} controllers
 * @param {Binding[]} bindings
 * @param {ViewNode[]} children
 * @param {Record<string, ShadowSlot>} shadowSlots
 * @param {Record<string, ViewFactory>} partReplacements
 * @param {ViewResources} resources
 */
function applyInstructions(containers, element, instruction, controllers, bindings, children, shadowSlots, partReplacements, resources) {
  let behaviorInstructions = instruction.behaviorInstructions;
  let expressions = instruction.expressions;
  let elementContainer;
  let i;
  let ii;
  let current;
  let instance;

  if (instruction.contentExpression) {
    bindings.push(instruction.contentExpression.createBinding(element.nextSibling));
    element.nextSibling.auInterpolationTarget = true;
    element.parentNode.removeChild(element);
    return;
  }

  if (instruction.shadowSlot) {
    let commentAnchor = DOM.createComment('slot');
    let slot;

    if (instruction.slotDestination) {
      slot = new PassThroughSlot(commentAnchor, instruction.slotName, instruction.slotDestination, instruction.slotFallbackFactory);
    } else {
      slot = new ShadowSlot(commentAnchor, instruction.slotName, instruction.slotFallbackFactory);
    }

    DOM.replaceNode(commentAnchor, element);
    shadowSlots[instruction.slotName] = slot;
    controllers.push(slot);
    return;
  }

  if (instruction.letElement) {
    for (i = 0, ii = expressions.length; i < ii; ++i) {
      bindings.push(expressions[i].createBinding());
    }
    element.parentNode.removeChild(element);
    return;
  }

  if (behaviorInstructions.length) {
    if (!instruction.anchorIsContainer) {
      element = makeElementIntoAnchor(element, instruction.elementInstruction);
    }

    containers[instruction.injectorId] = elementContainer =
      createElementContainer(
        containers[instruction.parentInjectorId],
        element,
        instruction,
        children,
        partReplacements,
        resources
        );

    for (i = 0, ii = behaviorInstructions.length; i < ii; ++i) {
      current = behaviorInstructions[i];
      instance = current.type.create(elementContainer, current, element, bindings);
      controllers.push(instance);
    }
  }

  for (i = 0, ii = expressions.length; i < ii; ++i) {
    bindings.push(expressions[i].createBinding(element));
  }
}

function styleStringToObject(style, target) {
  let attributes = style.split(';');
  let firstIndexOfColon;
  let i;
  let current;
  let key;
  let value;

  target = target || {};

  for (i = 0; i < attributes.length; i++) {
    current = attributes[i];
    firstIndexOfColon = current.indexOf(':');
    key = current.substring(0, firstIndexOfColon).trim();
    value = current.substring(firstIndexOfColon + 1).trim();
    target[key] = value;
  }

  return target;
}

function styleObjectToString(obj) {
  let result = '';

  for (let key in obj) {
    result += key + ':' + obj[key] + ';';
  }

  return result;
}

function applySurrogateInstruction(container, element, instruction, controllers, bindings, children) {
  let behaviorInstructions = instruction.behaviorInstructions;
  let expressions = instruction.expressions;
  let providers = instruction.providers;
  let values = instruction.values;
  let i;
  let ii;
  let current;
  let instance;
  let currentAttributeValue;

  i = providers.length;
  while (i--) {
    container._resolvers.set(providers[i], providerResolverInstance);
  }

  //apply surrogate attributes
  for (let key in values) {
    currentAttributeValue = element.getAttribute(key);

    if (currentAttributeValue) {
      if (key === 'class') {
        //merge the surrogate classes
        element.setAttribute('class', currentAttributeValue + ' ' + values[key]);
      } else if (key === 'style') {
        //merge the surrogate styles
        let styleObject = styleStringToObject(values[key]);
        styleStringToObject(currentAttributeValue, styleObject);
        element.setAttribute('style', styleObjectToString(styleObject));
      }

      //otherwise, do not overwrite the consumer's attribute
    } else {
      //copy the surrogate attribute
      element.setAttribute(key, values[key]);
    }
  }

  //apply surrogate behaviors
  if (behaviorInstructions.length) {
    for (i = 0, ii = behaviorInstructions.length; i < ii; ++i) {
      current = behaviorInstructions[i];
      instance = current.type.create(container, current, element, bindings);

      if (instance.contentView) {
        children.push(instance.contentView);
      }

      controllers.push(instance);
    }
  }

  //apply surrogate bindings
  for (i = 0, ii = expressions.length; i < ii; ++i) {
    bindings.push(expressions[i].createBinding(element));
  }
}

/**
* A factory capable of creating View instances, bound to a location within another view hierarchy.
*/
export class BoundViewFactory {
  /**
  * Creates an instance of BoundViewFactory.
  * @param parentContainer The parent DI container.
  * @param viewFactory The internal unbound factory.
  * @param partReplacements Part replacement overrides for the internal factory.
  */
  constructor(parentContainer: Container, viewFactory: ViewFactory, partReplacements?: Object) {
    this.parentContainer = parentContainer;
    this.viewFactory = viewFactory;
    this.factoryCreateInstruction = { partReplacements: partReplacements }; //This is referenced internally in the controller's bind method.
  }

  /**
  * Creates a view or returns one from the internal cache, if available.
  * @return The created view.
  */
  create(): View {
    let view = this.viewFactory.create(this.parentContainer.createChild(), this.factoryCreateInstruction);
    view._isUserControlled = true;
    return view;
  }

  /**
  * Indicates whether this factory is currently using caching.
  */
  get isCaching() {
    return this.viewFactory.isCaching;
  }

  /**
  * Sets the cache size for this factory.
  * @param size The number of views to cache or "*" to cache all.
  * @param doNotOverrideIfAlreadySet Indicates that setting the cache should not override the setting if previously set.
  */
  setCacheSize(size: number | string, doNotOverrideIfAlreadySet: boolean): void {
    this.viewFactory.setCacheSize(size, doNotOverrideIfAlreadySet);
  }

  /**
  * Gets a cached view if available...
  * @return A cached view or null if one isn't available.
  */
  getCachedView(): View {
    return this.viewFactory.getCachedView();
  }

  /**
  * Returns a view to the cache.
  * @param view The view to return to the cache if space is available.
  */
  returnViewToCache(view: View): void {
    this.viewFactory.returnViewToCache(view);
  }
}

/**
* A factory capable of creating View instances.
*/
export class ViewFactory {
  /**
  * Indicates whether this factory is currently using caching.
  */
  isCaching = false;

  /**
  * Creates an instance of ViewFactory.
  * @param template The document fragment that serves as a template for the view to be created.
  * @param instructions The instructions to be applied ot the template during the creation of a view.
  * @param resources The resources used to compile this factory.
  */
  constructor(template: DocumentFragment, instructions: Object, resources: ViewResources) {
    this.template = template;
    this.instructions = instructions;
    this.resources = resources;
    this.cacheSize = -1;
    this.cache = null;
  }

  /**
  * Sets the cache size for this factory.
  * @param size The number of views to cache or "*" to cache all.
  * @param doNotOverrideIfAlreadySet Indicates that setting the cache should not override the setting if previously set.
  */
  setCacheSize(size: number | string, doNotOverrideIfAlreadySet: boolean): void {
    if (size) {
      if (size === '*') {
        size = Number.MAX_VALUE;
      } else if (typeof size === 'string') {
        size = parseInt(size, 10);
      }
    }

    if (this.cacheSize === -1 || !doNotOverrideIfAlreadySet) {
      this.cacheSize = size;
    }

    if (this.cacheSize > 0) {
      this.cache = [];
    } else {
      this.cache = null;
    }

    this.isCaching = this.cacheSize > 0;
  }

  /**
  * Gets a cached view if available...
  * @return A cached view or null if one isn't available.
  */
  getCachedView(): View {
    return this.cache !== null ? (this.cache.pop() || null) : null;
  }

  /**
  * Returns a view to the cache.
  * @param view The view to return to the cache if space is available.
  */
  returnViewToCache(view: View): void {
    if (view.isAttached) {
      view.detached();
    }

    if (view.isBound) {
      view.unbind();
    }

    if (this.cache !== null && this.cache.length < this.cacheSize) {
      view.fromCache = true;
      this.cache.push(view);
    }
  }

  /**
  * Creates a view or returns one from the internal cache, if available.
  * @param container The container to create the view from.
  * @param createInstruction The instruction used to customize view creation.
  * @param element The custom element that hosts the view.
  * @return The created view.
  */
  create(container: Container, createInstruction?: ViewCreateInstruction, element?: Element): View {
    createInstruction = createInstruction || BehaviorInstruction.normal;

    let cachedView = this.getCachedView();
    if (cachedView !== null) {
      return cachedView;
    }

    let fragment = createInstruction.enhance ? this.template : this.template.cloneNode(true);
    let instructables = fragment.querySelectorAll('.au-target');
    let instructions = this.instructions;
    let resources = this.resources;
    let controllers = [];
    let bindings = [];
    let children = [];
    let shadowSlots = Object.create(null);
    let containers = { root: container };
    let partReplacements = createInstruction.partReplacements;
    let i;
    let ii;
    let view;
    let instructable;
    let instruction;

    this.resources._invokeHook('beforeCreate', this, container, fragment, createInstruction);

    if (element && this.surrogateInstruction !== null) {
      applySurrogateInstruction(container, element, this.surrogateInstruction, controllers, bindings, children);
    }

    if (createInstruction.enhance && fragment.hasAttribute('au-target-id')) {
      instructable = fragment;
      instruction = instructions[instructable.getAttribute('au-target-id')];
      applyInstructions(containers, instructable, instruction, controllers, bindings, children, shadowSlots, partReplacements, resources);
    }

    for (i = 0, ii = instructables.length; i < ii; ++i) {
      instructable = instructables[i];
      instruction = instructions[instructable.getAttribute('au-target-id')];
      applyInstructions(containers, instructable, instruction, controllers, bindings, children, shadowSlots, partReplacements, resources);
    }

    view = new View(container, this, fragment, controllers, bindings, children, shadowSlots);

    //if iniated by an element behavior, let the behavior trigger this callback once it's done creating the element
    if (!createInstruction.initiatedByBehavior) {
      view.created();
    }

    this.resources._invokeHook('afterCreate', view);

    return view;
  }
}
