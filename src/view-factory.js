import {Container, resolver} from 'aurelia-dependency-injection';
import {View} from './view';
import {ViewSlot} from './view-slot';
import {_ContentSelector} from './content-selector';
import {ViewResources} from './view-resources';
import {BehaviorInstruction, TargetInstruction} from './instructions';
import {DOM} from 'aurelia-pal';

function createBehaviorContainer(parent, element, instruction, children, viewResources, partReplacements) {
  let providers = instruction.providers;
  let handlers = parent._handlers;

  return {
    parent: parent,
    root: parent.root,
    _configuration: parent._configuration,
    _handlers: parent._handlers,
    boundViewFactory: null,
    viewSlot: null,
    standardContainer: null,
    get(key) {
      if (key === null || key === undefined) {
        throw new Error('key/value cannot be null or undefined. Are you trying to inject/register something that doesn\'t exist with DI?');
      }

      if('__providerId__' in key) {
        let providerKey = key.__providerId__;

        if(providerKey in providers) {
          return this[providerKey] || (this[providerKey] = handlers.get(key).invoke(this));
        }
      }

      if (key === Container) {
        return this;
      }

      if (key === DOM.Element) {
        return element;
      }

      if (key === BoundViewFactory) {
        if (this.boundViewFactory !== null) {
          return this.boundViewFactory;
        }

        let factory = instruction.viewFactory;

        if (partReplacements) {
          factory = partReplacements[factory.part] || factory;
        }

        this.boundViewFactory = new BoundViewFactory(this, factory, partReplacements);
        return this.boundViewFactory;
      }

      if (key === ViewSlot) {
        if (this.viewSlot === null) {
          this.viewSlot = new ViewSlot(element, instruction.anchorIsContainer);
          element.isContentProjectionSource = instruction.lifting;
          children.push(this.viewSlot);
        }

        return this.viewSlot;
      }

      if (key === ViewResources) {
        return viewResources;
      }

      if (key === TargetInstruction) {
        return instruction;
      }

      return this.standardContainer !== null ? this.standardContainer._get(key) : parent._get(key);
    },
    _get(key) {
      if('__providerId__' in key) {
        let providerKey = key.__providerId__;

        if(providerKey in providers) {
          return this[providerKey] || (this[providerKey] = handlers.get(key).invoke(this));
        }
      }

      return this.standardContainer !== null ? this.standardContainer._get(key) : parent._get(key);
    },
    createChild() {
      return createBehaviorContainer(this, element, instruction, children, viewResources, partReplacements);
    },
    ensureStandardContainer() {
      if(this.standardContainer === null) {
        this.standardContainer = new Container(this._configuration);
        this.standardContainer.root = this.root;
        this.standardContainer.parent = this.parent;
      }

      return this.standardContainer;
    }
  };
}

function makeElementIntoAnchor(element, elementInstruction) {
  let anchor = DOM.createComment('anchor');

  if (elementInstruction) {
    anchor.hasAttribute = function(name) { return element.hasAttribute(name); };
    anchor.getAttribute = function(name) { return element.getAttribute(name); };
    anchor.setAttribute = function(name, value) { element.setAttribute(name, value); };
  }

  DOM.replaceNode(anchor, element);

  return anchor;
}

function applyInstructions(containers, element, instruction, controllers, bindings, children, contentSelectors, partReplacements, resources) {
  let behaviorInstructions = instruction.behaviorInstructions;
  let expressions = instruction.expressions;
  let elementContainer;
  let i;
  let ii;
  let current;
  let instance;

  if (instruction.contentExpression) {
    bindings.push(instruction.contentExpression.createBinding(element.nextSibling));
    element.parentNode.removeChild(element);
    return;
  }

  if (instruction.contentSelector) {
    let commentAnchor = DOM.createComment('anchor');
    DOM.replaceNode(commentAnchor, element);
    contentSelectors.push(new _ContentSelector(commentAnchor, instruction.selector));
    return;
  }

  if (behaviorInstructions.length) {
    if (!instruction.anchorIsContainer) {
      element = makeElementIntoAnchor(element, instruction.elementInstruction);
    }

    containers[instruction.injectorId] = elementContainer =
      createBehaviorContainer(containers[instruction.parentInjectorId], element, instruction, children, resources, partReplacements);

    for (i = 0, ii = behaviorInstructions.length; i < ii; ++i) {
      current = behaviorInstructions[i];
      instance = current.type.create(elementContainer, current, element, bindings);

      if (instance.contentView) {
        children.push(instance.contentView);
      }

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
  let values = instruction.values;
  let i;
  let ii;
  let current;
  let instance;
  let currentAttributeValue;

  Object.assign(container.providers, instruction.providers);

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
    this.factoryCreateInstruction = { partReplacements: partReplacements };
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
    element = element || null;

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
    let contentSelectors = [];
    let containers = { root: container };
    let partReplacements = createInstruction.partReplacements;
    let i;
    let ii;
    let view;
    let instructable;
    let instruction;

    this.resources._onBeforeCreate(this, container, fragment, createInstruction);

    if (element !== null && this.surrogateInstruction !== null) {
      applySurrogateInstruction(container, element, this.surrogateInstruction, controllers, bindings, children);
    }

    for (i = 0, ii = instructables.length; i < ii; ++i) {
      instructable = instructables[i];
      instruction = instructions[instructable.getAttribute('au-target-id')];

      applyInstructions(containers, instructable, instruction, controllers, bindings, children, contentSelectors, partReplacements, resources);
    }

    view = new View(this, fragment, controllers, bindings, children, contentSelectors);

    //if iniated by an element behavior, let the behavior trigger this callback once it's done creating the element
    if (!createInstruction.initiatedByBehavior) {
      view.created();
    }

    this.resources._onAfterCreate(view);

    return view;
  }
}
