import * as LogManager from 'aurelia-logging';
import {
  metadata,
  Origin,
  protocol
} from 'aurelia-metadata';
import {
  DOM,
  PLATFORM,
  FEATURE
} from 'aurelia-pal';
import {
  TemplateRegistryEntry,
  Loader
} from 'aurelia-loader';
import {
  relativeToFile
} from 'aurelia-path';
import {
  Scope,
  Expression,
  ValueConverterResource,
  BindingBehaviorResource,
  camelCase,
  Binding,
  createOverrideContext,
  subscriberCollection,
  bindingMode,
  ObserverLocator,
  EventManager
} from 'aurelia-binding';
import {
  Container,
  resolver,
  inject
} from 'aurelia-dependency-injection';
import {
  TaskQueue
} from 'aurelia-task-queue';
export declare interface EventHandler {
  eventName: string;
  bubbles: boolean;
  capture: boolean;
  dispose: Function;
  handler: Function;
}

/**
* Specifies how a view should be created.
*/
export declare interface ViewCreateInstruction {
  
  /**
    * Indicates that the view is being created by enhancing existing DOM.
    */
  enhance?: boolean;
  
  /**
    * Specifies a key/value lookup of part replacements for the view being created.
    */
  partReplacements?: Object;
}

/**
* Implemented by classes that describe how a view factory should be loaded.
*/
export declare interface ViewStrategy {
  
  /**
    * Loads a view factory.
    * @param viewEngine The view engine to use during the load process.
    * @param compileInstruction Additional instructions to use during compilation of the view.
    * @param loadContext The loading context used for loading all resources and dependencies.
    * @param target A class from which to extract metadata of additional resources to load.
    * @return A promise for the view factory that is produced by this strategy.
    */
  loadViewFactory(viewEngine: ViewEngine, compileInstruction: ViewCompileInstruction, loadContext?: ResourceLoadContext, target?: any): Promise<ViewFactory>;
}
export declare interface IStaticViewConfig {
  template: string | HTMLTemplateElement;
  dependencies?: Function[] | (() => Array<Function | Promise<Function | Record<string, Function>>>);
}
export declare interface LetExpression {
  createBinding(): LetBinding;
}
export declare interface LetBinding {
  
  /**
     * The expression to access/assign/connect the binding source property.
     */
  sourceExpression: Expression;
  
  /**
     * Assigns a value to the target.
     */
  updateTarget(value: any): void;
  
  /**
     * Connects the binding to a scope.
     */
  bind(source: Scope): void;
  
  /**
     * Disconnects the binding from a scope.
     */
  unbind(): void;
}

/**
* View engine hooks that enable a view resource to provide custom processing during the compilation or creation of a view.
*/
export declare interface ViewEngineHooks {
  
  /**
    * Invoked before a template is compiled.
    * @param content The DocumentFragment to compile.
    * @param resources The resources to compile the view against.
    * @param instruction The compilation instruction associated with the compilation process.
    */
  beforeCompile?: (content: DocumentFragment, resources: ViewResources, instruction: ViewCompileInstruction) => void;
  
  /**
    * Invoked after a template is compiled.
    * @param viewFactory The view factory that was produced from the compilation process.
    */
  afterCompile?: (viewFactory: ViewFactory) => void;
  
  /**
    * Invoked before a view is created.
    * @param viewFactory The view factory that will be used to create the view.
    * @param container The DI container used during view creation.
    * @param content The cloned document fragment representing the view.
    * @param instruction The view creation instruction associated with this creation process.
    */
  beforeCreate?: (viewFactory: ViewFactory, container: Container, content: DocumentFragment, instruction: ViewCreateInstruction) => void;
  
  /**
    * Invoked after a view is created.
    * @param view The view that was created by the factory.
    */
  afterCreate?: (view: View) => void;
  
  /**
    * Invoked after the bindingContext and overrideContext are configured on the view but before the view is bound.
    * @param view The view that was created by the factory.
    */
  beforeBind?: (view: View) => void;
  
  /**
    * Invoked before the view is unbind. The bindingContext and overrideContext are still available on the view.
    * @param view The view that was created by the factory.
    */
  beforeUnbind?: (view: View) => void;
}
export declare interface IBindablePropertyConfig {
  
  /**
    * The name of the property.
    */
  name?: string;
  attribute?: string;
  
  /**
     * The default binding mode of the property. If given string, will use to lookup
     */
  defaultBindingMode?: bindingMode | 'oneTime' | 'oneWay' | 'twoWay' | 'fromView' | 'toView';
  
  /**
     * The name of a view model method to invoke when the property is updated.
     */
  changeHandler?: string;
  
  /**
     * A default value for the property.
     */
  defaultValue?: any;
  
  /**
     * Designates the property as the default bindable property among all the other bindable properties when used in a custom attribute with multiple bindable properties.
     */
  primaryProperty?: boolean;
  
  // For compatibility and future extension
  [key: string]: any;
}
export declare interface IStaticResourceConfig {
  
  /**
     * Resource type of this class, omit equals to custom element
     */
  type?: 'element' | 'attribute' | 'valueConverter' | 'bindingBehavior' | 'viewEngineHooks';
  
  /**
     * Name of this resource. Reccommended to explicitly set to works better with minifier
     */
  name?: string;
  
  /**
     * Used to tell if a custom attribute is a template controller
     */
  templateController?: boolean;
  
  /**
     * Used to set default binding mode of default custom attribute view model "value" property
     */
  defaultBindingMode?: bindingMode | 'oneTime' | 'oneWay' | 'twoWay' | 'fromView' | 'toView';
  
  /**
     * Flags a custom attribute has dynamic options
     */
  hasDynamicOptions?: boolean;
  
  /**
     * Flag if this custom element uses native shadow dom instead of emulation
     */
  usesShadowDOM?: boolean;
  
  /**
     * Options that will be used if the element is flagged with usesShadowDOM
     */
  shadowDOMOptions?: ShadowRootInit;
  
  /**
     * Flag a custom element as containerless. Which will remove their render target
     */
  containerless?: boolean;
  
  /**
     * Custom processing of the attributes on an element before the framework inspects them.
     */
  processAttributes?: (viewCompiler: ViewCompiler, resources: ViewResources, node: Element, attributes: NamedNodeMap, elementInstruction: BehaviorInstruction) => void;
  
  /**
     * Enables custom processing of the content that is places inside the custom element by its consumer.
     * Pass a boolean to direct the template compiler to not process
     * the content placed inside this element. Alternatively, pass a function which
     * can provide custom processing of the content. This function should then return
     * a boolean indicating whether the compiler should also process the content.
     */
  processContent?: (viewCompiler: ViewCompiler, resources: ViewResources, node: Element, instruction: BehaviorInstruction) => boolean;
  
  /**
     * List of bindable properties of this custom element / custom attribute, by name or full config object
     */
  bindables?: string | IBindablePropertyConfig[];
}

/* eslint no-unused-vars: 0, no-constant-condition: 0 */
/**
* Represents a node in the view hierarchy.
*/
export declare interface ViewNode {
  
  /**
    * Binds the node and it's children.
    * @param bindingContext The binding context to bind to.
    * @param overrideContext A secondary binding context that can override the standard context.
    */
  bind(bindingContext: Object, overrideContext?: Object): void;
  
  /**
    * Triggers the attach for the node and its children.
    */
  attached(): void;
  
  /**
    * Triggers the detach for the node and its children.
    */
  detached(): void;
  
  /**
    * Unbinds the node and its children.
    */
  unbind(): void;
}

/**
* An optional interface describing the created convention.
*/
export declare interface ComponentCreated {
  
  /**
      * Implement this hook if you want to perform custom logic after the constructor has been called.
      * At this point in time, the view has also been created and both the view-model and the view
      * are connected to their controller. The hook will recieve the instance of the "owningView".
      * This is the view that the component is declared inside of. If the component itself has a view,
      * this will be passed second.
      */
  created(owningView: View, myView: View): void;
}

/**
* An optional interface describing the bind convention.
*/
/**
* An optional interface describing the bind convention.
*/
export declare interface ComponentBind {
  
  /**
      * Implement this hook if you want to perform custom logic when databinding is activated on the view and view-model.
      * The "binding context" to which the component is being bound will be passed first.
      * An "override context" will be passed second. The override context contains information used to traverse
      * the parent hierarchy and can also be used to add any contextual properties that the component wants to add.
      */
  bind(bindingContext: any, overrideContext: any): void;
}

