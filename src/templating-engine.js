import {createScopeForTest} from 'aurelia-binding';
import {Container, inject} from 'aurelia-dependency-injection';
import {DOM} from 'aurelia-pal';
import {Controller} from './controller';
import {ModuleAnalyzer} from './module-analyzer';
import {Animator} from './animator';
import {ViewResources} from './view-resources';
import {CompositionEngine} from './composition-engine';
import {ViewFactory} from './view-factory';
import {ViewCompiler} from './view-compiler';
import {BehaviorInstruction} from './instructions';

interface EnhanceInstruction {
  container?: Container;
  element: Element;
  resources?: ViewResources;
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

  enhance(instruction: Element | EnhanceInstruction): View {
    if (instruction instanceof DOM.Element) {
      instruction = { element: instruction };
    }

    let compilerInstructions = {};
    let resources = instruction.resources || this._container.get(ViewResources);

    this._viewCompiler.compileNode(instruction.element, resources, compilerInstructions, instruction.element.parentNode, 'root', true);

    let factory = new ViewFactory(instruction.element, compilerInstructions, resources);
    let container = instruction.container || this._container.createChild();
    let view = factory.create(container, BehaviorInstruction.enhance());

    view.bind(instruction.bindingContext || {});

    return view;
  }

  createControllerForUnitTest(viewModelType: Function, attributesFromHTML?: Object): Controller {
    let exportName = viewModelType.name;
    let resourceModule = this._moduleAnalyzer.analyze('test-module', { [exportName]: viewModelType }, exportName);
    let description = resourceModule.mainResource;

    description.initialize(this._container);

    let viewModel = this._container.get(viewModelType);
    let instruction = BehaviorInstruction.unitTest(description, attributesFromHTML);

    return new Controller(description.metadata, instruction, viewModel);
  }

  createModelForUnitTest(viewModelType: Function, attributesFromHTML?: Object, bindingContext?: any): Object {
    let controller = this.createControllerForUnitTest(viewModelType, attributesFromHTML);
    controller.bind(createScopeForTest(bindingContext));
    return controller.viewModel;
  }
}
