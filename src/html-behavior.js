import {metadata, Origin} from 'aurelia-metadata';
import {ObserverLocator, Binding} from 'aurelia-binding';
import {TaskQueue} from 'aurelia-task-queue';
import {Container} from 'aurelia-dependency-injection';
import {ViewLocator} from './view-locator';
import {ViewEngine} from './view-engine';
import {ViewCompiler} from './view-compiler';
import {_hyphenate, _isAllWhitespace} from './util';
import {BindableProperty} from './bindable-property';
import {Controller} from './controller';
import {ViewResources} from './view-resources';
import {ResourceLoadContext, ViewCompileInstruction, BehaviorInstruction} from './instructions';
import {FEATURE, DOM} from 'aurelia-pal';

let lastProviderId = 0;

function nextProviderId() {
  return ++lastProviderId;
}

function doProcessContent() { return true; }
function doProcessAttributes() {}

/**
* Identifies a class as a resource that implements custom element or custom
* attribute functionality.
*/
export class HtmlBehaviorResource {
  /**
  * Creates an instance of HtmlBehaviorResource.
  */
  constructor() {
    this.elementName = null;
    this.attributeName = null;
    this.attributeDefaultBindingMode = undefined;
    this.liftsContent = false;
    this.targetShadowDOM = false;
    this.shadowDOMOptions = null;
    this.processAttributes = doProcessAttributes;
    this.processContent = doProcessContent;
    this.usesShadowDOM = false;
    this.childBindings = null;
    this.hasDynamicOptions = false;
    this.containerless = false;
    this.properties = [];
    this.attributes = {};
    this.isInitialized = false;
    this.primaryProperty = null;
  }

  /**
  * Checks whether the provided name matches any naming conventions for HtmlBehaviorResource.
  * @param name The name of the potential resource.
  * @param existing An already existing resource that may need a convention name applied.
  */
  static convention(name: string, existing?: HtmlBehaviorResource): HtmlBehaviorResource {
    let behavior;

    if (name.endsWith('CustomAttribute')) {
      behavior = existing || new HtmlBehaviorResource();
      behavior.attributeName = _hyphenate(name.substring(0, name.length - 15));
    }

    if (name.endsWith('CustomElement')) {
      behavior = existing || new HtmlBehaviorResource();
      behavior.elementName = _hyphenate(name.substring(0, name.length - 13));
    }

    return behavior;
  }

  /**
  * Adds a binding expression to the component created by this resource.
  * @param behavior The binding expression.
  */
  addChildBinding(behavior: Object): void {
    if (this.childBindings === null) {
      this.childBindings = [];
    }

    this.childBindings.push(behavior);
  }

  /**
  * Provides an opportunity for the resource to initialize iteself.
  * @param container The dependency injection container from which the resource
  * can aquire needed services.
  * @param target The class to which this resource metadata is attached.
  */
  initialize(container: Container, target: Function): void {
    let proto = target.prototype;
    let properties = this.properties;
    let attributeName = this.attributeName;
    let attributeDefaultBindingMode = this.attributeDefaultBindingMode;
    let i;
    let ii;
    let current;

    if (this.isInitialized) {
      return;
    }

    this.isInitialized = true;
    target.__providerId__ = nextProviderId();

    this.observerLocator = container.get(ObserverLocator);
    this.taskQueue = container.get(TaskQueue);

    this.target = target;
    this.usesShadowDOM = this.targetShadowDOM && FEATURE.shadowDOM;
    this.handlesCreated = ('created' in proto);
    this.handlesBind = ('bind' in proto);
    this.handlesUnbind = ('unbind' in proto);
    this.handlesAttached = ('attached' in proto);
    this.handlesDetached = ('detached' in proto);
    this.htmlName = this.elementName || this.attributeName;

    if (attributeName !== null) {
      if (properties.length === 0) { //default for custom attributes
        new BindableProperty({
          name: 'value',
          changeHandler: 'valueChanged' in proto ? 'valueChanged' : null,
          attribute: attributeName,
          defaultBindingMode: attributeDefaultBindingMode
        }).registerWith(target, this);
      }

      current = properties[0];

      if (properties.length === 1 && current.name === 'value') { //default for custom attributes
        current.isDynamic = current.hasOptions = this.hasDynamicOptions;
        current.defineOn(target, this);
      } else { //custom attribute with options
        for (i = 0, ii = properties.length; i < ii; ++i) {
          properties[i].defineOn(target, this);
          if (properties[i].primaryProperty) {
            if (this.primaryProperty) {
              throw new Error('Only one bindable property on a custom element can be defined as the default');
            }
            this.primaryProperty = properties[i];
          }
        }

        current = new BindableProperty({
          name: 'value',
          changeHandler: 'valueChanged' in proto ? 'valueChanged' : null,
          attribute: attributeName,
          defaultBindingMode: attributeDefaultBindingMode
        });

        current.hasOptions = true;
        current.registerWith(target, this);
      }
    } else {
      for (i = 0, ii = properties.length; i < ii; ++i) {
        properties[i].defineOn(target, this);
      }
      // Because how inherited properties would interact with the default 'value' property
      // in a custom attribute is not well defined yet, we only inherit properties on
      // custom elements, where it's not a problem.
      this._copyInheritedProperties(container, target);
    }
  }

