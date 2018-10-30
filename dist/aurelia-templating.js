import * as LogManager from 'aurelia-logging';
import {metadata,Origin,protocol} from 'aurelia-metadata';
import {DOM,PLATFORM,FEATURE} from 'aurelia-pal';
import {TemplateRegistryEntry,Loader} from 'aurelia-loader';
import {relativeToFile} from 'aurelia-path';
import {Scope,Expression,ValueConverterResource,BindingBehaviorResource,camelCase,Binding,createOverrideContext,subscriberCollection,bindingMode,ObserverLocator,EventManager} from 'aurelia-binding';
import {Container,resolver,inject} from 'aurelia-dependency-injection';
import {TaskQueue} from 'aurelia-task-queue';

/**
* List the events that an Animator should raise.
*/
export const animationEvent = {
  enterBegin: 'animation:enter:begin',
  enterActive: 'animation:enter:active',
  enterDone: 'animation:enter:done',
  enterTimeout: 'animation:enter:timeout',

  leaveBegin: 'animation:leave:begin',
  leaveActive: 'animation:leave:active',
  leaveDone: 'animation:leave:done',
  leaveTimeout: 'animation:leave:timeout',

  staggerNext: 'animation:stagger:next',

  removeClassBegin: 'animation:remove-class:begin',
  removeClassActive: 'animation:remove-class:active',
  removeClassDone: 'animation:remove-class:done',
  removeClassTimeout: 'animation:remove-class:timeout',

  addClassBegin: 'animation:add-class:begin',
  addClassActive: 'animation:add-class:active',
  addClassDone: 'animation:add-class:done',
  addClassTimeout: 'animation:add-class:timeout',

  animateBegin: 'animation:animate:begin',
  animateActive: 'animation:animate:active',
  animateDone: 'animation:animate:done',
  animateTimeout: 'animation:animate:timeout',

  sequenceBegin: 'animation:sequence:begin',
  sequenceDone: 'animation:sequence:done'
};

/**
 * An abstract class representing a mechanism for animating the DOM during various DOM state transitions.
 */
export class Animator {
  /**
   * Execute an 'enter' animation on an element
   * @param element Element to animate
   * @returns Resolved when the animation is done
   */
  enter(element: HTMLElement): Promise<boolean> {
    return Promise.resolve(false);
  }

  /**
   * Execute a 'leave' animation on an element
   * @param element Element to animate
   * @returns Resolved when the animation is done
   */
  leave(element: HTMLElement): Promise<boolean> {
    return Promise.resolve(false);
  }

  /**
   * Add a class to an element to trigger an animation.
   * @param element Element to animate
   * @param className Properties to animate or name of the effect to use
   * @returns Resolved when the animation is done
   */
  removeClass(element: HTMLElement, className: string): Promise<boolean> {
    element.classList.remove(className);
    return Promise.resolve(false);
  }

  /**
   * Add a class to an element to trigger an animation.
   * @param element Element to animate
   * @param className Properties to animate or name of the effect to use
   * @returns Resolved when the animation is done
   */
  addClass(element: HTMLElement, className: string): Promise<boolean> {
    element.classList.add(className);
    return Promise.resolve(false);
  }

  /**
   * Execute a single animation.
   * @param element Element to animate
   * @param className Properties to animate or name of the effect to use. For css animators this represents the className to be added and removed right after the animation is done.
   * @param options options for the animation (duration, easing, ...)
   * @returns Resolved when the animation is done
   */
  animate(element: HTMLElement | Array<HTMLElement>, className: string): Promise<boolean> {
    return Promise.resolve(false);
  }

  /**
   * Run a sequence of animations one after the other.
   * for example: animator.runSequence("fadeIn","callout")
   * @param sequence An array of effectNames or classNames
   * @returns Resolved when all animations are done
   */
  runSequence(animations:Array<any>): Promise<boolean> {}

  /**
   * Register an effect (for JS based animators)
   * @param effectName identifier of the effect
   * @param properties Object with properties for the effect
   */
  registerEffect(effectName: string, properties: Object): void {}

  /**
   * Unregister an effect (for JS based animators)
   * @param effectName identifier of the effect
   */
  unregisterEffect(effectName: string): void {}
}

/**
* A mechanism by which an enlisted async render operation can notify the owning transaction when its work is done.
*/
export class CompositionTransactionNotifier {
  constructor(owner) {
    this.owner = owner;
    this.owner._compositionCount++;
  }

  /**
  * Notifies the owning transaction that its work is done.
  */
  done(): void {
    this.owner._compositionCount--;
    this.owner._tryCompleteTransaction();
  }
}

/**
* Referenced by the subsytem which wishes to control a composition transaction.
*/
export class CompositionTransactionOwnershipToken {
  constructor(owner) {
    this.owner = owner;
    this.owner._ownershipToken = this;
    this.thenable = this._createThenable();
  }

  /**
  * Allows the transaction owner to wait for the completion of all child compositions.
  * @return A promise that resolves when all child compositions are done.
  */
  waitForCompositionComplete(): Promise<void> {
    this.owner._tryCompleteTransaction();
    return this.thenable;
  }

  /**
  * Used internall to resolve the composition complete promise.
  */
  resolve(): void {
    this._resolveCallback();
  }

  _createThenable() {
    return new Promise((resolve, reject) => {
      this._resolveCallback = resolve;
    });
  }
}

/**
* Enables an initiator of a view composition to track any internal async rendering processes for completion.
*/
export class CompositionTransaction {
  /**
  * Creates an instance of CompositionTransaction.
  */
  constructor() {
    this._ownershipToken = null;
    this._compositionCount = 0;
  }

  /**
  * Attempt to take ownership of the composition transaction.
  * @return An ownership token if successful, otherwise null.
  */
  tryCapture(): CompositionTransactionOwnershipToken {
    return this._ownershipToken === null
      ? new CompositionTransactionOwnershipToken(this)
      : null;
  }

  /**
  * Enlist an async render operation into the transaction.
  * @return A completion notifier.
  */
  enlist(): CompositionTransactionNotifier {
    return new CompositionTransactionNotifier(this);
  }

  _tryCompleteTransaction() {
    if (this._compositionCount <= 0) {
      this._compositionCount = 0;

      if (this._ownershipToken !== null) {
        let token = this._ownershipToken;
        this._ownershipToken = null;
        token.resolve();
      }
    }
  }
}

const capitalMatcher = /([A-Z])/g;

function addHyphenAndLower(char) {
  return '-' + char.toLowerCase();
}

export function _hyphenate(name) {
  return (name.charAt(0).toLowerCase() + name.slice(1)).replace(capitalMatcher, addHyphenAndLower);
}

//https://developer.mozilla.org/en-US/docs/Web/API/Document_Object_Model/Whitespace_in_the_DOM
//We need to ignore whitespace so we don't mess up fallback rendering
//However, we cannot ignore empty text nodes that container interpolations.
export function _isAllWhitespace(node) {
  // Use ECMA-262 Edition 3 String and RegExp features
  return !(node.auInterpolationTarget || (/[^\t\n\r ]/.test(node.textContent)));
}

export class ViewEngineHooksResource {
  constructor() {}

  initialize(container, target) {
    this.instance = container.get(target);
  }

  register(registry, name) {
    registry.registerViewEngineHooks(this.instance);
  }

  load(container, target) {}

  static convention(name) { // eslint-disable-line
    if (name.endsWith('ViewEngineHooks')) {
      return new ViewEngineHooksResource();
    }
  }
}

export function viewEngineHooks(target) { // eslint-disable-line
  let deco = function(t) {
    metadata.define(metadata.resource, new ViewEngineHooksResource(), t);
  };

  return target ? deco(target) : deco;
}

interface EventHandler {
  eventName: string;
  bubbles: boolean;
  capture: boolean;
  dispose: Function;
  handler: Function;
}

/**
 * Dispatches subscribets to and publishes events in the DOM.
 * @param element
 */
export class ElementEvents {
  constructor(element: EventTarget) {
    this.element = element;
    this.subscriptions = {};
  }

  _enqueueHandler(handler: EventHandler): void {
    this.subscriptions[handler.eventName] = this.subscriptions[handler.eventName] || [];
    this.subscriptions[handler.eventName].push(handler);
  }

  _dequeueHandler(handler: EventHandler): EventHandler {
    let index;
    let subscriptions = this.subscriptions[handler.eventName];
    if (subscriptions) {
      index = subscriptions.indexOf(handler);
      if (index > -1) {
        subscriptions.splice(index, 1);
      }
    }
    return handler;
  }

  /**
   * Dispatches an Event on the context element.
   * @param eventName
   * @param detail
   * @param bubbles
   * @param cancelable
   */
  publish(eventName: string, detail?: Object = {}, bubbles?: boolean = true, cancelable?: boolean = true) {
    let event = DOM.createCustomEvent(eventName, {cancelable, bubbles, detail});
    this.element.dispatchEvent(event);
  }

  /**
   * Adds and Event Listener on the context element.
   * @return Returns the eventHandler containing a dispose method
   */
  subscribe(eventName: string, handler: Function, captureOrOptions?: boolean = true): EventHandler {
    if (typeof handler === 'function') {
      const eventHandler = new EventHandlerImpl(this, eventName, handler, captureOrOptions, false);
      return eventHandler;
    }

    return undefined;
  }

  /**
   * Adds an Event Listener on the context element, that will be disposed on the first trigger.
   * @return Returns the eventHandler containing a dispose method
   */
  subscribeOnce(eventName: string, handler: Function, captureOrOptions?: boolean = true): EventHandler {
    if (typeof handler === 'function') {
      const eventHandler = new EventHandlerImpl(this, eventName, handler, captureOrOptions, true);
      return eventHandler;
    }

    return undefined;
  }

  /**
   * Removes all events that are listening to the specified eventName.
   * @param eventName
   */
  dispose(eventName: string): void {
    if (eventName && typeof eventName === 'string') {
      let subscriptions = this.subscriptions[eventName];
      if (subscriptions) {
        while (subscriptions.length) {
          let subscription = subscriptions.pop();
          if (subscription) {
            subscription.dispose();
          }
        }
      }
    } else {
      this.disposeAll();
    }
  }

  /**
   * Removes all event handlers.
   */
  disposeAll() {
    for (let key in this.subscriptions) {
      this.dispose(key);
    }
  }
}

class EventHandlerImpl {
  constructor(owner: ElementEvents, eventName: string, handler: Function, captureOrOptions: boolean, once: boolean) {
    this.owner = owner;
    this.eventName = eventName;
    this.handler = handler;
    // For compat with interface
    this.capture = typeof captureOrOptions === 'boolean' ? captureOrOptions : captureOrOptions.capture;
    this.bubbles = !this.capture;
    this.captureOrOptions = captureOrOptions;
    this.once = once;
    owner.element.addEventListener(eventName, this, captureOrOptions);
    owner._enqueueHandler(this);
  }

  handleEvent(e) {
    // To keep `undefined` as context, same as the old way
    const fn = this.handler;
    fn(e);
    if (this.once) {
      this.dispose();
    }
  }

  dispose() {
    this.owner.element.removeEventListener(this.eventName, this, this.captureOrOptions);
    this.owner._dequeueHandler(this);
    this.owner = this.handler = null;
  }
}

/**
* A context that flows through the view resource load process.
*/
export class ResourceLoadContext {
  dependencies: Object;

  /**
  * Creates an instance of ResourceLoadContext.
  */
  constructor() {
    this.dependencies = {};
  }

  /**
  * Tracks a dependency that is being loaded.
  * @param url The url of the dependency.
  */
  addDependency(url: string): void {
    this.dependencies[url] = true;
  }

  /**
  * Checks if the current context includes a load of the specified url.
  * @return True if the url is being loaded in the context; false otherwise.
  */
  hasDependency(url: string): boolean {
    return url in this.dependencies;
  }
}

/**
* Specifies how a view should be compiled.
*/
export class ViewCompileInstruction {
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
  constructor(targetShadowDOM?: boolean = false, compileSurrogate?: boolean = false) {
    this.targetShadowDOM = targetShadowDOM;
    this.compileSurrogate = compileSurrogate;
    this.associatedModuleId = null;
  }
}

ViewCompileInstruction.normal = new ViewCompileInstruction();

/**
* Specifies how a view should be created.
*/
interface ViewCreateInstruction {
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
* Indicates how a custom attribute or element should be instantiated in a view.
*/
export class BehaviorInstruction {

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
  static enhance(): BehaviorInstruction {
    let instruction = new BehaviorInstruction();
    instruction.enhance = true;
    return instruction;
  }

  /**
  * Creates an instruction for unit testing.
  * @param type The HtmlBehaviorResource to create.
  * @param attributes A key/value lookup of attributes for the behaior.
  * @return The created instruction.
  */
  static unitTest(type: HtmlBehaviorResource, attributes: Object): BehaviorInstruction {
    let instruction = new BehaviorInstruction();
    instruction.type = type;
    instruction.attributes = attributes || {};
    return instruction;
  }

  /**
  * Creates a custom element instruction.
  * @param node The node that represents the custom element.
  * @param type The HtmlBehaviorResource to create.
  * @return The created instruction.
  */
  static element(node: Node, type: HtmlBehaviorResource): BehaviorInstruction {
    let instruction = new BehaviorInstruction();
    instruction.type = type;
    instruction.attributes = {};
    instruction.anchorIsContainer = !(node.hasAttribute('containerless') || type.containerless);
    instruction.initiatedByBehavior = true;
    return instruction;
  }

  /**
  * Creates a custom attribute instruction.
  * @param attrName The name of the attribute.
  * @param type The HtmlBehaviorResource to create.
  * @return The created instruction.
  */
  static attribute(attrName: string, type?: HtmlBehaviorResource): BehaviorInstruction {
    let instruction = new BehaviorInstruction();
    instruction.attrName = attrName;
    instruction.type = type || null;
    instruction.attributes = {};
    return instruction;
  }

  /**
  * Creates a dynamic component instruction.
  * @param host The element that will parent the dynamic component.
  * @param viewModel The dynamic component's view model instance.
  * @param viewFactory A view factory used in generating the component's view.
  * @return The created instruction.
  */
  static dynamic(host: Element, viewModel: Object, viewFactory: ViewFactory): BehaviorInstruction {
    let instruction = new BehaviorInstruction();
    instruction.host = host;
    instruction.viewModel = viewModel;
    instruction.viewFactory = viewFactory;
    instruction.inheritBindingContext = true;
    return instruction;
  }
}

const biProto = BehaviorInstruction.prototype;
biProto.initiatedByBehavior = false;
biProto.enhance = false;
biProto.partReplacements = null;
biProto.viewFactory = null;
biProto.originalAttrName = null;
biProto.skipContentProcessing = false;
biProto.contentFactory = null;
biProto.viewModel = null;
biProto.anchorIsContainer = false;
biProto.host = null;
biProto.attributes = null;
biProto.type = null;
biProto.attrName = null;
biProto.inheritBindingContext = false;

BehaviorInstruction.normal = new BehaviorInstruction();

/**
* Provides all the instructions for how a target element should be enhanced inside of a view.
*/
export class TargetInstruction {

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
  static noExpressions = Object.freeze([]);

  /**
  * Creates an instruction that represents a shadow dom slot.
  * @param parentInjectorId The id of the parent dependency injection container.
  * @return The created instruction.
  */
  static shadowSlot(parentInjectorId: number): TargetInstruction {
    let instruction = new TargetInstruction();
    instruction.parentInjectorId = parentInjectorId;
    instruction.shadowSlot = true;
    return instruction;
  }

  /**
  * Creates an instruction that represents a binding expression in the content of an element.
  * @param expression The binding expression.
  * @return The created instruction.
  */
  static contentExpression(expression): TargetInstruction {
    let instruction = new TargetInstruction();
    instruction.contentExpression = expression;
    return instruction;
  }

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
  static letElement(expressions: Array<Object>): TargetInstruction {
    let instruction = new TargetInstruction();
    instruction.expressions = expressions;
    instruction.letElement = true;
    return instruction;
  }

  /**
  * Creates an instruction that represents content that was lifted out of the DOM and into a ViewFactory.
  * @param parentInjectorId The id of the parent dependency injection container.
  * @param liftingInstruction The behavior instruction of the lifting behavior.
  * @return The created instruction.
  */
  static lifting(parentInjectorId: number, liftingInstruction: BehaviorInstruction): TargetInstruction {
    let instruction = new TargetInstruction();
    instruction.parentInjectorId = parentInjectorId;
    instruction.expressions = TargetInstruction.noExpressions;
    instruction.behaviorInstructions = [liftingInstruction];
    instruction.viewFactory = liftingInstruction.viewFactory;
    instruction.providers = [liftingInstruction.type.target];
    instruction.lifting = true;
    return instruction;
  }

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
  static normal(injectorId: number, parentInjectorId: number, providers: Array<Function>, behaviorInstructions: Array<BehaviorInstruction>, expressions: Array<Object>, elementInstruction: BehaviorInstruction): TargetInstruction {
    let instruction = new TargetInstruction();
    instruction.injectorId = injectorId;
    instruction.parentInjectorId = parentInjectorId;
    instruction.providers = providers;
    instruction.behaviorInstructions = behaviorInstructions;
    instruction.expressions = expressions;
    instruction.anchorIsContainer = elementInstruction ? elementInstruction.anchorIsContainer : true;
    instruction.elementInstruction = elementInstruction;
    return instruction;
  }

  /**
  * Creates an instruction that represents the surrogate behaviors and bindings for an element.
  * @param providers The types which will provide behavior for this element.
  * @param behaviorInstructions The instructions for creating behaviors on this element.
  * @param expressions Bindings, listeners, triggers, etc.
  * @param values A key/value lookup of attributes to transplant.
  * @return The created instruction.
  */
  static surrogate(providers: Array<Function>, behaviorInstructions: Array<BehaviorInstruction>, expressions: Array<Object>, values: Object): TargetInstruction {
    let instruction = new TargetInstruction();
    instruction.expressions = expressions;
    instruction.behaviorInstructions = behaviorInstructions;
    instruction.providers = providers;
    instruction.values = values;
    return instruction;
  }
}

const tiProto = TargetInstruction.prototype;

tiProto.injectorId = null;
tiProto.parentInjectorId = null;

tiProto.shadowSlot = false;
tiProto.slotName = null;
tiProto.slotFallbackFactory = null;

tiProto.contentExpression = null;
tiProto.letElement = false;

tiProto.expressions = null;
tiProto.expressions = null;
tiProto.providers = null;

tiProto.viewFactory = null;

tiProto.anchorIsContainer = false;
tiProto.elementInstruction = null;
tiProto.lifting = false;

tiProto.values = null;

/**
* Implemented by classes that describe how a view factory should be loaded.
*/
interface ViewStrategy {
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
* Decorator: Indicates that the decorated class/object is a view strategy.
*/
export const viewStrategy: Function = protocol.create('aurelia:view-strategy', {
  validate(target) {
    if (!(typeof target.loadViewFactory === 'function')) {
      return 'View strategies must implement: loadViewFactory(viewEngine: ViewEngine, compileInstruction: ViewCompileInstruction, loadContext?: ResourceLoadContext): Promise<ViewFactory>';
    }

    return true;
  },
  compose(target) {
    if (!(typeof target.makeRelativeTo === 'function')) {
      target.makeRelativeTo = PLATFORM.noop;
    }
  }
});

/**
* A view strategy that loads a view relative to its associated view-model.
*/
@viewStrategy()
export class RelativeViewStrategy {
  /**
  * Creates an instance of RelativeViewStrategy.
  * @param path The relative path to the view.
  */
  constructor(path: string) {
    this.path = path;
    this.absolutePath = null;
  }

  /**
  * Loads a view factory.
  * @param viewEngine The view engine to use during the load process.
  * @param compileInstruction Additional instructions to use during compilation of the view.
  * @param loadContext The loading context used for loading all resources and dependencies.
  * @param target A class from which to extract metadata of additional resources to load.
  * @return A promise for the view factory that is produced by this strategy.
  */
  loadViewFactory(viewEngine: ViewEngine, compileInstruction: ViewCompileInstruction, loadContext?: ResourceLoadContext, target?: any): Promise<ViewFactory> {
    if (this.absolutePath === null && this.moduleId) {
      this.absolutePath = relativeToFile(this.path, this.moduleId);
    }

    compileInstruction.associatedModuleId = this.moduleId;
    return viewEngine.loadViewFactory(this.absolutePath || this.path, compileInstruction, loadContext, target);
  }

  /**
  * Makes the view loaded by this strategy relative to the provided file path.
  * @param file The path to load the view relative to.
  */
  makeRelativeTo(file: string): void {
    if (this.absolutePath === null) {
      this.absolutePath = relativeToFile(this.path, file);
    }
  }
}

/**
* A view strategy based on naming conventions.
*/
@viewStrategy()
export class ConventionalViewStrategy {
  /**
  * Creates an instance of ConventionalViewStrategy.
  * @param viewLocator The view locator service for conventionally locating the view.
  * @param origin The origin of the view model to conventionally load the view for.
  */
  constructor(viewLocator: ViewLocator, origin: Origin) {
    this.moduleId = origin.moduleId;
    this.viewUrl = viewLocator.convertOriginToViewUrl(origin);
  }

  /**
  * Loads a view factory.
  * @param viewEngine The view engine to use during the load process.
  * @param compileInstruction Additional instructions to use during compilation of the view.
  * @param loadContext The loading context used for loading all resources and dependencies.
  * @param target A class from which to extract metadata of additional resources to load.
  * @return A promise for the view factory that is produced by this strategy.
  */
  loadViewFactory(viewEngine: ViewEngine, compileInstruction: ViewCompileInstruction, loadContext?: ResourceLoadContext, target?: any): Promise<ViewFactory> {
    compileInstruction.associatedModuleId = this.moduleId;
    return viewEngine.loadViewFactory(this.viewUrl, compileInstruction, loadContext, target);
  }
}

/**
* A view strategy that indicates that the component has no view that the templating engine needs to manage.
* Typically used when the component author wishes to take over fine-grained rendering control.
*/
@viewStrategy()
export class NoViewStrategy {
  /**
  * Creates an instance of NoViewStrategy.
  * @param dependencies A list of view resource dependencies of this view.
  * @param dependencyBaseUrl The base url for the view dependencies.
  */
  constructor(dependencies?: Array<string | Function | Object>, dependencyBaseUrl?: string) {
    this.dependencies = dependencies || null;
    this.dependencyBaseUrl = dependencyBaseUrl || '';
  }