/**
* An optional interface describing the attached convention.
*/
/**
* An optional interface describing the attached convention.
*/
export declare interface ComponentAttached {
  
  /**
      * Implement this hook if you want to perform custom logic when the component is attached to the DOM (in document).
      */
  attached(): void;
}

/**
* An optional interface describing the detached convention.
*/
/**
* An optional interface describing the detached convention.
*/
export declare interface ComponentDetached {
  
  /**
      * Implement this hook if you want to perform custom logic if/when the component is removed from the the DOM.
      */
  detached(): void;
}

/**
* An optional interface describing the unbind convention.
*/
/**
* An optional interface describing the unbind convention.
*/
export declare interface ComponentUnbind {
  
  /**
      * Implement this hook if you want to perform custom logic after the component is detached and unbound.
      */
  unbind(): void;
}

/**
* An optional interface describing the getViewStrategy convention for dynamic components (used with the compose element or the router).
*/
/**
* An optional interface describing the getViewStrategy convention for dynamic components (used with the compose element or the router).
*/
export declare interface DynamicComponentGetViewStrategy {
  
  /**
      * Implement this hook if you want to provide custom view strategy when this component is used with the compose element or the router.
      */
  getViewStrategy(): string | ViewStrategy;
}

/**
* Instructs the composition engine how to dynamically compose a component.
*/
export declare interface CompositionContext {
  
  /**
    * The parent Container for the component creation.
    */
  container: Container;
  
  /**
    * The child Container for the component creation. One will be created from the parent if not provided.
    */
  childContainer?: Container;
  
  /**
    * The context in which the view model is executed in.
    */
  bindingContext: any;
  
  /**
    * A secondary binding context that can override the standard context.
    */
  overrideContext?: any;
  
  /**
    * The view model url or instance for the component.
    */
  viewModel?: any;
  
  /**
    * Data to be passed to the "activate" hook on the view model.
    */
  model?: any;
  
  /**
    * The HtmlBehaviorResource for the component.
    */
  viewModelResource?: HtmlBehaviorResource;
  
  /**
    * The view resources for the view in which the component should be created.
    */
  viewResources: ViewResources;
  
  /**
    * The view inside which this composition is happening.
    */
  owningView?: View;
  
  /**
    * The view url or view strategy to override the default view location convention.
    */
  view?: string | ViewStrategy;
  
  /**
    * The slot to push the dynamically composed component into.
    */
  viewSlot: ViewSlot;
  
  /**
    * Should the composition system skip calling the "activate" hook on the view model.
    */
  skipActivation?: boolean;
  
  /**
    * The element that will parent the dynamic component.
    * It will be registered in the child container of this composition.
    */
  host?: Element;
}
export declare interface IStaticViewStrategyConfig {
  template: string | HTMLTemplateElement;
  dependencies?: Function[] | {};
}

/**
* Instructs the framework in how to enhance an existing DOM structure.
*/
export declare interface EnhanceInstruction {
  
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
* List the events that an Animator should raise.
*/
export declare const animationEvent: any;

/**
 * An abstract class representing a mechanism for animating the DOM during various DOM state transitions.
 */
export declare class Animator {
  
  /**
     * Execute an 'enter' animation on an element
     * @param element Element to animate
     * @returns Resolved when the animation is done
     */
  enter(element: HTMLElement): Promise<boolean>;
  
  /**
     * Execute a 'leave' animation on an element
     * @param element Element to animate
     * @returns Resolved when the animation is done
     */
  leave(element: HTMLElement): Promise<boolean>;
  
  /**
     * Add a class to an element to trigger an animation.
     * @param element Element to animate
     * @param className Properties to animate or name of the effect to use
     * @returns Resolved when the animation is done
     */
  removeClass(element: HTMLElement, className: string): Promise<boolean>;
  
  /**
     * Add a class to an element to trigger an animation.
     * @param element Element to animate
     * @param className Properties to animate or name of the effect to use
     * @returns Resolved when the animation is done
     */
  addClass(element: HTMLElement, className: string): Promise<boolean>;
  
  /**
     * Execute a single animation.
     * @param element Element to animate
     * @param className Properties to animate or name of the effect to use. For css animators this represents the className to be added and removed right after the animation is done.
     * @param options options for the animation (duration, easing, ...)
     * @returns Resolved when the animation is done
     */
  animate(element: HTMLElement | Array<HTMLElement>, className: string): Promise<boolean>;
  
  /**
     * Run a sequence of animations one after the other.
     * for example: animator.runSequence("fadeIn","callout")
     * @param sequence An array of effectNames or classNames
     * @returns Resolved when all animations are done
     */
  runSequence(animations: Array<any>): Promise<boolean>;
  
  /**
     * Register an effect (for JS based animators)
     * @param effectName identifier of the effect
     * @param properties Object with properties for the effect
     */
  registerEffect(effectName: string, properties: Object): void;
  
  /**
     * Unregister an effect (for JS based animators)
     * @param effectName identifier of the effect
     */
  unregisterEffect(effectName: string): void;
}

/**
* A mechanism by which an enlisted async render operation can notify the owning transaction when its work is done.
*/
export declare class CompositionTransactionNotifier {
  constructor(owner?: any);
  
  /**
    * Notifies the owning transaction that its work is done.
    */
  done(): void;
}

/**
* Referenced by the subsytem which wishes to control a composition transaction.
*/
export declare class CompositionTransactionOwnershipToken {
  constructor(owner?: any);
  
  /**
    * Allows the transaction owner to wait for the completion of all child compositions.
    * @return A promise that resolves when all child compositions are done.
    */
  waitForCompositionComplete(): Promise<void>;
  
  /**
    * Used internall to resolve the composition complete promise.
    */
  resolve(): void;
}

/**
* Enables an initiator of a view composition to track any internal async rendering processes for completion.
*/
export declare class CompositionTransaction {
  
  /**
    * Creates an instance of CompositionTransaction.
    */
  constructor();
  
  /**
    * Attempt to take ownership of the composition transaction.
    * @return An ownership token if successful, otherwise null.
    */
  tryCapture(): CompositionTransactionOwnershipToken;
  
  /**
    * Enlist an async render operation into the transaction.
    * @return A completion notifier.
    */
  enlist(): CompositionTransactionNotifier;
}
export declare class ViewEngineHooksResource {
  constructor();
  initialize(container?: any, target?: any): any;
  register(registry?: any, name?: any): any;
  load(container?: any, target?: any): any;
  static convention(name?: any): any;
}
export declare function viewEngineHooks(target?: any): any;

/**
 * Dispatches subscribets to and publishes events in the DOM.
 * @param element
 */
/**
 * Dispatches subscribets to and publishes events in the DOM.
 * @param element
 */
export declare class ElementEvents {
  constructor(element: EventTarget);
  
  /**
     * Dispatches an Event on the context element.
     * @param eventName
     * @param detail
     * @param bubbles
     * @param cancelable
     */
  publish(eventName: string, detail?: Object, bubbles?: boolean, cancelable?: boolean): any;
  
  /**
     * Adds and Event Listener on the context element.
     * @return Returns the eventHandler containing a dispose method
     */
  subscribe(eventName: string, handler: Function, captureOrOptions?: boolean): EventHandler;
  
  /**
     * Adds an Event Listener on the context element, that will be disposed on the first trigger.
     * @return Returns the eventHandler containing a dispose method
     */
  subscribeOnce(eventName: string, handler: Function, captureOrOptions?: boolean): EventHandler;
  
  /**
     * Removes all events that are listening to the specified eventName.
     * @param eventName
     */
  dispose(eventName: string): void;
  
  /**
     * Removes all event handlers.
     */
  disposeAll(): any;
}

/**
* A context that flows through the view resource load process.
*/
export declare class ResourceLoadContext {
  dependencies: Object;
  
  /**
    * Creates an instance of ResourceLoadContext.
    */
  constructor();
  
  /**
    * Tracks a dependency that is being loaded.
    * @param url The url of the dependency.
    */
  addDependency(url: string): void;
  
  /**
    * Checks if the current context includes a load of the specified url.
    * @return True if the url is being loaded in the context; false otherwise.
    */
  hasDependency(url: string): boolean;
}

/**
* Specifies how a view should be compiled.
*/
export declare class ViewCompileInstruction {
  targetShadowDOM: boolean;
  compileSurrogate: boolean;
  associatedModuleId: any;
  
