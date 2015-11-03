import {Origin} from 'aurelia-metadata';
import {ObserverLocator, BindingExpression, Binding} from 'aurelia-binding';
import {TaskQueue} from 'aurelia-task-queue';
import {Container} from 'aurelia-dependency-injection';
import {ViewStrategy} from './view-strategy';
import {ViewEngine} from './view-engine';
import {ViewCompiler} from './view-compiler';
import {ContentSelector} from './content-selector';
import {hyphenate} from './util';
import {BindableProperty} from './bindable-property';
import {Controller} from './controller';
import {ViewResources} from './view-resources';
import {ResourceLoadContext, ViewCompileInstruction, BehaviorInstruction} from './instructions';
import {FEATURE, DOM} from 'aurelia-pal';

const contentSelectorViewCreateInstruction = { suppressBind: true, enhance: false };
let lastProviderId = 0;

function nextProviderId() {
  return ++lastProviderId;
}

function doProcessContent() {
  return true;
}

export class HtmlBehaviorResource {
  constructor() {
    this.elementName = null;
    this.attributeName = null;
    this.attributeDefaultBindingMode = undefined;
    this.liftsContent = false;
    this.targetShadowDOM = false;
    this.processContent = doProcessContent;
    this.usesShadowDOM = false;
    this.childBindings = null;
    this.hasDynamicOptions = false;
    this.containerless = false;
    this.properties = [];
    this.attributes = {};
  }

  static convention(name: string, existing?: HtmlBehaviorResource): HtmlBehaviorResource {
    let behavior;

    if (name.endsWith('CustomAttribute')) {
      behavior = existing || new HtmlBehaviorResource();
      behavior.attributeName = hyphenate(name.substring(0, name.length - 15));
    }

    if (name.endsWith('CustomElement')) {
      behavior = existing || new HtmlBehaviorResource();
      behavior.elementName = hyphenate(name.substring(0, name.length - 13));
    }

    return behavior;
  }

  addChildBinding(behavior: BindingExpression): void {
    if (this.childBindings === null) {
      this.childBindings = [];
    }

    this.childBindings.push(behavior);
  }

  initialize(container: Container, target: Function): void {
    let proto = target.prototype;
    let properties = this.properties;
    let attributeName = this.attributeName;
    let attributeDefaultBindingMode = this.attributeDefaultBindingMode;
    let i;
    let ii;
    let current;

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
    }
  }

  register(registry: ViewResources, name?: string): void {
    if (this.attributeName !== null) {
      registry.registerAttribute(name || this.attributeName, this, this.attributeName);
    }

    if (this.elementName !== null) {
      registry.registerElement(name || this.elementName, this);
    }
  }

  load(container: Container, target: Function, viewStrategy?: ViewStrategy, transientView?: boolean, loadContext?: ResourceLoadContext): Promise<HtmlBehaviorResource> {
    let options;

    if (this.elementName !== null) {
      viewStrategy = viewStrategy || this.viewStrategy || ViewStrategy.getDefault(target);
      options = new ViewCompileInstruction(this.targetShadowDOM, true);

      if (!viewStrategy.moduleId) {
        viewStrategy.moduleId = Origin.get(target).moduleId;
      }

      return viewStrategy.loadViewFactory(container.get(ViewEngine), options, loadContext).then(viewFactory => {
        if (!transientView || !this.viewFactory) {
          this.viewFactory = viewFactory;
        }

        return viewFactory;
      });
    }

    return Promise.resolve(this);
  }

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
      let partReplacements = instruction.partReplacements = {};

      if (this.processContent(compiler, resources, node, instruction) && node.hasChildNodes()) {
        if (this.usesShadowDOM) {
          let currentChild = node.firstChild;
          let nextSibling;
          let toReplace;

          while (currentChild) {
            nextSibling = currentChild.nextSibling;

            if (currentChild.tagName === 'TEMPLATE' && (toReplace = currentChild.getAttribute('replace-part'))) {
              partReplacements[toReplace] = compiler.compile(currentChild, resources);
              DOM.removeNode(currentChild, parentNode);
            }

            currentChild = nextSibling;
          }

          instruction.skipContentProcessing = false;
        } else {
          let fragment = DOM.createDocumentFragment();
          let currentChild = node.firstChild;
          let nextSibling;
          let toReplace;

          while (currentChild) {
            nextSibling = currentChild.nextSibling;

            if (currentChild.tagName === 'TEMPLATE' && (toReplace = currentChild.getAttribute('replace-part'))) {
              partReplacements[toReplace] = compiler.compile(currentChild, resources);
              DOM.removeNode(currentChild, parentNode);
            } else {
              fragment.appendChild(currentChild);
            }

            currentChild = nextSibling;
          }

          instruction.contentFactory = compiler.compile(fragment, resources);
          instruction.skipContentProcessing = true;
        }
      } else {
        instruction.skipContentProcessing = true;
      }
    }

    return node;
  }

  create(container: Container, instruction?: BehaviorInstruction, element?: Element, bindings?: Binding[]): Controller {
    let host;
    let au = null;

    instruction = instruction || BehaviorInstruction.normal;
    element = element || null;
    bindings = bindings || null;

    if (this.elementName !== null && element) {
      if (this.usesShadowDOM) {
        host = element.createShadowRoot();
        container.registerInstance(DOM.boundary, host);
      } else {
        host = element;

        if (this.targetShadowDOM) {
          container.registerInstance(DOM.boundary, host);
        }
      }
    }

    if (element !== null) {
      element.au = au = element.au || {};
    }

    let viewModel = instruction.bindingContext || container.get(this.target);
    let controller = new Controller(this, viewModel, instruction);
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
          if (!this.usesShadowDOM) {
            if (instruction.contentFactory) {
              let contentView = instruction.contentFactory.create(container, contentSelectorViewCreateInstruction);

              ContentSelector.applySelectors(
                contentView,
                controller.view.contentSelectors,
                (contentSelector, group) => contentSelector.add(group)
              );

              controller.contentView = contentView;
            }
          }

          if (instruction.anchorIsContainer) {
            if (childBindings !== null) {
              for (let i = 0, ii = childBindings.length; i < ii; ++i) {
                controller.view.addBinding(childBindings[i].create(element, viewModel));
              }
            }

            controller.view.appendNodesTo(host);
          } else {
            controller.view.insertNodesBefore(host);
          }
        } else if (childBindings !== null) {
          for (let i = 0, ii = childBindings.length; i < ii; ++i) {
            bindings.push(childBindings[i].create(element, viewModel));
          }
        }
      } else if (controller.view) {
        //dynamic element with view
        controller.view.controller = controller;

        if (childBindings !== null) {
          for (let i = 0, ii = childBindings.length; i < ii; ++i) {
            controller.view.addBinding(childBindings[i].create(instruction.host, viewModel));
          }
        }
      } else if (childBindings !== null) {
        //dynamic element without view
        for (let i = 0, ii = childBindings.length; i < ii; ++i) {
          bindings.push(childBindings[i].create(instruction.host, viewModel));
        }
      }
    } else if (childBindings !== null) {
      //custom attribute
      for (let i = 0, ii = childBindings.length; i < ii; ++i) {
        bindings.push(childBindings[i].create(element, viewModel));
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

  ensurePropertiesDefined(instance: Object, lookup: Object) {
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
}
