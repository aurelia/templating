import {Origin,Metadata} from 'aurelia-metadata';
import {ViewStrategy, UseViewStrategy} from './view-strategy';
import {ViewEngine} from './view-engine';
import {HtmlBehaviorResource} from './html-behavior';

export class CompositionEngine {
  static inject(){ return [ViewEngine]; }
  constructor(viewEngine){
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
        viewModelResource = instruction.viewModelResource,
        viewModel = instruction.viewModel,
        metadata;

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

      if(viewModelResource){
        metadata = viewModelResource.metadata;
        doneLoading = metadata.load(childContainer, viewModelResource.value, instruction.view, true);
      }else{
        metadata = new HtmlBehaviorResource();
        metadata.elementName = 'dynamic-element';
        metadata.analyze(instruction.container || childContainer, viewModel.constructor);
        doneLoading = metadata.load(childContainer, viewModel.constructor, instruction.view, true).then(viewFactory => {
          return viewFactory;
        });
      }

      return doneLoading.then(viewFactory => {
        return metadata.create(childContainer, {
          executionContext:viewModel,
          viewFactory:viewFactory,
          suppressBind:true,
          host:instruction.host
        });
      });
    });
  }

  createViewModel(instruction){
    var childContainer = instruction.childContainer || instruction.container.createChild();

    instruction.viewModel = instruction.viewResources
        ? instruction.viewResources.relativeToView(instruction.viewModel)
        : instruction.viewModel;

    return this.viewEngine.importViewModelResource(instruction.viewModel).then(viewModelResource => {
      childContainer.autoRegister(viewModelResource.value);

      if(instruction.host){
        childContainer.registerInstance(Element, instruction.host);
      }

      instruction.viewModel = childContainer.viewModel = childContainer.get(viewModelResource.value);
      instruction.viewModelResource = viewModelResource;
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