  /**
    * The normal configuration for view compilation.
    */
  static normal: ViewCompileInstruction;
  
  /**
    * Creates an instance of ViewCompileInstruction.
    * @param targetShadowDOM Should the compilation target the Shadow DOM.
    * @param compileSurrogate Should the compilation also include surrogate bindings and behaviors.
    */
  constructor(targetShadowDOM?: boolean, compileSurrogate?: boolean);
}

/**
* Indicates how a custom attribute or element should be instantiated in a view.
*/
/**
* Indicates how a custom attribute or element should be instantiated in a view.
*/
export declare class BehaviorInstruction {
  initiatedByBehavior: boolean;
  enhance: boolean;
  partReplacements: any;
  viewFactory: ViewFactory;
  originalAttrName: string;
  skipContentProcessing: boolean;
  contentFactory: any;
  viewModel: Object;
  anchorIsContainer: boolean;
  host: Element;
  attributes: Object;
  type: HtmlBehaviorResource;
  attrName: string;
  inheritBindingContext: boolean;
  
  /**
    * A default behavior used in scenarios where explicit configuration isn't available.
    */
  static normal: BehaviorInstruction;
  
  /**
    * Creates an instruction for element enhancement.
    * @return The created instruction.
    */
  static enhance(): BehaviorInstruction;
  
  /**
    * Creates an instruction for unit testing.
    * @param type The HtmlBehaviorResource to create.
    * @param attributes A key/value lookup of attributes for the behaior.
    * @return The created instruction.
    */
  static unitTest(type: HtmlBehaviorResource, attributes: Object): BehaviorInstruction;
  
  /**
    * Creates a custom element instruction.
    * @param node The node that represents the custom element.
    * @param type The HtmlBehaviorResource to create.
    * @return The created instruction.
    */
  static element(node: Node, type: HtmlBehaviorResource): BehaviorInstruction;
  
  /**
    * Creates a custom attribute instruction.
    * @param attrName The name of the attribute.
    * @param type The HtmlBehaviorResource to create.
    * @return The created instruction.
    */
  static attribute(attrName: string, type?: HtmlBehaviorResource): BehaviorInstruction;
  
  /**
    * Creates a dynamic component instruction.
    * @param host The element that will parent the dynamic component.
    * @param viewModel The dynamic component's view model instance.
    * @param viewFactory A view factory used in generating the component's view.
    * @return The created instruction.
    */
  static dynamic(host: Element, viewModel: Object, viewFactory: ViewFactory): BehaviorInstruction;
}

/**
* Provides all the instructions for how a target element should be enhanced inside of a view.
*/
export declare class TargetInstruction {
  injectorId: number;
  parentInjectorId: number;
  shadowSlot: boolean;
  slotName: string;
  slotFallbackFactory: any;
  
  /**
     * Indicates if this instruction is targeting a text node
     */
  contentExpression: any;
  
  /**
     * Indicates if this instruction is a let element instruction
     */
  letElement: boolean;
  expressions: Array<Object>;
  behaviorInstructions: Array<BehaviorInstruction>;
  providers: Array<Function>;
  viewFactory: ViewFactory;
  anchorIsContainer: boolean;
  elementInstruction: BehaviorInstruction;
  lifting: boolean;
  values: Object;
  
  /**
    * An empty array used to represent a target with no binding expressions.
    */
  static noExpressions: any;
  
  /**
    * Creates an instruction that represents a shadow dom slot.
    * @param parentInjectorId The id of the parent dependency injection container.
    * @return The created instruction.
    */
  static shadowSlot(parentInjectorId: number): TargetInstruction;
  
  /**
    * Creates an instruction that represents a binding expression in the content of an element.
    * @param expression The binding expression.
    * @return The created instruction.
    */
  static contentExpression(expression?: any): TargetInstruction;
  
  /**
    * Creates an instruction that represents an element with behaviors and bindings.
    * @param injectorId The id of the dependency injection container.
    * @param parentInjectorId The id of the parent dependency injection container.
    * @param providers The types which will provide behavior for this element.
    * @param behaviorInstructions The instructions for creating behaviors on this element.
    * @param expressions Bindings, listeners, triggers, etc.
    * @param elementInstruction The element behavior for this element.
    * @return The created instruction.
    */
  static letElement(expressions: Array<Object>): TargetInstruction;
  
  /**
    * Creates an instruction that represents content that was lifted out of the DOM and into a ViewFactory.
    * @param parentInjectorId The id of the parent dependency injection container.
    * @param liftingInstruction The behavior instruction of the lifting behavior.
    * @return The created instruction.
    */
  static lifting(parentInjectorId: number, liftingInstruction: BehaviorInstruction): TargetInstruction;
  
  /**
    * Creates an instruction that represents an element with behaviors and bindings.
    * @param injectorId The id of the dependency injection container.
    * @param parentInjectorId The id of the parent dependency injection container.
    * @param providers The types which will provide behavior for this element.
    * @param behaviorInstructions The instructions for creating behaviors on this element.
    * @param expressions Bindings, listeners, triggers, etc.
    * @param elementInstruction The element behavior for this element.
    * @return The created instruction.
    */
  static normal(injectorId: number, parentInjectorId: number, providers: Array<Function>, behaviorInstructions: Array<BehaviorInstruction>, expressions: Array<Object>, elementInstruction: BehaviorInstruction): TargetInstruction;
  
  /**
    * Creates an instruction that represents the surrogate behaviors and bindings for an element.
    * @param providers The types which will provide behavior for this element.
    * @param behaviorInstructions The instructions for creating behaviors on this element.
    * @param expressions Bindings, listeners, triggers, etc.
    * @param values A key/value lookup of attributes to transplant.
    * @return The created instruction.
    */
  static surrogate(providers: Array<Function>, behaviorInstructions: Array<BehaviorInstruction>, expressions: Array<Object>, values: Object): TargetInstruction;
}

/**
* Decorator: Indicates that the decorated class/object is a view strategy.
*/
/**
* Decorator: Indicates that the decorated class/object is a view strategy.
*/
export declare const viewStrategy: Function;

/**
* A view strategy that loads a view relative to its associated view-model.
*/
export declare class RelativeViewStrategy {
  
  /**
    * Creates an instance of RelativeViewStrategy.
    * @param path The relative path to the view.
    */
  constructor(path: string);
  
  /**
    * Loads a view factory.
    * @param viewEngine The view engine to use during the load process.
    * @param compileInstruction Additional instructions to use during compilation of the view.
    * @param loadContext The loading context used for loading all resources and dependencies.
    * @param target A class from which to extract metadata of additional resources to load.
    * @return A promise for the view factory that is produced by this strategy.
    */
  loadViewFactory(viewEngine: ViewEngine, compileInstruction: ViewCompileInstruction, loadContext?: ResourceLoadContext, target?: any): Promise<ViewFactory>;
  
  /**
    * Makes the view loaded by this strategy relative to the provided file path.
    * @param file The path to load the view relative to.
    */
  makeRelativeTo(file: string): void;
}

/**
* A view strategy based on naming conventions.
*/
export declare class ConventionalViewStrategy {
  
  /**
    * Creates an instance of ConventionalViewStrategy.
    * @param viewLocator The view locator service for conventionally locating the view.
    * @param origin The origin of the view model to conventionally load the view for.
    */
  constructor(viewLocator: ViewLocator, origin: Origin);
  
  /**
    * Loads a view factory.
    * @param viewEngine The view engine to use during the load process.
    * @param compileInstruction Additional instructions to use during compilation of the view.
    * @param loadContext The loading context used for loading all resources and dependencies.
    * @param target A class from which to extract metadata of additional resources to load.
    * @return A promise for the view factory that is produced by this strategy.
    */
  loadViewFactory(viewEngine: ViewEngine, compileInstruction: ViewCompileInstruction, loadContext?: ResourceLoadContext, target?: any): Promise<ViewFactory>;
}

/**
* A view strategy that indicates that the component has no view that the templating engine needs to manage.
* Typically used when the component author wishes to take over fine-grained rendering control.
*/
export declare class NoViewStrategy {
  
  /**
    * Creates an instance of NoViewStrategy.
    * @param dependencies A list of view resource dependencies of this view.
    * @param dependencyBaseUrl The base url for the view dependencies.
    */
  constructor(dependencies?: Array<string | Function | Object>, dependencyBaseUrl?: string);
  