  /**
  * Loads a view factory.
  * @param viewEngine The view engine to use during the load process.
  * @param compileInstruction Additional instructions to use during compilation of the view.
  * @param loadContext The loading context used for loading all resources and dependencies.
  * @param target A class from which to extract metadata of additional resources to load.
  * @return A promise for the view factory that is produced by this strategy.
  */
  loadViewFactory(viewEngine: ViewEngine, compileInstruction: ViewCompileInstruction, loadContext?: ResourceLoadContext, target?: any): Promise<ViewFactory> {
    let entry = this.entry;
    let dependencies = this.dependencies;

    if (entry && entry.factoryIsReady) {
      return Promise.resolve(null);
    }

    this.entry = entry = new TemplateRegistryEntry(this.moduleId || this.dependencyBaseUrl);
    // since we're not invoking the TemplateRegistryEntry template setter
    // we need to create the dependencies Array manually and set it as loaded:
    entry.dependencies = [];
    entry.templateIsLoaded = true;

    if (dependencies !== null) {
      for (let i = 0, ii = dependencies.length; i < ii; ++i) {
        let current = dependencies[i];

        if (typeof current === 'string' || typeof current === 'function') {
          entry.addDependency(current);
        } else {
          entry.addDependency(current.from, current.as);
        }
      }
    }

    compileInstruction.associatedModuleId = this.moduleId;

    // loadViewFactory will resolve as 'null' because entry template is not set:
    return viewEngine.loadViewFactory(entry, compileInstruction, loadContext, target);
  }
}

/**
* A view strategy created directly from the template registry entry.
*/
@viewStrategy()
export class TemplateRegistryViewStrategy {
  /**
  * Creates an instance of TemplateRegistryViewStrategy.
  * @param moduleId The associated moduleId of the view to be loaded.
  * @param entry The template registry entry used in loading the view factory.
  */
  constructor(moduleId: string, entry: TemplateRegistryEntry) {
    this.moduleId = moduleId;
    this.entry = entry;
  }

  /**
  * Loads a view factory.
  * @param viewEngine The view engine to use during the load process.
  * @param compileInstruction Additional instructions to use during compilation of the view.
  * @param loadContext The loading context used for loading all resources and dependencies.
  * @param target A class from which to extract metadata of additional resources to load.
  * @return A promise for the view factory that is produced by this strategy.
  */
  loadViewFactory(viewEngine: ViewEngine, compileInstruction: ViewCompileInstruction, loadContext?: ResourceLoadContext, target?: any): Promise<ViewFactory> {
    let entry = this.entry;

    if (entry.factoryIsReady) {
      return Promise.resolve(entry.factory);
    }

    compileInstruction.associatedModuleId = this.moduleId;
    return viewEngine.loadViewFactory(entry, compileInstruction, loadContext, target);
  }
}

/**
* A view strategy that allows the component author to inline the html for the view.
*/
@viewStrategy()
export class InlineViewStrategy {
  /**
  * Creates an instance of InlineViewStrategy.
  * @param markup The markup for the view. Be sure to include the wrapping template tag.
  * @param dependencies A list of view resource dependencies of this view.
  * @param dependencyBaseUrl The base url for the view dependencies.
  */
  constructor(markup: string, dependencies?: Array<string | Function | Object>, dependencyBaseUrl?: string) {
    this.markup = markup;
    this.dependencies = dependencies || null;
    this.dependencyBaseUrl = dependencyBaseUrl || '';
  }

  /**
  * Loads a view factory.
  * @param viewEngine The view engine to use during the load process.
  * @param compileInstruction Additional instructions to use during compilation of the view.
  * @param loadContext The loading context used for loading all resources and dependencies.
  * @param target A class from which to extract metadata of additional resources to load.
  * @return A promise for the view factory that is produced by this strategy.
  */
  loadViewFactory(viewEngine: ViewEngine, compileInstruction: ViewCompileInstruction, loadContext?: ResourceLoadContext, target?: any): Promise<ViewFactory> {
    let entry = this.entry;
    let dependencies = this.dependencies;

    if (entry && entry.factoryIsReady) {
      return Promise.resolve(entry.factory);
    }

    this.entry = entry = new TemplateRegistryEntry(this.moduleId || this.dependencyBaseUrl);
    entry.template = DOM.createTemplateFromMarkup(this.markup);

    if (dependencies !== null) {
      for (let i = 0, ii = dependencies.length; i < ii; ++i) {
        let current = dependencies[i];

        if (typeof current === 'string' || typeof current === 'function') {
          entry.addDependency(current);
        } else {
          entry.addDependency(current.from, current.as);
        }
      }
    }

    compileInstruction.associatedModuleId = this.moduleId;
    return viewEngine.loadViewFactory(entry, compileInstruction, loadContext, target);
  }
}

interface IStaticViewConfig {
  template: string | HTMLTemplateElement;
  dependencies?: Function[] | (() => Array<Function | Promise<Function | Record<string, Function>>>);
}

@viewStrategy()
export class StaticViewStrategy {

  /**@internal */
  template: string | HTMLTemplateElement;
  /**@internal */
  dependencies: Function[] | (() => Array<Function | Promise<Function | Record<string, Function>>>);
  factoryIsReady: boolean;
  factory: ViewFactory;

  constructor(config: string | HTMLTemplateElement | IStaticViewConfig) {
    if (typeof config === 'string' || (config instanceof DOM.Element && config.tagName === 'TEMPLATE')) {
      config = {
        template: config
      };
    }
    this.template = config.template;
    this.dependencies = config.dependencies || [];
    this.factoryIsReady = false;
    this.onReady = null;
    this.moduleId = 'undefined';
  }

  /**
  * Loads a view factory.
  * @param viewEngine The view engine to use during the load process.
  * @param compileInstruction Additional instructions to use during compilation of the view.
  * @param loadContext The loading context used for loading all resources and dependencies.
  * @param target A class from which to extract metadata of additional resources to load.
  * @return A promise for the view factory that is produced by this strategy.
  */
  loadViewFactory(viewEngine: ViewEngine, compileInstruction: ViewCompileInstruction, loadContext: ResourceLoadContext, target: any): Promise<ViewFactory> {
    if (this.factoryIsReady) {
      return Promise.resolve(this.factory);
    }
    let deps = this.dependencies;
    deps = typeof deps === 'function' ? deps() : deps;
    deps = deps ? deps : [];
    deps = Array.isArray(deps) ? deps : [deps];
    // Promise.all() to normalize dependencies into an array of either functions, or records that contain function
    return Promise.all(deps).then((dependencies) => {
      const container = viewEngine.container;
      const appResources = viewEngine.appResources;
      const viewCompiler = viewEngine.viewCompiler;
      const viewResources = new ViewResources(appResources);

      let resource;
      let elDeps = [];

      if (target) {
        // when composing without a view mode, but view specified, target will be undefined
        viewResources.autoRegister(container, target);
      }

      for (let dep of dependencies) {
        if (typeof dep === 'function') {
          // dependencies: [class1, class2, import('module').then(m => m.class3)]
          resource = viewResources.autoRegister(container, dep);
          if (resource.elementName !== null) {
            elDeps.push(resource);
          }
        } else if (dep && typeof dep === 'object') {
          // dependencies: [import('module1'), import('module2')]
          for (let key in dep) {
            let exported = dep[key];
            if (typeof exported === 'function') {
              resource = viewResources.autoRegister(container, exported);
              if (resource.elementName !== null) {
                elDeps.push(resource);
              }
            }
          }
        } else {
          throw new Error(`dependency neither function nor object. Received: "${typeof dep}"`);
        }
      }
      // only load custom element as first step.
      return Promise.all(elDeps.map(el => el.load(container, el.target))).then(() => {
        const factory = this.template !== null
          ? viewCompiler.compile(this.template, viewResources, compileInstruction)
          : null;
        this.factoryIsReady = true;
        this.factory = factory;
        return factory;
      });
    });
  }
}

/**
* Locates a view for an object.
*/
export class ViewLocator {
  /**
  * The metadata key for storing/finding view strategies associated with an class/object.
  */
  static viewStrategyMetadataKey = 'aurelia:view-strategy';

  /**
  * Gets the view strategy for the value.
  * @param value The value to locate the view strategy for.
  * @return The located ViewStrategy instance.
  */
  getViewStrategy(value: any): ViewStrategy {
    if (!value) {
      return null;
    }

    if (typeof value === 'object' && 'getViewStrategy' in value) {
      let origin = Origin.get(value.constructor);

      value = value.getViewStrategy();

      if (typeof value === 'string') {
        value = new RelativeViewStrategy(value);
      }

      viewStrategy.assert(value);

      if (origin.moduleId) {
        value.makeRelativeTo(origin.moduleId);
      }

      return value;
    }

    if (typeof value === 'string') {
      value = new RelativeViewStrategy(value);
    }

    if (viewStrategy.validate(value)) {
      return value;
    }

    if (typeof value !== 'function') {
      value = value.constructor;
    }

    // static view strategy
    if ('$view' in value) {
      let c = value.$view;
      let view;
      c = typeof c === 'function' ? c.call(value) : c;
      if (c === null) {
        view = new NoViewStrategy();
      } else {
        view = c instanceof StaticViewStrategy ? c : new StaticViewStrategy(c);
      }
      metadata.define(ViewLocator.viewStrategyMetadataKey, view, value);
      return view;
    }

    let origin = Origin.get(value);
    let strategy = metadata.get(ViewLocator.viewStrategyMetadataKey, value);

    if (!strategy) {
      if (!origin.moduleId) {
        throw new Error('Cannot determine default view strategy for object.', value);
      }

      strategy = this.createFallbackViewStrategy(origin);
    } else if (origin.moduleId) {
      strategy.moduleId = origin.moduleId;
    }

    return strategy;
  }

  /**
  * Creates a fallback View Strategy. Used when unable to locate a configured strategy.
  * The default implementation returns and instance of ConventionalViewStrategy.
  * @param origin The origin of the view model to return the strategy for.
  * @return The fallback ViewStrategy.
  */
  createFallbackViewStrategy(origin: Origin): ViewStrategy {
    return new ConventionalViewStrategy(this, origin);
  }

  /**
  * Conventionally converts a view model origin to a view url.
  * Used by the ConventionalViewStrategy.
  * @param origin The origin of the view model to convert.
  * @return The view url.
  */
  convertOriginToViewUrl(origin: Origin): string {
    let moduleId = origin.moduleId;
    let id = (moduleId.endsWith('.js') || moduleId.endsWith('.ts')) ? moduleId.substring(0, moduleId.length - 3) : moduleId;
    return id + '.html';
  }
}

function mi(name) {
  throw new Error(`BindingLanguage must implement ${name}().`);
}

interface LetExpression {
  createBinding(): LetBinding;
}

interface LetBinding {
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
* An abstract base class for implementations of a binding language.
*/
export class BindingLanguage {
  /**
  * Inspects an attribute for bindings.
  * @param resources The ViewResources for the view being compiled.
  * @param elementName The element name to inspect.
  * @param attrName The attribute name to inspect.
  * @param attrValue The attribute value to inspect.
  * @return An info object with the results of the inspection.
  */
  inspectAttribute(resources: ViewResources, elementName: string, attrName: string, attrValue: string): Object {
    mi('inspectAttribute');
  }

  /**
  * Creates an attribute behavior instruction.
  * @param resources The ViewResources for the view being compiled.
  * @param element The element that the attribute is defined on.
  * @param info The info object previously returned from inspectAttribute.
  * @param existingInstruction A previously created instruction for this attribute.
  * @return The instruction instance.
  */
  createAttributeInstruction(resources: ViewResources, element: Element, info: Object, existingInstruction?: Object): BehaviorInstruction {
    mi('createAttributeInstruction');
  }

  /**
   * Creates let expressions from a <let/> element
   * @param resources The ViewResources for the view being compiled
   * @param element the let element in the view template
   * @param existingExpressions the array that will hold compiled let expressions from the let element
   * @return the expression array created from the <let/> element
   */
  createLetExpressions(resources: ViewResources, element: Element): LetExpression[] {
    mi('createLetExpressions');
  }

  /**
  * Parses the text for bindings.
  * @param resources The ViewResources for the view being compiled.
  * @param value The value of the text to parse.
  * @return A binding expression.
  */
  inspectTextContent(resources: ViewResources, value: string): Object {
    mi('inspectTextContent');
  }
}

let noNodes = Object.freeze([]);

export class SlotCustomAttribute {
  static inject() {
    return [DOM.Element];
  }

  constructor(element) {
    this.element = element;
    this.element.auSlotAttribute = this;
  }

  valueChanged(newValue, oldValue) {
    //console.log('au-slot', newValue);
  }
}

export class PassThroughSlot {
  constructor(anchor, name, destinationName, fallbackFactory) {
    this.anchor = anchor;
    this.anchor.viewSlot = this;
    this.name = name;
    this.destinationName = destinationName;
    this.fallbackFactory = fallbackFactory;
    this.destinationSlot = null;
    this.projections = 0;
    this.contentView = null;

    let attr = new SlotCustomAttribute(this.anchor);
    attr.value = this.destinationName;
  }

  get needsFallbackRendering() {
    return this.fallbackFactory && this.projections === 0;
  }

  renderFallbackContent(view, nodes, projectionSource, index) {
    if (this.contentView === null) {
      this.contentView = this.fallbackFactory.create(this.ownerView.container);
      this.contentView.bind(this.ownerView.bindingContext, this.ownerView.overrideContext);

      let slots = Object.create(null);
      slots[this.destinationSlot.name] = this.destinationSlot;

      ShadowDOM.distributeView(this.contentView, slots, projectionSource, index, this.destinationSlot.name);
    }
  }

  passThroughTo(destinationSlot) {
    this.destinationSlot = destinationSlot;
  }

  addNode(view, node, projectionSource, index) {
    if (this.contentView !== null) {
      this.contentView.removeNodes();
      this.contentView.detached();
      this.contentView.unbind();
      this.contentView = null;
    }

    if (node.viewSlot instanceof PassThroughSlot) {
      node.viewSlot.passThroughTo(this);
      return;
    }

    this.projections++;
    this.destinationSlot.addNode(view, node, projectionSource, index);
  }

  removeView(view, projectionSource) {
    this.projections--;
    this.destinationSlot.removeView(view, projectionSource);

    if (this.needsFallbackRendering) {
      this.renderFallbackContent(null, noNodes, projectionSource);
    }
  }

  removeAll(projectionSource) {
    this.projections = 0;
    this.destinationSlot.removeAll(projectionSource);

    if (this.needsFallbackRendering) {
      this.renderFallbackContent(null, noNodes, projectionSource);
    }
  }

  projectFrom(view, projectionSource) {
    this.destinationSlot.projectFrom(view, projectionSource);
  }

  created(ownerView) {
    this.ownerView = ownerView;
  }

  bind(view) {
    if (this.contentView) {
      this.contentView.bind(view.bindingContext, view.overrideContext);
    }
  }

  attached() {
    if (this.contentView) {
      this.contentView.attached();
    }
  }

  detached() {
    if (this.contentView) {
      this.contentView.detached();
    }
  }

  unbind() {
    if (this.contentView) {
      this.contentView.unbind();
    }
  }
}

export class ShadowSlot {
  constructor(anchor, name, fallbackFactory) {
    this.anchor = anchor;
    this.anchor.isContentProjectionSource = true;
    this.anchor.viewSlot = this;
    this.name = name;
    this.fallbackFactory = fallbackFactory;
    this.contentView = null;
    this.projections = 0;
    this.children = [];
    this.projectFromAnchors = null;
    this.destinationSlots = null;
  }

  get needsFallbackRendering() {
    return this.fallbackFactory && this.projections === 0;
  }

  addNode(view, node, projectionSource, index, destination) {
    if (this.contentView !== null) {
      this.contentView.removeNodes();
      this.contentView.detached();
      this.contentView.unbind();
      this.contentView = null;
    }

    if (node.viewSlot instanceof PassThroughSlot) {
      node.viewSlot.passThroughTo(this);
      return;
    }

    if (this.destinationSlots !== null) {
      ShadowDOM.distributeNodes(view, [node], this.destinationSlots, this, index);
    } else {
      node.auOwnerView = view;
      node.auProjectionSource = projectionSource;
      node.auAssignedSlot = this;

      let anchor = this._findAnchor(view, node, projectionSource, index);
      let parent = anchor.parentNode;

      parent.insertBefore(node, anchor);
      this.children.push(node);
      this.projections++;
    }
  }

  removeView(view, projectionSource) {
    if (this.destinationSlots !== null) {
      ShadowDOM.undistributeView(view, this.destinationSlots, this);
    } else if (this.contentView && this.contentView.hasSlots) {
      ShadowDOM.undistributeView(view, this.contentView.slots, projectionSource);
    } else {
      let found = this.children.find(x => x.auSlotProjectFrom === projectionSource);
      if (found) {
        let children = found.auProjectionChildren;

        for (let i = 0, ii = children.length; i < ii; ++i) {
          let child = children[i];

          if (child.auOwnerView === view) {
            children.splice(i, 1);
            view.fragment.appendChild(child);
            i--; ii--;
            this.projections--;
          }
        }

        if (this.needsFallbackRendering) {
          this.renderFallbackContent(view, noNodes, projectionSource);
        }
      }
    }
  }

  removeAll(projectionSource) {
    if (this.destinationSlots !== null) {
      ShadowDOM.undistributeAll(this.destinationSlots, this);
    } else if (this.contentView && this.contentView.hasSlots) {
      ShadowDOM.undistributeAll(this.contentView.slots, projectionSource);
    } else {
      let found = this.children.find(x => x.auSlotProjectFrom === projectionSource);

      if (found) {
        let children = found.auProjectionChildren;
        for (let i = 0, ii = children.length; i < ii; ++i) {
          let child = children[i];
          child.auOwnerView.fragment.appendChild(child);
          this.projections--;
        }

        found.auProjectionChildren = [];

        if (this.needsFallbackRendering) {
          this.renderFallbackContent(null, noNodes, projectionSource);
        }
      }
    }
  }

  _findAnchor(view, node, projectionSource, index) {
    if (projectionSource) {
      //find the anchor associated with the projected view slot
      let found = this.children.find(x => x.auSlotProjectFrom === projectionSource);
      if (found) {
        if (index !== undefined) {
          let children = found.auProjectionChildren;
          let viewIndex = -1;
          let lastView;

          for (let i = 0, ii = children.length; i < ii; ++i) {
            let current = children[i];

            if (current.auOwnerView !== lastView) {
              viewIndex++;
              lastView = current.auOwnerView;

              if (viewIndex >= index && lastView !== view) {
                children.splice(i, 0, node);
                return current;
              }
            }
          }
        }

        found.auProjectionChildren.push(node);
        return found;
      }
    }

    return this.anchor;
  }

  projectTo(slots) {
    this.destinationSlots = slots;
  }

  projectFrom(view, projectionSource) {
    let anchor = DOM.createComment('anchor');
    let parent = this.anchor.parentNode;
    anchor.auSlotProjectFrom = projectionSource;
    anchor.auOwnerView = view;
    anchor.auProjectionChildren = [];
    parent.insertBefore(anchor, this.anchor);
    this.children.push(anchor);

    if (this.projectFromAnchors === null) {
      this.projectFromAnchors = [];
    }

    this.projectFromAnchors.push(anchor);
  }

  renderFallbackContent(view, nodes, projectionSource, index) {
    if (this.contentView === null) {
      this.contentView = this.fallbackFactory.create(this.ownerView.container);
      this.contentView.bind(this.ownerView.bindingContext, this.ownerView.overrideContext);
      this.contentView.insertNodesBefore(this.anchor);
    }

    if (this.contentView.hasSlots) {
      let slots = this.contentView.slots;
      let projectFromAnchors = this.projectFromAnchors;

      if (projectFromAnchors !== null) {
        for (let slotName in slots) {
          let slot = slots[slotName];

          for (let i = 0, ii = projectFromAnchors.length; i < ii; ++i) {
            let anchor = projectFromAnchors[i];
            slot.projectFrom(anchor.auOwnerView, anchor.auSlotProjectFrom);
          }
        }
      }

      this.fallbackSlots = slots;
      ShadowDOM.distributeNodes(view, nodes, slots, projectionSource, index);
    }
  }

  created(ownerView) {
    this.ownerView = ownerView;
  }

  bind(view) {
    if (this.contentView) {
      this.contentView.bind(view.bindingContext, view.overrideContext);
    }
  }

  attached() {
    if (this.contentView) {
      this.contentView.attached();
    }
  }

  detached() {
    if (this.contentView) {
      this.contentView.detached();
    }
  }

  unbind() {
    if (this.contentView) {
      this.contentView.unbind();
    }
  }
}

export class ShadowDOM {
  static defaultSlotKey = '__au-default-slot-key__';

  static getSlotName(node) {
    if (node.auSlotAttribute === undefined) {
      return ShadowDOM.defaultSlotKey;
    }

    return node.auSlotAttribute.value;
  }

  static distributeView(view, slots, projectionSource, index, destinationOverride) {
    let nodes;

    if (view === null) {
      nodes = noNodes;
    } else {
      let childNodes = view.fragment.childNodes;
      let ii = childNodes.length;
      nodes = new Array(ii);

      for (let i = 0; i < ii; ++i) {
        nodes[i] = childNodes[i];
      }
    }

    ShadowDOM.distributeNodes(
      view,
      nodes,
      slots,
      projectionSource,
      index,
      destinationOverride
    );
  }

  static undistributeView(view, slots, projectionSource) {
    for (let slotName in slots) {
      slots[slotName].removeView(view, projectionSource);
    }
  }

  static undistributeAll(slots, projectionSource) {
    for (let slotName in slots) {
      slots[slotName].removeAll(projectionSource);
    }
  }

