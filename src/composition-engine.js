import {ViewStrategy, UseView} from './view-strategy';
import {ResourceCoordinator} from './resource-coordinator';
import {ViewEngine} from './view-engine';
import {CustomElement} from './custom-element';

export class CompositionEngine {
  static inject(){ return [ResourceCoordinator, ViewEngine]; }
  constructor(resourceCoordinator, viewEngine){
    this.resourceCoordinator = resourceCoordinator;
    this.viewEngine = viewEngine;
  }

  bindAndSwap(viewSlot, next, current){
    next.bind(next.executionContext);
    viewSlot.swap(next.view);

    if(current){
      current.unbind();
    }

    return next;
  }

  activateViewModel(viewModel, model){
    if(typeof viewModel.activate === 'function') {
      return viewModel.activate(model) || Promise.resolve();
    }else{
      return Promise.resolve();
    }
  }

  createBehavior(instruction, container, viewModelInfo){
    return this.activateViewModel(instruction.viewModel, instruction.model).then(() => {
      var doneLoading;

      if('getViewStrategy' in instruction.viewModel && !instruction.view){
        instruction.view = ViewStrategy.normalize(instruction.viewModel.getViewStrategy());
      }

      if(viewModelInfo){
        doneLoading = viewModelInfo.type.load(container, viewModelInfo.value, instruction.view);
      }else{
        doneLoading = new CustomElement().load(container, instruction.viewModel.constructor, instruction.view);
      }

      return doneLoading.then(behaviorType => {
        var behavior = behaviorType.create(container, {executionContext:instruction.viewModel, suppressBind:true});
        return this.bindAndSwap(instruction.viewSlot, behavior, instruction.currentBehavior);
      });
    });
  }

  compose(instruction){
    var childContainer;
    
    instruction.view = ViewStrategy.normalize(instruction.view);

    if(typeof instruction.viewModel === 'string'){
      instruction.viewModel = instruction.viewResources 
        ? instruction.viewResources.relativeToView(instruction.viewModel)
        : instruction.viewModel;
      
      return this.resourceCoordinator.loadViewModelInfo(instruction.viewModel).then(viewModelInfo => {
        childContainer = instruction.container.createChild();
        childContainer.autoRegister(viewModelInfo.value);
        instruction.viewModel = childContainer.get(viewModelInfo.value);
        return this.createBehavior(instruction, childContainer, viewModelInfo);
      });
    }else{
      if(instruction.viewModel){
        return this.createBehavior(instruction, instruction.container.createChild());
      } else if (instruction.view){
        return instruction.view.loadViewFactory(this.viewEngine).then(viewFactory => {
          childContainer = instruction.container.createChild();
          result = viewFactory.create(childContainer, instruction.executionContext);
          instruction.viewSlot.swap(result);
        });
      }
    }
  }
}