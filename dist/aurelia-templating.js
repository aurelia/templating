import * as LogManager from 'aurelia-logging';
import {DOM,PLATFORM,FEATURE} from 'aurelia-pal';
import {Origin,protocol,metadata} from 'aurelia-metadata';
import {relativeToFile} from 'aurelia-path';
import {TemplateRegistryEntry,Loader} from 'aurelia-loader';
import {Binding,createOverrideContext,ValueConverterResource,BindingBehaviorResource,subscriberCollection,bindingMode,ObserverLocator,EventManager,createScopeForTest} from 'aurelia-binding';
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

interface CompositionTransactionOwnershipToken {
  waitForCompositionComplete(): Promise<void>;
}

interface CompositionTransactionNotifier {
  done(): void;
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
    if (this._ownershipToken !== null) {
      return null;
    }

    return (this._ownershipToken = this._createOwnershipToken());
  }

  /**
  * Enlist an async render operation into the transaction.
  * @return A completion notifier.
  */
  enlist(): CompositionTransactionNotifier {
    let that = this;

    that._compositionCount++;

    return {
      done() {
        that._compositionCount--;
        that._tryCompleteTransaction();
      }
    };
  }

  _tryCompleteTransaction() {
    if (this._compositionCount <= 0) {
      this._compositionCount = 0;

      if (this._ownershipToken !== null) {
        let capture = this._ownershipToken;
        this._ownershipToken = null;
        capture._resolve();
      }
    }
  }

  _createOwnershipToken(): CompositionTransactionOwnershipToken {
    let token = {};
    let promise = new Promise((resolve, reject) => {
      token._resolve = resolve;
    });

    token.waitForCompositionComplete = () => {
      this._tryCompleteTransaction();
      return promise;
    };

    return token;
  }
}

const capitalMatcher = /([A-Z])/g;

function addHyphenAndLower(char) {
  return '-' + char.toLowerCase();
}

export function _hyphenate(name) {
  return (name.charAt(0).toLowerCase() + name.slice(1)).replace(capitalMatcher, addHyphenAndLower);
}

interface EventHandler {
  eventName: string;
  bubbles: boolean;
  dispose: Function;
  handler: Function;
}

/**
 * Dispatches subscribets to and publishes events in the DOM.
 * @param element
 */
