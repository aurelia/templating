export class ResourceLoadContext {
  constructor(){
    this.dependencies = {};
  }

  addDependency(url:string):void{
    this.dependencies[url] = true;
  }

  doesNotHaveDependency(url:string):boolean{
    return !(url in this.dependencies);
  }
}

export class ViewCompileInstruction {
  static normal = new ViewCompileInstruction();

  constructor(targetShadowDOM?:boolean=false, compileSurrogate?:boolean=false){
    this.targetShadowDOM = targetShadowDOM;
    this.compileSurrogate = compileSurrogate;
    this.associatedModuleId = null;
  }
}

interface ViewCreateInstruction {
  suppressBind?:boolean;
  systemControlled?:boolean;
  enhance?:boolean;
  partReplacements?:Object;
  initiatedByBehavior?:boolean;
}

export class BehaviorInstruction {
  static normal = new BehaviorInstruction();
  static contentSelector = new BehaviorInstruction(true);

  static element(node:Node, type:HtmlBehaviorResource):BehaviorInstruction{
    let instruction = new BehaviorInstruction(true);
    instruction.type = type;
    instruction.attributes = {};
    instruction.anchorIsContainer = !(node.hasAttribute('containerless') || type.containerless);
    instruction.initiatedByBehavior = true;
    return instruction;
  }

  static attribute(attrName:string, type?:HtmlBehaviorResource):BehaviorInstruction{
    let instruction = new BehaviorInstruction(true);
    instruction.attrName = attrName;
    instruction.type = type || null;
    instruction.attributes = {};
    return instruction;
  }

  static dynamic(host, bindingContext, viewFactory){
    let instruction = new BehaviorInstruction(true);
    instruction.host = host;
    instruction.bindingContext = bindingContext;
    instruction.viewFactory = viewFactory;
    return instruction;
  }

  constructor(suppressBind?:boolean=false){
    this.suppressBind = suppressBind;
    this.initiatedByBehavior = false;
    this.systemControlled = false;
    this.enhance = false;
    this.partReplacements = null;
    this.viewFactory = null;
    this.originalAttrName = null;
    this.skipContentProcessing = false;
    this.contentFactory = null;
    this.bindingContext = null;
    this.anchorIsContainer = false;
    this.host = null;
    this.attributes = null;
    this.type = null;
    this.attrName = null;
  }
}

export class TargetInstruction {
  static noExpressions = Object.freeze([]);

  static contentSelector(node:Node, parentInjectorId:number):TargetInstruction{
    let instruction = new TargetInstruction();
    instruction.parentInjectorId = parentInjectorId;
    instruction.contentSelector = true;
    instruction.selector = node.getAttribute('select');
    instruction.suppressBind = true
    return instruction;
  }

  static contentExpression(expression):TargetInstruction{
    let instruction = new TargetInstruction();
    instruction.contentExpression = expression;
    return instruction;
  }

  static lifting(parentInjectorId:number, liftingInstruction:BehaviorInstruction):TargetInstruction{
    let instruction = new TargetInstruction();
    instruction.parentInjectorId = parentInjectorId;
    instruction.expressions = TargetInstruction.noExpressions;
    instruction.behaviorInstructions = [liftingInstruction];
    instruction.viewFactory = liftingInstruction.viewFactory;
    instruction.providers = [liftingInstruction.type.target];
    return instruction;
  }

  static normal(injectorId, parentInjectorId, providers, behaviorInstructions, expressions, elementInstruction):TargetInstruction{
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

  static surrogate(providers, behaviorInstructions, expressions, values):TargetInstruction{
    let instruction = new TargetInstruction();
    instruction.expressions = expressions;
    instruction.behaviorInstructions = behaviorInstructions;
    instruction.providers = providers;
    instruction.values = values;
    return instruction;
  }

  constructor(){
    this.injectorId = null;
    this.parentInjectorId = null;

    this.contentSelector = false;
    this.selector = null;
    this.suppressBind = false;

    this.contentExpression = null;

    this.expressions = null;
    this.behaviorInstructions = null;
    this.providers = null;

    this.viewFactory = null;

    this.anchorIsContainer = false;
    this.elementInstruction = null;

    this.values = null;
  }
}