  static distributeNodes(view, nodes, slots, projectionSource, index, destinationOverride) {
    for (let i = 0, ii = nodes.length; i < ii; ++i) {
      let currentNode = nodes[i];
      let nodeType = currentNode.nodeType;

      if (currentNode.isContentProjectionSource) {
        currentNode.viewSlot.projectTo(slots);

        for (let slotName in slots) {
          slots[slotName].projectFrom(view, currentNode.viewSlot);
        }

        nodes.splice(i, 1);
        ii--; i--;
      } else if (nodeType === 1 || nodeType === 3 || currentNode.viewSlot instanceof PassThroughSlot) { //project only elements and text
        if (nodeType === 3 && _isAllWhitespace(currentNode)) {
          nodes.splice(i, 1);
          ii--; i--;
        } else {
          let found = slots[destinationOverride || ShadowDOM.getSlotName(currentNode)];

          if (found) {
            found.addNode(view, currentNode, projectionSource, index);
            nodes.splice(i, 1);
            ii--; i--;
          }
        }
      } else {
        nodes.splice(i, 1);
        ii--; i--;
      }
    }

    for (let slotName in slots) {
      let slot = slots[slotName];

      if (slot.needsFallbackRendering) {
        slot.renderFallbackContent(view, nodes, projectionSource, index);
      }
    }
  }
}

function register(lookup, name, resource, type) {
  if (!name) {
    return;
  }

  let existing = lookup[name];
  if (existing) {
    if (existing !== resource) {
      throw new Error(`Attempted to register ${type} when one with the same name already exists. Name: ${name}.`);
    }

    return;
  }

  lookup[name] = resource;
}

/**
* View engine hooks that enable a view resource to provide custom processing during the compilation or creation of a view.
*/
interface ViewEngineHooks {
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

interface IBindablePropertyConfig {
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

interface IStaticResourceConfig {
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
  bindables?: (string | IBindablePropertyConfig)[];
}

export function validateBehaviorName(name: string, type: string) {
  if (/[A-Z]/.test(name)) {
    let newName = _hyphenate(name);
    LogManager
      .getLogger('templating')
      .warn(`'${name}' is not a valid ${type} name and has been converted to '${newName}'. Upper-case letters are not allowed because the DOM is not case-sensitive.`);
    return newName;
  }
  return name;
}

const conventionMark = '__au_resource__';

/**
 * Represents a collection of resources used during the compilation of a view.
 * Will optinally add information to an existing HtmlBehaviorResource if given
 */
export class ViewResources {

  /**
   * Checks whether the provided class contains any resource conventions
   * @param target Target class to extract metadata based on convention
   * @param existing If supplied, all custom element / attribute metadata extracted from convention will be apply to this instance
   */
  static convention(target: Function, existing?: HtmlBehaviorResource): HtmlBehaviorResource | ValueConverterResource | BindingBehaviorResource | ViewEngineHooksResource {
    let resource;
    // Use a simple string to mark that an HtmlBehaviorResource instance
    // has been applied all resource information from its target view model class
    // to prevent subsequence call re initialization all info again
    if (existing && conventionMark in existing) {
      return existing;
    }
    if ('$resource' in target) {
      let config = target.$resource;
      // 1. check if resource config is a string
      if (typeof config === 'string') {
        // it's a custom element, with name is the resource variable
        // static $resource = 'my-element'
        resource = existing || new HtmlBehaviorResource();
        resource[conventionMark] = true;
        if (!resource.elementName) {
          // if element name was not specified before
          resource.elementName = validateBehaviorName(config, 'custom element');
        }
      } else {
        // 2. if static config is not a string, normalize into an config object
        if (typeof config === 'function') {
          // static $resource() {  }
          config = config.call(target);
        }
        if (typeof config === 'string') {
          // static $resource() { return 'my-custom-element-name' }
          // though rare case, still needs to handle properly
          config = { name: config };
        }
        // after normalization, copy to another obj
        // as the config could come from a static field, which subject to later reuse
        // it shouldn't be modified
        config = Object.assign({}, config);
        // no type specified = custom element
        let resourceType = config.type || 'element';
        // cannot do name = config.name || target.name
        // depends on resource type, it may need to use different strategies to normalize name
        let name = config.name;
        switch (resourceType) { // eslint-disable-line default-case
        case 'element': case 'attribute':
          // if a metadata is supplied, use it
          resource = existing || new HtmlBehaviorResource();
          resource[conventionMark] = true;
          if (resourceType === 'element') {
            // if element name was defined before applying convention here
            // it's a result from `@customElement` call (or manual modification)
            // need not to redefine name
            // otherwise, fall into following if
            if (!resource.elementName) {
              resource.elementName = name
                ? validateBehaviorName(name, 'custom element')
                : _hyphenate(target.name);
            }
          } else {
            // attribute name was defined before applying convention here
            // it's a result from `@customAttribute` call (or manual modification)
            // need not to redefine name
            // otherwise, fall into following if
            if (!resource.attributeName) {
              resource.attributeName = name
                ? validateBehaviorName(name, 'custom attribute')
                : _hyphenate(target.name);
            }
          }
          if ('templateController' in config) {
            // map templateController to liftsContent
            config.liftsContent = config.templateController;
            delete config.templateController;
          }
          if ('defaultBindingMode' in config && resource.attributeDefaultBindingMode !== undefined) {
            // map defaultBindingMode to attributeDefaultBinding mode
            // custom element doesn't have default binding mode
            config.attributeDefaultBindingMode = config.defaultBindingMode;
            delete config.defaultBindingMode;
          }
          // not bringing over the name.
          delete config.name;
          // just copy over. Devs are responsible for what specified in the config
          Object.assign(resource, config);
          break;
        case 'valueConverter':
          resource = new ValueConverterResource(camelCase(name || target.name));
          break;
        case 'bindingBehavior':
          resource = new BindingBehaviorResource(camelCase(name || target.name));
          break;
        case 'viewEngineHooks':
          resource = new ViewEngineHooksResource();
          break;
        }
      }

      if (resource instanceof HtmlBehaviorResource) {
        // check for bindable registration
        // This will concat bindables specified in static field / method with bindables specified via decorators
        // Which means if `name` is specified in both decorator and static config, it will be duplicated here
        // though it will finally resolves to only 1 `name` attribute
        // Will not break if it's done in that way but probably only happenned in inheritance scenarios.
        let bindables = typeof config === 'string' ? undefined : config.bindables;
        let currentProps = resource.properties;
        if (Array.isArray(bindables)) {
          for (let i = 0, ii = bindables.length; ii > i; ++i) {
            let prop = bindables[i];
            if (!prop || (typeof prop !== 'string' && !prop.name)) {
              throw new Error(`Invalid bindable property at "${i}" for class "${target.name}". Expected either a string or an object with "name" property.`);
            }
            let newProp = new BindableProperty(prop);
            // Bindable properties defined in $resource convention
            // shouldn't override existing prop with the same name
            // as they could be explicitly defined via decorator, thus more trust worthy ?
            let existed = false;
            for (let j = 0, jj = currentProps.length; jj > j; ++j) {
              if (currentProps[j].name === newProp.name) {
                existed = true;
                break;
              }
            }
            if (existed) {
              continue;
            }
            newProp.registerWith(target, resource);
          }
        }
      }
    }
    return resource;
  }

  /**
  * A custom binding language used in the view.
  */
  bindingLanguage = null;

  /**
  * Creates an instance of ViewResources.
  * @param parent The parent resources. This resources can override them, but if a resource is not found, it will be looked up in the parent.
  * @param viewUrl The url of the view to which these resources apply.
  */
  constructor(parent?: ViewResources, viewUrl?: string) {
    this.parent = parent || null;
    this.hasParent = this.parent !== null;
    this.viewUrl = viewUrl || '';
    this.lookupFunctions = {
      valueConverters: this.getValueConverter.bind(this),
      bindingBehaviors: this.getBindingBehavior.bind(this)
    };
    this.attributes = Object.create(null);
    this.elements = Object.create(null);
    this.valueConverters = Object.create(null);
    this.bindingBehaviors = Object.create(null);
    this.attributeMap = Object.create(null);
    this.values = Object.create(null);
    this.beforeCompile = this.afterCompile = this.beforeCreate = this.afterCreate = this.beforeBind = this.beforeUnbind = false;
  }

  _tryAddHook(obj, name) {
    if (typeof obj[name] === 'function') {
      let func = obj[name].bind(obj);
      let counter = 1;
      let callbackName;

      while (this[callbackName = name + counter.toString()] !== undefined) {
        counter++;
      }

      this[name] = true;
      this[callbackName] = func;
    }
  }

  _invokeHook(name, one, two, three, four) {
    if (this.hasParent) {
      this.parent._invokeHook(name, one, two, three, four);
    }

    if (this[name]) {
      this[name + '1'](one, two, three, four);

      let callbackName = name + '2';
      if (this[callbackName]) {
        this[callbackName](one, two, three, four);

        callbackName = name + '3';
        if (this[callbackName]) {
          this[callbackName](one, two, three, four);

          let counter = 4;

          while (this[callbackName = name + counter.toString()] !== undefined) {
            this[callbackName](one, two, three, four);
            counter++;
          }
        }
      }
    }
  }

  /**
  * Registers view engine hooks for the view.
  * @param hooks The hooks to register.
  */
  registerViewEngineHooks(hooks: ViewEngineHooks): void {
    this._tryAddHook(hooks, 'beforeCompile');
    this._tryAddHook(hooks, 'afterCompile');
    this._tryAddHook(hooks, 'beforeCreate');
    this._tryAddHook(hooks, 'afterCreate');
    this._tryAddHook(hooks, 'beforeBind');
    this._tryAddHook(hooks, 'beforeUnbind');
  }

  /**
  * Gets the binding language associated with these resources, or return the provided fallback implementation.
  * @param bindingLanguageFallback The fallback binding language implementation to use if no binding language is configured locally.
  * @return The binding language.
  */
  getBindingLanguage(bindingLanguageFallback: BindingLanguage): BindingLanguage {
    return this.bindingLanguage || (this.bindingLanguage = bindingLanguageFallback);
  }

  /**
  * Patches an immediate parent into the view resource resolution hierarchy.
  * @param newParent The new parent resources to patch in.
  */
  patchInParent(newParent: ViewResources): void {
    let originalParent = this.parent;

    this.parent = newParent || null;
    this.hasParent = this.parent !== null;

    if (newParent.parent === null) {
      newParent.parent = originalParent;
      newParent.hasParent = originalParent !== null;
    }
  }

  /**
  * Maps a path relative to the associated view's origin.
  * @param path The relative path.
  * @return The calcualted path.
  */
  relativeToView(path: string): string {
    return relativeToFile(path, this.viewUrl);
  }

  /**
  * Registers an HTML element.
  * @param tagName The name of the custom element.
  * @param behavior The behavior of the element.
  */
  registerElement(tagName: string, behavior: HtmlBehaviorResource): void {
    register(this.elements, tagName, behavior, 'an Element');
  }

  /**
  * Gets an HTML element behavior.
  * @param tagName The tag name to search for.
  * @return The HtmlBehaviorResource for the tag name or null.
  */
  getElement(tagName: string): HtmlBehaviorResource {
    return this.elements[tagName] || (this.hasParent ? this.parent.getElement(tagName) : null);
  }

  /**
  * Gets the known attribute name based on the local attribute name.
  * @param attribute The local attribute name to lookup.
  * @return The known name.
  */
  mapAttribute(attribute: string): string {
    return this.attributeMap[attribute] || (this.hasParent ? this.parent.mapAttribute(attribute) : null);
  }

  /**
  * Registers an HTML attribute.
  * @param attribute The name of the attribute.
  * @param behavior The behavior of the attribute.
  * @param knownAttribute The well-known name of the attribute (in lieu of the local name).
  */
  registerAttribute(attribute: string, behavior: HtmlBehaviorResource, knownAttribute: string): void {
    this.attributeMap[attribute] = knownAttribute;
    register(this.attributes, attribute, behavior, 'an Attribute');
  }

  /**
  * Gets an HTML attribute behavior.
  * @param attribute The name of the attribute to lookup.
  * @return The HtmlBehaviorResource for the attribute or null.
  */
  getAttribute(attribute: string): HtmlBehaviorResource {
    return this.attributes[attribute] || (this.hasParent ? this.parent.getAttribute(attribute) : null);
  }

  /**
  * Registers a value converter.
  * @param name The name of the value converter.
  * @param valueConverter The value converter instance.
  */
  registerValueConverter(name: string, valueConverter: Object): void {
    register(this.valueConverters, name, valueConverter, 'a ValueConverter');
  }

  /**
  * Gets a value converter.
  * @param name The name of the value converter.
  * @return The value converter instance.
  */
  getValueConverter(name: string): Object {
    return this.valueConverters[name] || (this.hasParent ? this.parent.getValueConverter(name) : null);
  }

  /**
  * Registers a binding behavior.
  * @param name The name of the binding behavior.
  * @param bindingBehavior The binding behavior instance.
  */
  registerBindingBehavior(name: string, bindingBehavior: Object): void {
    register(this.bindingBehaviors, name, bindingBehavior, 'a BindingBehavior');
  }

  /**
  * Gets a binding behavior.
  * @param name The name of the binding behavior.
  * @return The binding behavior instance.
  */
  getBindingBehavior(name: string): Object {
    return this.bindingBehaviors[name] || (this.hasParent ? this.parent.getBindingBehavior(name) : null);
  }

  /**
  * Registers a value.
  * @param name The name of the value.
  * @param value The value.
  */
  registerValue(name: string, value: any): void {
    register(this.values, name, value, 'a value');
  }

  /**
  * Gets a value.
  * @param name The name of the value.
  * @return The value.
  */
  getValue(name: string): any {
    return this.values[name] || (this.hasParent ? this.parent.getValue(name) : null);
  }

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
  autoRegister(container, impl) {
    let resourceTypeMeta = metadata.getOwn(metadata.resource, impl);
    if (resourceTypeMeta) {
      if (resourceTypeMeta instanceof HtmlBehaviorResource) {
        // first use static resource
        ViewResources.convention(impl, resourceTypeMeta);

        // then fallback to traditional convention
        if (resourceTypeMeta.attributeName === null && resourceTypeMeta.elementName === null) {
          //no customeElement or customAttribute but behavior added by other metadata
          HtmlBehaviorResource.convention(impl.name, resourceTypeMeta);
        }
        if (resourceTypeMeta.attributeName === null && resourceTypeMeta.elementName === null) {
          //no convention and no customeElement or customAttribute but behavior added by other metadata
          resourceTypeMeta.elementName = _hyphenate(impl.name);
        }
      }
    } else {
      resourceTypeMeta = ViewResources.convention(impl)
        || HtmlBehaviorResource.convention(impl.name)
        || ValueConverterResource.convention(impl.name)
        || BindingBehaviorResource.convention(impl.name)
        || ViewEngineHooksResource.convention(impl.name);
      if (!resourceTypeMeta) {
        // doesn't match any convention, and is an exported value => custom element
        resourceTypeMeta = new HtmlBehaviorResource();
        resourceTypeMeta.elementName = _hyphenate(impl.name);
      }
      metadata.define(metadata.resource, resourceTypeMeta, impl);
    }
    resourceTypeMeta.initialize(container, impl);
    resourceTypeMeta.register(this);
    return resourceTypeMeta;
  }
}

/* eslint no-unused-vars: 0, no-constant-condition: 0 */
/**
* Represents a node in the view hierarchy.
*/
interface ViewNode {
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

export class View {
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
  constructor(container: Container, viewFactory: ViewFactory, fragment: DocumentFragment, controllers: Controller[], bindings: Binding[], children: ViewNode[], slots: Object) {
    this.container = container;
    this.viewFactory = viewFactory;
    this.resources = viewFactory.resources;
    this.fragment = fragment;
    this.firstChild = fragment.firstChild;
    this.lastChild = fragment.lastChild;
    this.controllers = controllers;
    this.bindings = bindings;
    this.children = children;
    this.slots = slots;
    this.hasSlots = false;
    this.fromCache = false;
    this.isBound = false;
    this.isAttached = false;
    this.bindingContext = null;
    this.overrideContext = null;
    this.controller = null;
    this.viewModelScope = null;
    this.animatableElement = undefined;
    this._isUserControlled = false;
    this.contentView = null;

    for (let key in slots) {
      this.hasSlots = true;
      break;
    }
  }

  /**
  * Returns this view to the appropriate view cache.
  */
  returnToCache(): void {
    this.viewFactory.returnViewToCache(this);
  }

  /**
  * Triggers the created callback for this view and its children.
  */
  created(): void {
    let i;
    let ii;
    let controllers = this.controllers;

    for (i = 0, ii = controllers.length; i < ii; ++i) {
      controllers[i].created(this);
    }
  }

  /**
  * Binds the view and it's children.
  * @param bindingContext The binding context to bind to.
  * @param overrideContext A secondary binding context that can override the standard context.
  */
  bind(bindingContext: Object, overrideContext?: Object, _systemUpdate?: boolean): void {
    let controllers;
    let bindings;
    let children;
    let i;
    let ii;

    if (_systemUpdate && this._isUserControlled) {
      return;
    }

    if (this.isBound) {
      if (this.bindingContext === bindingContext) {
        return;
      }

      this.unbind();
    }

    this.isBound = true;
    this.bindingContext = bindingContext;
    this.overrideContext = overrideContext || createOverrideContext(bindingContext);

    this.resources._invokeHook('beforeBind', this);

    bindings = this.bindings;
    for (i = 0, ii = bindings.length; i < ii; ++i) {
      bindings[i].bind(this);
    }

    if (this.viewModelScope !== null) {
      bindingContext.bind(this.viewModelScope.bindingContext, this.viewModelScope.overrideContext);
      this.viewModelScope = null;
    }

    controllers = this.controllers;
    for (i = 0, ii = controllers.length; i < ii; ++i) {
      controllers[i].bind(this);
    }

    children = this.children;
    for (i = 0, ii = children.length; i < ii; ++i) {
      children[i].bind(bindingContext, overrideContext, true);
    }

    if (this.hasSlots) {
      ShadowDOM.distributeView(this.contentView, this.slots);
    }
  }

  /**
  * Adds a binding instance to this view.
  * @param binding The binding instance.
  */
  addBinding(binding: Object): void {
    this.bindings.push(binding);

    if (this.isBound) {
      binding.bind(this);
    }
  }

  /**
  * Unbinds the view and its children.
  */
  unbind(): void {
    let controllers;
    let bindings;
    let children;
    let i;
    let ii;

    if (this.isBound) {
      this.isBound = false;
      this.resources._invokeHook('beforeUnbind', this);

      if (this.controller !== null) {
        this.controller.unbind();
      }

      bindings = this.bindings;
      for (i = 0, ii = bindings.length; i < ii; ++i) {
        bindings[i].unbind();
      }

      controllers = this.controllers;
      for (i = 0, ii = controllers.length; i < ii; ++i) {
        controllers[i].unbind();
      }

      children = this.children;
      for (i = 0, ii = children.length; i < ii; ++i) {
        children[i].unbind();
      }

      this.bindingContext = null;
      this.overrideContext = null;
    }
  }

  /**
  * Inserts this view's nodes before the specified DOM node.
  * @param refNode The node to insert this view's nodes before.
  */
  insertNodesBefore(refNode: Node): void {
    refNode.parentNode.insertBefore(this.fragment, refNode);
  }

  /**
  * Appends this view's to the specified DOM node.
  * @param parent The parent element to append this view's nodes to.
  */
  appendNodesTo(parent: Element): void {
    parent.appendChild(this.fragment);
  }

  /**
  * Removes this view's nodes from the DOM.
  */
  removeNodes(): void {
    let fragment = this.fragment;
    let current = this.firstChild;
    let end = this.lastChild;
    let next;

    while (current) {
      next = current.nextSibling;
      fragment.appendChild(current);

      if (current === end) {
        break;
      }

      current = next;
    }
  }

  /**
  * Triggers the attach for the view and its children.
  */
  attached(): void {
    let controllers;
    let children;
    let i;
    let ii;

    if (this.isAttached) {
      return;
    }

    this.isAttached = true;

    if (this.controller !== null) {
      this.controller.attached();
    }

    controllers = this.controllers;
    for (i = 0, ii = controllers.length; i < ii; ++i) {
      controllers[i].attached();
    }

    children = this.children;
    for (i = 0, ii = children.length; i < ii; ++i) {
      children[i].attached();
    }
  }

  /**
  * Triggers the detach for the view and its children.
  */
  detached(): void {
    let controllers;
    let children;
    let i;
    let ii;

    if (this.isAttached) {
      this.isAttached = false;

      if (this.controller !== null) {
        this.controller.detached();
      }

      controllers = this.controllers;
      for (i = 0, ii = controllers.length; i < ii; ++i) {
        controllers[i].detached();
      }

      children = this.children;
      for (i = 0, ii = children.length; i < ii; ++i) {
        children[i].detached();
      }
    }
  }
}

/**
* An optional interface describing the created convention.
*/
interface ComponentCreated {
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
interface ComponentBind {
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
interface ComponentAttached {
    /**
    * Implement this hook if you want to perform custom logic when the component is attached to the DOM (in document).
    */
    attached(): void;
}

/**
* An optional interface describing the detached convention.
*/
interface ComponentDetached {
    /**
    * Implement this hook if you want to perform custom logic if/when the component is removed from the the DOM.
    */
    detached(): void;
}

/**
* An optional interface describing the unbind convention.
*/
interface ComponentUnbind {
    /**
    * Implement this hook if you want to perform custom logic after the component is detached and unbound.
    */
    unbind(): void;
}

/**
* An optional interface describing the getViewStrategy convention for dynamic components (used with the compose element or the router).
*/
interface DynamicComponentGetViewStrategy {
    /**
    * Implement this hook if you want to provide custom view strategy when this component is used with the compose element or the router.
    */
    getViewStrategy(): string|ViewStrategy;
}

function getAnimatableElement(view) {
  if (view.animatableElement !== undefined) {
    return view.animatableElement;
  }

  let current = view.firstChild;

  while (current && current.nodeType !== 1) {
    current = current.nextSibling;
  }

  if (current && current.nodeType === 1) {
    return (view.animatableElement = current.classList.contains('au-animate') ? current : null);
  }

  return (view.animatableElement = null);
}

/**
* Represents a slot or location within the DOM to which views can be added and removed.
* Manages the view lifecycle for its children.
*/
export class ViewSlot {
  /**
  * Creates an instance of ViewSlot.
  * @param anchor The DOM node which will server as the anchor or container for insertion.
  * @param anchorIsContainer Indicates whether the node is a container.
  * @param animator The animator that will controll enter/leave transitions for this slot.
  */
  constructor(anchor: Node, anchorIsContainer: boolean, animator?: Animator = Animator.instance) {
    this.anchor = anchor;
    this.anchorIsContainer = anchorIsContainer;
    this.bindingContext = null;
    this.overrideContext = null;
    this.animator = animator;
    this.children = [];
    this.isBound = false;
    this.isAttached = false;
    this.contentSelectors = null;
    anchor.viewSlot = this;
    anchor.isContentProjectionSource = false;
  }

