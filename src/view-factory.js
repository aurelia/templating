import {Container} from 'aurelia-dependency-injection';
import {View} from './view';
import {ViewSlot} from './view-slot';
import {ContentSelector} from './content-selector';

class BehaviorContainer extends Container {
  get(key){
    if(key === Element){
      return this.element;
    }

    if(key === BoundViewFactory){
      return this.boundViewFactory || (this.boundViewFactory = new BoundViewFactory(this, this.instruction.viewFactory, this.executionContext));
    }

    if(key === ViewSlot){
      if(this.viewSlot === undefined){
        this.viewSlot = new ViewSlot(this.element, this.instruction.anchorIsContainer, this.executionContext);
        this.children.push(this.viewSlot);
      }

      return this.viewSlot;
    }

    return super.get(key);
  }
}

function applyInstructions(containers, executionContext, element, instruction, 
  behaviors, bindings, children, contentSelectors){
  var behaviorInstructions = instruction.behaviorInstructions,
      elementContainer;

  if(instruction.contentExpression){
    bindings.push(instruction.contentExpression.createBinding(element.nextSibling));
    element.parentNode.removeChild(element);
    return;
  }

  if(instruction.contentSelector){ 
    contentSelectors.push(new ContentSelector(element, instruction.selector));
    return;
  }

  if(behaviorInstructions.length){
    containers[instruction.injectorId] = elementContainer = containers[instruction.parentInjectorId].createTypedChild(BehaviorContainer);
    
    elementContainer.element = element;
    elementContainer.instruction = instruction;
    elementContainer.executionContext = executionContext;
    elementContainer.children = children;
    elementContainer.autoRegisterAll(instruction.providers);

    behaviorInstructions.forEach(behaviorInstruction => {
      var instance = behaviorInstruction.type.create(elementContainer, behaviorInstruction, element, bindings);
      
      if(instance.contentView){
        children.push(instance.contentView);
      }

      behaviors.push(instance);
    });
  }

  instruction.expressions.forEach(exp => bindings.push(exp.createBinding(element)));
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
  constructor(template, instructions){
    this.template = template;
    this.instructions = instructions;
  }

  create(container, executionContext, options=defaultFactoryOptions){
    var fragment = this.template.cloneNode(true), 
        instructables = fragment.querySelectorAll('.ai-target'),
        instructions = this.instructions,
        behaviors = [],
        bindings = [],
        children = [],
        contentSelectors = [],
        containers = { root:container };

    for(var i = 0, ii = instructables.length; i < ii; i++){
      applyInstructions(containers, executionContext, instructables[i], 
        instructions[i], behaviors, bindings, children, contentSelectors);
    }

    var view = new View(fragment, behaviors, bindings, children, options.systemControlled, contentSelectors);

    view.created(executionContext);

    if(!options.suppressBind){
      view.bind(executionContext);
    }

    return view;
  }
}