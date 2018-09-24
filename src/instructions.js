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