  /**
   *   Runs the animator against the first animatable element found within the view's fragment
   *   @param  view       The view to use when searching for the element.
   *   @param  direction  The animation direction enter|leave.
   *   @returns An animation complete Promise or undefined if no animation was run.
   */
  animateView(view: View, direction: string = 'enter'): void | Promise<any> {
    let animatableElement = getAnimatableElement(view);

    if (animatableElement !== null) {
      switch (direction) {
      case 'enter':
        return this.animator.enter(animatableElement);
      case 'leave':
        return this.animator.leave(animatableElement);
      default:
        throw new Error('Invalid animation direction: ' + direction);
      }
    }
  }

  /**
  * Takes the child nodes of an existing element that has been converted into a ViewSlot
  * and makes those nodes into a View within the slot.
  */
  transformChildNodesIntoView(): void {
    let parent = this.anchor;

    this.children.push({
      fragment: parent,
      firstChild: parent.firstChild,
      lastChild: parent.lastChild,
      returnToCache() {},
      removeNodes() {
        let last;

        while (last = parent.lastChild) {
          parent.removeChild(last);
        }
      },
      created() {},
      bind() {},
      unbind() {},
      attached() {},
      detached() {}
    });
  }

  /**
  * Binds the slot and it's children.
  * @param bindingContext The binding context to bind to.
  * @param overrideContext A secondary binding context that can override the standard context.
  */
  bind(bindingContext: Object, overrideContext: Object): void {
    let i;
    let ii;
    let children;

    if (this.isBound) {
      if (this.bindingContext === bindingContext) {
        return;
      }

      this.unbind();
    }

    this.isBound = true;
    this.bindingContext = bindingContext = bindingContext || this.bindingContext;
    this.overrideContext = overrideContext = overrideContext || this.overrideContext;

    children = this.children;
    for (i = 0, ii = children.length; i < ii; ++i) {
      children[i].bind(bindingContext, overrideContext, true);
    }
  }

  /**
  * Unbinds the slot and its children.
  */
  unbind(): void {
    if (this.isBound) {
      let i;
      let ii;
      let children = this.children;

      this.isBound = false;
      this.bindingContext = null;
      this.overrideContext = null;

      for (i = 0, ii = children.length; i < ii; ++i) {
        children[i].unbind();
      }
    }
  }

  /**
  * Adds a view to the slot.
  * @param view The view to add.
  * @return May return a promise if the view addition triggered an animation.
  */
  add(view: View): void | Promise<any> {
    if (this.anchorIsContainer) {
      view.appendNodesTo(this.anchor);
    } else {
      view.insertNodesBefore(this.anchor);
    }

    this.children.push(view);

    if (this.isAttached) {
      view.attached();
      return this.animateView(view, 'enter');
    }
  }

  /**
  * Inserts a view into the slot.
  * @param index The index to insert the view at.
  * @param view The view to insert.
  * @return May return a promise if the view insertion triggered an animation.
  */
  insert(index: number, view: View): void | Promise<any> {
    let children = this.children;
    let length = children.length;

    if ((index === 0 && length === 0) || index >= length) {
      return this.add(view);
    }

    view.insertNodesBefore(children[index].firstChild);
    children.splice(index, 0, view);

    if (this.isAttached) {
      view.attached();
      return this.animateView(view, 'enter');
    }
  }

  /**
   * Moves a view across the slot.
   * @param sourceIndex The index the view is currently at.
   * @param targetIndex The index to insert the view at.
   */
  move(sourceIndex, targetIndex) {
    if (sourceIndex === targetIndex) {
      return;
    }

    const children = this.children;
    const view = children[sourceIndex];

    view.removeNodes();
    view.insertNodesBefore(children[targetIndex].firstChild);
    children.splice(sourceIndex, 1);
    children.splice(targetIndex, 0, view);
  }

  /**
  * Removes a view from the slot.
  * @param view The view to remove.
  * @param returnToCache Should the view be returned to the view cache?
  * @param skipAnimation Should the removal animation be skipped?
  * @return May return a promise if the view removal triggered an animation.
  */
  remove(view: View, returnToCache?: boolean, skipAnimation?: boolean): View | Promise<View> {
    return this.removeAt(this.children.indexOf(view), returnToCache, skipAnimation);
  }

  /**
  * Removes many views from the slot.
  * @param viewsToRemove The array of views to remove.
  * @param returnToCache Should the views be returned to the view cache?
  * @param skipAnimation Should the removal animation be skipped?
  * @return May return a promise if the view removal triggered an animation.
  */
  removeMany(viewsToRemove: View[], returnToCache?: boolean, skipAnimation?: boolean): void | Promise<void> {
    const children = this.children;
    let ii = viewsToRemove.length;
    let i;
    let rmPromises = [];

    viewsToRemove.forEach(child => {
      if (skipAnimation) {
        child.removeNodes();
        return;
      }

      let animation = this.animateView(child, 'leave');
      if (animation) {
        rmPromises.push(animation.then(() => child.removeNodes()));
      } else {
        child.removeNodes();
      }
    });

    let removeAction = () => {
      if (this.isAttached) {
        for (i = 0; i < ii; ++i) {
          viewsToRemove[i].detached();
        }
      }

      if (returnToCache) {
        for (i = 0; i < ii; ++i) {
          viewsToRemove[i].returnToCache();
        }
      }

      for (i = 0; i < ii; ++i) {
        const index = children.indexOf(viewsToRemove[i]);
        if (index >= 0) {
          children.splice(index, 1);
        }
      }
    };

    if (rmPromises.length > 0) {
      return Promise.all(rmPromises).then(() => removeAction());
    }

    return removeAction();
  }

  /**
  * Removes a view an a specified index from the slot.
  * @param index The index to remove the view at.
  * @param returnToCache Should the view be returned to the view cache?
  * @param skipAnimation Should the removal animation be skipped?
  * @return May return a promise if the view removal triggered an animation.
  */
  removeAt(index: number, returnToCache?: boolean, skipAnimation?: boolean): View | Promise<View> {
    let view = this.children[index];

    let removeAction = () => {
      index = this.children.indexOf(view);
      view.removeNodes();
      this.children.splice(index, 1);

      if (this.isAttached) {
        view.detached();
      }

      if (returnToCache) {
        view.returnToCache();
      }

      return view;
    };

    if (!skipAnimation) {
      let animation = this.animateView(view, 'leave');
      if (animation) {
        return animation.then(() => removeAction());
      }
    }

    return removeAction();
  }

  /**
  * Removes all views from the slot.
  * @param returnToCache Should the view be returned to the view cache?
  * @param skipAnimation Should the removal animation be skipped?
  * @return May return a promise if the view removals triggered an animation.
  */
  removeAll(returnToCache?: boolean, skipAnimation?: boolean): void | Promise<any> {
    let children = this.children;
    let ii = children.length;
    let i;
    let rmPromises = [];

    children.forEach(child => {
      if (skipAnimation) {
        child.removeNodes();
        return;
      }

      let animation = this.animateView(child, 'leave');
      if (animation) {
        rmPromises.push(animation.then(() => child.removeNodes()));
      } else {
        child.removeNodes();
      }
    });

    let removeAction = () => {
      if (this.isAttached) {
        for (i = 0; i < ii; ++i) {
          children[i].detached();
        }
      }

      if (returnToCache) {
        for (i = 0; i < ii; ++i) {
          const child = children[i];

          if (child) {
            child.returnToCache();
          }
        }
      }

      this.children = [];
    };

    if (rmPromises.length > 0) {
      return Promise.all(rmPromises).then(() => removeAction());
    }

    return removeAction();
  }

  /**
  * Triggers the attach for the slot and its children.
  */
  attached(): void {
    let i;
    let ii;
    let children;
    let child;

    if (this.isAttached) {
      return;
    }

    this.isAttached = true;

    children = this.children;
    for (i = 0, ii = children.length; i < ii; ++i) {
      child = children[i];
      child.attached();
      this.animateView(child, 'enter');
    }
  }

  /**
  * Triggers the detach for the slot and its children.
  */
  detached(): void {
    let i;
    let ii;
    let children;

    if (this.isAttached) {
      this.isAttached = false;
      children = this.children;
      for (i = 0, ii = children.length; i < ii; ++i) {
        children[i].detached();
      }
    }
  }

  projectTo(slots: Object): void {
    this.projectToSlots = slots;
    this.add = this._projectionAdd;
    this.insert = this._projectionInsert;
    this.move = this._projectionMove;
    this.remove = this._projectionRemove;
    this.removeAt = this._projectionRemoveAt;
    this.removeMany = this._projectionRemoveMany;
    this.removeAll = this._projectionRemoveAll;
    this.children.forEach(view => ShadowDOM.distributeView(view, slots, this));
  }

  _projectionAdd(view) {
    ShadowDOM.distributeView(view, this.projectToSlots, this);

    this.children.push(view);

    if (this.isAttached) {
      view.attached();
    }
  }

  _projectionInsert(index, view) {
    if ((index === 0 && !this.children.length) || index >= this.children.length) {
      this.add(view);
    } else {
      ShadowDOM.distributeView(view, this.projectToSlots, this, index);

      this.children.splice(index, 0, view);

      if (this.isAttached) {
        view.attached();
      }
    }
  }

  _projectionMove(sourceIndex, targetIndex) {
    if (sourceIndex === targetIndex) {
      return;
    }

    const children = this.children;
    const view = children[sourceIndex];

    ShadowDOM.undistributeView(view, this.projectToSlots, this);
    ShadowDOM.distributeView(view, this.projectToSlots, this, targetIndex);

    children.splice(sourceIndex, 1);
    children.splice(targetIndex, 0, view);
  }

  _projectionRemove(view, returnToCache) {
    ShadowDOM.undistributeView(view, this.projectToSlots, this);
    this.children.splice(this.children.indexOf(view), 1);

    if (this.isAttached) {
      view.detached();
    }
    if (returnToCache) {
      view.returnToCache();
    }
  }

  _projectionRemoveAt(index, returnToCache) {
    let view = this.children[index];

    ShadowDOM.undistributeView(view, this.projectToSlots, this);
    this.children.splice(index, 1);

    if (this.isAttached) {
      view.detached();
    }
    if (returnToCache) {
      view.returnToCache();
    }
  }

  _projectionRemoveMany(viewsToRemove, returnToCache?) {
    viewsToRemove.forEach(view => this.remove(view, returnToCache));
  }

  _projectionRemoveAll(returnToCache) {
    ShadowDOM.undistributeAll(this.projectToSlots, this);

    let children = this.children;
    let ii = children.length;

    for (let i = 0; i < ii; ++i) {
      if (returnToCache) {
        children[i].returnToCache();
      } else if (this.isAttached) {
        children[i].detached();
      }
    }

    this.children = [];
  }
}

@resolver
class ProviderResolver {
  get(container, key) {
    let id = key.__providerId__;
    return id in container ? container[id] : (container[id] = container.invoke(key));
  }
}

let providerResolverInstance = new ProviderResolver();

function elementContainerGet(key) {
  if (key === DOM.Element) {
    return this.element;
  }

  if (key === BoundViewFactory) {
    if (this.boundViewFactory) {
      return this.boundViewFactory;
    }

    let factory = this.instruction.viewFactory;
    let partReplacements = this.partReplacements;

    if (partReplacements) {
      factory = partReplacements[factory.part] || factory;
    }

    this.boundViewFactory = new BoundViewFactory(this, factory, partReplacements);
    return this.boundViewFactory;
  }

  if (key === ViewSlot) {
    if (this.viewSlot === undefined) {
      this.viewSlot = new ViewSlot(this.element, this.instruction.anchorIsContainer);
      this.element.isContentProjectionSource = this.instruction.lifting;
      this.children.push(this.viewSlot);
    }

    return this.viewSlot;
  }

  if (key === ElementEvents) {
    return this.elementEvents || (this.elementEvents = new ElementEvents(this.element));
  }

  if (key === CompositionTransaction) {
    return this.compositionTransaction || (this.compositionTransaction = this.parent.get(key));
  }

  if (key === ViewResources) {
    return this.viewResources;
  }

  if (key === TargetInstruction) {
    return this.instruction;
  }

  return this.superGet(key);
}

function createElementContainer(parent, element, instruction, children, partReplacements, resources) {
  let container = parent.createChild();
  let providers;
  let i;

  container.element = element;
  container.instruction = instruction;
  container.children = children;
  container.viewResources = resources;
  container.partReplacements = partReplacements;

  providers = instruction.providers;
  i = providers.length;

  while (i--) {
    container._resolvers.set(providers[i], providerResolverInstance);
  }

  container.superGet = container.get;
  container.get = elementContainerGet;

  return container;
}

function hasAttribute(name) {
  return this._element.hasAttribute(name);
}

function getAttribute(name) {
  return this._element.getAttribute(name);
}

function setAttribute(name, value) {
  this._element.setAttribute(name, value);
}

function makeElementIntoAnchor(element, elementInstruction) {
  let anchor = DOM.createComment('anchor');

  if (elementInstruction) {
    let firstChild = element.firstChild;

    if (firstChild && firstChild.tagName === 'AU-CONTENT') {
      anchor.contentElement = firstChild;
    }

    anchor._element = element;

    anchor.hasAttribute = hasAttribute;
    anchor.getAttribute = getAttribute;
    anchor.setAttribute = setAttribute;
  }

  DOM.replaceNode(anchor, element);

  return anchor;
}

/**
 * @param {Container[]} containers
 * @param {Element} element
 * @param {TargetInstruction} instruction
 * @param {Controller[]} controllers
 * @param {Binding[]} bindings
 * @param {ViewNode[]} children
 * @param {Record<string, ShadowSlot>} shadowSlots
 * @param {Record<string, ViewFactory>} partReplacements
 * @param {ViewResources} resources
 */
function applyInstructions(containers, element, instruction, controllers, bindings, children, shadowSlots, partReplacements, resources) {
  let behaviorInstructions = instruction.behaviorInstructions;
  let expressions = instruction.expressions;
  let elementContainer;
  let i;
  let ii;
  let current;
  let instance;

  if (instruction.contentExpression) {
    bindings.push(instruction.contentExpression.createBinding(element.nextSibling));
    element.nextSibling.auInterpolationTarget = true;
    element.parentNode.removeChild(element);
    return;
  }

  if (instruction.shadowSlot) {
    let commentAnchor = DOM.createComment('slot');
    let slot;

    if (instruction.slotDestination) {
      slot = new PassThroughSlot(commentAnchor, instruction.slotName, instruction.slotDestination, instruction.slotFallbackFactory);
    } else {
      slot = new ShadowSlot(commentAnchor, instruction.slotName, instruction.slotFallbackFactory);
    }

    DOM.replaceNode(commentAnchor, element);
    shadowSlots[instruction.slotName] = slot;
    controllers.push(slot);
    return;
  }

  if (instruction.letElement) {
    for (i = 0, ii = expressions.length; i < ii; ++i) {
      bindings.push(expressions[i].createBinding());
    }
    element.parentNode.removeChild(element);
    return;
  }

  if (behaviorInstructions.length) {
    if (!instruction.anchorIsContainer) {
      element = makeElementIntoAnchor(element, instruction.elementInstruction);
    }

    containers[instruction.injectorId] = elementContainer =
      createElementContainer(
        containers[instruction.parentInjectorId],
        element,
        instruction,
        children,
        partReplacements,
        resources
        );

    for (i = 0, ii = behaviorInstructions.length; i < ii; ++i) {
      current = behaviorInstructions[i];
      instance = current.type.create(elementContainer, current, element, bindings);
      controllers.push(instance);
    }
  }

  for (i = 0, ii = expressions.length; i < ii; ++i) {
    bindings.push(expressions[i].createBinding(element));
  }
}

function styleStringToObject(style, target) {
  let attributes = style.split(';');
  let firstIndexOfColon;
  let i;
  let current;
  let key;
  let value;

  target = target || {};

  for (i = 0; i < attributes.length; i++) {
    current = attributes[i];
    firstIndexOfColon = current.indexOf(':');
    key = current.substring(0, firstIndexOfColon).trim();
    value = current.substring(firstIndexOfColon + 1).trim();
    target[key] = value;
  }

  return target;
}

function styleObjectToString(obj) {
  let result = '';

  for (let key in obj) {
    result += key + ':' + obj[key] + ';';
  }

  return result;
}

function applySurrogateInstruction(container, element, instruction, controllers, bindings, children) {
  let behaviorInstructions = instruction.behaviorInstructions;
  let expressions = instruction.expressions;
  let providers = instruction.providers;
  let values = instruction.values;
  let i;
  let ii;
  let current;
  let instance;
  let currentAttributeValue;

  i = providers.length;
  while (i--) {
    container._resolvers.set(providers[i], providerResolverInstance);
  }

  //apply surrogate attributes
  for (let key in values) {
    currentAttributeValue = element.getAttribute(key);

    if (currentAttributeValue) {
      if (key === 'class') {
        //merge the surrogate classes
        element.setAttribute('class', currentAttributeValue + ' ' + values[key]);
      } else if (key === 'style') {
        //merge the surrogate styles
        let styleObject = styleStringToObject(values[key]);
        styleStringToObject(currentAttributeValue, styleObject);
        element.setAttribute('style', styleObjectToString(styleObject));
      }

      //otherwise, do not overwrite the consumer's attribute
    } else {
      //copy the surrogate attribute
      element.setAttribute(key, values[key]);
    }
  }

  //apply surrogate behaviors
  if (behaviorInstructions.length) {
    for (i = 0, ii = behaviorInstructions.length; i < ii; ++i) {
      current = behaviorInstructions[i];
      instance = current.type.create(container, current, element, bindings);

      if (instance.contentView) {
        children.push(instance.contentView);
      }

      controllers.push(instance);
    }
  }

  //apply surrogate bindings
  for (i = 0, ii = expressions.length; i < ii; ++i) {
    bindings.push(expressions[i].createBinding(element));
  }
}

/**
* A factory capable of creating View instances, bound to a location within another view hierarchy.
*/
export class BoundViewFactory {
  /**
  * Creates an instance of BoundViewFactory.
  * @param parentContainer The parent DI container.
  * @param viewFactory The internal unbound factory.
  * @param partReplacements Part replacement overrides for the internal factory.
  */
  constructor(parentContainer: Container, viewFactory: ViewFactory, partReplacements?: Object) {
    this.parentContainer = parentContainer;
    this.viewFactory = viewFactory;
    this.factoryCreateInstruction = { partReplacements: partReplacements }; //This is referenced internally in the controller's bind method.
  }

  /**
  * Creates a view or returns one from the internal cache, if available.
  * @return The created view.
  */
  create(): View {
    let view = this.viewFactory.create(this.parentContainer.createChild(), this.factoryCreateInstruction);
    view._isUserControlled = true;
    return view;
  }

  /**
  * Indicates whether this factory is currently using caching.
  */
  get isCaching() {
    return this.viewFactory.isCaching;
  }

  /**
  * Sets the cache size for this factory.
  * @param size The number of views to cache or "*" to cache all.
  * @param doNotOverrideIfAlreadySet Indicates that setting the cache should not override the setting if previously set.
  */
  setCacheSize(size: number | string, doNotOverrideIfAlreadySet: boolean): void {
    this.viewFactory.setCacheSize(size, doNotOverrideIfAlreadySet);
  }

  /**
  * Gets a cached view if available...
  * @return A cached view or null if one isn't available.
  */
  getCachedView(): View {
    return this.viewFactory.getCachedView();
  }

  /**
  * Returns a view to the cache.
  * @param view The view to return to the cache if space is available.
  */
  returnViewToCache(view: View): void {
    this.viewFactory.returnViewToCache(view);
  }
}

/**
* A factory capable of creating View instances.
*/
export class ViewFactory {
  /**
  * Indicates whether this factory is currently using caching.
  */
  isCaching = false;

  /**
  * Creates an instance of ViewFactory.
  * @param template The document fragment that serves as a template for the view to be created.
  * @param instructions The instructions to be applied ot the template during the creation of a view.
  * @param resources The resources used to compile this factory.
  */
  constructor(template: DocumentFragment, instructions: Object, resources: ViewResources) {
    this.template = template;
    this.instructions = instructions;
    this.resources = resources;
    this.cacheSize = -1;
    this.cache = null;
  }

  /**
  * Sets the cache size for this factory.
  * @param size The number of views to cache or "*" to cache all.
  * @param doNotOverrideIfAlreadySet Indicates that setting the cache should not override the setting if previously set.
  */
  setCacheSize(size: number | string, doNotOverrideIfAlreadySet: boolean): void {
    if (size) {
      if (size === '*') {
        size = Number.MAX_VALUE;
      } else if (typeof size === 'string') {
        size = parseInt(size, 10);
      }
    }

    if (this.cacheSize === -1 || !doNotOverrideIfAlreadySet) {
      this.cacheSize = size;
    }

    if (this.cacheSize > 0) {
      this.cache = [];
    } else {
      this.cache = null;
    }

    this.isCaching = this.cacheSize > 0;
  }

  /**
  * Gets a cached view if available...
  * @return A cached view or null if one isn't available.
  */
  getCachedView(): View {
    return this.cache !== null ? (this.cache.pop() || null) : null;
  }

  /**
  * Returns a view to the cache.
  * @param view The view to return to the cache if space is available.
  */
  returnViewToCache(view: View): void {
    if (view.isAttached) {
      view.detached();
    }

    if (view.isBound) {
      view.unbind();
    }

    if (this.cache !== null && this.cache.length < this.cacheSize) {
      view.fromCache = true;
      this.cache.push(view);
    }
  }