  /**
    * Loads a view factory.
    * @param viewEngine The view engine to use during the load process.
    * @param compileInstruction Additional instructions to use during compilation of the view.
    * @param loadContext The loading context used for loading all resources and dependencies.
    * @param target A class from which to extract metadata of additional resources to load.
    * @return A promise for the view factory that is produced by this strategy.
    */
  loadViewFactory(viewEngine: ViewEngine, compileInstruction: ViewCompileInstruction, loadContext?: ResourceLoadContext, target?: any): Promise<ViewFactory>;
}

/**
* A view strategy created directly from the template registry entry.
*/
export declare class TemplateRegistryViewStrategy {
  
  /**
    * Creates an instance of TemplateRegistryViewStrategy.
    * @param moduleId The associated moduleId of the view to be loaded.
    * @param entry The template registry entry used in loading the view factory.
    */
  constructor(moduleId: string, entry: TemplateRegistryEntry);
  
  /**
    * Loads a view factory.
    * @param viewEngine The view engine to use during the load process.
    * @param compileInstruction Additional instructions to use during compilation of the view.
    * @param loadContext The loading context used for loading all resources and dependencies.
    * @param target A class from which to extract metadata of additional resources to load.
    * @return A promise for the view factory that is produced by this strategy.
    */
  loadViewFactory(viewEngine: ViewEngine, compileInstruction: ViewCompileInstruction, loadContext?: ResourceLoadContext, target?: any): Promise<ViewFactory>;
}

/**
* A view strategy that allows the component author to inline the html for the view.
*/
export declare class InlineViewStrategy {
  
  /**
    * Creates an instance of InlineViewStrategy.
    * @param markup The markup for the view. Be sure to include the wrapping template tag.
    * @param dependencies A list of view resource dependencies of this view.
    * @param dependencyBaseUrl The base url for the view dependencies.
    */
  constructor(markup: string, dependencies?: Array<string | Function | Object>, dependencyBaseUrl?: string);
  
  /**
    * Loads a view factory.
    * @param viewEngine The view engine to use during the load process.
    * @param compileInstruction Additional instructions to use during compilation of the view.
    * @param loadContext The loading context used for loading all resources and dependencies.
    * @param target A class from which to extract metadata of additional resources to load.
    * @return A promise for the view factory that is produced by this strategy.
    */
  loadViewFactory(viewEngine: ViewEngine, compileInstruction: ViewCompileInstruction, loadContext?: ResourceLoadContext, target?: any): Promise<ViewFactory>;
}
export declare class StaticViewStrategy {
  
  /**@internal */
  template: string | HTMLTemplateElement;
  
  /**@internal */
  dependencies: Function[] | (() => Array<Function | Promise<Function | Record<string, Function>>>);
  factoryIsReady: boolean;
  factory: ViewFactory;
  constructor(config: string | HTMLTemplateElement | IStaticViewConfig);
  
  /**
    * Loads a view factory.
    * @param viewEngine The view engine to use during the load process.
    * @param compileInstruction Additional instructions to use during compilation of the view.
    * @param loadContext The loading context used for loading all resources and dependencies.
    * @param target A class from which to extract metadata of additional resources to load.
    * @return A promise for the view factory that is produced by this strategy.
    */
  loadViewFactory(viewEngine: ViewEngine, compileInstruction: ViewCompileInstruction, loadContext: ResourceLoadContext, target: any): Promise<ViewFactory>;
}

/**
* Locates a view for an object.
*/
export declare class ViewLocator {
  
  /**
    * The metadata key for storing/finding view strategies associated with an class/object.
    */
  static viewStrategyMetadataKey: any;
  
  /**
    * Gets the view strategy for the value.
    * @param value The value to locate the view strategy for.
    * @return The located ViewStrategy instance.
    */
  getViewStrategy(value: any): ViewStrategy;
  
  /**
    * Creates a fallback View Strategy. Used when unable to locate a configured strategy.
    * The default implementation returns and instance of ConventionalViewStrategy.
    * @param origin The origin of the view model to return the strategy for.
    * @return The fallback ViewStrategy.
    */
  createFallbackViewStrategy(origin: Origin): ViewStrategy;
  
  /**
    * Conventionally converts a view model origin to a view url.
    * Used by the ConventionalViewStrategy.
    * @param origin The origin of the view model to convert.
    * @return The view url.
    */
  convertOriginToViewUrl(origin: Origin): string;
}

/**
* An abstract base class for implementations of a binding language.
*/
/**
* An abstract base class for implementations of a binding language.
*/
export declare class BindingLanguage {
  
  /**
    * Inspects an attribute for bindings.
    * @param resources The ViewResources for the view being compiled.
    * @param elementName The element name to inspect.
    * @param attrName The attribute name to inspect.
    * @param attrValue The attribute value to inspect.
    * @return An info object with the results of the inspection.
    */
  inspectAttribute(resources: ViewResources, elementName: string, attrName: string, attrValue: string): Object;
  
  /**
    * Creates an attribute behavior instruction.
    * @param resources The ViewResources for the view being compiled.
    * @param element The element that the attribute is defined on.
    * @param info The info object previously returned from inspectAttribute.
    * @param existingInstruction A previously created instruction for this attribute.
    * @return The instruction instance.
    */
  createAttributeInstruction(resources: ViewResources, element: Element, info: Object, existingInstruction?: Object): BehaviorInstruction;
  
  /**
     * Creates let expressions from a <let/> element
     * @param resources The ViewResources for the view being compiled
     * @param element the let element in the view template
     * @param existingExpressions the array that will hold compiled let expressions from the let element
     * @return the expression array created from the <let/> element
     */
  createLetExpressions(resources: ViewResources, element: Element): LetExpression[];
  
  /**
    * Parses the text for bindings.
    * @param resources The ViewResources for the view being compiled.
    * @param value The value of the text to parse.
    * @return A binding expression.
    */
  inspectTextContent(resources: ViewResources, value: string): Object;
}
export declare class SlotCustomAttribute {
  static inject(): any;
  constructor(element?: any);
  valueChanged(newValue?: any, oldValue?: any): any;
}
export declare class PassThroughSlot {
  constructor(anchor?: any, name?: any, destinationName?: any, fallbackFactory?: any);
  needsFallbackRendering: any;
  renderFallbackContent(view?: any, nodes?: any, projectionSource?: any, index?: any): any;
  passThroughTo(destinationSlot?: any): any;
  addNode(view?: any, node?: any, projectionSource?: any, index?: any): any;
  removeView(view?: any, projectionSource?: any): any;
  removeAll(projectionSource?: any): any;
  projectFrom(view?: any, projectionSource?: any): any;
  created(ownerView?: any): any;
  bind(view?: any): any;
  attached(): any;
  detached(): any;
  unbind(): any;
}
export declare class ShadowSlot {
  constructor(anchor?: any, name?: any, fallbackFactory?: any);
  needsFallbackRendering: any;
  addNode(view?: any, node?: any, projectionSource?: any, index?: any, destination?: any): any;
  removeView(view?: any, projectionSource?: any): any;
  removeAll(projectionSource?: any): any;
  projectTo(slots?: any): any;
  projectFrom(view?: any, projectionSource?: any): any;
  renderFallbackContent(view?: any, nodes?: any, projectionSource?: any, index?: any): any;
  created(ownerView?: any): any;
  bind(view?: any): any;
  attached(): any;
  detached(): any;
  unbind(): any;
}
export declare class ShadowDOM {
  static defaultSlotKey: any;
  static getSlotName(node?: any): any;
  static distributeView(view?: any, slots?: any, projectionSource?: any, index?: any, destinationOverride?: any): any;
  static undistributeView(view?: any, slots?: any, projectionSource?: any): any;
  static undistributeAll(slots?: any, projectionSource?: any): any;
  static distributeNodes(view?: any, nodes?: any, slots?: any, projectionSource?: any, index?: any, destinationOverride?: any): any;
}
export declare function validateBehaviorName(name: string, type: string): any;

/**
 * Represents a collection of resources used during the compilation of a view.
 * Will optinally add information to an existing HtmlBehaviorResource if given
 */
export declare class ViewResources {
  
  /**
     * Checks whether the provided class contains any resource conventions
     * @param target Target class to extract metadata based on convention
     * @param existing If supplied, all custom element / attribute metadata extracted from convention will be apply to this instance
     */
  static convention(target: Function, existing?: HtmlBehaviorResource): HtmlBehaviorResource | ValueConverterResource | BindingBehaviorResource | ViewEngineHooksResource;
  
