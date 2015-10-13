import {Controller} from './controller';
import {Container} from 'aurelia-dependency-injection';
import {bindingEngine} from 'aurelia-binding';
import {ModuleAnalyzer} from './module-analyzer';

export const templatingEngine = {
  initialize(container?: Container) {
    this._container = container || new Container();
    this._moduleAnalyzer = this._container.get(ModuleAnalyzer);
    bindingEngine.initialize(this._container);
  },
  createModelForUnitTest(modelType: Function, attributesFromHTML?: Object, bindingContext?: any): Object {
    let exportName = modelType.name;
    let resourceModule = this._moduleAnalyzer.analyze('test-module', { [exportName]: modelType }, exportName);
    let description = resourceModule.mainResource;

    description.initialize(this._container);

    let model = this._container.get(modelType);
    let controller = new Controller(description.metadata, model, {attributes: attributesFromHTML || {}});

    controller.bind(bindingContext || {});

    return model;
  }
};