  /**
  * Creates a view or returns one from the internal cache, if available.
  * @param container The container to create the view from.
  * @param createInstruction The instruction used to customize view creation.
  * @param element The custom element that hosts the view.
  * @return The created view.
  */
  create(container: Container, createInstruction?: ViewCreateInstruction, element?: Element): View {
    createInstruction = createInstruction || BehaviorInstruction.normal;

    let cachedView = this.getCachedView();
    if (cachedView !== null) {
      return cachedView;
    }

    let fragment = createInstruction.enhance ? this.template : this.template.cloneNode(true);
    let instructables = fragment.querySelectorAll('.au-target');
    let instructions = this.instructions;
    let resources = this.resources;
    let controllers = [];
    let bindings = [];
    let children = [];
    let shadowSlots = Object.create(null);
    let containers = { root: container };
    let partReplacements = createInstruction.partReplacements;
    let i;
    let ii;
    let view;
    let instructable;
    let instruction;

    this.resources._invokeHook('beforeCreate', this, container, fragment, createInstruction);

    if (element && this.surrogateInstruction !== null) {
      applySurrogateInstruction(container, element, this.surrogateInstruction, controllers, bindings, children);
    }

    if (createInstruction.enhance && fragment.hasAttribute('au-target-id')) {
      instructable = fragment;
      instruction = instructions[instructable.getAttribute('au-target-id')];
      applyInstructions(containers, instructable, instruction, controllers, bindings, children, shadowSlots, partReplacements, resources);
    }

    for (i = 0, ii = instructables.length; i < ii; ++i) {
      instructable = instructables[i];
      instruction = instructions[instructable.getAttribute('au-target-id')];
      applyInstructions(containers, instructable, instruction, controllers, bindings, children, shadowSlots, partReplacements, resources);
    }

    view = new View(container, this, fragment, controllers, bindings, children, shadowSlots);

    //if iniated by an element behavior, let the behavior trigger this callback once it's done creating the element
    if (!createInstruction.initiatedByBehavior) {
      view.created();
    }

    this.resources._invokeHook('afterCreate', view);

    return view;
  }
}

let nextInjectorId = 0;
function getNextInjectorId() {
  return ++nextInjectorId;
}

let lastAUTargetID = 0;
function getNextAUTargetID() {
  return (++lastAUTargetID).toString();
}

function makeIntoInstructionTarget(element) {
  let value = element.getAttribute('class');
  let auTargetID = getNextAUTargetID();

  element.setAttribute('class', (value ? value + ' au-target' : 'au-target'));
  element.setAttribute('au-target-id', auTargetID);

  return auTargetID;
}

function makeShadowSlot(compiler, resources, node, instructions, parentInjectorId) {
  let auShadowSlot = DOM.createElement('au-shadow-slot');
  DOM.replaceNode(auShadowSlot, node);

  let auTargetID = makeIntoInstructionTarget(auShadowSlot);
  let instruction = TargetInstruction.shadowSlot(parentInjectorId);

  instruction.slotName = node.getAttribute('name') || ShadowDOM.defaultSlotKey;
  instruction.slotDestination = node.getAttribute('slot');

  if (node.innerHTML.trim()) {
    let fragment = DOM.createDocumentFragment();
    let child;

    while (child = node.firstChild) {
      fragment.appendChild(child);
    }

    instruction.slotFallbackFactory = compiler.compile(fragment, resources);
  }

  instructions[auTargetID] = instruction;

  return auShadowSlot;
}

const defaultLetHandler = BindingLanguage.prototype.createLetExpressions;

/**
* Compiles html templates, dom fragments and strings into ViewFactory instances, capable of instantiating Views.
*/
@inject(BindingLanguage, ViewResources)
export class ViewCompiler {
  /**
  * Creates an instance of ViewCompiler.
  * @param bindingLanguage The default data binding language and syntax used during view compilation.
  * @param resources The global resources used during compilation when none are provided for compilation.
  */
  constructor(bindingLanguage: BindingLanguage, resources: ViewResources) {
    this.bindingLanguage = bindingLanguage;
    this.resources = resources;
  }

  /**
  * Compiles an html template, dom fragment or string into ViewFactory instances, capable of instantiating Views.
  * @param source The template, fragment or string to compile.
  * @param resources The view resources used during compilation.
  * @param compileInstruction A set of instructions that customize how compilation occurs.
  * @return The compiled ViewFactory.
  */
  compile(source: Element|DocumentFragment|string, resources?: ViewResources, compileInstruction?: ViewCompileInstruction): ViewFactory {
    resources = resources || this.resources;
    compileInstruction = compileInstruction || ViewCompileInstruction.normal;
    source = typeof source === 'string' ? DOM.createTemplateFromMarkup(source) : source;

    let content;
    let part;
    let cacheSize;

    if (source.content) {
      part = source.getAttribute('part');
      cacheSize = source.getAttribute('view-cache');
      content = DOM.adoptNode(source.content);
    } else {
      content = source;
    }

    compileInstruction.targetShadowDOM = compileInstruction.targetShadowDOM && FEATURE.shadowDOM;
    resources._invokeHook('beforeCompile', content, resources, compileInstruction);

    let instructions = {};
    this._compileNode(content, resources, instructions, source, 'root', !compileInstruction.targetShadowDOM);

    let firstChild = content.firstChild;
    if (firstChild && firstChild.nodeType === 1) {
      let targetId = firstChild.getAttribute('au-target-id');
      if (targetId) {
        let ins = instructions[targetId];

        if (ins.shadowSlot || ins.lifting || (ins.elementInstruction && !ins.elementInstruction.anchorIsContainer)) {
          content.insertBefore(DOM.createComment('view'), firstChild);
        }
      }
    }

    let factory = new ViewFactory(content, instructions, resources);

    factory.surrogateInstruction = compileInstruction.compileSurrogate ? this._compileSurrogate(source, resources) : null;
    factory.part = part;

    if (cacheSize) {
      factory.setCacheSize(cacheSize);
    }

    resources._invokeHook('afterCompile', factory);

    return factory;
  }

  _compileNode(node, resources, instructions, parentNode, parentInjectorId, targetLightDOM) {
    switch (node.nodeType) {
    case 1: //element node
      return this._compileElement(node, resources, instructions, parentNode, parentInjectorId, targetLightDOM);
    case 3: //text node
      //use wholeText to retrieve the textContent of all adjacent text nodes.
      let expression = resources.getBindingLanguage(this.bindingLanguage).inspectTextContent(resources, node.wholeText);
      if (expression) {
        let marker = DOM.createElement('au-marker');
        let auTargetID = makeIntoInstructionTarget(marker);
        (node.parentNode || parentNode).insertBefore(marker, node);
        node.textContent = ' ';
        instructions[auTargetID] = TargetInstruction.contentExpression(expression);
        //remove adjacent text nodes.
        while (node.nextSibling && node.nextSibling.nodeType === 3) {
          (node.parentNode || parentNode).removeChild(node.nextSibling);
        }
      } else {
        //skip parsing adjacent text nodes.
        while (node.nextSibling && node.nextSibling.nodeType === 3) {
          node = node.nextSibling;
        }
      }
      return node.nextSibling;
    case 11: //document fragment node
      let currentChild = node.firstChild;
      while (currentChild) {
        currentChild = this._compileNode(currentChild, resources, instructions, node, parentInjectorId, targetLightDOM);
      }
      break;
    default:
      break;
    }

    return node.nextSibling;
  }

  _compileSurrogate(node, resources) {
    let tagName = node.tagName.toLowerCase();
    let attributes = node.attributes;
    let bindingLanguage = resources.getBindingLanguage(this.bindingLanguage);
    let knownAttribute;
    let property;
    let instruction;
    let i;
    let ii;
    let attr;
    let attrName;
    let attrValue;
    let info;
    let type;
    let expressions = [];
    let expression;
    let behaviorInstructions = [];
    let values = {};
    let hasValues = false;
    let providers = [];

    for (i = 0, ii = attributes.length; i < ii; ++i) {
      attr = attributes[i];
      attrName = attr.name;
      attrValue = attr.value;

      info = bindingLanguage.inspectAttribute(resources, tagName, attrName, attrValue);
      type = resources.getAttribute(info.attrName);

      if (type) { //do we have an attached behavior?
        knownAttribute = resources.mapAttribute(info.attrName); //map the local name to real name
        if (knownAttribute) {
          property = type.attributes[knownAttribute];

          if (property) { //if there's a defined property
            info.defaultBindingMode = property.defaultBindingMode; //set the default binding mode

            if (!info.command && !info.expression) { // if there is no command or detected expression
              info.command = property.hasOptions ? 'options' : null; //and it is an optons property, set the options command
            }

            // if the attribute itself is bound to a default attribute value then we have to
            // associate the attribute value with the name of the default bindable property
            // (otherwise it will remain associated with "value")
            if (info.command && (info.command !== 'options') && type.primaryProperty) {
              const primaryProperty = type.primaryProperty;
              attrName = info.attrName = primaryProperty.attribute;
              // note that the defaultBindingMode always overrides the attribute bindingMode which is only used for "single-value" custom attributes
              // when using the syntax `<div square.bind="color"></div>`
              info.defaultBindingMode = primaryProperty.defaultBindingMode;
            }
          }
        }
      }

      instruction = bindingLanguage.createAttributeInstruction(resources, node, info, undefined, type);

      if (instruction) { //HAS BINDINGS
        if (instruction.alteredAttr) {
          type = resources.getAttribute(instruction.attrName);
        }

        if (instruction.discrete) { //ref binding or listener binding
          expressions.push(instruction);
        } else { //attribute bindings
          if (type) { //templator or attached behavior found
            instruction.type = type;
            this._configureProperties(instruction, resources);

            if (type.liftsContent) { //template controller
              throw new Error('You cannot place a template controller on a surrogate element.');
            } else { //attached behavior
              behaviorInstructions.push(instruction);
            }
          } else { //standard attribute binding
            expressions.push(instruction.attributes[instruction.attrName]);
          }
        }
      } else { //NO BINDINGS
        if (type) { //templator or attached behavior found
          instruction = BehaviorInstruction.attribute(attrName, type);
          instruction.attributes[resources.mapAttribute(attrName)] = attrValue;

          if (type.liftsContent) { //template controller
            throw new Error('You cannot place a template controller on a surrogate element.');
          } else { //attached behavior
            behaviorInstructions.push(instruction);
          }
        } else if (attrName !== 'id' && attrName !== 'part' && attrName !== 'replace-part') {
          hasValues = true;
          values[attrName] = attrValue;
        }
      }
    }

    if (expressions.length || behaviorInstructions.length || hasValues) {
      for (i = 0, ii = behaviorInstructions.length; i < ii; ++i) {
        instruction = behaviorInstructions[i];
        instruction.type.compile(this, resources, node, instruction);
        providers.push(instruction.type.target);
      }

      for (i = 0, ii = expressions.length; i < ii; ++i) {
        expression =  expressions[i];
        if (expression.attrToRemove !== undefined) {
          node.removeAttribute(expression.attrToRemove);
        }
      }

      return TargetInstruction.surrogate(providers, behaviorInstructions, expressions, values);
    }

    return null;
  }

  _compileElement(node: Node, resources: ViewResources, instructions: any, parentNode: Node, parentInjectorId: number, targetLightDOM: boolean) {
    let tagName = node.tagName.toLowerCase();
    let attributes = node.attributes;
    let expressions = [];
    let expression;
    let behaviorInstructions = [];
    let providers = [];
    let bindingLanguage = resources.getBindingLanguage(this.bindingLanguage);
    let liftingInstruction;
    let viewFactory;
    let type;
    let elementInstruction;
    let elementProperty;
    let i;
    let ii;
    let attr;
    let attrName;
    let attrValue;
    let originalAttrName;
    let instruction;
    let info;
    let property;
    let knownAttribute;
    let auTargetID;
    let injectorId;

    if (tagName === 'slot') {
      if (targetLightDOM) {
        node = makeShadowSlot(this, resources, node, instructions, parentInjectorId);
      }
      return node.nextSibling;
    } else if (tagName === 'template') {
      if (!('content' in node)) {
        throw new Error('You cannot place a template element within ' + node.namespaceURI + ' namespace');
      }
      viewFactory = this.compile(node, resources);
      viewFactory.part = node.getAttribute('part');
    } else {
      type = resources.getElement(node.getAttribute('as-element') || tagName);
      // Only attempt to process a <let/> when it's not a custom element,
      // and the binding language has an implementation for it
      // This is an backward compat move
      if (tagName === 'let' && !type && bindingLanguage.createLetExpressions !== defaultLetHandler) {
        expressions = bindingLanguage.createLetExpressions(resources, node);
        auTargetID = makeIntoInstructionTarget(node);
        instructions[auTargetID] = TargetInstruction.letElement(expressions);
        return node.nextSibling;
      }
      if (type) {
        elementInstruction = BehaviorInstruction.element(node, type);
        type.processAttributes(this, resources, node, attributes, elementInstruction);
        behaviorInstructions.push(elementInstruction);
      }
    }

    for (i = 0, ii = attributes.length; i < ii; ++i) {
      attr = attributes[i];
      originalAttrName = attrName = attr.name;
      attrValue = attr.value;
      info = bindingLanguage.inspectAttribute(resources, tagName, attrName, attrValue);

      if (targetLightDOM && info.attrName === 'slot') {
        info.attrName = attrName = 'au-slot';
      }

      type = resources.getAttribute(info.attrName);
      elementProperty = null;

      if (type) { //do we have an attached behavior?
        knownAttribute = resources.mapAttribute(info.attrName); //map the local name to real name
        if (knownAttribute) {
          property = type.attributes[knownAttribute];

          if (property) { //if there's a defined property
            info.defaultBindingMode = property.defaultBindingMode; //set the default binding mode

            if (!info.command && !info.expression) { // if there is no command or detected expression
              info.command = property.hasOptions ? 'options' : null; //and it is an optons property, set the options command
            }

            // if the attribute itself is bound to a default attribute value then we have to
            // associate the attribute value with the name of the default bindable property
            // (otherwise it will remain associated with "value")
            if (info.command && (info.command !== 'options') && type.primaryProperty) {
              const primaryProperty = type.primaryProperty;
              attrName = info.attrName = primaryProperty.attribute;
              // note that the defaultBindingMode always overrides the attribute bindingMode which is only used for "single-value" custom attributes
              // when using the syntax `<div square.bind="color"></div>`
              info.defaultBindingMode = primaryProperty.defaultBindingMode;
            }
          }
        }
      } else if (elementInstruction) { //or if this is on a custom element
        elementProperty = elementInstruction.type.attributes[info.attrName];
        if (elementProperty) { //and this attribute is a custom property
          info.defaultBindingMode = elementProperty.defaultBindingMode; //set the default binding mode
        }
      }

      if (elementProperty) {
        instruction = bindingLanguage.createAttributeInstruction(resources, node, info, elementInstruction);
      } else {
        instruction = bindingLanguage.createAttributeInstruction(resources, node, info, undefined, type);
      }

      if (instruction) { //HAS BINDINGS
        if (instruction.alteredAttr) {
          type = resources.getAttribute(instruction.attrName);
        }

        if (instruction.discrete) { //ref binding or listener binding
          expressions.push(instruction);
        } else { //attribute bindings
          if (type) { //templator or attached behavior found
            instruction.type = type;
            this._configureProperties(instruction, resources);

            if (type.liftsContent) { //template controller
              instruction.originalAttrName = originalAttrName;
              liftingInstruction = instruction;
              break;
            } else { //attached behavior
              behaviorInstructions.push(instruction);
            }
          } else if (elementProperty) { //custom element attribute
            elementInstruction.attributes[info.attrName].targetProperty = elementProperty.name;
          } else { //standard attribute binding
            expressions.push(instruction.attributes[instruction.attrName]);
          }
        }
      } else { //NO BINDINGS
        if (type) { //templator or attached behavior found
          instruction = BehaviorInstruction.attribute(attrName, type);
          instruction.attributes[resources.mapAttribute(attrName)] = attrValue;

          if (type.liftsContent) { //template controller
            instruction.originalAttrName = originalAttrName;
            liftingInstruction = instruction;
            break;
          } else { //attached behavior
            behaviorInstructions.push(instruction);
          }
        } else if (elementProperty) { //custom element attribute
          elementInstruction.attributes[attrName] = attrValue;
        }

        //else; normal attribute; do nothing
      }
    }

    if (liftingInstruction) {
      liftingInstruction.viewFactory = viewFactory;
      node = liftingInstruction.type.compile(this, resources, node, liftingInstruction, parentNode);
      auTargetID = makeIntoInstructionTarget(node);
      instructions[auTargetID] = TargetInstruction.lifting(parentInjectorId, liftingInstruction);
    } else {
      let skipContentProcessing = false;

      if (expressions.length || behaviorInstructions.length) {
        injectorId = behaviorInstructions.length ? getNextInjectorId() : false;

        for (i = 0, ii = behaviorInstructions.length; i < ii; ++i) {
          instruction = behaviorInstructions[i];
          instruction.type.compile(this, resources, node, instruction, parentNode);
          providers.push(instruction.type.target);
          skipContentProcessing = skipContentProcessing || instruction.skipContentProcessing;
        }

        for (i = 0, ii = expressions.length; i < ii; ++i) {
          expression =  expressions[i];
          if (expression.attrToRemove !== undefined) {
            node.removeAttribute(expression.attrToRemove);
          }
        }

        auTargetID = makeIntoInstructionTarget(node);
        instructions[auTargetID] = TargetInstruction.normal(
          injectorId,
          parentInjectorId,
          providers,
          behaviorInstructions,
          expressions,
          elementInstruction
        );
      }

      if (skipContentProcessing) {
        return node.nextSibling;
      }

      let currentChild = node.firstChild;
      while (currentChild) {
        currentChild = this._compileNode(currentChild, resources, instructions, node, injectorId || parentInjectorId, targetLightDOM);
      }
    }

    return node.nextSibling;
  }

  _configureProperties(instruction, resources) {
    let type = instruction.type;
    let attrName = instruction.attrName;
    let attributes = instruction.attributes;
    let property;
    let key;
    let value;

    let knownAttribute = resources.mapAttribute(attrName);
    if (knownAttribute && attrName in attributes && knownAttribute !== attrName) {
      attributes[knownAttribute] = attributes[attrName];
      delete attributes[attrName];
    }

    for (key in attributes) {
      value = attributes[key];

      if (value !== null && typeof value === 'object') {
        property = type.attributes[key];

        if (property !== undefined) {
          value.targetProperty = property.name;
        } else {
          value.targetProperty = key;
        }
      }
    }
  }
}

/**
* Represents a module with view resources.
*/
export class ResourceModule {
  /**
  * Creates an instance of ResourceModule.
  * @param moduleId The id of the module that contains view resources.
  */
  constructor(moduleId: string) {
    this.id = moduleId;
    this.moduleInstance = null;
    this.mainResource = null;
    this.resources = null;
    this.viewStrategy = null;
    this.isInitialized = false;
    this.onLoaded = null;
    this.loadContext = null;
  }

  /**
  * Initializes the resources within the module.
  * @param container The dependency injection container usable during resource initialization.
  */
  initialize(container: Container): void {
    let current = this.mainResource;
    let resources = this.resources;
    let vs = this.viewStrategy;

    if (this.isInitialized) {
      return;
    }

    this.isInitialized = true;

    if (current !== undefined) {
      current.metadata.viewStrategy = vs;
      current.initialize(container);
    }

    for (let i = 0, ii = resources.length; i < ii; ++i) {
      current = resources[i];
      current.metadata.viewStrategy = vs;
      current.initialize(container);
    }
  }

  /**
  * Registers the resources in the module with the view resources.
  * @param registry The registry of view resources to regiser within.
  * @param name The name to use in registering the default resource.
  */
  register(registry:ViewResources, name?:string): void {
    let main = this.mainResource;
    let resources = this.resources;

    if (main !== undefined) {
      main.register(registry, name);
      name = null;
    }

    for (let i = 0, ii = resources.length; i < ii; ++i) {
      resources[i].register(registry, name);
      name = null;
    }
  }

  /**
  * Loads any dependencies of the resources within this module.
  * @param container The DI container to use during dependency resolution.
  * @param loadContext The loading context used for loading all resources and dependencies.
  * @return A promise that resolves when all loading is complete.
  */
  load(container: Container, loadContext?: ResourceLoadContext): Promise<void> {
    if (this.onLoaded !== null) {
      //if it's trying to load the same thing again during the same load, this is a circular dep, so just resolve
      return this.loadContext === loadContext ? Promise.resolve() : this.onLoaded;
    }

    let main = this.mainResource;
    let resources = this.resources;
    let loads;

    if (main !== undefined) {
      loads = new Array(resources.length + 1);
      loads[0] = main.load(container, loadContext);
      for (let i = 0, ii = resources.length; i < ii; ++i) {
        loads[i + 1] = resources[i].load(container, loadContext);
      }
    } else {
      loads = new Array(resources.length);
      for (let i = 0, ii = resources.length; i < ii; ++i) {
        loads[i] = resources[i].load(container, loadContext);
      }
    }

    this.loadContext = loadContext;
    this.onLoaded = Promise.all(loads);
    return this.onLoaded;
  }
}

/**
* Represents a single view resource with a ResourceModule.
*/
export class ResourceDescription {
  /**
  * Creates an instance of ResourceDescription.
  * @param key The key that the resource was exported as.
  * @param exportedValue The exported resource.
  * @param resourceTypeMeta The metadata located on the resource.
  */
  constructor(key: string, exportedValue: any, resourceTypeMeta?: Object) {
    if (!resourceTypeMeta) {
      resourceTypeMeta = metadata.get(metadata.resource, exportedValue);

      if (!resourceTypeMeta) {
        resourceTypeMeta = new HtmlBehaviorResource();
        resourceTypeMeta.elementName = _hyphenate(key);
        metadata.define(metadata.resource, resourceTypeMeta, exportedValue);
      }
    }

    if (resourceTypeMeta instanceof HtmlBehaviorResource) {
      if (resourceTypeMeta.elementName === undefined) {
        //customeElement()
        resourceTypeMeta.elementName = _hyphenate(key);
      } else if (resourceTypeMeta.attributeName === undefined) {
        //customAttribute()
        resourceTypeMeta.attributeName = _hyphenate(key);
      } else if (resourceTypeMeta.attributeName === null && resourceTypeMeta.elementName === null) {
        //no customeElement or customAttribute but behavior added by other metadata
        HtmlBehaviorResource.convention(key, resourceTypeMeta);
      }
    } else if (!resourceTypeMeta.name) {
      resourceTypeMeta.name = _hyphenate(key);
    }

    this.metadata = resourceTypeMeta;
    this.value = exportedValue;
  }

  /**
  * Initializes the resource.
  * @param container The dependency injection container usable during resource initialization.
  */
  initialize(container: Container): void {
    this.metadata.initialize(container, this.value);
  }

  /**
  * Registrers the resource with the view resources.
  * @param registry The registry of view resources to regiser within.
  * @param name The name to use in registering the resource.
  */
  register(registry: ViewResources, name?: string): void {
    this.metadata.register(registry, name);
  }