  /**
    * A custom binding language used in the view.
    */
  bindingLanguage: any;
  
  /**
    * Creates an instance of ViewResources.
    * @param parent The parent resources. This resources can override them, but if a resource is not found, it will be looked up in the parent.
    * @param viewUrl The url of the view to which these resources apply.
    */
  constructor(parent?: ViewResources, viewUrl?: string);
  
  /**
    * Registers view engine hooks for the view.
    * @param hooks The hooks to register.
    */
  registerViewEngineHooks(hooks: ViewEngineHooks): void;
  
  /**
    * Gets the binding language associated with these resources, or return the provided fallback implementation.
    * @param bindingLanguageFallback The fallback binding language implementation to use if no binding language is configured locally.
    * @return The binding language.
    */
  getBindingLanguage(bindingLanguageFallback: BindingLanguage): BindingLanguage;
  
  /**
    * Patches an immediate parent into the view resource resolution hierarchy.
    * @param newParent The new parent resources to patch in.
    */
  patchInParent(newParent: ViewResources): void;
  
  /**
    * Maps a path relative to the associated view's origin.
    * @param path The relative path.
    * @return The calcualted path.
    */
  relativeToView(path: string): string;
  
  /**
    * Registers an HTML element.
    * @param tagName The name of the custom element.
    * @param behavior The behavior of the element.
    */
  registerElement(tagName: string, behavior: HtmlBehaviorResource): void;
  
  /**
    * Gets an HTML element behavior.
    * @param tagName The tag name to search for.
    * @return The HtmlBehaviorResource for the tag name or null.
    */
  getElement(tagName: string): HtmlBehaviorResource;
  
  /**
    * Gets the known attribute name based on the local attribute name.
    * @param attribute The local attribute name to lookup.
    * @return The known name.
    */
  mapAttribute(attribute: string): string;
  
  /**
    * Registers an HTML attribute.
    * @param attribute The name of the attribute.
    * @param behavior The behavior of the attribute.
    * @param knownAttribute The well-known name of the attribute (in lieu of the local name).
    */
  registerAttribute(attribute: string, behavior: HtmlBehaviorResource, knownAttribute: string): void;
  
  /**
    * Gets an HTML attribute behavior.
    * @param attribute The name of the attribute to lookup.
    * @return The HtmlBehaviorResource for the attribute or null.
    */
  getAttribute(attribute: string): HtmlBehaviorResource;
  
  /**
    * Registers a value converter.
    * @param name The name of the value converter.
    * @param valueConverter The value converter instance.
    */
  registerValueConverter(name: string, valueConverter: Object): void;
  
  /**
    * Gets a value converter.
    * @param name The name of the value converter.
    * @return The value converter instance.
    */
  getValueConverter(name: string): Object;
  
  /**
    * Registers a binding behavior.
    * @param name The name of the binding behavior.
    * @param bindingBehavior The binding behavior instance.
    */
  registerBindingBehavior(name: string, bindingBehavior: Object): void;
  
  /**
    * Gets a binding behavior.
    * @param name The name of the binding behavior.
    * @return The binding behavior instance.
    */
  getBindingBehavior(name: string): Object;
  
  /**
    * Registers a value.
    * @param name The name of the value.
    * @param value The value.
    */
  registerValue(name: string, value: any): void;
  
  /**
    * Gets a value.
    * @param name The name of the value.
    * @return The value.
    */
  getValue(name: string): any;
  
  /**
     * @internal
     * Not supported for public use. Can be changed without warning.
     *
     * Auto register a resources based on its metadata or convention
     * Will fallback to custom element if no metadata found and all conventions fail
     * @param {Container} container
     * @param {Function} impl
     * @returns {HtmlBehaviorResource | ValueConverterResource | BindingBehaviorResource | ViewEngineHooksResource}
     */
  autoRegister(container?: any, impl?: any): any;
}
export declare class View {
  
  /**
    * The Dependency Injection Container that was used to create this View instance.
    */
  container: Container;
  
  /**
    * The ViewFactory that built this View instance.
    */
  viewFactory: ViewFactory;
  
  /**
    * Contains the DOM Nodes which represent this View. If the view was created via the "enhance" API, this will be an Element, otherwise it will be a DocumentFragment. If not created via "enhance" then the fragment will only contain nodes when the View is detached from the DOM.
    */
  fragment: DocumentFragment | Element;
  
  /**
    * The primary binding context that this view is data-bound to.
    */
  bindingContext: Object;
  
  /**
    * The override context which contains properties capable of overriding those found on the binding context.
    */
  overrideContext: Object;
  
  /**
    * The Controller instance that owns this View.
    */
  controller: Controller;
  
  /**
    * Creates a View instance.
    * @param container The container from which the view was created.
    * @param viewFactory The factory that created this view.
    * @param fragment The DOM fragement representing the view.
    * @param controllers The controllers inside this view.
    * @param bindings The bindings inside this view.
    * @param children The children of this view.
    */
  constructor(container: Container, viewFactory: ViewFactory, fragment: DocumentFragment, controllers: Controller[], bindings: Binding[], children: ViewNode[], slots: Object);
  
  /**
    * Returns this view to the appropriate view cache.
    */
  returnToCache(): void;
  
  /**
    * Triggers the created callback for this view and its children.
    */
  created(): void;
  
  /**
    * Binds the view and it's children.
    * @param bindingContext The binding context to bind to.
    * @param overrideContext A secondary binding context that can override the standard context.
    */
  bind(bindingContext: Object, overrideContext?: Object, _systemUpdate?: boolean): void;
  
  /**
    * Adds a binding instance to this view.
    * @param binding The binding instance.
    */
  addBinding(binding: Object): void;
  
  /**
    * Unbinds the view and its children.
    */
  unbind(): void;
  
  /**
    * Inserts this view's nodes before the specified DOM node.
    * @param refNode The node to insert this view's nodes before.
    */
  insertNodesBefore(refNode: Node): void;
  
  /**
    * Appends this view's to the specified DOM node.
    * @param parent The parent element to append this view's nodes to.
    */
  appendNodesTo(parent: Element): void;
  
  /**
    * Removes this view's nodes from the DOM.
    */
  removeNodes(): void;
  
  /**
    * Triggers the attach for the view and its children.
    */
  attached(): void;
  
  /**
    * Triggers the detach for the view and its children.
    */
  detached(): void;
}

/**
* Represents a slot or location within the DOM to which views can be added and removed.
* Manages the view lifecycle for its children.
*/
export declare class ViewSlot {
  
  /**
    * Creates an instance of ViewSlot.
    * @param anchor The DOM node which will server as the anchor or container for insertion.
    * @param anchorIsContainer Indicates whether the node is a container.
    * @param animator The animator that will controll enter/leave transitions for this slot.
    */
  constructor(anchor: Node, anchorIsContainer: boolean, animator?: Animator);
  
  /**
     *   Runs the animator against the first animatable element found within the view's fragment
     *   @param  view       The view to use when searching for the element.
     *   @param  direction  The animation direction enter|leave.
     *   @returns An animation complete Promise or undefined if no animation was run.
     */
  animateView(view: View, direction?: string): void | Promise<any>;
  
  /**
    * Takes the child nodes of an existing element that has been converted into a ViewSlot
    * and makes those nodes into a View within the slot.
    */
  transformChildNodesIntoView(): void;
  
  /**
    * Binds the slot and it's children.
    * @param bindingContext The binding context to bind to.
    * @param overrideContext A secondary binding context that can override the standard context.
    */
  bind(bindingContext: Object, overrideContext: Object): void;
  
  /**
    * Unbinds the slot and its children.
    */
  unbind(): void;
  
  /**
    * Adds a view to the slot.
    * @param view The view to add.
    * @return May return a promise if the view addition triggered an animation.
    */
  add(view: View): void | Promise<any>;
  
  /**
    * Inserts a view into the slot.
    * @param index The index to insert the view at.
    * @param view The view to insert.
    * @return May return a promise if the view insertion triggered an animation.
    */
  insert(index: number, view: View): void | Promise<any>;
  
  /**
     * Moves a view across the slot.
     * @param sourceIndex The index the view is currently at.
     * @param targetIndex The index to insert the view at.
     */
  move(sourceIndex?: any, targetIndex?: any): any;
  