  /**
  * Allows the resource to be registered in the view resources for the particular
  * view into which it was required.
  * @param registry The view resource registry for the view that required this resource.
  * @param name The name provided by the end user for this resource, within the
  * particular view it's being used.
  */
  register(registry: ViewResources, name?: string): void {
    if (this.attributeName !== null) {
      registry.registerAttribute(name || this.attributeName, this, this.attributeName);

      if (Array.isArray(this.aliases)) {
        this.aliases
          .forEach( (alias) => {
            registry.registerAttribute(alias, this, this.attributeName);
          });
      }
    }

    if (this.elementName !== null) {
      registry.registerElement(name || this.elementName, this);
    }
  }

  /**
  * Enables the resource to asynchronously load additional resources.
  * @param container The dependency injection container from which the resource
  * can aquire needed services.
  * @param target The class to which this resource metadata is attached.
  * @param loadContext The loading context object provided by the view engine.
  * @param viewStrategy A view strategy to overload the default strategy defined by the resource.
  * @param transientView Indicated whether the view strategy is transient or
  * permanently tied to this component.
  */
  load(container: Container, target: Function, loadContext?: ResourceLoadContext, viewStrategy?: ViewStrategy, transientView?: boolean): Promise<HtmlBehaviorResource> {
    let options;

    if (this.elementName !== null) {
      viewStrategy = container.get(ViewLocator).getViewStrategy(viewStrategy || this.viewStrategy || target);
      options = new ViewCompileInstruction(this.targetShadowDOM, true);

      if (!viewStrategy.moduleId) {
        viewStrategy.moduleId = Origin.get(target).moduleId;
      }

      return viewStrategy.loadViewFactory(container.get(ViewEngine), options, loadContext, target).then(viewFactory => {
        if (!transientView || !this.viewFactory) {
          this.viewFactory = viewFactory;
        }

        return viewFactory;
      });
    }

    return Promise.resolve(this);
  }

  /**
  * Plugs into the compiler and enables custom processing of the node on which this behavior is located.
  * @param compiler The compiler that is currently compiling the view that this behavior exists within.
  * @param resources The resources for the view that this behavior exists within.
  * @param node The node on which this behavior exists.
  * @param instruction The behavior instruction created for this behavior.
  * @param parentNode The parent node of the current node.
  * @return The current node.
  */
  compile(compiler: ViewCompiler, resources: ViewResources, node: Node, instruction: BehaviorInstruction, parentNode?: Node): Node {
    if (this.liftsContent) {
      if (!instruction.viewFactory) {
        let template = DOM.createElement('template');
        let fragment = DOM.createDocumentFragment();
        let cacheSize = node.getAttribute('view-cache');
        let part = node.getAttribute('part');

        node.removeAttribute(instruction.originalAttrName);
        DOM.replaceNode(template, node, parentNode);
        fragment.appendChild(node);
        instruction.viewFactory = compiler.compile(fragment, resources);

        if (part) {
          instruction.viewFactory.part = part;
          node.removeAttribute('part');
        }

        if (cacheSize) {
          instruction.viewFactory.setCacheSize(cacheSize);
          node.removeAttribute('view-cache');
        }

        node = template;
      }
    } else if (this.elementName !== null) { //custom element
      let partReplacements = {};

      if (this.processContent(compiler, resources, node, instruction) && node.hasChildNodes()) {
        let currentChild = node.firstChild;
        let contentElement = this.usesShadowDOM ? null : DOM.createElement('au-content');
        let nextSibling;
        let toReplace;

        while (currentChild) {
          nextSibling = currentChild.nextSibling;

          if (currentChild.tagName === 'TEMPLATE' && (toReplace = currentChild.getAttribute('replace-part'))) {
            partReplacements[toReplace] = compiler.compile(currentChild, resources);
            DOM.removeNode(currentChild, parentNode);
            instruction.partReplacements = partReplacements;
          } else if (contentElement !== null) {
            if (currentChild.nodeType === 3 && _isAllWhitespace(currentChild)) {
              DOM.removeNode(currentChild, parentNode);
            } else {
              contentElement.appendChild(currentChild);
            }
          }

          currentChild = nextSibling;
        }

        if (contentElement !== null && contentElement.hasChildNodes()) {
          node.appendChild(contentElement);
        }

        instruction.skipContentProcessing = false;
      } else {
        instruction.skipContentProcessing = true;
      }
    } else if (!this.processContent(compiler, resources, node, instruction)) {
      instruction.skipContentProcessing = true;
    }

    return node;
  }