  /**
  * Loads any dependencies of the resource.
  * @param container The DI container to use during dependency resolution.
  * @param loadContext The loading context used for loading all resources and dependencies.
  * @return A promise that resolves when all loading is complete.
  */
  load(container: Container, loadContext?: ResourceLoadContext): Promise<void> | void {
    return this.metadata.load(container, this.value, loadContext);
  }
}

/**
* Analyzes a module in order to discover the view resources that it exports.
*/
export class ModuleAnalyzer {
  /**
  * Creates an instance of ModuleAnalyzer.
  */
  constructor() {
    this.cache = Object.create(null);
  }

  /**
  * Retrieves the ResourceModule analysis for a previously analyzed module.
  * @param moduleId The id of the module to lookup.
  * @return The ResouceModule if found, undefined otherwise.
  */
  getAnalysis(moduleId: string): ResourceModule {
    return this.cache[moduleId];
  }

  /**
  * Analyzes a module.
  * @param moduleId The id of the module to analyze.
  * @param moduleInstance The module instance to analyze.
  * @param mainResourceKey The name of the main resource.
  * @return The ResouceModule representing the analysis.
  */
  analyze(moduleId: string, moduleInstance: any, mainResourceKey?: string): ResourceModule {
    let mainResource;
    let fallbackValue;
    let fallbackKey;
    let resourceTypeMeta;
    let key;
    let exportedValue;
    let resources = [];
    let conventional;
    let vs;
    let resourceModule;

    resourceModule = this.cache[moduleId];
    if (resourceModule) {
      return resourceModule;
    }

    resourceModule = new ResourceModule(moduleId);
    this.cache[moduleId] = resourceModule;

    if (typeof moduleInstance === 'function') {
      moduleInstance = {'default': moduleInstance};
    }

    if (mainResourceKey) {
      mainResource = new ResourceDescription(mainResourceKey, moduleInstance[mainResourceKey]);
    }

    for (key in moduleInstance) {
      exportedValue = moduleInstance[key];

      if (key === mainResourceKey || typeof exportedValue !== 'function') {
        continue;
      }

      // This is an unexpected behavior for inheritance as it will walk through the whole prototype chain
      // to look for metadata. Should be `getOwn` instead. Though it's subjected to a breaking changes change
      resourceTypeMeta = metadata.get(metadata.resource, exportedValue);

      if (resourceTypeMeta) {
        if (resourceTypeMeta instanceof HtmlBehaviorResource) {
          // first used static resource
          ViewResources.convention(exportedValue, resourceTypeMeta);

          if (resourceTypeMeta.attributeName === null && resourceTypeMeta.elementName === null) {
            //no customeElement or customAttribute but behavior added by other metadata
            HtmlBehaviorResource.convention(key, resourceTypeMeta);
          }

          if (resourceTypeMeta.attributeName === null && resourceTypeMeta.elementName === null) {
            //no convention and no customeElement or customAttribute but behavior added by other metadata
            resourceTypeMeta.elementName = _hyphenate(key);
          }
        }

        if (!mainResource && resourceTypeMeta instanceof HtmlBehaviorResource && resourceTypeMeta.elementName !== null) {
          mainResource = new ResourceDescription(key, exportedValue, resourceTypeMeta);
        } else {
          resources.push(new ResourceDescription(key, exportedValue, resourceTypeMeta));
        }
      } else if (viewStrategy.decorates(exportedValue)) {
        vs = exportedValue;
      } else if (exportedValue instanceof TemplateRegistryEntry) {
        vs = new TemplateRegistryViewStrategy(moduleId, exportedValue);
      } else {
        if (conventional = ViewResources.convention(exportedValue)) {
          if (conventional.elementName !== null && !mainResource) {
            mainResource = new ResourceDescription(key, exportedValue, conventional);
          } else {
            resources.push(new ResourceDescription(key, exportedValue, conventional));
          }
          metadata.define(metadata.resource, conventional, exportedValue);
        } else if (conventional = HtmlBehaviorResource.convention(key)) {
          if (conventional.elementName !== null && !mainResource) {
            mainResource = new ResourceDescription(key, exportedValue, conventional);
          } else {
            resources.push(new ResourceDescription(key, exportedValue, conventional));
          }

          metadata.define(metadata.resource, conventional, exportedValue);
        } else if (conventional = ValueConverterResource.convention(key)
          || BindingBehaviorResource.convention(key)
          || ViewEngineHooksResource.convention(key)) {
          resources.push(new ResourceDescription(key, exportedValue, conventional));
          metadata.define(metadata.resource, conventional, exportedValue);
        } else if (!fallbackValue) {
          fallbackValue = exportedValue;
          fallbackKey = key;
        }
      }
    }

    if (!mainResource && fallbackValue) {
      mainResource = new ResourceDescription(fallbackKey, fallbackValue);
    }

    resourceModule.moduleInstance = moduleInstance;
    resourceModule.mainResource = mainResource;
    resourceModule.resources = resources;
    resourceModule.viewStrategy = vs;

    return resourceModule;
  }
}

let logger = LogManager.getLogger('templating');

function ensureRegistryEntry(loader, urlOrRegistryEntry) {
  if (urlOrRegistryEntry instanceof TemplateRegistryEntry) {
    return Promise.resolve(urlOrRegistryEntry);
  }

  return loader.loadTemplate(urlOrRegistryEntry);
}

class ProxyViewFactory {
  constructor(promise) {
    promise.then(x => this.viewFactory = x);
  }

  create(container: Container, bindingContext?: Object, createInstruction?: ViewCreateInstruction, element?: Element): View {
    return this.viewFactory.create(container, bindingContext, createInstruction, element);
  }

  get isCaching() {
    return this.viewFactory.isCaching;
  }

  setCacheSize(size: number | string, doNotOverrideIfAlreadySet: boolean): void {
    this.viewFactory.setCacheSize(size, doNotOverrideIfAlreadySet);
  }

  getCachedView(): View {
    return this.viewFactory.getCachedView();
  }

  returnViewToCache(view: View): void {
    this.viewFactory.returnViewToCache(view);
  }
}

let auSlotBehavior = null;

/**
* Controls the view resource loading pipeline.
*/
@inject(Loader, Container, ViewCompiler, ModuleAnalyzer, ViewResources)
export class ViewEngine {
  /**
  * The metadata key for storing requires declared in a ViewModel.
  */
  static viewModelRequireMetadataKey = 'aurelia:view-model-require';

  /**
  * Creates an instance of ViewEngine.
  * @param loader The module loader.
  * @param container The root DI container for the app.
  * @param viewCompiler The view compiler.
  * @param moduleAnalyzer The module analyzer.
  * @param appResources The app-level global resources.
  */
  constructor(loader: Loader, container: Container, viewCompiler: ViewCompiler, moduleAnalyzer: ModuleAnalyzer, appResources: ViewResources) {
    this.loader = loader;
    this.container = container;
    this.viewCompiler = viewCompiler;
    this.moduleAnalyzer = moduleAnalyzer;
    this.appResources = appResources;
    this._pluginMap = {};

    if (auSlotBehavior === null) {
      auSlotBehavior  = new HtmlBehaviorResource();
      auSlotBehavior.attributeName = 'au-slot';
      metadata.define(metadata.resource, auSlotBehavior, SlotCustomAttribute);
    }

    auSlotBehavior.initialize(container, SlotCustomAttribute);
    auSlotBehavior.register(appResources);
  }

  /**
  * Adds a resource plugin to the resource loading pipeline.
  * @param extension The file extension to match in require elements.
  * @param implementation The plugin implementation that handles the resource type.
  */
  addResourcePlugin(extension: string, implementation: Object): void {
    let name = extension.replace('.', '') + '-resource-plugin';
    this._pluginMap[extension] = name;
    this.loader.addPlugin(name, implementation);
  }

  /**
  * Loads and compiles a ViewFactory from a url or template registry entry.
  * @param urlOrRegistryEntry A url or template registry entry to generate the view factory for.
  * @param compileInstruction Instructions detailing how the factory should be compiled.
  * @param loadContext The load context if this factory load is happening within the context of a larger load operation.
  * @param target A class from which to extract metadata of additional resources to load.
  * @return A promise for the compiled view factory.
  */
  loadViewFactory(urlOrRegistryEntry: string|TemplateRegistryEntry, compileInstruction?: ViewCompileInstruction, loadContext?: ResourceLoadContext, target?: any): Promise<ViewFactory> {
    loadContext = loadContext || new ResourceLoadContext();

    return ensureRegistryEntry(this.loader, urlOrRegistryEntry).then(registryEntry => {
      const url = registryEntry.address;

      if (registryEntry.onReady) {
        if (!loadContext.hasDependency(url)) {
          loadContext.addDependency(url);
          return registryEntry.onReady;
        }

        if (registryEntry.template === null) {
          // handle NoViewStrategy:
          return registryEntry.onReady;
        }

        return Promise.resolve(new ProxyViewFactory(registryEntry.onReady));
      }

      loadContext.addDependency(url);

      registryEntry.onReady = this.loadTemplateResources(registryEntry, compileInstruction, loadContext, target).then(resources => {
        registryEntry.resources = resources;

        if (registryEntry.template === null) {
          // handle NoViewStrategy:
          return registryEntry.factory = null;
        }

        let viewFactory = this.viewCompiler.compile(registryEntry.template, resources, compileInstruction);
        return registryEntry.factory = viewFactory;
      });

      return registryEntry.onReady;
    });
  }

  /**
  * Loads all the resources specified by the registry entry.
  * @param registryEntry The template registry entry to load the resources for.
  * @param compileInstruction The compile instruction associated with the load.
  * @param loadContext The load context if this is happening within the context of a larger load operation.
  * @param target A class from which to extract metadata of additional resources to load.
  * @return A promise of ViewResources for the registry entry.
  */
  loadTemplateResources(registryEntry: TemplateRegistryEntry, compileInstruction?: ViewCompileInstruction, loadContext?: ResourceLoadContext, target?: any): Promise<ViewResources> {
    let resources = new ViewResources(this.appResources, registryEntry.address);
    let dependencies = registryEntry.dependencies;
    let importIds;
    let names;

    compileInstruction = compileInstruction || ViewCompileInstruction.normal;

    if (dependencies.length === 0 && !compileInstruction.associatedModuleId) {
      return Promise.resolve(resources);
    }

    importIds = dependencies.map(x => x.src);
    names = dependencies.map(x => x.name);
    logger.debug(`importing resources for ${registryEntry.address}`, importIds);

    if (target) {
      let viewModelRequires = metadata.get(ViewEngine.viewModelRequireMetadataKey, target);
      if (viewModelRequires) {
        let templateImportCount = importIds.length;
        for (let i = 0, ii = viewModelRequires.length; i < ii; ++i) {
          let req = viewModelRequires[i];
          let importId = typeof req === 'function' ? Origin.get(req).moduleId : relativeToFile(req.src || req, registryEntry.address);

          if (importIds.indexOf(importId) === -1) {
            importIds.push(importId);
            names.push(req.as);
          }
        }
        logger.debug(`importing ViewModel resources for ${compileInstruction.associatedModuleId}`, importIds.slice(templateImportCount));
      }
    }

    return this.importViewResources(importIds, names, resources, compileInstruction, loadContext);
  }

  /**
  * Loads a view model as a resource.
  * @param moduleImport The module to import.
  * @param moduleMember The export from the module to generate the resource for.
  * @return A promise for the ResourceDescription.
  */
  importViewModelResource(moduleImport: string, moduleMember: string): Promise<ResourceDescription> {
    return this.loader.loadModule(moduleImport).then(viewModelModule => {
      let normalizedId = Origin.get(viewModelModule).moduleId;
      let resourceModule = this.moduleAnalyzer.analyze(normalizedId, viewModelModule, moduleMember);

      if (!resourceModule.mainResource) {
        throw new Error(`No view model found in module "${moduleImport}".`);
      }

      resourceModule.initialize(this.container);

      return resourceModule.mainResource;
    });
  }

  /**
  * Imports the specified resources with the specified names into the view resources object.
  * @param moduleIds The modules to load.
  * @param names The names associated with resource modules to import.
  * @param resources The resources lookup to add the loaded resources to.
  * @param compileInstruction The compilation instruction associated with the resource imports.
  * @return A promise for the ViewResources.
  */
  importViewResources(moduleIds: string[], names: string[], resources: ViewResources, compileInstruction?: ViewCompileInstruction, loadContext?: ResourceLoadContext): Promise<ViewResources> {
    loadContext = loadContext || new ResourceLoadContext();
    compileInstruction = compileInstruction || ViewCompileInstruction.normal;

    moduleIds = moduleIds.map(x => this._applyLoaderPlugin(x));

    return this.loader.loadAllModules(moduleIds).then(imports => {
      let i;
      let ii;
      let analysis;
      let normalizedId;
      let current;
      let associatedModule;
      let container = this.container;
      let moduleAnalyzer = this.moduleAnalyzer;
      let allAnalysis = new Array(imports.length);

      //initialize and register all resources first
      //this enables circular references for global refs
      //and enables order independence
      for (i = 0, ii = imports.length; i < ii; ++i) {
        current = imports[i];
        normalizedId = Origin.get(current).moduleId;

        analysis = moduleAnalyzer.analyze(normalizedId, current);
        analysis.initialize(container);
        analysis.register(resources, names[i]);

        allAnalysis[i] = analysis;
      }

      if (compileInstruction.associatedModuleId) {
        associatedModule = moduleAnalyzer.getAnalysis(compileInstruction.associatedModuleId);

        if (associatedModule) {
          associatedModule.register(resources);
        }
      }

      //cause compile/load of any associated views second
      //as a result all globals have access to all other globals during compilation
      for (i = 0, ii = allAnalysis.length; i < ii; ++i) {
        allAnalysis[i] = allAnalysis[i].load(container, loadContext);
      }

      return Promise.all(allAnalysis).then(() => resources);
    });
  }

  _applyLoaderPlugin(id) {
    let index = id.lastIndexOf('.');
    if (index !== -1) {
      let ext = id.substring(index);
      let pluginName = this._pluginMap[ext];

      if (pluginName === undefined) {
        return id;
      }

      return this.loader.applyPluginToUrl(id, pluginName);
    }

    return id;
  }
}

/**
* Controls a view model (and optionally its view), according to a particular behavior and by following a set of instructions.
*/
export class Controller {
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
  constructor(behavior: HtmlBehaviorResource, instruction: BehaviorInstruction, viewModel: Object, container: Container) {
    this.behavior = behavior;
    this.instruction = instruction;
    this.viewModel = viewModel;
    this.isAttached = false;
    this.view = null;
    this.isBound = false;
    this.scope = null;
    this.container = container;
    this.elementEvents = container.elementEvents || null;

    let observerLookup = behavior.observerLocator.getOrCreateObserversLookup(viewModel);
    let handlesBind = behavior.handlesBind;
    let attributes = instruction.attributes;
    let boundProperties = this.boundProperties = [];
    let properties = behavior.properties;
    let i;
    let ii;

    behavior._ensurePropertiesDefined(viewModel, observerLookup);

    for (i = 0, ii = properties.length; i < ii; ++i) {
      properties[i]._initialize(viewModel, observerLookup, attributes, handlesBind, boundProperties);
    }
  }

  /**
  * Invoked when the view which contains this controller is created.
  * @param owningView The view inside which this controller resides.
  */
  created(owningView: View): void {
    if (this.behavior.handlesCreated) {
      this.viewModel.created(owningView, this.view);
    }
  }

  /**
  * Used to automate the proper binding of this controller and its view. Used by the composition engine for dynamic component creation.
  * This should be considered a semi-private API and is subject to change without notice, even across minor or patch releases.
  * @param overrideContext An override context for binding.
  * @param owningView The view inside which this controller resides.
  */
  automate(overrideContext?: Object, owningView?: View): void {
    this.view.bindingContext = this.viewModel;
    this.view.overrideContext = overrideContext || createOverrideContext(this.viewModel);
    this.view._isUserControlled = true;

    if (this.behavior.handlesCreated) {
      this.viewModel.created(owningView || null, this.view);
    }

    this.bind(this.view);
  }

  /**
  * Binds the controller to the scope.
  * @param scope The binding scope.
  */
  bind(scope: Object): void {
    let skipSelfSubscriber = this.behavior.handlesBind;
    let boundProperties = this.boundProperties;
    let i;
    let ii;
    let x;
    let observer;
    let selfSubscriber;

    if (this.isBound) {
      if (this.scope === scope) {
        return;
      }

      this.unbind();
    }

    this.isBound = true;
    this.scope = scope;

    for (i = 0, ii = boundProperties.length; i < ii; ++i) {
      x = boundProperties[i];
      observer = x.observer;
      selfSubscriber = observer.selfSubscriber;
      observer.publishing = false;

      if (skipSelfSubscriber) {
        observer.selfSubscriber = null;
      }

      x.binding.bind(scope);
      observer.call();

      observer.publishing = true;
      observer.selfSubscriber = selfSubscriber;
    }

    let overrideContext;
    if (this.view !== null) {
      if (skipSelfSubscriber) {
        this.view.viewModelScope = scope;
      }
      // do we need to create an overrideContext or is the scope's overrideContext
      // valid for this viewModel?
      if (this.viewModel === scope.overrideContext.bindingContext) {
        overrideContext = scope.overrideContext;
      // should we inherit the parent scope? (eg compose / router)
      } else if (this.instruction.inheritBindingContext) {
        overrideContext = createOverrideContext(this.viewModel, scope.overrideContext);
      // create the overrideContext and capture the parent without making it
      // available to AccessScope. We may need it later for template-part replacements.
      } else {
        overrideContext = createOverrideContext(this.viewModel);
        overrideContext.__parentOverrideContext = scope.overrideContext;
      }

      this.view.bind(this.viewModel, overrideContext);
    } else if (skipSelfSubscriber) {
      overrideContext = scope.overrideContext;
      // the factoryCreateInstruction's partReplacements will either be null or an object
      // containing the replacements. If there are partReplacements we need to preserve the parent
      // context to allow replacement parts to bind to both the custom element scope and the ambient scope.
      // Note that factoryCreateInstruction is a property defined on BoundViewFactory. The code below assumes the
      // behavior stores a the BoundViewFactory on its viewModel under the name of viewFactory. This is implemented
      // by the replaceable custom attribute.
      if (scope.overrideContext.__parentOverrideContext !== undefined
        && this.viewModel.viewFactory && this.viewModel.viewFactory.factoryCreateInstruction.partReplacements) {
        // clone the overrideContext and connect the ambient context.
        overrideContext = Object.assign({}, scope.overrideContext);
        overrideContext.parentOverrideContext = scope.overrideContext.__parentOverrideContext;
      }
      this.viewModel.bind(scope.bindingContext, overrideContext);
    }
  }

  /**
  * Unbinds the controller.
  */
  unbind(): void {
    if (this.isBound) {
      let boundProperties = this.boundProperties;
      let i;
      let ii;

      this.isBound = false;
      this.scope = null;

      if (this.view !== null) {
        this.view.unbind();
      }

      if (this.behavior.handlesUnbind) {
        this.viewModel.unbind();
      }

      if (this.elementEvents !== null) {
        this.elementEvents.disposeAll();
      }

      for (i = 0, ii = boundProperties.length; i < ii; ++i) {
        boundProperties[i].binding.unbind();
      }
    }
  }

  /**
  * Attaches the controller.
  */
  attached(): void {
    if (this.isAttached) {
      return;
    }

    this.isAttached = true;

    if (this.behavior.handlesAttached) {
      this.viewModel.attached();
    }

    if (this.view !== null) {
      this.view.attached();
    }
  }

  /**
  * Detaches the controller.
  */
  detached(): void {
    if (this.isAttached) {
      this.isAttached = false;

      if (this.view !== null) {
        this.view.detached();
      }

      if (this.behavior.handlesDetached) {
        this.viewModel.detached();
      }
    }
  }
}

/**
* An implementation of Aurelia's Observer interface that is used to back bindable properties defined on a behavior.
*/
@subscriberCollection()
export class BehaviorPropertyObserver {
  /**
  * Creates an instance of BehaviorPropertyObserver.
  * @param taskQueue The task queue used to schedule change notifications.
  * @param obj The object that the property is defined on.
  * @param propertyName The name of the property.
  * @param selfSubscriber The callback function that notifies the object which defines the properties, if present.
  * @param initialValue The initial value of the property.
  */
  constructor(taskQueue: TaskQueue, obj: Object, propertyName: string, selfSubscriber: Function, initialValue: any) {
    this.taskQueue = taskQueue;
    this.obj = obj;
    this.propertyName = propertyName;
    this.notqueued = true;
    this.publishing = false;
    this.selfSubscriber = selfSubscriber;
    this.currentValue = this.oldValue = initialValue;
  }

  /**
  * Gets the property's value.
  */
  getValue(): any {
    return this.currentValue;
  }

  /**
  * Sets the property's value.
  * @param newValue The new value to set.
  */
  setValue(newValue: any): void {
    let oldValue = this.currentValue;

    if (!Object.is(newValue, oldValue)) {
      this.oldValue = oldValue;
      this.currentValue = newValue;

      if (this.publishing && this.notqueued) {
        if (this.taskQueue.flushing) {
          this.call();
        } else {
          this.notqueued = false;
          this.taskQueue.queueMicroTask(this);
        }
      }
    }
  }

  /**
  * Invoked by the TaskQueue to publish changes to subscribers.
  */
  call(): void {
    let oldValue = this.oldValue;
    let newValue = this.currentValue;

    this.notqueued = true;

    if (Object.is(newValue, oldValue)) {
      return;
    }

    if (this.selfSubscriber) {
      this.selfSubscriber(newValue, oldValue);
    }

    this.callSubscribers(newValue, oldValue);
    this.oldValue = newValue;
  }

  /**
  * Subscribes to the observerable.
  * @param context A context object to pass along to the subscriber when it's called.
  * @param callable A function or object with a "call" method to be invoked for delivery of changes.
  */
  subscribe(context: any, callable: Function): void {
    this.addSubscriber(context, callable);
  }