  /**
    * Removes a view from the slot.
    * @param view The view to remove.
    * @param returnToCache Should the view be returned to the view cache?
    * @param skipAnimation Should the removal animation be skipped?
    * @return May return a promise if the view removal triggered an animation.
    */
  remove(view: View, returnToCache?: boolean, skipAnimation?: boolean): View | Promise<View>;
  
  /**
    * Removes many views from the slot.
    * @param viewsToRemove The array of views to remove.
    * @param returnToCache Should the views be returned to the view cache?
    * @param skipAnimation Should the removal animation be skipped?
    * @return May return a promise if the view removal triggered an animation.
    */
  removeMany(viewsToRemove: View[], returnToCache?: boolean, skipAnimation?: boolean): void | Promise<void>;
  
  /**
    * Removes a view an a specified index from the slot.
    * @param index The index to remove the view at.
    * @param returnToCache Should the view be returned to the view cache?
    * @param skipAnimation Should the removal animation be skipped?
    * @return May return a promise if the view removal triggered an animation.
    */
  removeAt(index: number, returnToCache?: boolean, skipAnimation?: boolean): View | Promise<View>;
  
  /**
    * Removes all views from the slot.
    * @param returnToCache Should the view be returned to the view cache?
    * @param skipAnimation Should the removal animation be skipped?
    * @return May return a promise if the view removals triggered an animation.
    */
  removeAll(returnToCache?: boolean, skipAnimation?: boolean): void | Promise<any>;
  
  /**
    * Triggers the attach for the slot and its children.
    */
  attached(): void;
  
  /**
    * Triggers the detach for the slot and its children.
    */
  detached(): void;
  projectTo(slots: Object): void;
}

/**
* A factory capable of creating View instances, bound to a location within another view hierarchy.
*/
export declare class BoundViewFactory {
  
  /**
    * Creates an instance of BoundViewFactory.
    * @param parentContainer The parent DI container.
    * @param viewFactory The internal unbound factory.
    * @param partReplacements Part replacement overrides for the internal factory.
    */
  constructor(parentContainer: Container, viewFactory: ViewFactory, partReplacements?: Object);
  
  /**
    * Creates a view or returns one from the internal cache, if available.
    * @return The created view.
    */
  create(): View;
  
  /**
    * Indicates whether this factory is currently using caching.
    */
  isCaching: any;
  
  /**
    * Sets the cache size for this factory.
    * @param size The number of views to cache or "*" to cache all.
    * @param doNotOverrideIfAlreadySet Indicates that setting the cache should not override the setting if previously set.
    */
  setCacheSize(size: number | string, doNotOverrideIfAlreadySet: boolean): void;
  
  /**
    * Gets a cached view if available...
    * @return A cached view or null if one isn't available.
    */
  getCachedView(): View;
  
  /**
    * Returns a view to the cache.
    * @param view The view to return to the cache if space is available.
    */
  returnViewToCache(view: View): void;
}

/**
* A factory capable of creating View instances.
*/
export declare class ViewFactory {
  
  /**
    * Indicates whether this factory is currently using caching.
    */
  isCaching: any;
  
  /**
    * Creates an instance of ViewFactory.
    * @param template The document fragment that serves as a template for the view to be created.
    * @param instructions The instructions to be applied ot the template during the creation of a view.
    * @param resources The resources used to compile this factory.
    */
  constructor(template: DocumentFragment, instructions: Object, resources: ViewResources);
  
  /**
    * Sets the cache size for this factory.
    * @param size The number of views to cache or "*" to cache all.
    * @param doNotOverrideIfAlreadySet Indicates that setting the cache should not override the setting if previously set.
    */
  setCacheSize(size: number | string, doNotOverrideIfAlreadySet: boolean): void;
  
  /**
    * Gets a cached view if available...
    * @return A cached view or null if one isn't available.
    */
  getCachedView(): View;
  
  /**
    * Returns a view to the cache.
    * @param view The view to return to the cache if space is available.
    */
  returnViewToCache(view: View): void;
  
  /**
    * Creates a view or returns one from the internal cache, if available.
    * @param container The container to create the view from.
    * @param createInstruction The instruction used to customize view creation.
    * @param element The custom element that hosts the view.
    * @return The created view.
    */
  create(container: Container, createInstruction?: ViewCreateInstruction, element?: Element): View;
}

/**
* Compiles html templates, dom fragments and strings into ViewFactory instances, capable of instantiating Views.
*/
export declare class ViewCompiler {
  
  /**
    * Creates an instance of ViewCompiler.
    * @param bindingLanguage The default data binding language and syntax used during view compilation.
    * @param resources The global resources used during compilation when none are provided for compilation.
    */
  constructor(bindingLanguage: BindingLanguage, resources: ViewResources);
  
  /**
    * Compiles an html template, dom fragment or string into ViewFactory instances, capable of instantiating Views.
    * @param source The template, fragment or string to compile.
    * @param resources The view resources used during compilation.
    * @param compileInstruction A set of instructions that customize how compilation occurs.
    * @return The compiled ViewFactory.
    */
  compile(source: Element | DocumentFragment | string, resources?: ViewResources, compileInstruction?: ViewCompileInstruction): ViewFactory;
}

/**
* Represents a module with view resources.
*/
export declare class ResourceModule {
  
  /**
    * Creates an instance of ResourceModule.
    * @param moduleId The id of the module that contains view resources.
    */
  constructor(moduleId: string);
  
  /**
    * Initializes the resources within the module.
    * @param container The dependency injection container usable during resource initialization.
    */
  initialize(container: Container): void;
  
  /**
    * Registers the resources in the module with the view resources.
    * @param registry The registry of view resources to regiser within.
    * @param name The name to use in registering the default resource.
    */
  register(registry: ViewResources, name?: string): void;
  
  /**
    * Loads any dependencies of the resources within this module.
    * @param container The DI container to use during dependency resolution.
    * @param loadContext The loading context used for loading all resources and dependencies.
    * @return A promise that resolves when all loading is complete.
    */
  load(container: Container, loadContext?: ResourceLoadContext): Promise<void>;
}

/**
* Represents a single view resource with a ResourceModule.
*/
export declare class ResourceDescription {
  
  /**
    * Creates an instance of ResourceDescription.
    * @param key The key that the resource was exported as.
    * @param exportedValue The exported resource.
    * @param resourceTypeMeta The metadata located on the resource.
    */
  constructor(key: string, exportedValue: any, resourceTypeMeta?: Object);
  
  /**
    * Initializes the resource.
    * @param container The dependency injection container usable during resource initialization.
    */
  initialize(container: Container): void;
  
  /**
    * Registrers the resource with the view resources.
    * @param registry The registry of view resources to regiser within.
    * @param name The name to use in registering the resource.
    */
  register(registry: ViewResources, name?: string): void;
  
  /**
    * Loads any dependencies of the resource.
    * @param container The DI container to use during dependency resolution.
    * @param loadContext The loading context used for loading all resources and dependencies.
    * @return A promise that resolves when all loading is complete.
    */
  load(container: Container, loadContext?: ResourceLoadContext): Promise<void> | void;
}

/**
* Analyzes a module in order to discover the view resources that it exports.
*/
export declare class ModuleAnalyzer {
  
  /**
    * Creates an instance of ModuleAnalyzer.
    */
  constructor();
  
  /**
    * Retrieves the ResourceModule analysis for a previously analyzed module.
    * @param moduleId The id of the module to lookup.
    * @return The ResouceModule if found, undefined otherwise.
    */
  getAnalysis(moduleId: string): ResourceModule;
  
  /**
    * Analyzes a module.
    * @param moduleId The id of the module to analyze.
    * @param moduleInstance The module instance to analyze.
    * @param mainResourceKey The name of the main resource.
    * @return The ResouceModule representing the analysis.
    */
  analyze(moduleId: string, moduleInstance: any, mainResourceKey?: string): ResourceModule;
}

/**
* Controls the view resource loading pipeline.
*/
export declare class ViewEngine {
  
  /**
    * The metadata key for storing requires declared in a ViewModel.
    */
  static viewModelRequireMetadataKey: any;
  
  /**
    * Creates an instance of ViewEngine.
    * @param loader The module loader.
    * @param container The root DI container for the app.
    * @param viewCompiler The view compiler.
    * @param moduleAnalyzer The module analyzer.
    * @param appResources The app-level global resources.
    */
  constructor(loader: Loader, container: Container, viewCompiler: ViewCompiler, moduleAnalyzer: ModuleAnalyzer, appResources: ViewResources);
  