export class ElementEvents {
  constructor(element: Element) {
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
   * @param eventName
   * @param handler
   * @param bubbles
   * @return Returns the eventHandler containing a dispose method
   */
  subscribe(eventName: string, handler: Function, bubbles?: boolean = true): EventHandler {
    if (handler && typeof handler === 'function') {
      handler.eventName = eventName;
      handler.handler = handler;
      handler.bubbles = bubbles;
      handler.dispose = () => {
        this.element.removeEventListener(eventName, handler, bubbles);
        this._dequeueHandler(handler);
      };
      this.element.addEventListener(eventName, handler, bubbles);
      this._enqueueHandler(handler);
      return handler;
    }
  }

  /**
   * Adds an Event Listener on the context element, that will be disposed on the first trigger.
   * @param eventName
   * @param handler
   * @param bubbles
   * @return Returns the eventHandler containing a dispose method
   */
  subscribeOnce(eventName: String, handler: Function, bubbles?: Boolean = true): EventHandler {
    if (handler && typeof handler === 'function') {
      let _handler = (event) => {
        handler(event);
        _handler.dispose();
      };
      return this.subscribe(eventName, _handler, bubbles);
    }
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

/**
* A context that flows through the view resource load process.
*/
export class ResourceLoadContext {
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

  /**
  * Creates an instance of BehaviorInstruction.
  */
  constructor() {
    this.initiatedByBehavior = false;
    this.enhance = false;
    this.partReplacements = null;
    this.viewFactory = null;
    this.originalAttrName = null;
    this.skipContentProcessing = false;
    this.contentFactory = null;
    this.viewModel = null;
    this.anchorIsContainer = false;
    this.host = null;
    this.attributes = null;
    this.type = null;
    this.attrName = null;
    this.inheritBindingContext = false;
  }
}

BehaviorInstruction.normal = new BehaviorInstruction();

/**
* Provides all the instructions for how a target element should be enhanced inside of a view.
*/
export class TargetInstruction {
  /**
  * An empty array used to represent a target with no binding expressions.
  */
  static noExpressions = Object.freeze([]);

  /**
  * Creates an instruction that represents a content selector.
  * @param node The node that represents the selector.
  * @param parentInjectorId The id of the parent dependency injection container.
  * @return The created instruction.
  */
  static contentSelector(node: Node, parentInjectorId: number): TargetInstruction {
    let instruction = new TargetInstruction();
    instruction.parentInjectorId = parentInjectorId;
    instruction.contentSelector = true;
    instruction.selector = node.getAttribute('select');
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

  /**
  * Creates an instance of TargetInstruction.
  */
  constructor() {
    this.injectorId = null;
    this.parentInjectorId = null;

    this.contentSelector = false;
    this.selector = null;

    this.contentExpression = null;

    this.expressions = null;
    this.behaviorInstructions = null;
    this.providers = null;

    this.viewFactory = null;

    this.anchorIsContainer = false;
    this.elementInstruction = null;
    this.lifting = false;

    this.values = null;
  }
}

/**
* Implemented by classes that describe how a view factory should be loaded.
*/
interface ViewStrategy {
  /**
  * Loads a view factory.
  * @param viewEngine The view engine to use during the load process.
  * @param compileInstruction Additional instructions to use during compilation of the view.
  * @param loadContext The loading context used for loading all resources and dependencies.
  * @return A promise for the view factory that is produced by this strategy.
  */
  loadViewFactory(viewEngine: ViewEngine, compileInstruction: ViewCompileInstruction, loadContext?: ResourceLoadContext): Promise<ViewFactory>;
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
  * @return A promise for the view factory that is produced by this strategy.
  */
  loadViewFactory(viewEngine: ViewEngine, compileInstruction: ViewCompileInstruction, loadContext?: ResourceLoadContext): Promise<ViewFactory> {
    if (this.absolutePath === null && this.moduleId) {
      this.absolutePath = relativeToFile(this.path, this.moduleId);
    }

    compileInstruction.associatedModuleId = this.moduleId;
    return viewEngine.loadViewFactory(this.absolutePath || this.path, compileInstruction, loadContext);
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
  * @return A promise for the view factory that is produced by this strategy.
  */
  loadViewFactory(viewEngine: ViewEngine, compileInstruction: ViewCompileInstruction, loadContext?: ResourceLoadContext): Promise<ViewFactory> {
    compileInstruction.associatedModuleId = this.moduleId;
    return viewEngine.loadViewFactory(this.viewUrl, compileInstruction, loadContext);
  }
}

/**
* A view strategy that indicates that the component has no view that the templating engine needs to manage.
* Typically used when the component author wishes to take over fine-grained rendering control.
*/
@viewStrategy()
export class NoViewStrategy {
  /**
  * Loads a view factory.
  * @param viewEngine The view engine to use during the load process.
  * @param compileInstruction Additional instructions to use during compilation of the view.
  * @param loadContext The loading context used for loading all resources and dependencies.
  * @return A promise for the view factory that is produced by this strategy.
  */
  loadViewFactory(viewEngine: ViewEngine, compileInstruction: ViewCompileInstruction, loadContext?: ResourceLoadContext): Promise<ViewFactory> {
    return Promise.resolve(null);
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
  * @return A promise for the view factory that is produced by this strategy.
  */
  loadViewFactory(viewEngine: ViewEngine, compileInstruction: ViewCompileInstruction, loadContext?: ResourceLoadContext): Promise<ViewFactory> {
    let entry = this.entry;

    if (entry.factoryIsReady) {
      return Promise.resolve(entry.factory);
    }

    compileInstruction.associatedModuleId = this.moduleId;
    return viewEngine.loadViewFactory(entry, compileInstruction, loadContext);
  }
}

/**
* A view strategy that allows the component authore to inline the html for the view.
*/
@viewStrategy()
export class InlineViewStrategy {
  /**
  * Creates an instance of InlineViewStrategy.
  * @param markup The markup for the view. Be sure to include the wrapping template tag.
  * @param dependencies A list of view resource dependencies of this view.
  * @param dependencyBaseUrl The base url for the view dependencies.
  */
  constructor(markup: string, dependencies?: Array<string|Function|Object>, dependencyBaseUrl?: string) {
    this.markup = markup;
    this.dependencies = dependencies || null;
    this.dependencyBaseUrl = dependencyBaseUrl || '';
  }

  /**
  * Loads a view factory.
  * @param viewEngine The view engine to use during the load process.
  * @param compileInstruction Additional instructions to use during compilation of the view.
  * @param loadContext The loading context used for loading all resources and dependencies.
  * @return A promise for the view factory that is produced by this strategy.
  */
  loadViewFactory(viewEngine: ViewEngine, compileInstruction: ViewCompileInstruction, loadContext?: ResourceLoadContext): Promise<ViewFactory> {
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
    return viewEngine.loadViewFactory(entry, compileInstruction, loadContext);
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

      if (origin) {
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

    let origin = Origin.get(value);
    let strategy = metadata.get(ViewLocator.viewStrategyMetadataKey, value);

    if (!strategy) {
      if (!origin) {
        throw new Error('Cannot determinte default view strategy for object.', value);
      }

      strategy = this.createFallbackViewStrategy(origin);
    } else if (origin) {
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

/**
* An abstract base class for implementations of a binding language.
*/
export class BindingLanguage {
  /**
  * Inspects an attribute for bindings.
  * @param resources The ViewResources for the view being compiled.
  * @param attrName The attribute name to inspect.
  * @param attrValue The attribute value to inspce.
  * @return An info object with the results of the inspection.
  */
  inspectAttribute(resources: ViewResources, attrName: string, attrValue: string): Object {
    throw new Error('A BindingLanguage must implement inspectAttribute(...)');
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
    throw new Error('A BindingLanguage must implement createAttributeInstruction(...)');
  }

  /**
  * Parses the text for bindings.
  * @param resources The ViewResources for the view being compiled.
  * @param value The value of the text to parse.
  * @return A binding expression.
  */
  parseText(resources: ViewResources, value: string): Object {
    throw new Error('A BindingLanguage must implement parseText(...)');
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

/**
* Represents a collection of resources used during the compilation of a view.
*/
export class ViewResources {
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
  registerViewEngineHooks(hooks:ViewEngineHooks): void {
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
}

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
  * Creates a View instance.
  * @param viewFactory The factory that created this view.
  * @param fragment The DOM fragement representing the view.
  * @param controllers The controllers inside this view.
  * @param bindings The bindings inside this view.
  * @param children The children of this view.
  */
  constructor(viewFactory: ViewFactory, fragment: DocumentFragment, controllers: Controller[], bindings: Binding[], children: ViewNode[], contentSelectors: Array<Object>) {
    this.viewFactory = viewFactory;
    this.resources = viewFactory.resources;
    this.fragment = fragment;
    this.controllers = controllers;
    this.bindings = bindings;
    this.children = children;
    this.contentSelectors = contentSelectors;
    this.firstChild = fragment.firstChild;
    this.lastChild = fragment.lastChild;
    this.fromCache = false;
    this.isBound = false;
    this.isAttached = false;
    this.fromCache = false;
    this.bindingContext = null;
    this.overrideContext = null;
    this.controller = null;
    this.viewModelScope = null;
    this._isUserControlled = false;
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
    let parent = refNode.parentNode;
    parent.insertBefore(this.fragment, refNode);
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
    let start = this.firstChild;
    let end = this.lastChild;
    let fragment = this.fragment;
    let next;
    let current = start;
    let loop = true;

    while (loop) {
      if (current === end) {
        loop = false;
      }

      next = current.nextSibling;
      fragment.appendChild(current);
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

let placeholder = [];

function findInsertionPoint(groups, index) {
  let insertionPoint;

  while (!insertionPoint && index >= 0) {
    insertionPoint = groups[index][0];
    index--;
  }

  return insertionPoint;
}

export class _ContentSelector {
  static applySelectors(view, contentSelectors, callback) {
    let currentChild = view.fragment.firstChild;
    let contentMap = new Map();
    let nextSibling;
    let i;
    let ii;
    let contentSelector;

    while (currentChild) {
      nextSibling = currentChild.nextSibling;

      if (currentChild.isContentProjectionSource) {
        let viewSlotSelectors = contentSelectors.map(x => x.copyForViewSlot());
        currentChild.viewSlot._installContentSelectors(viewSlotSelectors);
      } else {
        for (i = 0, ii = contentSelectors.length; i < ii; i++) {
          contentSelector = contentSelectors[i];
          if (contentSelector.matches(currentChild)) {
            let elements = contentMap.get(contentSelector);
            if (!elements) {
              elements = [];
              contentMap.set(contentSelector, elements);
            }

            elements.push(currentChild);
            break;
          }
        }
      }

      currentChild = nextSibling;
    }

    for (i = 0, ii = contentSelectors.length; i < ii; ++i) {
      contentSelector = contentSelectors[i];
      callback(contentSelector, contentMap.get(contentSelector) || placeholder);
    }
  }

  constructor(anchor, selector) {
    this.anchor = anchor;
    this.selector = selector;
    this.all = !this.selector;
    this.groups = [];
  }

  copyForViewSlot() {
    return new _ContentSelector(this.anchor, this.selector);
  }

  matches(node) {
    return this.all || (node.nodeType === 1 && node.matches(this.selector));
  }

  add(group) {
    let anchor = this.anchor;
    let parent = anchor.parentNode;
    let i;
    let ii;

    for (i = 0, ii = group.length; i < ii; ++i) {
      parent.insertBefore(group[i], anchor);
    }

    this.groups.push(group);
  }

  insert(index, group) {
    if (group.length) {
      let anchor = findInsertionPoint(this.groups, index) || this.anchor;
      let parent = anchor.parentNode;
      let i;
      let ii;

      for (i = 0, ii = group.length; i < ii; ++i) {
        parent.insertBefore(group[i], anchor);
      }
    }

    this.groups.splice(index, 0, group);
  }

  removeAt(index, fragment) {
    let group = this.groups[index];
    let i;
    let ii;

    for (i = 0, ii = group.length; i < ii; ++i) {
      fragment.appendChild(group[i]);
    }

    this.groups.splice(index, 1);
  }
}

function getAnimatableElement(view) {
  let firstChild = view.firstChild;

  if (firstChild !== null && firstChild !== undefined && firstChild.nodeType === 8) {
    let element = DOM.nextElementSibling(firstChild);

    if (element !== null && element !== undefined &&
      element.nodeType === 1 &&
      element.classList.contains('au-animate')) {
      return element;
    }
  }

  return null;
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
    this.viewAddMethod = anchorIsContainer ? 'appendNodesTo' : 'insertNodesBefore';
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
    view[this.viewAddMethod](this.anchor);
    this.children.push(view);

    if (this.isAttached) {
      view.attached();

      let animatableElement = getAnimatableElement(view);
      if (animatableElement !== null) {
        return this.animator.enter(animatableElement);
      }
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

      let animatableElement = getAnimatableElement(view);
      if (animatableElement !== null) {
        return this.animator.enter(animatableElement);
      }
    }
  }

  /**
  * Removes a view from the slot.
  * @param view The view to remove.
  * @param returnToCache Should the view be returned to the view cache?
  * @param skipAnimation Should the removal animation be skipped?
  * @return May return a promise if the view removal triggered an animation.
  */
  remove(view: View, returnToCache?: boolean, skipAnimation?: boolean): void | Promise<View> {
    return this.removeAt(this.children.indexOf(view), returnToCache, skipAnimation);
  }

  /**
  * Removes a view an a specified index from the slot.
  * @param index The index to remove the view at.
  * @param returnToCache Should the view be returned to the view cache?
  * @param skipAnimation Should the removal animation be skipped?
  * @return May return a promise if the view removal triggered an animation.
  */
  removeAt(index: number, returnToCache?: boolean, skipAnimation?: boolean): void | Promise<View> {
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
      let animatableElement = getAnimatableElement(view);
      if (animatableElement !== null) {
        return this.animator.leave(animatableElement).then(() => removeAction());
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

      let animatableElement = getAnimatableElement(child);
      if (animatableElement !== null) {
        rmPromises.push(this.animator.leave(animatableElement).then(() => child.removeNodes()));
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
          children[i].returnToCache();
        }
      }

      this.children = [];
    };

    if (rmPromises.length > 0) {
      return Promise.all(rmPromises).then(() => removeAction());
    }

    removeAction();
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

      let element = child.firstChild ? DOM.nextElementSibling(child.firstChild) : null;
      if (child.firstChild &&
        child.firstChild.nodeType === 8 &&
         element &&
         element.nodeType === 1 &&
         element.classList.contains('au-animate')) {
        this.animator.enter(element);
      }
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

  _installContentSelectors(contentSelectors: _ContentSelector[]): void {
    this.contentSelectors = contentSelectors;
    this.add = this._contentSelectorAdd;
    this.insert = this._contentSelectorInsert;
    this.remove = this._contentSelectorRemove;
    this.removeAt = this._contentSelectorRemoveAt;
    this.removeAll = this._contentSelectorRemoveAll;
  }

  _contentSelectorAdd(view) {
    _ContentSelector.applySelectors(
      view,
      this.contentSelectors,
      (contentSelector, group) => contentSelector.add(group)
      );

    this.children.push(view);

    if (this.isAttached) {
      view.attached();
    }
  }

  _contentSelectorInsert(index, view) {
    if ((index === 0 && !this.children.length) || index >= this.children.length) {
      this.add(view);
    } else {
      _ContentSelector.applySelectors(
        view,
        this.contentSelectors,
        (contentSelector, group) => contentSelector.insert(index, group)
      );

      this.children.splice(index, 0, view);

      if (this.isAttached) {
        view.attached();
      }
    }
  }

  _contentSelectorRemove(view) {
    let index = this.children.indexOf(view);
    let contentSelectors = this.contentSelectors;
    let i;
    let ii;

    for (i = 0, ii = contentSelectors.length; i < ii; ++i) {
      contentSelectors[i].removeAt(index, view.fragment);
    }

    this.children.splice(index, 1);

    if (this.isAttached) {
      view.detached();
    }
  }

  _contentSelectorRemoveAt(index) {
    let view = this.children[index];
    let contentSelectors = this.contentSelectors;
    let i;
    let ii;

    for (i = 0, ii = contentSelectors.length; i < ii; ++i) {
      contentSelectors[i].removeAt(index, view.fragment);
    }

    this.children.splice(index, 1);

    if (this.isAttached) {
      view.detached();
    }

    return view;
  }

  _contentSelectorRemoveAll() {
    let children = this.children;
    let contentSelectors = this.contentSelectors;
    let ii = children.length;
    let jj = contentSelectors.length;
    let i;
    let j;
    let view;

    for (i = 0; i < ii; ++i) {
      view = children[i];

      for (j = 0; j < jj; ++j) {
        contentSelectors[j].removeAt(0, view.fragment);
      }
    }

    if (this.isAttached) {
      for (i = 0; i < ii; ++i) {
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

function makeElementIntoAnchor(element, elementInstruction) {
  let anchor = DOM.createComment('anchor');

  if (elementInstruction) {
    anchor.hasAttribute = function(name) { return element.hasAttribute(name); };
    anchor.getAttribute = function(name) { return element.getAttribute(name); };
    anchor.setAttribute = function(name, value) { element.setAttribute(name, value); };
  }

  DOM.replaceNode(anchor, element);

  return anchor;
}

function applyInstructions(containers, element, instruction, controllers, bindings, children, contentSelectors, partReplacements, resources) {
  let behaviorInstructions = instruction.behaviorInstructions;
  let expressions = instruction.expressions;
  let elementContainer;
  let i;
  let ii;
  let current;
  let instance;

  if (instruction.contentExpression) {
    bindings.push(instruction.contentExpression.createBinding(element.nextSibling));
    element.parentNode.removeChild(element);
    return;
  }

  if (instruction.contentSelector) {
    let commentAnchor = DOM.createComment('anchor');
    DOM.replaceNode(commentAnchor, element);
    contentSelectors.push(new _ContentSelector(commentAnchor, instruction.selector));
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

      if (instance.contentView) {
        children.push(instance.contentView);
      }

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
    element = element || null;

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
    let contentSelectors = [];
    let containers = { root: container };
    let partReplacements = createInstruction.partReplacements;
    let i;
    let ii;
    let view;
    let instructable;
    let instruction;

    this.resources._invokeHook('beforeCreate', this, container, fragment, createInstruction);

    if (element !== null && this.surrogateInstruction !== null) {
      applySurrogateInstruction(container, element, this.surrogateInstruction, controllers, bindings, children);
    }

    for (i = 0, ii = instructables.length; i < ii; ++i) {
      instructable = instructables[i];
      instruction = instructions[instructable.getAttribute('au-target-id')];

      applyInstructions(containers, instructable, instruction, controllers, bindings, children, contentSelectors, partReplacements, resources);
    }

    view = new View(this, fragment, controllers, bindings, children, contentSelectors);

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

function configureProperties(instruction, resources) {
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

let lastAUTargetID = 0;
function getNextAUTargetID() {
  return (++lastAUTargetID).toString();
}

function makeIntoInstructionTarget(element) {
  let value = element.getAttribute('class');
  let auTargetID = getNextAUTargetID();

  element.setAttribute('class', (value ? value += ' au-target' : 'au-target'));
  element.setAttribute('au-target-id', auTargetID);

  return auTargetID;
}

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
    content.insertBefore(DOM.createComment('<view>'), content.firstChild);
    content.appendChild(DOM.createComment('</view>'));

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
      let expression = resources.getBindingLanguage(this.bindingLanguage).parseText(resources, node.wholeText);
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

      info = bindingLanguage.inspectAttribute(resources, attrName, attrValue);
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
            configureProperties(instruction, resources);

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

  _compileElement(node, resources, instructions, parentNode, parentInjectorId, targetLightDOM) {
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
    let instruction;
    let info;
    let property;
    let knownAttribute;
    let auTargetID;
    let injectorId;

    if (tagName === 'content') {
      if (targetLightDOM) {
        auTargetID = makeIntoInstructionTarget(node);
        instructions[auTargetID] = TargetInstruction.contentSelector(node, parentInjectorId);
      }
      return node.nextSibling;
    } else if (tagName === 'template') {
      viewFactory = this.compile(node, resources);
      viewFactory.part = node.getAttribute('part');
    } else {
      type = resources.getElement(node.getAttribute('as-element') || tagName);
      if (type) {
        elementInstruction = BehaviorInstruction.element(node, type);
        type.processAttributes(this, resources, attributes, elementInstruction);
        behaviorInstructions.push(elementInstruction);
      }
    }

    for (i = 0, ii = attributes.length; i < ii; ++i) {
      attr = attributes[i];
      attrName = attr.name;
      attrValue = attr.value;
      info = bindingLanguage.inspectAttribute(resources, attrName, attrValue);
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
            configureProperties(instruction, resources);

            if (type.liftsContent) { //template controller
              instruction.originalAttrName = attrName;
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
            instruction.originalAttrName = attrName;
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
      if (expressions.length || behaviorInstructions.length) {
        injectorId = behaviorInstructions.length ? getNextInjectorId() : false;

        for (i = 0, ii = behaviorInstructions.length; i < ii; ++i) {
          instruction = behaviorInstructions[i];
          instruction.type.compile(this, resources, node, instruction, parentNode);
          providers.push(instruction.type.target);
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

      if (elementInstruction && elementInstruction.skipContentProcessing) {
        return node.nextSibling;
      }

      let currentChild = node.firstChild;
      while (currentChild) {
        currentChild = this._compileNode(currentChild, resources, instructions, node, injectorId || parentInjectorId, targetLightDOM);
      }
    }

    return node.nextSibling;
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
      return this.onLoaded;
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

      resourceTypeMeta = metadata.get(metadata.resource, exportedValue);

      if (resourceTypeMeta) {
        if (resourceTypeMeta.attributeName === null && resourceTypeMeta.elementName === null) {
          //no customeElement or customAttribute but behavior added by other metadata
          HtmlBehaviorResource.convention(key, resourceTypeMeta);
        }

        if (resourceTypeMeta.attributeName === null && resourceTypeMeta.elementName === null) {
          //no convention and no customeElement or customAttribute but behavior added by other metadata
          resourceTypeMeta.elementName = _hyphenate(key);
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
        if (conventional = HtmlBehaviorResource.convention(key)) {
          if (conventional.elementName !== null && !mainResource) {
            mainResource = new ResourceDescription(key, exportedValue, conventional);
          } else {
            resources.push(new ResourceDescription(key, exportedValue, conventional));
          }

          metadata.define(metadata.resource, conventional, exportedValue);
        } else if (conventional = ValueConverterResource.convention(key)) {
          resources.push(new ResourceDescription(key, exportedValue, conventional));
          metadata.define(metadata.resource, conventional, exportedValue);
        } else if (conventional = BindingBehaviorResource.convention(key)) {
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

/**
* Controls the view resource loading pipeline.
*/
@inject(Loader, Container, ViewCompiler, ModuleAnalyzer, ViewResources)
export class ViewEngine {
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
  * @return A promise for the compiled view factory.
  */
  loadViewFactory(urlOrRegistryEntry: string|TemplateRegistryEntry, compileInstruction?: ViewCompileInstruction, loadContext?: ResourceLoadContext): Promise<ViewFactory> {
    loadContext = loadContext || new ResourceLoadContext();

    return ensureRegistryEntry(this.loader, urlOrRegistryEntry).then(registryEntry => {
      if (registryEntry.onReady) {
        if (!loadContext.hasDependency(urlOrRegistryEntry)) {
          loadContext.addDependency(urlOrRegistryEntry);
          return registryEntry.onReady;
        }

        return Promise.resolve(new ProxyViewFactory(registryEntry.onReady));
      }

      loadContext.addDependency(urlOrRegistryEntry);

      registryEntry.onReady = this.loadTemplateResources(registryEntry, compileInstruction, loadContext).then(resources => {
        registryEntry.resources = resources;
        let viewFactory = this.viewCompiler.compile(registryEntry.template, resources, compileInstruction);
        registryEntry.factory = viewFactory;
        return viewFactory;
      });

      return registryEntry.onReady;
    });
  }

  /**
  * Loads all the resources specified by the registry entry.
  * @param registryEntry The template registry entry to load the resources for.
  * @param compileInstruction The compile instruction associated with the load.
  * @param loadContext The load context if this is happening within the context of a larger load operation.
  * @return A promise of ViewResources for the registry entry.
  */
  loadTemplateResources(registryEntry: TemplateRegistryEntry, compileInstruction?: ViewCompileInstruction, loadContext?: ResourceLoadContext): Promise<ViewResources> {
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
  */
  constructor(behavior: HtmlBehaviorResource, instruction: BehaviorInstruction, viewModel: Object, elementEvents?: ElementEvents) {
    this.behavior = behavior;
    this.instruction = instruction;
    this.viewModel = viewModel;
    this.isAttached = false;
    this.view = null;
    this.isBound = false;
    this.scope = null;
    this.elementEvents = elementEvents || null;

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

    if (oldValue !== newValue) {
      if (this.publishing && this.notqueued) {
        this.notqueued = false;
        this.taskQueue.queueMicroTask(this);
      }

      this.oldValue = oldValue;
      this.currentValue = newValue;
    }
  }

  /**
  * Invoked by the TaskQueue to publish changes to subscribers.
  */
  call(): void {
    let oldValue = this.oldValue;
    let newValue = this.currentValue;

    this.notqueued = true;

    if (newValue === oldValue) {
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

function getObserver(behavior, instance, name) {
  let lookup = instance.__observers__;

  if (lookup === undefined) {
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
    if (this.defaultBindingMode === null || this.defaultBindingMode === undefined) {
      this.defaultBindingMode = bindingMode.oneWay;
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
      return this._configureDescriptor(behavior, descriptor);
    }
  }

  _configureDescriptor(behavior: HtmlBehaviorResource, descriptor: Object): Object {
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
      return getObserver(behavior, this, name).getValue();
    };

    descriptor.set = function(value) {
      getObserver(behavior, this, name).setValue(value);
    };

    descriptor.get.getObserver = function(obj) {
      return getObserver(behavior, obj, name);
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

const contentSelectorViewCreateInstruction = { enhance: false };
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
    this.processAttributes = doProcessAttributes;
    this.processContent = doProcessContent;
    this.usesShadowDOM = false;
    this.childBindings = null;
    this.hasDynamicOptions = false;
    this.containerless = false;
    this.properties = [];
    this.attributes = {};
    this.isInitialized = false;
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

      return viewStrategy.loadViewFactory(container.get(ViewEngine), options, loadContext).then(viewFactory => {
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
        if (this.usesShadowDOM) {
          let currentChild = node.firstChild;
          let nextSibling;
          let toReplace;

          while (currentChild) {
            nextSibling = currentChild.nextSibling;

            if (currentChild.tagName === 'TEMPLATE' && (toReplace = currentChild.getAttribute('replace-part'))) {
              partReplacements[toReplace] = compiler.compile(currentChild, resources);
              DOM.removeNode(currentChild, parentNode);
              instruction.partReplacements = partReplacements;
            }

            currentChild = nextSibling;
          }

          instruction.skipContentProcessing = false;
        } else {
          let fragment = DOM.createDocumentFragment();
          let currentChild = node.firstChild;
          let nextSibling;
          let toReplace;

          while (currentChild) {
            nextSibling = currentChild.nextSibling;

            if (currentChild.tagName === 'TEMPLATE' && (toReplace = currentChild.getAttribute('replace-part'))) {
              partReplacements[toReplace] = compiler.compile(currentChild, resources);
              DOM.removeNode(currentChild, parentNode);
              instruction.partReplacements = partReplacements;
            } else {
              fragment.appendChild(currentChild);
            }

            currentChild = nextSibling;
          }

          instruction.contentFactory = compiler.compile(fragment, resources);
          instruction.skipContentProcessing = true;
        }
      } else {
        instruction.skipContentProcessing = true;
      }
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
    let host;
    let au = null;

    instruction = instruction || BehaviorInstruction.normal;
    element = element || null;
    bindings = bindings || null;

    if (this.elementName !== null && element) {
      if (this.usesShadowDOM) {
        host = element.createShadowRoot();
        container.registerInstance(DOM.boundary, host);
      } else {
        host = element;

        if (this.targetShadowDOM) {
          container.registerInstance(DOM.boundary, host);
        }
      }
    }

    if (element !== null) {
      element.au = au = element.au || {};
    }

    let viewModel = instruction.viewModel || container.get(this.target);
    let controller = new Controller(this, instruction, viewModel, container.elementEvents);
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
          if (!this.usesShadowDOM) {
            if (instruction.contentFactory) {
              let contentView = instruction.contentFactory.create(container, contentSelectorViewCreateInstruction);

              _ContentSelector.applySelectors(
                contentView,
                controller.view.contentSelectors,
                (contentSelector, group) => contentSelector.add(group)
              );

              controller.contentView = contentView;
            }
          }

          if (instruction.anchorIsContainer) {
            if (childBindings !== null) {
              for (let i = 0, ii = childBindings.length; i < ii; ++i) {
                controller.view.addBinding(childBindings[i].create(element, viewModel));
              }
            }

            controller.view.appendNodesTo(host);
          } else {
            controller.view.insertNodesBefore(host);
          }
        } else if (childBindings !== null) {
          for (let i = 0, ii = childBindings.length; i < ii; ++i) {
            bindings.push(childBindings[i].create(element, viewModel));
          }
        }
      } else if (controller.view) {
        //dynamic element with view
        controller.view.controller = controller;

        if (childBindings !== null) {
          for (let i = 0, ii = childBindings.length; i < ii; ++i) {
            controller.view.addBinding(childBindings[i].create(instruction.host, viewModel));
          }
        }
      } else if (childBindings !== null) {
        //dynamic element without view
        for (let i = 0, ii = childBindings.length; i < ii; ++i) {
          bindings.push(childBindings[i].create(instruction.host, viewModel));
        }
      }
    } else if (childBindings !== null) {
      //custom attribute
      for (let i = 0, ii = childBindings.length; i < ii; ++i) {
        bindings.push(childBindings[i].create(element, viewModel));
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

  create(target, viewModel) {
    return new ChildObserverBinder(this.selector, target, this.name, viewModel, this.changeHandler, this.all);
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
  constructor(selector, target, property, viewModel, changeHandler, all) {
    this.selector = selector;
    this.target = target;
    this.property = property;
    this.viewModel = viewModel;
    this.changeHandler = changeHandler in viewModel ? changeHandler : null;
    this.all = all;
  }

  bind(source) {
    let target = this.target;
    let viewModel = this.viewModel;
    let selector = this.selector;
    let current = target.firstElementChild;
    let observer = target.__childObserver__;

    if (!observer) {
      observer = target.__childObserver__ = DOM.createMutationObserver(onChildChange);
      observer.observe(target, {childList: true});
      observer.binders = [];
    }

    observer.binders.push(this);

    if (this.all) {
      let items = viewModel[this.property];
      if (!items) {
        items = viewModel[this.property] = [];
      } else {
        items.length = 0;
      }

      while (current) {
        if (current.matches(selector)) {
          items.push(current.au && current.au.controller ? current.au.controller.viewModel : current);
        }

        current = current.nextElementSibling;
      }

      if (this.changeHandler !== null) {
        this.viewModel[this.changeHandler](noMutations);
      }
    } else {
      while (current) {
        if (current.matches(selector)) {
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

  onRemove(element) {
    if (element.matches(this.selector)) {
      let value = element.au && element.au.controller ? element.au.controller.viewModel : element;

      if (this.all) {
        let items = this.viewModel[this.property];
        let index = items.indexOf(value);

        if (index !== -1) {
          items.splice(index, 1);
        }

        return true;
      }

      return false;
    }
  }

  onAdd(element) {
    let selector = this.selector;

    if (element.matches(selector)) {
      let value = element.au && element.au.controller ? element.au.controller.viewModel : element;

      if (this.all) {
        let items = this.viewModel[this.property];
        let index = 0;
        let prev = element.previousElementSibling;

        while (prev) {
          if (prev.matches(selector)) {
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
    if (this.target.__childObserver__) {
      this.target.__childObserver__.disconnect();
      this.target.__childObserver__ = null;
    }
  }
}

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

  _createControllerAndSwap(context) {
    function swap(controller) {
      return Promise.resolve(context.viewSlot.removeAll(true)).then(() => {
        if (context.currentController) {
          context.currentController.unbind();
        }

        context.viewSlot.add(controller.view);

        if (context.compositionTransactionNotifier) {
          context.compositionTransactionNotifier.done();
        }

        return controller;
      });
    }

    return this.createController(context).then(controller => {
      controller.automate(context.overrideContext, context.owningView);

      if (context.compositionTransactionOwnershipToken) {
        return context.compositionTransactionOwnershipToken.waitForCompositionComplete().then(() => swap(controller));
      }

      return swap(controller);
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
    let m;

    return this.ensureViewModel(context).then(tryActivateViewModel).then(() => {
      childContainer = context.childContainer;
      viewModel = context.viewModel;
      viewModelResource = context.viewModelResource;
      m = viewModelResource.metadata;

      let viewStrategy = this.viewLocator.getViewStrategy(context.view || viewModel);

      if (context.viewResources) {
        viewStrategy.makeRelativeTo(context.viewResources.viewUrl);
      }

      return m.load(childContainer, viewModelResource.value, null, viewStrategy, true);
    }).then(viewFactory => m.create(childContainer, BehaviorInstruction.dynamic(context.host, viewModel, viewFactory)));
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

    let m = metadata.getOrCreateOwn(metadata.resource, HtmlBehaviorResource, context.viewModel.constructor);
    m.elementName = m.elementName || 'dynamic-element';
    m.initialize(context.container || childContainer, context.viewModel.constructor);
    context.viewModelResource = { metadata: m, value: context.viewModel.constructor };
    childContainer.viewModel = context.viewModel;
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

        let work = () => {
          return Promise.resolve(context.viewSlot.removeAll(true)).then(() => {
            context.viewSlot.add(result);

            if (context.compositionTransactionNotifier) {
              context.compositionTransactionNotifier.done();
            }

            return result;
          });
        };

        if (context.compositionTransactionOwnershipToken) {
          return context.compositionTransactionOwnershipToken.waitForCompositionComplete().then(work);
        }

        return work();
      });
    } else if (context.viewSlot) {
      context.viewSlot.removeAll();

      if (context.compositionTransactionNotifier) {
        context.compositionTransactionNotifier.done();
      }

      return Promise.resolve(null);
    }
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

function validateBehaviorName(name, type) {
  if (/[A-Z]/.test(name)) {
    let newName = _hyphenate(name);
    LogManager.getLogger('templating').warn(`'${name}' is not a valid ${type} name and has been converted to '${newName}'. Upper-case letters are not allowed because the DOM is not case-sensitive.`);
    return newName;
  }
  return name;
}

/**
* Decorator: Specifies a resource instance that describes the decorated class.
* @param instance The resource instance.
*/
export function resource(instance: Object): any {
  return function(target) {
    metadata.define(metadata.resource, instance, target);
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
* @param defaultBindingMode The default binding mode to use when the attribute is bound wtih .bind.
*/
export function customAttribute(name: string, defaultBindingMode?: number): any {
  return function(target) {
    let r = metadata.getOrCreateOwn(metadata.resource, HtmlBehaviorResource, target);
    r.attributeName = validateBehaviorName(name, 'custom attribute');
    r.attributeDefaultBindingMode = defaultBindingMode;
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

/**
* Decorator: Indicates that the custom element should render its view in Shadow
* DOM. This decorator may change slightly when Aurelia updates to Shadow DOM v1.
*/
export function useShadowDOM(target?): any {
  let deco = function(t) {
    let r = metadata.getOrCreateOwn(metadata.resource, HtmlBehaviorResource, t);
    r.targetShadowDOM = true;
  };

  return target ? deco(target) : deco;
}

/**
* Decorator: Enables custom processing of the attributes on an element before the framework inspects them.
* @param processor Pass a function which can provide custom processing of the content.
*/
export function processAttributes(processor: Function): any {
  return function(t) {
    let r = metadata.getOrCreateOwn(metadata.resource, HtmlBehaviorResource, t);
    r.processAttributes = processor;
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
    r.processContent = processor || doNotProcessContent;
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
export function noView(target?): any {
  let deco = function(t) {
    metadata.define(ViewLocator.viewStrategyMetadataKey, new NoViewStrategy(), t);
  };

  return target ? deco(target) : deco;
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
