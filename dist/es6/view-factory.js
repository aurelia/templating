import {Container} from 'aurelia-dependency-injection';
import {View} from './view';
import {ViewSlot} from './view-slot';
import {ContentSelector} from './content-selector';
import {ViewResources} from './resource-registry';

function elementContainerGet(key){
  if(key === Element){
    return this.element;
  }

  if(key === BoundViewFactory){
    if(this.boundViewFactory){
      return this.boundViewFactory;
    }

    var factory = this.instruction.viewFactory,
        partReplacements = this.partReplacements;

    if(partReplacements){
      factory = partReplacements[factory.part] || factory;
    }

    factory.partReplacements = partReplacements;
    return this.boundViewFactory = new BoundViewFactory(this, factory, this.executionContext);
  }

  if(key === ViewSlot){
    if(this.viewSlot === undefined){
      this.viewSlot = new ViewSlot(this.element, this.instruction.anchorIsContainer, this.executionContext);
      this.children.push(this.viewSlot);
    }

    return this.viewSlot;
  }

  if(key === ViewResources){
    return this.viewResources;
  }

  return this.superGet(key);
}

function createElementContainer(parent, element, instruction, executionContext, children, partReplacements, resources){
  var container = parent.createChild(),
                  providers,
                  i;

  container.element = element;
  container.instruction = instruction;
  container.executionContext = executionContext;
  container.children = children;
  container.viewResources = resources;
  container.partReplacements = partReplacements;

  providers = instruction.providers;
  i = providers.length;

  while(i--) {
    container.registerSingleton(providers[i]);
  }

  container.superGet = container.get;
  container.get = elementContainerGet;

  return container;
}

function makeElementIntoAnchor(element, isCustomElement){
  var anchor = document.createComment('anchor');

  if(isCustomElement){
    anchor.attributes = element.attributes;
    anchor.hasAttribute = function(name) { return element.hasAttribute(name); };
    anchor.getAttribute = function(name){ return element.getAttribute(name); };
    anchor.setAttribute = function(name, value) { element.setAttribute(name, value); };
  }

  element.parentNode.replaceChild(anchor, element);

  return anchor;
}

function applyInstructions(containers, executionContext, element, instruction,
  behaviors, bindings, children, contentSelectors, partReplacements, resources){
  var behaviorInstructions = instruction.behaviorInstructions,
      expressions = instruction.expressions,
      elementContainer, i, ii, current, instance;

  if(instruction.contentExpression){
    bindings.push(instruction.contentExpression.createBinding(element.nextSibling));
    element.parentNode.removeChild(element);
    return;
  }

  if(instruction.contentSelector){
    var commentAnchor = document.createComment('anchor');
    element.parentNode.replaceChild(commentAnchor, element);
    contentSelectors.push(new ContentSelector(commentAnchor, instruction.selector));
    return;
  }

  if(behaviorInstructions.length){
    if(!instruction.anchorIsContainer){
      element = makeElementIntoAnchor(element, instruction.isCustomElement);
    }

    containers[instruction.injectorId] = elementContainer =
      createElementContainer(
        containers[instruction.parentInjectorId],
        element,
        instruction,
        executionContext,
        children,
        partReplacements,
        resources
        );

    for(i = 0, ii = behaviorInstructions.length; i < ii; ++i){
      current = behaviorInstructions[i];
      instance = current.type.create(elementContainer, current, element, bindings, current.partReplacements);

      if(instance.contentView){
        children.push(instance.contentView);
      }

      behaviors.push(instance);
    }
  }

  for(i = 0, ii = expressions.length; i < ii; ++i){
    bindings.push(expressions[i].createBinding(element));
  }
}

export class BoundViewFactory {
  constructor(parentContainer, viewFactory, executionContext){
    this.parentContainer = parentContainer;
    this.viewFactory = viewFactory;
    this.executionContext = executionContext;
    this.factoryOptions = { behaviorInstance:false };
  }

  create(executionContext){
    var childContainer = this.parentContainer.createChild(),
        context = executionContext || this.executionContext;

    this.factoryOptions.systemControlled = !executionContext;

    return this.viewFactory.create(childContainer, context, this.factoryOptions);
  }
}

var defaultFactoryOptions = {
  systemControlled:false,
  suppressBind:false
};

export class ViewFactory{
  constructor(template, instructions, resources){
    this.template = template;
    this.instructions = instructions;
    this.resources = resources;
  }

  create(container, executionContext, options=defaultFactoryOptions){
    var fragment = this.template.cloneNode(true),
        instructables = fragment.querySelectorAll('.au-target'),
        instructions = this.instructions,
        resources = this.resources,
        behaviors = [],
        bindings = [],
        children = [],
        contentSelectors = [],
        containers = { root:container },
        partReplacements = options.partReplacements || this.partReplacements,
        i, ii, view;

    for(i = 0, ii = instructables.length; i < ii; ++i){
      applyInstructions(containers, executionContext, instructables[i],
        instructions[i], behaviors, bindings, children, contentSelectors, partReplacements, resources);
    }

    view = new View(fragment, behaviors, bindings, children, options.systemControlled, contentSelectors);
    view.created(executionContext);

    if(!options.suppressBind){
      view.bind(executionContext);
    }

    return view;
  }
}