  /**
    * Adds a resource plugin to the resource loading pipeline.
    * @param extension The file extension to match in require elements.
    * @param implementation The plugin implementation that handles the resource type.
    */
  addResourcePlugin(extension: string, implementation: Object): void;
  
  /**
    * Loads and compiles a ViewFactory from a url or template registry entry.
    * @param urlOrRegistryEntry A url or template registry entry to generate the view factory for.
    * @param compileInstruction Instructions detailing how the factory should be compiled.
    * @param loadContext The load context if this factory load is happening within the context of a larger load operation.
    * @param target A class from which to extract metadata of additional resources to load.
    * @return A promise for the compiled view factory.
    */
  loadViewFactory(urlOrRegistryEntry: string | TemplateRegistryEntry, compileInstruction?: ViewCompileInstruction, loadContext?: ResourceLoadContext, target?: any): Promise<ViewFactory>;
  
  /**
    * Loads all the resources specified by the registry entry.
    * @param registryEntry The template registry entry to load the resources for.
    * @param compileInstruction The compile instruction associated with the load.
    * @param loadContext The load context if this is happening within the context of a larger load operation.
    * @param target A class from which to extract metadata of additional resources to load.
    * @return A promise of ViewResources for the registry entry.
    */
  loadTemplateResources(registryEntry: TemplateRegistryEntry, compileInstruction?: ViewCompileInstruction, loadContext?: ResourceLoadContext, target?: any): Promise<ViewResources>;
  
  /**
    * Loads a view model as a resource.
    * @param moduleImport The module to import.
    * @param moduleMember The export from the module to generate the resource for.
    * @return A promise for the ResourceDescription.
    */
  importViewModelResource(moduleImport: string, moduleMember: string): Promise<ResourceDescription>;
  
  /**
    * Imports the specified resources with the specified names into the view resources object.
    * @param moduleIds The modules to load.
    * @param names The names associated with resource modules to import.
    * @param resources The resources lookup to add the loaded resources to.
    * @param compileInstruction The compilation instruction associated with the resource imports.
    * @return A promise for the ViewResources.
    */
  importViewResources(moduleIds: string[], names: string[], resources: ViewResources, compileInstruction?: ViewCompileInstruction, loadContext?: ResourceLoadContext): Promise<ViewResources>;
}

/**
* Controls a view model (and optionally its view), according to a particular behavior and by following a set of instructions.
*/
export declare class Controller {
  
  /**
    * The HtmlBehaviorResource that provides the base behavior for this controller.
    */
  behavior: HtmlBehaviorResource;
  
  /**
    * The developer's view model instance which provides the custom behavior for this controller.
    */
  viewModel: Object;
  
  /**
    * The view associated with the component being controlled by this controller.
    * Note: Not all components will have a view, so the value may be null.
    */
  view: View;
  
  /**
    * Creates an instance of Controller.
    * @param behavior The HtmlBehaviorResource that provides the base behavior for this controller.
    * @param instruction The instructions pertaining to the controller's behavior.
    * @param viewModel The developer's view model instance which provides the custom behavior for this controller.
    * @param container The container that the controller's view was created from.
    */
  constructor(behavior: HtmlBehaviorResource, instruction: BehaviorInstruction, viewModel: Object, container: Container);
  
  /**
    * Invoked when the view which contains this controller is created.
    * @param owningView The view inside which this controller resides.
    */
  created(owningView: View): void;
  
  /**
    * Used to automate the proper binding of this controller and its view. Used by the composition engine for dynamic component creation.
    * This should be considered a semi-private API and is subject to change without notice, even across minor or patch releases.
    * @param overrideContext An override context for binding.
    * @param owningView The view inside which this controller resides.
    */
  automate(overrideContext?: Object, owningView?: View): void;
  
  /**
    * Binds the controller to the scope.
    * @param scope The binding scope.
    */
  bind(scope: Object): void;
  
  /**
    * Unbinds the controller.
    */
  unbind(): void;
  
  /**
    * Attaches the controller.
    */
  attached(): void;
  
  /**
    * Detaches the controller.
    */
  detached(): void;
}

/**
* An implementation of Aurelia's Observer interface that is used to back bindable properties defined on a behavior.
*/
export declare class BehaviorPropertyObserver {
  
  /**
    * Creates an instance of BehaviorPropertyObserver.
    * @param taskQueue The task queue used to schedule change notifications.
    * @param obj The object that the property is defined on.
    * @param propertyName The name of the property.
    * @param selfSubscriber The callback function that notifies the object which defines the properties, if present.
    * @param initialValue The initial value of the property.
    */
  constructor(taskQueue: TaskQueue, obj: Object, propertyName: string, selfSubscriber: Function, initialValue: any);
  
  /**
    * Gets the property's value.
    */
  getValue(): any;
  
  /**
    * Sets the property's value.
    * @param newValue The new value to set.
    */
  setValue(newValue: any): void;
  
  /**
    * Invoked by the TaskQueue to publish changes to subscribers.
    */
  call(): void;
  
  /**
    * Subscribes to the observerable.
    * @param context A context object to pass along to the subscriber when it's called.
    * @param callable A function or object with a "call" method to be invoked for delivery of changes.
    */
  subscribe(context: any, callable: Function): void;
  
  /**
    * Unsubscribes from the observerable.
    * @param context The context object originally subscribed with.
    * @param callable The callable that was originally subscribed with.
    */
  unsubscribe(context: any, callable: Function): void;
}

/**
* Represents a bindable property on a behavior.
*/
export declare class BindableProperty {
  
  /**
    * Creates an instance of BindableProperty.
    * @param nameOrConfig The name of the property or a cofiguration object.
    */
  constructor(nameOrConfig: string | Object);
  
  /**
    * Registers this bindable property with particular Class and Behavior instance.
    * @param target The class to register this behavior with.
    * @param behavior The behavior instance to register this property with.
    * @param descriptor The property descriptor for this property.
    */
  registerWith(target: Function, behavior: HtmlBehaviorResource, descriptor?: Object): void;
  
  /**
    * Defines this property on the specified class and behavior.
    * @param target The class to define the property on.
    * @param behavior The behavior to define the property on.
    */
  defineOn(target: Function, behavior: HtmlBehaviorResource): void;
  
  /**
    * Creates an observer for this property.
    * @param viewModel The view model instance on which to create the observer.
    * @return The property observer.
    */
  createObserver(viewModel: Object): BehaviorPropertyObserver;
}

/**
* Identifies a class as a resource that implements custom element or custom
* attribute functionality.
*/
export declare class HtmlBehaviorResource {
  
  /**
    * Creates an instance of HtmlBehaviorResource.
    */
  constructor();
  
  /**
    * Checks whether the provided name matches any naming conventions for HtmlBehaviorResource.
    * @param name The name of the potential resource.
    * @param existing An already existing resource that may need a convention name applied.
    */
  static convention(name: string, existing?: HtmlBehaviorResource): HtmlBehaviorResource;
  
  /**
    * Adds a binding expression to the component created by this resource.
    * @param behavior The binding expression.
    */
  addChildBinding(behavior: Object): void;
  
  /**
    * Provides an opportunity for the resource to initialize iteself.
    * @param container The dependency injection container from which the resource
    * can aquire needed services.
    * @param target The class to which this resource metadata is attached.
    */
  initialize(container: Container, target: Function): void;
  
  /**
    * Allows the resource to be registered in the view resources for the particular
    * view into which it was required.
    * @param registry The view resource registry for the view that required this resource.
    * @param name The name provided by the end user for this resource, within the
    * particular view it's being used.
    */
  register(registry: ViewResources, name?: string): void;
  
  /**
    * Enables the resource to asynchronously load additional resources.
    * @param container The dependency injection container from which the resource
    * can aquire needed services.
    * @param target The class to which this resource metadata is attached.
    * @param loadContext The loading context object provided by the view engine.
    * @param viewStrategy A view strategy to overload the default strategy defined by the resource.
    * @param transientView Indicated whether the view strategy is transient or
    * permanently tied to this component.
    */
  load(container: Container, target: Function, loadContext?: ResourceLoadContext, viewStrategy?: ViewStrategy, transientView?: boolean): Promise<HtmlBehaviorResource>;
  
