export class ResourceLoadContext {
  constructor(){
    this.dependencies = {};
  }

  addDependency(url){
    this.dependencies[url] = true;
  }

  doesNotHaveDependency(url){
    return !(url in this.dependencies);
  }
}

export class ViewCompileInstruction {
  static normal = new ViewCompileInstruction();

  constructor(targetShadowDOM?:boolean=false, compileSurrogate?:boolean=false, beforeCompile?:boolean=null){
    this.targetShadowDOM = targetShadowDOM;
    this.compileSurrogate = compileSurrogate;
    this.associatedModuleId = null;
    this.beforeCompile = beforeCompile; //this will be replaced soon
  }
}

interface ViewCreateInstruction {
  suppressBind?:boolean;
  systemControlled?:boolean;
  enhance?:boolean;
  partReplacements?:Object;
}

export class BehaviorInstruction {
  static normal = new BehaviorInstruction();
  static contentSelector = new BehaviorInstruction(true);

  static element(node:Node, type:HtmlBehaviorResource){
    let instruction = new BehaviorInstruction();
    instruction.type = type;
    instruction.attributes = {};
    instruction.anchorIsContainer = !(node.hasAttribute('containerless') || type.containerless);
    return instruction;
  }

  constructor(suppressBind?:boolean=false){
    this.suppressBind = suppressBind;
    this.systemControlled = false;
    this.enhance = false;
    this.partReplacements = null;
    this.viewFactory = null;
    this.originalAttrName = null;
    this.skipContentProcessing = false;
    this.contentFactory = null;
    this.executionContext = null;
    this.anchorIsContainer = false;
    this.host = null;
    this.attributes = null;
    this.type = null;
  }
}

export class TargetInstruction {
  static noExpressions = Object.freeze([]);

  static contentSelector(node:Node, parentInjectorId){
    let instruction = new TargetInstruction();
    instruction.parentInjectorId = parentInjectorId;
    instruction.contentSelector = true;
    instruction.selector = node.getAttribute('select');
    instruction.suppressBind = true
    return instruction;
  }

  static contentExpression(expression){
    let instruction = new TargetInstruction();
    instruction.contentExpression = expression;
    return instruction;
  }

  static lifting(parentInjectorId, liftingInstruction){
    let instruction = new TargetInstruction();
    instruction.parentInjectorId = parentInjectorId;
    instruction.expressions = TargetInstruction.noExpressions;
    instruction.behaviorInstructions = [liftingInstruction];
    instruction.viewFactory = liftingInstruction.viewFactory;
    instruction.providers = [liftingInstruction.type.target];
    return instruction;
  }

  static normal(injectorId, parentInjectorId, providers, behaviorInstructions, expressions, elementInstruction){
    let instruction = new TargetInstruction();
    instruction.injectorId = injectorId;
    instruction.parentInjectorId = parentInjectorId;
    instruction.providers = providers;
    instruction.behaviorInstructions = behaviorInstructions;
    instruction.expressions = expressions;
    instruction.anchorIsContainer = elementInstruction ? elementInstruction.anchorIsContainer : true;
    instruction.isCustomElement = !!elementInstruction;
    return instruction;
  }

  static surrogate(providers, behaviorInstructions, expressions, values){
    let instruction = new TargetInstruction();
    instruction.expressions = expressions;
    instruction.behaviorInstructions = behaviorInstructions;
    instruction.providers = providers;
    instruction.values = values;
    return instruction;
  }

  constructor(){
    this.parentInjectorId = null;
    this.contentSelector = false;
    this.selector = null;
    this.suppressBind = false;
    this.contentExpression = null;
    this.anchorIsContainer = false;
    this.expressions = null;
    this.behaviorInstructions = null;
    this.providers = null;
    this.viewFactory = null;
    this.isCustomElement = false;
    this.injectorId = null;
    this.values = null;
  }
}
