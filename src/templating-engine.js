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

/**
* Instructs the framework in how to enhance an existing DOM structure.
*/
interface EnhanceInstruction {
  /**
  * The DI container to use as the root for UI enhancement.
  */
  container?: Container;
  /**
  * The element to enhance.
  */
  element: Element;
  /**
  * The resources available for enhancement.
  */
  resources?: ViewResources;
  /**
  * A binding context for the enhancement.
  */
  bindingContext?: Object;
}

/**
* A facade of the templating engine capabilties which provides a more user friendly API for common use cases.
*/
@inject(Container, ModuleAnalyzer, ViewCompiler, CompositionEngine)
export class TemplatingEngine {
  /**
  * Creates an instance of TemplatingEngine.
  * @param container The root DI container.
  * @param moduleAnalyzer The module analyzer for discovering view resources.
  * @param viewCompiler The view compiler for compiling views.
  * @param compositionEngine The composition engine used during dynamic component composition.
  */
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

  /**
   * Dynamically composes components and views.
   * @param context The composition context to use.
   * @return A promise for the resulting Controller or View. Consumers of this API
   * are responsible for enforcing the Controller/View lifecycle.
   */
  compose(context: CompositionContext): Promise<View | Controller> {
    return this._compositionEngine.compose(context);
  }

  /**
   * Enhances existing DOM with behaviors and bindings.
   * @param instruction The element to enhance or a set of instructions for the enhancement process.
   * @return A View representing the enhanced UI. Consumers of this API
   * are responsible for enforcing the View lifecycle.
   */
  enhance(instruction: Element | EnhanceInstruction): View {
    if (instruction instanceof DOM.Element) {
      instruction = { element: instruction };
    }

    let compilerInstructions = {};
    let resources = instruction.resources || this._container.get(ViewResources);

    this._viewCompiler._compileNode(instruction.element, resources, compilerInstructions, instruction.element.parentNode, 'root', true);

    let factory = new ViewFactory(instruction.element, compilerInstructions, resources);
    let container = instruction.container || this._container.createChild();
    let view = factory.create(container, BehaviorInstruction.enhance());

    view.bind(instruction.bindingContext || {});

    return view;
  }

  /**
   * Creates a behavior's controller for use in unit testing.
   * @param viewModelType The constructor of the behavior view model to test.
   * @param attributesFromHTML A key/value lookup of attributes representing what would be in HTML (values can be literals or binding expressions).
   * @return The Controller of the behavior.
   */
  createControllerForUnitTest(viewModelType: Function, attributesFromHTML?: Object): Controller {
    let exportName = viewModelType.name;
    let resourceModule = this._moduleAnalyzer.analyze('test-module', { [exportName]: viewModelType }, exportName);
    let description = resourceModule.mainResource;

    description.initialize(this._container);

    let viewModel = this._container.get(viewModelType);
    let instruction = BehaviorInstruction.unitTest(description, attributesFromHTML);

    return new Controller(description.metadata, instruction, viewModel);
  }

  /**
   * Creates a behavior's view model for use in unit testing.
   * @param viewModelType The constructor of the behavior view model to test.
   * @param attributesFromHTML A key/value lookup of attributes representing what would be in HTML (values can be literals or binding expressions).
   * @param bindingContext
   * @return The view model instance.
   */
  createViewModelForUnitTest(viewModelType: Function, attributesFromHTML?: Object, bindingContext?: any): Object {
    let controller = this.createControllerForUnitTest(viewModelType, attributesFromHTML);
    controller.bind(createScopeForTest(bindingContext));
    return controller.viewModel;
  }
}
