import {Origin,Metadata} from 'aurelia-metadata';
import {} from 'aurelia-dependency-injection';
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

  activate(instruction){
    if(instruction.skipActivation || typeof instruction.viewModel.activate !== 'function'){
      return Promise.resolve();
    }

    return instruction.viewModel.activate(instruction.model) || Promise.resolve();
  }

  createBehaviorAndSwap(instruction){
    return this.createBehavior(instruction).then(behavior => {
      behavior.view.bind(behavior.executionContext);
      instruction.viewSlot.swap(behavior.view);

      if(instruction.currentBehavior){
        instruction.currentBehavior.unbind();
      }

      return behavior;
    });
  }

  createBehavior(instruction){
    var childContainer = instruction.childContainer,
        viewModelInfo = instruction.viewModelInfo,
        viewModel = instruction.viewModel;

    return this.activate(instruction).then(() => {
      var doneLoading, viewStrategyFromViewModel, origin;

      if('getViewStrategy' in viewModel && !instruction.view){
        viewStrategyFromViewModel = true;
        instruction.view = ViewStrategy.normalize(viewModel.getViewStrategy());
      }

      if (instruction.view) {
        if(viewStrategyFromViewModel){
          origin = Origin.get(viewModel.constructor);
          if(origin){
            instruction.view.makeRelativeTo(origin.moduleId);
          }
        }else if(instruction.viewResources){
          instruction.view.makeRelativeTo(instruction.viewResources.viewUrl);
        }
      }

      if(viewModelInfo){
        doneLoading = viewModelInfo.type.load(childContainer, viewModelInfo.value, instruction.view);
      }else{
        doneLoading = new CustomElement().load(childContainer, viewModel.constructor, instruction.view);
      }

      return doneLoading.then(behaviorType => {
        return behaviorType.create(childContainer, {executionContext:viewModel, suppressBind:true});
      });
    });
  }

  createViewModel(instruction){
    var childContainer = instruction.childContainer || instruction.container.createChild();

    instruction.viewModel = instruction.viewResources
        ? instruction.viewResources.relativeToView(instruction.viewModel)
        : instruction.viewModel;

    return this.resourceCoordinator.loadViewModelInfo(instruction.viewModel).then(viewModelInfo => {
      childContainer.autoRegister(viewModelInfo.value);
      instruction.viewModel = childContainer.viewModel = childContainer.get(viewModelInfo.value);
      instruction.viewModelInfo = viewModelInfo;
      return instruction;
    });
  }

  compose(instruction){
    instruction.childContainer = instruction.childContainer || instruction.container.createChild();
    instruction.view = ViewStrategy.normalize(instruction.view);

    if(instruction.viewModel){
      if(typeof instruction.viewModel === 'string'){
        return this.createViewModel(instruction).then(instruction => {
          return this.createBehaviorAndSwap(instruction);
        });
      }else{
        return this.createBehaviorAndSwap(instruction);
      }
    }else if(instruction.view){
      if(instruction.viewResources){
        instruction.view.makeRelativeTo(instruction.viewResources.viewUrl);
      }

      return instruction.view.loadViewFactory(this.viewEngine).then(viewFactory => {
        var result = viewFactory.create(instruction.childContainer, instruction.executionContext);
        instruction.viewSlot.swap(result);
        return result;
      });
    }else if(instruction.viewSlot){
      instruction.viewSlot.removeAll();
      return Promise.resolve(null);
    }
  }
}
