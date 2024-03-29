import { Container } from 'aurelia-dependency-injection';
import { DOM } from 'aurelia-pal';
import { Animator } from './animator';
import { CompositionContext, CompositionEngine } from './composition-engine';
import { Controller } from './controller';
import { BehaviorInstruction } from './instructions';
import { ModuleAnalyzer } from './module-analyzer';
import { View } from './view';
import { ViewCompiler } from './view-compiler';
import { ViewFactory } from './view-factory';
import { ViewResources } from './view-resources';

/**
* Instructs the framework in how to enhance an existing DOM structure.
*/
export interface EnhanceInstruction {
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
  /**
  * A secondary binding context that can override the standard context.
  */
  overrideContext?: any;
}

/**
* A facade of the templating engine capabilties which provides a more user friendly API for common use cases.
*/
export class TemplatingEngine {

  /** @internal */
  static inject = [Container, ModuleAnalyzer, ViewCompiler, CompositionEngine];

  /** @internal */
  private _container: Container;
  /** @internal */
  private _moduleAnalyzer: ModuleAnalyzer;
  /** @internal */
  private _viewCompiler: ViewCompiler;
  /** @internal */
  private _compositionEngine: CompositionEngine;

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

    let compilerInstructions = { letExpressions: [] };
    let resources = instruction.resources || this._container.get(ViewResources);

    this._viewCompiler._compileNode(instruction.element, resources, compilerInstructions, instruction.element.parentNode, 'root', true);

    // todo(typings): view factory should accept Element beside Document fragment
    let factory = new ViewFactory(instruction.element as unknown as DocumentFragment, compilerInstructions, resources);
    let container = instruction.container || this._container.createChild();
    let view = factory.create(container, BehaviorInstruction.enhance());

    view.bind(instruction.bindingContext || {}, instruction.overrideContext);

    view.firstChild = view.lastChild = view.fragment as ChildNode;
    view.fragment = DOM.createDocumentFragment();
    view.attached();

    return view;
  }
}
