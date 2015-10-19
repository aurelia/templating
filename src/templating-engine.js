import {Controller} from './controller';
import {Container, inject} from 'aurelia-dependency-injection';
import {ModuleAnalyzer} from './module-analyzer';

@inject(Container, ModuleAnalyzer)
export class TemplatingEngine {
  constructor(container, moduleAnalyzer) {
    this._container = container;
    this._moduleAnalyzer = moduleAnalyzer;
  }

  createControllerForUnitTest(modelType: Function, attributesFromHTML?: Object): Controller {
    let exportName = modelType.name;
    let resourceModule = this._moduleAnalyzer.analyze('test-module', { [exportName]: modelType }, exportName);
    let description = resourceModule.mainResource;

    description.initialize(this._container);

    let model = this._container.get(modelType);
    return new Controller(description.metadata, model, {attributes: attributesFromHTML || {}});
  }

  createModelForUnitTest(modelType: Function, attributesFromHTML?: Object, bindingContext?: any): Object {
    let controller = this.createControllerForUnitTest(modelType, attributesFromHTML);
    controller.bind(bindingContext || {});
    return controller.model;
  }
}