  /**
  * Creates an instance of this behavior.
  * @param container The DI container to create the instance in.
  * @param instruction The instruction for this behavior that was constructed during compilation.
  * @param element The element on which this behavior exists.
  * @param bindings The bindings that are associated with the view in which this behavior exists.
  * @return The Controller of this behavior.
  */
  create(container: Container, instruction?: BehaviorInstruction, element?: Element, bindings?: Binding[]): Controller {
    let viewHost;
    let au = null;

    instruction = instruction || BehaviorInstruction.normal;
    element = element || null;
    bindings = bindings || null;

    if (this.elementName !== null && element) {
      if (this.usesShadowDOM) {
        viewHost = element.attachShadow(this.shadowDOMOptions);
        container.registerInstance(DOM.boundary, viewHost);
      } else {
        viewHost = element;
        if (this.targetShadowDOM) {
          container.registerInstance(DOM.boundary, viewHost);
        }
      }
    }

    if (element !== null) {
      element.au = au = element.au || {};
    }

    let viewModel = instruction.viewModel || container.get(this.target);
    let controller = new Controller(this, instruction, viewModel, container);
    let childBindings = this.childBindings;
    let viewFactory;

    if (this.liftsContent) {
      //template controller
      au.controller = controller;
    } else if (this.elementName !== null) {
      //custom element
      viewFactory = instruction.viewFactory || this.viewFactory;
      container.viewModel = viewModel;

      if (viewFactory) {
        controller.view = viewFactory.create(container, instruction, element);
      }

      if (element !== null) {
        au.controller = controller;

        if (controller.view) {
          if (!this.usesShadowDOM && (element.childNodes.length === 1 || element.contentElement)) { //containerless passes content view special contentElement property
            let contentElement = element.childNodes[0] || element.contentElement;
            controller.view.contentView = { fragment: contentElement }; //store the content before appending the view
            contentElement.parentNode && DOM.removeNode(contentElement); //containerless content element has no parent
          }

          if (instruction.anchorIsContainer) {
            if (childBindings !== null) {
              for (let i = 0, ii = childBindings.length; i < ii; ++i) {
                controller.view.addBinding(childBindings[i].create(element, viewModel, controller));
              }
            }

            controller.view.appendNodesTo(viewHost);
          } else {
            controller.view.insertNodesBefore(viewHost);
          }
        } else if (childBindings !== null) {
          for (let i = 0, ii = childBindings.length; i < ii; ++i) {
            bindings.push(childBindings[i].create(element, viewModel, controller));
          }
        }
      } else if (controller.view) {
        //dynamic element with view
        controller.view.controller = controller;

        if (childBindings !== null) {
          for (let i = 0, ii = childBindings.length; i < ii; ++i) {
            controller.view.addBinding(childBindings[i].create(instruction.host, viewModel, controller));
          }
        }
      } else if (childBindings !== null) {
        //dynamic element without view
        for (let i = 0, ii = childBindings.length; i < ii; ++i) {
          bindings.push(childBindings[i].create(instruction.host, viewModel, controller));
        }
      }
    } else if (childBindings !== null) {
      //custom attribute
      for (let i = 0, ii = childBindings.length; i < ii; ++i) {
        bindings.push(childBindings[i].create(element, viewModel, controller));
      }
    }

    if (au !== null) {
      au[this.htmlName] = controller;
    }

    if (instruction.initiatedByBehavior && viewFactory) {
      controller.view.created();
    }

    return controller;
  }

  _ensurePropertiesDefined(instance: Object, lookup: Object) {
    let properties;
    let i;
    let ii;
    let observer;

    if ('__propertiesDefined__' in lookup) {
      return;
    }

    lookup.__propertiesDefined__ = true;
    properties = this.properties;

    for (i = 0, ii = properties.length; i < ii; ++i) {
      observer = properties[i].createObserver(instance);

      if (observer !== undefined) {
        lookup[observer.propertyName] = observer;
      }
    }
  }

  _copyInheritedProperties(container: Container, target: Function) {
    // This methods enables inherited @bindable properties.
    // We look for the first base class with metadata, make sure it's initialized
    // and copy its properties.
    // We don't need to walk further than the first parent with metadata because
    // it had also inherited properties during its own initialization.
    let behavior;
    let derived = target;

    while (true) {
      let proto = Object.getPrototypeOf(target.prototype);
      target = proto && proto.constructor;
      if (!target) {
        return;
      }
      behavior = metadata.getOwn(metadata.resource, target);
      if (behavior) {
        break;
      }
    }
    behavior.initialize(container, target);
    for (let i = 0, ii = behavior.properties.length; i < ii; ++i) {
      let prop = behavior.properties[i];
      // Check that the property metadata was not overriden or re-defined in this class
      if (this.properties.some(p => p.name === prop.name)) {
        continue;
      }
      // We don't need to call .defineOn() for those properties because it was done
      // on the parent prototype during initialization.
      new BindableProperty(prop).registerWith(derived, this);
    }
  }
}