  /**
  * Unsubscribes from the observerable.
  * @param context The context object originally subscribed with.
  * @param callable The callable that was originally subscribed with.
  */
  unsubscribe(context: any, callable: Function): void {
    this.removeSubscriber(context, callable);
  }
}

function getObserver(instance, name) {
  let lookup = instance.__observers__;

  if (lookup === undefined) {
    // We need to lookup the actual behavior for this instance,
    // as it might be a derived class (and behavior) rather than
    // the class (and behavior) that declared the property calling getObserver().
    // This means we can't capture the behavior in property get/set/getObserver and pass it here.
    // Note that it's probably for the best, as passing the behavior is an overhead
    // that is only useful in the very first call of the first property of the instance.
    let ctor = Object.getPrototypeOf(instance).constructor; // Playing safe here, user could have written to instance.constructor.
    let behavior = metadata.get(metadata.resource, ctor);
    if (!behavior.isInitialized) {
      behavior.initialize(Container.instance || new Container(), instance.constructor);
    }

    lookup = behavior.observerLocator.getOrCreateObserversLookup(instance);
    behavior._ensurePropertiesDefined(instance, lookup);
  }

  return lookup[name];
}

/**
* Represents a bindable property on a behavior.
*/
export class BindableProperty {
  /**
  * Creates an instance of BindableProperty.
  * @param nameOrConfig The name of the property or a cofiguration object.
  */
  constructor(nameOrConfig: string | Object) {
    if (typeof nameOrConfig === 'string') {
      this.name = nameOrConfig;
    } else {
      Object.assign(this, nameOrConfig);
    }

    this.attribute = this.attribute || _hyphenate(this.name);
    let defaultBindingMode = this.defaultBindingMode;
    if (defaultBindingMode === null || defaultBindingMode === undefined) {
      this.defaultBindingMode = bindingMode.oneWay;
    } else if (typeof defaultBindingMode === 'string') {
      // to avoid import from aurelia
      this.defaultBindingMode = bindingMode[defaultBindingMode] || bindingMode.oneWay;
    }
    this.changeHandler = this.changeHandler || null;
    this.owner = null;
    this.descriptor = null;
  }

  /**
  * Registers this bindable property with particular Class and Behavior instance.
  * @param target The class to register this behavior with.
  * @param behavior The behavior instance to register this property with.
  * @param descriptor The property descriptor for this property.
  */
  registerWith(target: Function, behavior: HtmlBehaviorResource, descriptor?: Object): void {
    behavior.properties.push(this);
    behavior.attributes[this.attribute] = this;
    this.owner = behavior;

    if (descriptor) {
      this.descriptor = descriptor;
      return this._configureDescriptor(descriptor);
    }

    return undefined;
  }

  _configureDescriptor(descriptor: Object): Object {
    let name = this.name;

    descriptor.configurable = true;
    descriptor.enumerable = true;

    if ('initializer' in descriptor) {
      this.defaultValue = descriptor.initializer;
      delete descriptor.initializer;
      delete descriptor.writable;
    }

    if ('value' in descriptor) {
      this.defaultValue = descriptor.value;
      delete descriptor.value;
      delete descriptor.writable;
    }

    descriptor.get = function() {
      return getObserver(this, name).getValue();
    };

    descriptor.set = function(value) {
      getObserver(this, name).setValue(value);
    };

    descriptor.get.getObserver = function(obj) {
      return getObserver(obj, name);
    };

    return descriptor;
  }

  /**
  * Defines this property on the specified class and behavior.
  * @param target The class to define the property on.
  * @param behavior The behavior to define the property on.
  */
  defineOn(target: Function, behavior: HtmlBehaviorResource): void {
    let name = this.name;
    let handlerName;

    if (this.changeHandler === null) {
      handlerName = name + 'Changed';
      if (handlerName in target.prototype) {
        this.changeHandler = handlerName;
      }
    }

    if (this.descriptor === null) {
      Object.defineProperty(target.prototype, name, this._configureDescriptor(behavior, {}));
    }
  }

  /**
  * Creates an observer for this property.
  * @param viewModel The view model instance on which to create the observer.
  * @return The property observer.
  */
  createObserver(viewModel: Object): BehaviorPropertyObserver {
    let selfSubscriber = null;
    let defaultValue = this.defaultValue;
    let changeHandlerName = this.changeHandler;
    let name = this.name;
    let initialValue;

    if (this.hasOptions) {
      return undefined;
    }

    if (changeHandlerName in viewModel) {
      if ('propertyChanged' in viewModel) {
        selfSubscriber = (newValue, oldValue) => {
          viewModel[changeHandlerName](newValue, oldValue);
          viewModel.propertyChanged(name, newValue, oldValue);
        };
      } else {
        selfSubscriber = (newValue, oldValue) => viewModel[changeHandlerName](newValue, oldValue);
      }
    } else if ('propertyChanged' in viewModel) {
      selfSubscriber = (newValue, oldValue) => viewModel.propertyChanged(name, newValue, oldValue);
    } else if (changeHandlerName !== null) {
      throw new Error(`Change handler ${changeHandlerName} was specified but not declared on the class.`);
    }

    if (defaultValue !== undefined) {
      initialValue = typeof defaultValue === 'function' ? defaultValue.call(viewModel) : defaultValue;
    }

    return new BehaviorPropertyObserver(this.owner.taskQueue, viewModel, this.name, selfSubscriber, initialValue);
  }

  _initialize(viewModel, observerLookup, attributes, behaviorHandlesBind, boundProperties): void {
    let selfSubscriber;
    let observer;
    let attribute;
    let defaultValue = this.defaultValue;

    if (this.isDynamic) {
      for (let key in attributes) {
        this._createDynamicProperty(viewModel, observerLookup, behaviorHandlesBind, key, attributes[key], boundProperties);
      }
    } else if (!this.hasOptions) {
      observer = observerLookup[this.name];

      if (attributes !== null) {
        selfSubscriber = observer.selfSubscriber;
        attribute = attributes[this.attribute];

        if (behaviorHandlesBind) {
          observer.selfSubscriber = null;
        }

        if (typeof attribute === 'string') {
          viewModel[this.name] = attribute;
          observer.call();
        } else if (attribute) {
          boundProperties.push({observer: observer, binding: attribute.createBinding(viewModel)});
        } else if (defaultValue !== undefined) {
          observer.call();
        }

        observer.selfSubscriber = selfSubscriber;
      }

      observer.publishing = true;
    }
  }

  _createDynamicProperty(viewModel, observerLookup, behaviorHandlesBind, name, attribute, boundProperties) {
    let changeHandlerName = name + 'Changed';
    let selfSubscriber = null;
    let observer;
    let info;

    if (changeHandlerName in viewModel) {
      if ('propertyChanged' in viewModel) {
        selfSubscriber = (newValue, oldValue) => {
          viewModel[changeHandlerName](newValue, oldValue);
          viewModel.propertyChanged(name, newValue, oldValue);
        };
      } else {
        selfSubscriber = (newValue, oldValue) => viewModel[changeHandlerName](newValue, oldValue);
      }
    } else if ('propertyChanged' in viewModel) {
      selfSubscriber = (newValue, oldValue) => viewModel.propertyChanged(name, newValue, oldValue);
    }

    observer = observerLookup[name] = new BehaviorPropertyObserver(
        this.owner.taskQueue,
        viewModel,
        name,
        selfSubscriber
        );

    Object.defineProperty(viewModel, name, {
      configurable: true,
      enumerable: true,
      get: observer.getValue.bind(observer),
      set: observer.setValue.bind(observer)
    });

    if (behaviorHandlesBind) {
      observer.selfSubscriber = null;
    }

    if (typeof attribute === 'string') {
      viewModel[name] = attribute;
      observer.call();
    } else if (attribute) {
      info = {observer: observer, binding: attribute.createBinding(viewModel)};
      boundProperties.push(info);
    }

    observer.publishing = true;
    observer.selfSubscriber = selfSubscriber;
  }
}

let lastProviderId = 0;

function nextProviderId() {
  return ++lastProviderId;
}

function doProcessContent() { return true; }
function doProcessAttributes() {}

/**
* Identifies a class as a resource that implements custom element or custom
* attribute functionality.
*/
export class HtmlBehaviorResource {
  /**
  * Creates an instance of HtmlBehaviorResource.
  */
  constructor() {
    this.elementName = null;
    this.attributeName = null;
    this.attributeDefaultBindingMode = undefined;
    this.liftsContent = false;
    this.targetShadowDOM = false;
    this.shadowDOMOptions = null;
    this.processAttributes = doProcessAttributes;
    this.processContent = doProcessContent;
    this.usesShadowDOM = false;
    this.childBindings = null;
    this.hasDynamicOptions = false;
    this.containerless = false;
    this.properties = [];
    this.attributes = {};
    this.isInitialized = false;
    this.primaryProperty = null;
  }

  /**
  * Checks whether the provided name matches any naming conventions for HtmlBehaviorResource.
  * @param name The name of the potential resource.
  * @param existing An already existing resource that may need a convention name applied.
  */
  static convention(name: string, existing?: HtmlBehaviorResource): HtmlBehaviorResource {
    let behavior;

    if (name.endsWith('CustomAttribute')) {
      behavior = existing || new HtmlBehaviorResource();
      behavior.attributeName = _hyphenate(name.substring(0, name.length - 15));
    }

    if (name.endsWith('CustomElement')) {
      behavior = existing || new HtmlBehaviorResource();
      behavior.elementName = _hyphenate(name.substring(0, name.length - 13));
    }

    return behavior;
  }

  /**
  * Adds a binding expression to the component created by this resource.
  * @param behavior The binding expression.
  */
  addChildBinding(behavior: Object): void {
    if (this.childBindings === null) {
      this.childBindings = [];
    }

    this.childBindings.push(behavior);
  }

  /**
  * Provides an opportunity for the resource to initialize iteself.
  * @param container The dependency injection container from which the resource
  * can aquire needed services.
  * @param target The class to which this resource metadata is attached.
  */
  initialize(container: Container, target: Function): void {
    let proto = target.prototype;
    let properties = this.properties;
    let attributeName = this.attributeName;
    let attributeDefaultBindingMode = this.attributeDefaultBindingMode;
    let i;
    let ii;
    let current;

    if (this.isInitialized) {
      return;
    }

    this.isInitialized = true;
    target.__providerId__ = nextProviderId();

    this.observerLocator = container.get(ObserverLocator);
    this.taskQueue = container.get(TaskQueue);

    this.target = target;
    this.usesShadowDOM = this.targetShadowDOM && FEATURE.shadowDOM;
    this.handlesCreated = ('created' in proto);
    this.handlesBind = ('bind' in proto);
    this.handlesUnbind = ('unbind' in proto);
    this.handlesAttached = ('attached' in proto);
    this.handlesDetached = ('detached' in proto);
    this.htmlName = this.elementName || this.attributeName;

    if (attributeName !== null) {
      if (properties.length === 0) { //default for custom attributes
        new BindableProperty({
          name: 'value',
          changeHandler: 'valueChanged' in proto ? 'valueChanged' : null,
          attribute: attributeName,
          defaultBindingMode: attributeDefaultBindingMode
        }).registerWith(target, this);
      }

      current = properties[0];

      if (properties.length === 1 && current.name === 'value') { //default for custom attributes
        current.isDynamic = current.hasOptions = this.hasDynamicOptions;
        current.defineOn(target, this);
      } else { //custom attribute with options
        for (i = 0, ii = properties.length; i < ii; ++i) {
          properties[i].defineOn(target, this);
          if (properties[i].primaryProperty) {
            if (this.primaryProperty) {
              throw new Error('Only one bindable property on a custom element can be defined as the default');
            }
            this.primaryProperty = properties[i];
          }
        }

        current = new BindableProperty({
          name: 'value',
          changeHandler: 'valueChanged' in proto ? 'valueChanged' : null,
          attribute: attributeName,
          defaultBindingMode: attributeDefaultBindingMode
        });

        current.hasOptions = true;
        current.registerWith(target, this);
      }
    } else {
      for (i = 0, ii = properties.length; i < ii; ++i) {
        properties[i].defineOn(target, this);
      }
      // Because how inherited properties would interact with the default 'value' property
      // in a custom attribute is not well defined yet, we only inherit properties on
      // custom elements, where it's not a problem.
      this._copyInheritedProperties(container, target);
    }
  }

  /**
  * Allows the resource to be registered in the view resources for the particular
  * view into which it was required.
  * @param registry The view resource registry for the view that required this resource.
  * @param name The name provided by the end user for this resource, within the
  * particular view it's being used.
  */
  register(registry: ViewResources, name?: string): void {
    if (this.attributeName !== null) {
      registry.registerAttribute(name || this.attributeName, this, this.attributeName);

      if (Array.isArray(this.aliases)) {
        this.aliases
          .forEach( (alias) => {
            registry.registerAttribute(alias, this, this.attributeName);
          });
      }
    }

    if (this.elementName !== null) {
      registry.registerElement(name || this.elementName, this);
    }
  }

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
  load(container: Container, target: Function, loadContext?: ResourceLoadContext, viewStrategy?: ViewStrategy, transientView?: boolean): Promise<HtmlBehaviorResource> {
    let options;

    if (this.elementName !== null) {
      viewStrategy = container.get(ViewLocator).getViewStrategy(viewStrategy || this.viewStrategy || target);
      options = new ViewCompileInstruction(this.targetShadowDOM, true);

      if (!viewStrategy.moduleId) {
        viewStrategy.moduleId = Origin.get(target).moduleId;
      }

      return viewStrategy.loadViewFactory(container.get(ViewEngine), options, loadContext, target).then(viewFactory => {
        if (!transientView || !this.viewFactory) {
          this.viewFactory = viewFactory;
        }

        return viewFactory;
      });
    }

    return Promise.resolve(this);
  }

  /**
  * Plugs into the compiler and enables custom processing of the node on which this behavior is located.
  * @param compiler The compiler that is currently compiling the view that this behavior exists within.
  * @param resources The resources for the view that this behavior exists within.
  * @param node The node on which this behavior exists.
  * @param instruction The behavior instruction created for this behavior.
  * @param parentNode The parent node of the current node.
  * @return The current node.
  */
  compile(compiler: ViewCompiler, resources: ViewResources, node: Node, instruction: BehaviorInstruction, parentNode?: Node): Node {
    if (this.liftsContent) {
      if (!instruction.viewFactory) {
        let template = DOM.createElement('template');
        let fragment = DOM.createDocumentFragment();
        let cacheSize = node.getAttribute('view-cache');
        let part = node.getAttribute('part');

        node.removeAttribute(instruction.originalAttrName);
        DOM.replaceNode(template, node, parentNode);
        fragment.appendChild(node);
        instruction.viewFactory = compiler.compile(fragment, resources);

        if (part) {
          instruction.viewFactory.part = part;
          node.removeAttribute('part');
        }

        if (cacheSize) {
          instruction.viewFactory.setCacheSize(cacheSize);
          node.removeAttribute('view-cache');
        }

        node = template;
      }
    } else if (this.elementName !== null) { //custom element
      let partReplacements = {};

      if (this.processContent(compiler, resources, node, instruction) && node.hasChildNodes()) {
        let currentChild = node.firstChild;
        let contentElement = this.usesShadowDOM ? null : DOM.createElement('au-content');
        let nextSibling;
        let toReplace;

        while (currentChild) {
          nextSibling = currentChild.nextSibling;

          if (currentChild.tagName === 'TEMPLATE' && (toReplace = currentChild.getAttribute('replace-part'))) {
            partReplacements[toReplace] = compiler.compile(currentChild, resources);
            DOM.removeNode(currentChild, parentNode);
            instruction.partReplacements = partReplacements;
          } else if (contentElement !== null) {
            if (currentChild.nodeType === 3 && _isAllWhitespace(currentChild)) {
              DOM.removeNode(currentChild, parentNode);
            } else {
              contentElement.appendChild(currentChild);
            }
          }

          currentChild = nextSibling;
        }

        if (contentElement !== null && contentElement.hasChildNodes()) {
          node.appendChild(contentElement);
        }

        instruction.skipContentProcessing = false;
      } else {
        instruction.skipContentProcessing = true;
      }
    } else if (!this.processContent(compiler, resources, node, instruction)) {
      instruction.skipContentProcessing = true;
    }

    return node;
  }

  /**
  * Creates an instance of this behavior.
  * @param container The DI container to create the instance in.
  * @param instruction The instruction for this behavior that was constructed during compilation.
  * @param element The element on which this behavior exists.
  * @param bindings The bindings that are associated with the view in which this behavior exists.
  * @return The Controller of this behavior.
  */
  create(container: Container, instruction?: BehaviorInstruction, element?: Element, bindings?: Binding[]): Controller {
    let viewHost;
    let au = null;

    instruction = instruction || BehaviorInstruction.normal;
    element = element || null;
    bindings = bindings || null;

    if (this.elementName !== null && element) {
      if (this.usesShadowDOM) {
        viewHost = element.attachShadow(this.shadowDOMOptions);
        container.registerInstance(DOM.boundary, viewHost);
      } else {
        viewHost = element;
        if (this.targetShadowDOM) {
          container.registerInstance(DOM.boundary, viewHost);
        }
      }
    }

    if (element !== null) {
      element.au = au = element.au || {};
    }

    let viewModel = instruction.viewModel || container.get(this.target);
    let controller = new Controller(this, instruction, viewModel, container);
    let childBindings = this.childBindings;
    let viewFactory;

    if (this.liftsContent) {
      //template controller
      au.controller = controller;
    } else if (this.elementName !== null) {
      //custom element
      viewFactory = instruction.viewFactory || this.viewFactory;
      container.viewModel = viewModel;

      if (viewFactory) {
        controller.view = viewFactory.create(container, instruction, element);
      }

      if (element !== null) {
        au.controller = controller;

        if (controller.view) {
          if (!this.usesShadowDOM && (element.childNodes.length === 1 || element.contentElement)) { //containerless passes content view special contentElement property
            let contentElement = element.childNodes[0] || element.contentElement;
            controller.view.contentView = { fragment: contentElement }; //store the content before appending the view
            contentElement.parentNode && DOM.removeNode(contentElement); //containerless content element has no parent
          }

          if (instruction.anchorIsContainer) {
            if (childBindings !== null) {
              for (let i = 0, ii = childBindings.length; i < ii; ++i) {
                controller.view.addBinding(childBindings[i].create(element, viewModel, controller));
              }
            }

            controller.view.appendNodesTo(viewHost);
          } else {
            controller.view.insertNodesBefore(viewHost);
          }
        } else if (childBindings !== null) {
          for (let i = 0, ii = childBindings.length; i < ii; ++i) {
            bindings.push(childBindings[i].create(element, viewModel, controller));
          }
        }
      } else if (controller.view) {
        //dynamic element with view
        controller.view.controller = controller;

        if (childBindings !== null) {
          for (let i = 0, ii = childBindings.length; i < ii; ++i) {
            controller.view.addBinding(childBindings[i].create(instruction.host, viewModel, controller));
          }
        }
      } else if (childBindings !== null) {
        //dynamic element without view
        for (let i = 0, ii = childBindings.length; i < ii; ++i) {
          bindings.push(childBindings[i].create(instruction.host, viewModel, controller));
        }
      }
    } else if (childBindings !== null) {
      //custom attribute
      for (let i = 0, ii = childBindings.length; i < ii; ++i) {
        bindings.push(childBindings[i].create(element, viewModel, controller));
      }
    }

    if (au !== null) {
      au[this.htmlName] = controller;
    }

    if (instruction.initiatedByBehavior && viewFactory) {
      controller.view.created();
    }

    return controller;
  }

  _ensurePropertiesDefined(instance: Object, lookup: Object) {
    let properties;
    let i;
    let ii;
    let observer;

    if ('__propertiesDefined__' in lookup) {
      return;
    }

    lookup.__propertiesDefined__ = true;
    properties = this.properties;

    for (i = 0, ii = properties.length; i < ii; ++i) {
      observer = properties[i].createObserver(instance);

      if (observer !== undefined) {
        lookup[observer.propertyName] = observer;
      }
    }
  }

  _copyInheritedProperties(container: Container, target: Function) {
    // This methods enables inherited @bindable properties.
    // We look for the first base class with metadata, make sure it's initialized
    // and copy its properties.
    // We don't need to walk further than the first parent with metadata because
    // it had also inherited properties during its own initialization.
    let behavior;
    let derived = target;

    while (true) {
      let proto = Object.getPrototypeOf(target.prototype);
      target = proto && proto.constructor;
      if (!target) {
        return;
      }
      behavior = metadata.getOwn(metadata.resource, target);
      if (behavior) {
        break;
      }
    }
    behavior.initialize(container, target);
    for (let i = 0, ii = behavior.properties.length; i < ii; ++i) {
      let prop = behavior.properties[i];
      // Check that the property metadata was not overriden or re-defined in this class
      if (this.properties.some(p => p.name === prop.name)) {
        continue;
      }
      // We don't need to call .defineOn() for those properties because it was done
      // on the parent prototype during initialization.
      new BindableProperty(prop).registerWith(derived, this);
    }
  }
}

function createChildObserverDecorator(selectorOrConfig, all) {
  return function(target, key, descriptor) {
    let actualTarget = typeof key === 'string' ? target.constructor : target; //is it on a property or a class?
    let r = metadata.getOrCreateOwn(metadata.resource, HtmlBehaviorResource, actualTarget);

    if (typeof selectorOrConfig === 'string') {
      selectorOrConfig = {
        selector: selectorOrConfig,
        name: key
      };
    }

    if (descriptor) {
      descriptor.writable = true;
      descriptor.configurable = true;
    }

    selectorOrConfig.all = all;
    r.addChildBinding(new ChildObserver(selectorOrConfig));
  };
}

/**
* Creates a behavior property that references an array of immediate content child elements that matches the provided selector.
*/
export function children(selectorOrConfig: string | Object): any {
  return createChildObserverDecorator(selectorOrConfig, true);
}

/**
* Creates a behavior property that references an immediate content child element that matches the provided selector.
*/
export function child(selectorOrConfig: string | Object): any {
  return createChildObserverDecorator(selectorOrConfig, false);
}

class ChildObserver {
  constructor(config) {
    this.name = config.name;
    this.changeHandler = config.changeHandler || this.name + 'Changed';
    this.selector = config.selector;
    this.all = config.all;
  }