  /**
    * Plugs into the compiler and enables custom processing of the node on which this behavior is located.
    * @param compiler The compiler that is currently compiling the view that this behavior exists within.
    * @param resources The resources for the view that this behavior exists within.
    * @param node The node on which this behavior exists.
    * @param instruction The behavior instruction created for this behavior.
    * @param parentNode The parent node of the current node.
    * @return The current node.
    */
  compile(compiler: ViewCompiler, resources: ViewResources, node: Node, instruction: BehaviorInstruction, parentNode?: Node): Node;
  
  /**
    * Creates an instance of this behavior.
    * @param container The DI container to create the instance in.
    * @param instruction The instruction for this behavior that was constructed during compilation.
    * @param element The element on which this behavior exists.
    * @param bindings The bindings that are associated with the view in which this behavior exists.
    * @return The Controller of this behavior.
    */
  create(container: Container, instruction?: BehaviorInstruction, element?: Element, bindings?: Binding[]): Controller;
}

/**
* Creates a behavior property that references an array of immediate content child elements that matches the provided selector.
*/
export declare function children(selectorOrConfig: string | Object): any;

/**
* Creates a behavior property that references an immediate content child element that matches the provided selector.
*/
export declare function child(selectorOrConfig: string | Object): any;
export declare const SwapStrategies: any;

/**
* Used to dynamically compose components.
*/
export declare class CompositionEngine {
  
  /**
    * Creates an instance of the CompositionEngine.
    * @param viewEngine The ViewEngine used during composition.
    */
  constructor(viewEngine: ViewEngine, viewLocator: ViewLocator);
  
  /**
    * Creates a controller instance for the component described in the context.
    * @param context The CompositionContext that describes the component.
    * @return A Promise for the Controller.
    */
  createController(context: CompositionContext): Promise<Controller>;
  
  /**
    * Ensures that the view model and its resource are loaded for this context.
    * @param context The CompositionContext to load the view model and its resource for.
    * @return A Promise for the context.
    */
  ensureViewModel(context: CompositionContext): Promise<CompositionContext>;
  
  /**
    * Dynamically composes a component.
    * @param context The CompositionContext providing information on how the composition should occur.
    * @return A Promise for the View or the Controller that results from the dynamic composition.
    */
  compose(context: CompositionContext): Promise<View | Controller>;
}

/**
* Identifies a class as a resource that configures the EventManager with information
* about how events relate to properties for the purpose of two-way data-binding
* to Web Components.
*/
export declare class ElementConfigResource {
  
  /**
    * Provides an opportunity for the resource to initialize iteself.
    * @param container The dependency injection container from which the resource
    * can aquire needed services.
    * @param target The class to which this resource metadata is attached.
    */
  initialize(container: Container, target: Function): void;
  
  /**
    * Allows the resource to be registered in the view resources for the particular
    * view into which it was required.
    * @param registry The view resource registry for the view that required this resource.
    * @param name The name provided by the end user for this resource, within the
    * particular view it's being used.
    */
  register(registry: ViewResources, name?: string): void;
  
  /**
    * Enables the resource to asynchronously load additional resources.
    * @param container The dependency injection container from which the resource
    * can aquire needed services.
    * @param target The class to which this resource metadata is attached.
    */
  load(container: Container, target: Function): void;
}

/**
* Decorator: Specifies a resource instance that describes the decorated class.
* @param instanceOrConfig The resource instance.
*/
export declare function resource(instanceOrConfig: string | object): any;

/**
* Decorator: Specifies a custom HtmlBehaviorResource instance or an object that overrides various implementation details of the default HtmlBehaviorResource.
* @param override The customized HtmlBehaviorResource or an object to override the default with.
*/
export declare function behavior(override: HtmlBehaviorResource | Object): any;

/**
* Decorator: Indicates that the decorated class is a custom element.
* @param name The name of the custom element.
*/
export declare function customElement(name: string): any;

/**
* Decorator: Indicates that the decorated class is a custom attribute.
* @param name The name of the custom attribute.
* @param defaultBindingMode The default binding mode to use when the attribute is bound with .bind.
* @param aliases The array of aliases to associate to the custom attribute.
*/
export declare function customAttribute(name: string, defaultBindingMode?: number, aliases?: string[]): any;

/**
* Decorator: Applied to custom attributes. Indicates that whatever element the
* attribute is placed on should be converted into a template and that this
* attribute controls the instantiation of the template.
*/
export declare function templateController(target?: any): any;

/**
* Decorator: Specifies that a property is bindable through HTML.
* @param nameOrConfigOrTarget The name of the property, or a configuration object.
*/
export declare function bindable(nameOrConfigOrTarget?: string | Object, key?: any, descriptor?: any): any;

/**
* Decorator: Specifies that the decorated custom attribute has options that
* are dynamic, based on their presence in HTML and not statically known.
*/
export declare function dynamicOptions(target?: any): any;

/**
* Decorator: Indicates that the custom element should render its view in Shadow
* DOM. This decorator may change slightly when Aurelia updates to Shadow DOM v1.
*/
export declare function useShadowDOM(targetOrOptions?: any): any;

/**
* Decorator: Enables custom processing of the attributes on an element before the framework inspects them.
* @param processor Pass a function which can provide custom processing of the content.
*/
export declare function processAttributes(processor: Function): any;

/**
* Decorator: Enables custom processing of the content that is places inside the
* custom element by its consumer.
* @param processor Pass a boolean to direct the template compiler to not process
* the content placed inside this element. Alternatively, pass a function which
* can provide custom processing of the content. This function should then return
* a boolean indicating whether the compiler should also process the content.
*/
export declare function processContent(processor: boolean | Function): any;

/**
* Decorator: Indicates that the custom element should be rendered without its
* element container.
*/
export declare function containerless(target?: any): any;

/**
* Decorator: Associates a custom view strategy with the component.
* @param strategy The view strategy instance.
*/
export declare function useViewStrategy(strategy: Object): any;

/**
* Decorator: Provides a relative path to a view for the component.
* @param path The path to the view.
*/
export declare function useView(path: string): any;

/**
* Decorator: Provides a view template, directly inline, for the component. Be
* sure to wrap the markup in a template element.
* @param markup The markup for the view.
* @param dependencies A list of dependencies that the template has.
* @param dependencyBaseUrl A base url from which the dependencies will be loaded.
*/
export declare function inlineView(markup: string, dependencies?: Array<string | Function | Object>, dependencyBaseUrl?: string): any;

/**
* Decorator: Indicates that the component has no view.
*/
export declare function noView(targetOrDependencies?: Function | Array<any>, dependencyBaseUrl?: string): any;

/**
 * Decorator: Indicates that the element use static view
 */
/**
 * Decorator: Indicates that the element use static view
 */
export declare function view(templateOrConfig: string | HTMLTemplateElement | IStaticViewStrategyConfig): any;

/**
* Decorator: Indicates that the decorated class provides element configuration
* to the EventManager for one or more Web Components.
*/
export declare function elementConfig(target?: any): any;

/**
* Decorator: Provides the ability to add resources to the related View
* Same as: <require from="..."></require>
* @param resources Either: strings with moduleIds, Objects with 'src' and optionally 'as' properties or one of the classes of the module to be included.
*/
export declare function viewResources(...resources: any[]): any;

/**
* A facade of the templating engine capabilties which provides a more user friendly API for common use cases.
*/

/**
* A facade of the templating engine capabilties which provides a more user friendly API for common use cases.
*/
export declare class TemplatingEngine {
  
  /**
    * Creates an instance of TemplatingEngine.
    * @param container The root DI container.
    * @param moduleAnalyzer The module analyzer for discovering view resources.
    * @param viewCompiler The view compiler for compiling views.
    * @param compositionEngine The composition engine used during dynamic component composition.
    */
  constructor(container: Container, moduleAnalyzer: ModuleAnalyzer, viewCompiler: ViewCompiler, compositionEngine: CompositionEngine);
  
  /**
     * Configures the default animator.
     * @param animator The animator instance.
     */
  configureAnimator(animator: Animator): void;
  
  /**
     * Dynamically composes components and views.
     * @param context The composition context to use.
     * @return A promise for the resulting Controller or View. Consumers of this API
     * are responsible for enforcing the Controller/View lifecycle.
     */
  compose(context: CompositionContext): Promise<View | Controller>;
  
  /**
     * Enhances existing DOM with behaviors and bindings.
     * @param instruction The element to enhance or a set of instructions for the enhancement process.
     * @return A View representing the enhanced UI. Consumers of this API
     * are responsible for enforcing the View lifecycle.
     */
  enhance(instruction: Element | EnhanceInstruction): View;
}