import {createScopeForTest} from 'aurelia-binding';
import {Controller} from './controller';
import {Container, inject} from 'aurelia-dependency-injection';
import {ModuleAnalyzer} from './module-analyzer';
import {Animator} from './animator';
import {ViewResources} from './view-resources';
import {CompositionEngine} from './composition-engine';
import {ViewFactory} from './view-factory';
import {ViewCompiler} from './view-compiler';

interface EnhanceInstruction {
  container: Container;
  element: Element;
  resources: ViewResources;
  bindingContext?: Object;
}

@inject(Container, ModuleAnalyzer, ViewCompiler, CompositionEngine)
export class TemplatingEngine {
  constructor(container: Container, moduleAnalyzer: ModuleAnalyzer, viewCompiler: ViewCompiler, compositionEngine: CompositionEngine) {
    this._container = container;
    this._moduleAnalyzer = moduleAnalyzer;
    this._viewCompiler = viewCompiler;
    this._compositionEngine = compositionEngine;
    container.registerInstance(Animator, Animator.instance = new Animator());
  }

  /**
   * Configures the default animator.
   * @param animator The animator instance.
   */
  configureAnimator(animator: Animator): void {
    this._container.unregister(Animator);
    this._container.registerInstance(Animator, Animator.instance = animator);
  }

  compose(instruction: ComposeInstruction): Promise<View | Controller> {
    return this._compositionEngine.compose(instruction);
  }

  enhance(instruction: EnhanceInstruction): View {
    let instructions = {};
    this._viewCompiler.compileNode(instruction.element, instruction.resources, instructions, instruction.element.parentNode, 'root', true);
    let factory = new ViewFactory(instruction.element, instructions, instruction.resources);
    return factory.create(instruction.container, instruction.bindingContext, { enhance: true });
  }

  createControllerForUnitTest(viewModelType: Function, attributesFromHTML?: Object): Controller {
    let exportName = viewModelType.name;
    let resourceModule = this._moduleAnalyzer.analyze('test-module', { [exportName]: viewModelType }, exportName);
    let description = resourceModule.mainResource;

    description.initialize(this._container);

    let viewModel = this._container.get(viewModelType);
    return new Controller(description.metadata, viewModel, {attributes: attributesFromHTML || {}});
  }

  createModelForUnitTest(viewModelType: Function, attributesFromHTML?: Object, bindingContext?: any): Object {
    let controller = this.createControllerForUnitTest(viewModelType, attributesFromHTML);
    controller.bind(createScopeForTest(bindingContext));
    return controller.viewModel;
  }
}