  create(viewHost, viewModel, controller) {
    return new ChildObserverBinder(this.selector, viewHost, this.name, viewModel, controller, this.changeHandler, this.all);
  }
}

const noMutations = [];

function trackMutation(groupedMutations, binder, record) {
  let mutations = groupedMutations.get(binder);

  if (!mutations) {
    mutations = [];
    groupedMutations.set(binder, mutations);
  }

  mutations.push(record);
}

function onChildChange(mutations, observer) {
  let binders = observer.binders;
  let bindersLength = binders.length;
  let groupedMutations = new Map();

  for (let i = 0, ii = mutations.length; i < ii; ++i) {
    let record = mutations[i];
    let added = record.addedNodes;
    let removed = record.removedNodes;

    for (let j = 0, jj = removed.length; j < jj; ++j) {
      let node = removed[j];
      if (node.nodeType === 1) {
        for (let k = 0; k < bindersLength; ++k) {
          let binder = binders[k];
          if (binder.onRemove(node)) {
            trackMutation(groupedMutations, binder, record);
          }
        }
      }
    }

    for (let j = 0, jj = added.length; j < jj; ++j) {
      let node = added[j];
      if (node.nodeType === 1) {
        for (let k = 0; k < bindersLength; ++k) {
          let binder = binders[k];
          if (binder.onAdd(node)) {
            trackMutation(groupedMutations, binder, record);
          }
        }
      }
    }
  }

  groupedMutations.forEach((value, key) => {
    if (key.changeHandler !== null) {
      key.viewModel[key.changeHandler](value);
    }
  });
}

class ChildObserverBinder {
  constructor(selector, viewHost, property, viewModel, controller, changeHandler, all) {
    this.selector = selector;
    this.viewHost = viewHost;
    this.property = property;
    this.viewModel = viewModel;
    this.controller = controller;
    this.changeHandler = changeHandler in viewModel ? changeHandler : null;
    this.usesShadowDOM = controller.behavior.usesShadowDOM;
    this.all = all;

    if (!this.usesShadowDOM && controller.view && controller.view.contentView) {
      this.contentView = controller.view.contentView;
    } else {
      this.contentView = null;
    }
  }

  matches(element) {
    if (element.matches(this.selector)) {
      if (this.contentView === null) {
        return true;
      }

      let contentView = this.contentView;
      let assignedSlot = element.auAssignedSlot;

      if (assignedSlot && assignedSlot.projectFromAnchors) {
        let anchors = assignedSlot.projectFromAnchors;

        for (let i = 0, ii = anchors.length; i < ii; ++i) {
          if (anchors[i].auOwnerView === contentView) {
            return true;
          }
        }

        return false;
      }

      return element.auOwnerView === contentView;
    }

    return false;
  }

  bind(source) {
    let viewHost = this.viewHost;
    let viewModel = this.viewModel;
    let observer = viewHost.__childObserver__;

    if (!observer) {
      observer = viewHost.__childObserver__ = DOM.createMutationObserver(onChildChange);

      let options = {
        childList: true,
        subtree: !this.usesShadowDOM
      };

      observer.observe(viewHost, options);
      observer.binders = [];
    }

    observer.binders.push(this);

    if (this.usesShadowDOM) { //if using shadow dom, the content is already present, so sync the items
      let current = viewHost.firstElementChild;

      if (this.all) {
        let items = viewModel[this.property];
        if (!items) {
          items = viewModel[this.property] = [];
        } else {
          // The existing array may alread be observed in other bindings
          // Setting length to 0 will not work properly, unless we intercept it
          items.splice(0);
        }

        while (current) {
          if (this.matches(current)) {
            items.push(current.au && current.au.controller ? current.au.controller.viewModel : current);
          }

          current = current.nextElementSibling;
        }

        if (this.changeHandler !== null) {
          this.viewModel[this.changeHandler](noMutations);
        }
      } else {
        while (current) {
          if (this.matches(current)) {
            let value = current.au && current.au.controller ? current.au.controller.viewModel : current;
            this.viewModel[this.property] = value;

            if (this.changeHandler !== null) {
              this.viewModel[this.changeHandler](value);
            }

            break;
          }

          current = current.nextElementSibling;
        }
      }
    }
  }

  onRemove(element) {
    if (this.matches(element)) {
      let value = element.au && element.au.controller ? element.au.controller.viewModel : element;

      if (this.all) {
        let items = (this.viewModel[this.property] || (this.viewModel[this.property] = []));
        let index = items.indexOf(value);

        if (index !== -1) {
          items.splice(index, 1);
        }

        return true;
      }

      return false;
    }

    return false;
  }

  onAdd(element) {
    if (this.matches(element)) {
      let value = element.au && element.au.controller ? element.au.controller.viewModel : element;

      if (this.all) {
        let items = (this.viewModel[this.property] || (this.viewModel[this.property] = []));

        if (this.selector === '*') {
          items.push(value);
          return true;
        }

        let index = 0;
        let prev = element.previousElementSibling;

        while (prev) {
          if (this.matches(prev)) {
            index++;
          }

          prev = prev.previousElementSibling;
        }

        items.splice(index, 0, value);
        return true;
      }

      this.viewModel[this.property] = value;

      if (this.changeHandler !== null) {
        this.viewModel[this.changeHandler](value);
      }
    }

    return false;
  }

  unbind() {
    if (this.viewHost.__childObserver__) {
      this.viewHost.__childObserver__.disconnect();
      this.viewHost.__childObserver__ = null;
      this.viewModel[this.property] = null;
    }
  }
}

function remove(viewSlot, previous) {
  return Array.isArray(previous)
    ? viewSlot.removeMany(previous, true)
    : viewSlot.remove(previous, true);
}

export const SwapStrategies = {
  // animate the next view in before removing the current view;
  before(viewSlot, previous, callback) {
    return (previous === undefined)
      ? callback()
      : callback().then(() => remove(viewSlot, previous));
  },

  // animate the next view at the same time the current view is removed
  with(viewSlot, previous, callback) {
    return (previous === undefined)
      ? callback()
      : Promise.all([remove(viewSlot, previous), callback()]);
  },

  // animate the next view in after the current view has been removed
  after(viewSlot, previous, callback) {
    return Promise.resolve(viewSlot.removeAll(true)).then(callback);
  }
};

/**
* Instructs the composition engine how to dynamically compose a component.
*/
interface CompositionContext {
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

function tryActivateViewModel(context) {
  if (context.skipActivation || typeof context.viewModel.activate !== 'function') {
    return Promise.resolve();
  }

  return context.viewModel.activate(context.model) || Promise.resolve();
}

/**
* Used to dynamically compose components.
*/
@inject(ViewEngine, ViewLocator)
export class CompositionEngine {
  /**
  * Creates an instance of the CompositionEngine.
  * @param viewEngine The ViewEngine used during composition.
  */
  constructor(viewEngine: ViewEngine, viewLocator: ViewLocator) {
    this.viewEngine = viewEngine;
    this.viewLocator = viewLocator;
  }

  _swap(context, view) {
    let swapStrategy = SwapStrategies[context.swapOrder] || SwapStrategies.after;
    let previousViews = context.viewSlot.children.slice();

    return swapStrategy(context.viewSlot, previousViews, () => {
      return Promise.resolve(context.viewSlot.add(view)).then(() => {
        if (context.currentController) {
          context.currentController.unbind();
        }
      });
    }).then(() => {
      if (context.compositionTransactionNotifier) {
        context.compositionTransactionNotifier.done();
      }
    });
  }

  _createControllerAndSwap(context) {
    return this.createController(context).then(controller => {
      if (context.compositionTransactionOwnershipToken) {
        return context.compositionTransactionOwnershipToken
          .waitForCompositionComplete()
          .then(() => {
            controller.automate(context.overrideContext, context.owningView);

            return this._swap(context, controller.view);
          })
          .then(() => controller);
      }

      controller.automate(context.overrideContext, context.owningView);

      return this._swap(context, controller.view).then(() => controller);
    });
  }

  /**
  * Creates a controller instance for the component described in the context.
  * @param context The CompositionContext that describes the component.
  * @return A Promise for the Controller.
  */
  createController(context: CompositionContext): Promise<Controller> {
    let childContainer;
    let viewModel;
    let viewModelResource;
    /**@type {HtmlBehaviorResource} */
    let m;

    return this
      .ensureViewModel(context)
      .then(tryActivateViewModel)
      .then(() => {
        childContainer = context.childContainer;
        viewModel = context.viewModel;
        viewModelResource = context.viewModelResource;
        m = viewModelResource.metadata;

        let viewStrategy = this.viewLocator.getViewStrategy(context.view || viewModel);

        if (context.viewResources) {
          viewStrategy.makeRelativeTo(context.viewResources.viewUrl);
        }

        return m.load(
          childContainer,
          viewModelResource.value,
          null,
          viewStrategy,
          true
        );
      }).then(viewFactory => m.create(
        childContainer,
        BehaviorInstruction.dynamic(context.host, viewModel, viewFactory)
      ));
  }

  /**
  * Ensures that the view model and its resource are loaded for this context.
  * @param context The CompositionContext to load the view model and its resource for.
  * @return A Promise for the context.
  */
  ensureViewModel(context: CompositionContext): Promise<CompositionContext> {
    let childContainer = context.childContainer = (context.childContainer || context.container.createChild());

    if (typeof context.viewModel === 'string') {
      context.viewModel = context.viewResources
        ? context.viewResources.relativeToView(context.viewModel)
        : context.viewModel;

      return this.viewEngine.importViewModelResource(context.viewModel).then(viewModelResource => {
        childContainer.autoRegister(viewModelResource.value);

        if (context.host) {
          childContainer.registerInstance(DOM.Element, context.host);
        }

        context.viewModel = childContainer.viewModel = childContainer.get(viewModelResource.value);
        context.viewModelResource = viewModelResource;
        return context;
      });
    }
    // When viewModel in context is not a module path
    // only prepare the metadata and ensure the view model instance is ready
    // if viewModel is a class, instantiate it
    let ctor = context.viewModel.constructor;
    let isClass = typeof context.viewModel === 'function';
    if (isClass) {
      ctor = context.viewModel;
      childContainer.autoRegister(ctor);
    }
    let m = metadata.getOrCreateOwn(metadata.resource, HtmlBehaviorResource, ctor);
    // We don't call ViewResources.prototype.convention here as it should be called later
    // Just need to prepare the metadata for later usage
    m.elementName = m.elementName || 'dynamic-element';
    // HtmlBehaviorResource has its own guard to prevent unnecessary subsequent initialization calls
    // so it's safe to call initialize this way
    m.initialize(isClass ? childContainer : (context.container || childContainer), ctor);
    // simulate the metadata of view model, like it was analyzed by module analyzer
    // Cannot create a ResourceDescription instance here as it does too much
    context.viewModelResource = { metadata: m, value: ctor };
    // register the host element in case custom element view model declares it
    if (context.host) {
      childContainer.registerInstance(DOM.Element, context.host);
    }
    childContainer.viewModel = context.viewModel = isClass ? childContainer.get(ctor) : context.viewModel;
    return Promise.resolve(context);
  }

  /**
  * Dynamically composes a component.
  * @param context The CompositionContext providing information on how the composition should occur.
  * @return A Promise for the View or the Controller that results from the dynamic composition.
  */
  compose(context: CompositionContext): Promise<View | Controller> {
    context.childContainer = context.childContainer || context.container.createChild();
    context.view = this.viewLocator.getViewStrategy(context.view);

    let transaction = context.childContainer.get(CompositionTransaction);
    let compositionTransactionOwnershipToken = transaction.tryCapture();

    if (compositionTransactionOwnershipToken) {
      context.compositionTransactionOwnershipToken = compositionTransactionOwnershipToken;
    } else {
      context.compositionTransactionNotifier = transaction.enlist();
    }

    if (context.viewModel) {
      return this._createControllerAndSwap(context);
    } else if (context.view) {
      if (context.viewResources) {
        context.view.makeRelativeTo(context.viewResources.viewUrl);
      }

      return context.view.loadViewFactory(this.viewEngine, new ViewCompileInstruction()).then(viewFactory => {
        let result = viewFactory.create(context.childContainer);
        result.bind(context.bindingContext, context.overrideContext);

        if (context.compositionTransactionOwnershipToken) {
          return context.compositionTransactionOwnershipToken.waitForCompositionComplete()
            .then(() => this._swap(context, result))
            .then(() => result);
        }

        return this._swap(context, result).then(() => result);
      });
    } else if (context.viewSlot) {
      context.viewSlot.removeAll();

      if (context.compositionTransactionNotifier) {
        context.compositionTransactionNotifier.done();
      }

      return Promise.resolve(null);
    }

    return Promise.resolve(null);
  }
}

/**
* Identifies a class as a resource that configures the EventManager with information
* about how events relate to properties for the purpose of two-way data-binding
* to Web Components.
*/
export class ElementConfigResource {
  /**
  * Provides an opportunity for the resource to initialize iteself.
  * @param container The dependency injection container from which the resource
  * can aquire needed services.
  * @param target The class to which this resource metadata is attached.
  */
  initialize(container: Container, target: Function): void {}

  /**
  * Allows the resource to be registered in the view resources for the particular
  * view into which it was required.
  * @param registry The view resource registry for the view that required this resource.
  * @param name The name provided by the end user for this resource, within the
  * particular view it's being used.
  */
  register(registry: ViewResources, name?: string): void {}

  /**
  * Enables the resource to asynchronously load additional resources.
  * @param container The dependency injection container from which the resource
  * can aquire needed services.
  * @param target The class to which this resource metadata is attached.
  */
  load(container: Container, target: Function): void {
    let config = new target();
    let eventManager = container.get(EventManager);
    eventManager.registerElementConfig(config);
  }
}

/**
* Decorator: Specifies a resource instance that describes the decorated class.
* @param instanceOrConfig The resource instance.
*/
export function resource(instanceOrConfig: string | object): any {
  return function(target) {
    let isConfig = typeof instanceOrConfig === 'string' || Object.getPrototypeOf(instanceOrConfig) === Object.prototype;
    if (isConfig) {
      target.$resource = instanceOrConfig;
    } else {
      metadata.define(metadata.resource, instanceOrConfig, target);
    }
  };
}

/**
* Decorator: Specifies a custom HtmlBehaviorResource instance or an object that overrides various implementation details of the default HtmlBehaviorResource.
* @param override The customized HtmlBehaviorResource or an object to override the default with.
*/
export function behavior(override: HtmlBehaviorResource | Object): any {
  return function(target) {
    if (override instanceof HtmlBehaviorResource) {
      metadata.define(metadata.resource, override, target);
    } else {
      let r = metadata.getOrCreateOwn(metadata.resource, HtmlBehaviorResource, target);
      Object.assign(r, override);
    }
  };
}

/**
* Decorator: Indicates that the decorated class is a custom element.
* @param name The name of the custom element.
*/
export function customElement(name: string): any {
  return function(target) {
    let r = metadata.getOrCreateOwn(metadata.resource, HtmlBehaviorResource, target);
    r.elementName = validateBehaviorName(name, 'custom element');
  };
}

/**
* Decorator: Indicates that the decorated class is a custom attribute.
* @param name The name of the custom attribute.
* @param defaultBindingMode The default binding mode to use when the attribute is bound with .bind.
* @param aliases The array of aliases to associate to the custom attribute.
*/
export function customAttribute(name: string, defaultBindingMode?: number, aliases?: string[]): any {
  return function(target) {
    let r = metadata.getOrCreateOwn(metadata.resource, HtmlBehaviorResource, target);
    r.attributeName = validateBehaviorName(name, 'custom attribute');
    r.attributeDefaultBindingMode = defaultBindingMode;
    r.aliases = aliases;
  };
}

/**
* Decorator: Applied to custom attributes. Indicates that whatever element the
* attribute is placed on should be converted into a template and that this
* attribute controls the instantiation of the template.
*/
export function templateController(target?): any {
  let deco = function(t) {
    let r = metadata.getOrCreateOwn(metadata.resource, HtmlBehaviorResource, t);
    r.liftsContent = true;
  };

  return target ? deco(target) : deco;
}

/**
* Decorator: Specifies that a property is bindable through HTML.
* @param nameOrConfigOrTarget The name of the property, or a configuration object.
*/
export function bindable(nameOrConfigOrTarget?: string | Object, key?, descriptor?): any {
  let deco = function(target, key2, descriptor2) {
    let actualTarget = key2 ? target.constructor : target; //is it on a property or a class?
    let r = metadata.getOrCreateOwn(metadata.resource, HtmlBehaviorResource, actualTarget);
    let prop;

    if (key2) { //is it on a property or a class?
      nameOrConfigOrTarget = nameOrConfigOrTarget || {};
      nameOrConfigOrTarget.name = key2;
    }

    prop = new BindableProperty(nameOrConfigOrTarget);
    return prop.registerWith(actualTarget, r, descriptor2);
  };

  if (!nameOrConfigOrTarget) { //placed on property initializer with parens
    return deco;
  }

  if (key) { //placed on a property initializer without parens
    let target = nameOrConfigOrTarget;
    nameOrConfigOrTarget = null;
    return deco(target, key, descriptor);
  }

  return deco; //placed on a class
}

/**
* Decorator: Specifies that the decorated custom attribute has options that
* are dynamic, based on their presence in HTML and not statically known.
*/
export function dynamicOptions(target?): any {
  let deco = function(t) {
    let r = metadata.getOrCreateOwn(metadata.resource, HtmlBehaviorResource, t);
    r.hasDynamicOptions = true;
  };

  return target ? deco(target) : deco;
}

const defaultShadowDOMOptions = { mode: 'open' };
/**
* Decorator: Indicates that the custom element should render its view in Shadow
* DOM. This decorator may change slightly when Aurelia updates to Shadow DOM v1.
*/
export function useShadowDOM(targetOrOptions?): any {
  let options = typeof targetOrOptions === 'function' || !targetOrOptions
    ? defaultShadowDOMOptions
    : targetOrOptions;

  let deco = function(t) {
    let r = metadata.getOrCreateOwn(metadata.resource, HtmlBehaviorResource, t);
    r.targetShadowDOM = true;
    r.shadowDOMOptions = options;
  };

  return typeof targetOrOptions === 'function' ? deco(targetOrOptions) : deco;
}

/**
* Decorator: Enables custom processing of the attributes on an element before the framework inspects them.
* @param processor Pass a function which can provide custom processing of the content.
*/
export function processAttributes(processor: Function): any {
  return function(t) {
    let r = metadata.getOrCreateOwn(metadata.resource, HtmlBehaviorResource, t);
    r.processAttributes = function(compiler, resources, node, attributes, elementInstruction) {
      try {
        processor(compiler, resources, node, attributes, elementInstruction);
      } catch (error) {
        LogManager.getLogger('templating').error(error);
      }
    };
  };
}

function doNotProcessContent() { return false; }

/**
* Decorator: Enables custom processing of the content that is places inside the
* custom element by its consumer.
* @param processor Pass a boolean to direct the template compiler to not process
* the content placed inside this element. Alternatively, pass a function which
* can provide custom processing of the content. This function should then return
* a boolean indicating whether the compiler should also process the content.
*/
export function processContent(processor: boolean | Function): any {
  return function(t) {
    let r = metadata.getOrCreateOwn(metadata.resource, HtmlBehaviorResource, t);
    r.processContent = processor ? function(compiler, resources, node, instruction) {
      try {
        return processor(compiler, resources, node, instruction);
      } catch (error) {
        LogManager.getLogger('templating').error(error);
        return false;
      }
    } : doNotProcessContent;
  };
}

/**
* Decorator: Indicates that the custom element should be rendered without its
* element container.
*/
export function containerless(target?): any {
  let deco = function(t) {
    let r = metadata.getOrCreateOwn(metadata.resource, HtmlBehaviorResource, t);
    r.containerless = true;
  };

  return target ? deco(target) : deco;
}

/**
* Decorator: Associates a custom view strategy with the component.
* @param strategy The view strategy instance.
*/
export function useViewStrategy(strategy: Object): any {
  return function(target) {
    metadata.define(ViewLocator.viewStrategyMetadataKey, strategy, target);
  };
}

/**
* Decorator: Provides a relative path to a view for the component.
* @param path The path to the view.
*/
export function useView(path: string): any {
  return useViewStrategy(new RelativeViewStrategy(path));
}

/**
* Decorator: Provides a view template, directly inline, for the component. Be
* sure to wrap the markup in a template element.
* @param markup The markup for the view.
* @param dependencies A list of dependencies that the template has.
* @param dependencyBaseUrl A base url from which the dependencies will be loaded.
*/
export function inlineView(markup:string, dependencies?:Array<string|Function|Object>, dependencyBaseUrl?:string): any {
  return useViewStrategy(new InlineViewStrategy(markup, dependencies, dependencyBaseUrl));
}

/**
* Decorator: Indicates that the component has no view.
*/
export function noView(targetOrDependencies?:Function|Array<any>, dependencyBaseUrl?:string): any {
  let target;
  let dependencies;
  if (typeof targetOrDependencies === 'function') {
    target = targetOrDependencies;
  } else {
    dependencies = targetOrDependencies;
    target = undefined;
  }

  let deco = function(t) {
    metadata.define(ViewLocator.viewStrategyMetadataKey, new NoViewStrategy(dependencies, dependencyBaseUrl), t);
  };

  return target ? deco(target) : deco;
}

interface IStaticViewStrategyConfig {
  template: string | HTMLTemplateElement;
  dependencies?: Function[] | { (): (Promise<Record<string, Function>> | Function)[] }
}

/**
 * Decorator: Indicates that the element use static view
 */
export function view(templateOrConfig:string|HTMLTemplateElement|IStaticViewStrategyConfig): any {
  return function(target) {
    target.$view = templateOrConfig;
  };
}

/**
* Decorator: Indicates that the decorated class provides element configuration
* to the EventManager for one or more Web Components.
*/
export function elementConfig(target?): any {
  let deco = function(t) {
    metadata.define(metadata.resource, new ElementConfigResource(), t);
  };

  return target ? deco(target) : deco;
}

/**
* Decorator: Provides the ability to add resources to the related View
* Same as: <require from="..."></require>
* @param resources Either: strings with moduleIds, Objects with 'src' and optionally 'as' properties or one of the classes of the module to be included.
*/
export function viewResources(...resources) { // eslint-disable-line
  return function(target) {
    metadata.define(ViewEngine.viewModelRequireMetadataKey, resources, target);
  };
}

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
  /**
  * A secondary binding context that can override the standard context.
  */
  overrideContext?: any;
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

    let compilerInstructions = { letExpressions: [] };
    let resources = instruction.resources || this._container.get(ViewResources);

    this._viewCompiler._compileNode(instruction.element, resources, compilerInstructions, instruction.element.parentNode, 'root', true);

    let factory = new ViewFactory(instruction.element, compilerInstructions, resources);
    let container = instruction.container || this._container.createChild();
    let view = factory.create(container, BehaviorInstruction.enhance());

    view.bind(instruction.bindingContext || {}, instruction.overrideContext);

    view.firstChild = view.lastChild = view.fragment;
    view.fragment = DOM.createDocumentFragment();
    view.attached();

    return view;
  }
}
