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

  constructor(suppressBind?:boolean=false){
    this.suppressBind = suppressBind;
    this.systemControlled = false;
    this.enhance = false;
    this.partReplacements = null;

    //attributes

    //viewFactory
    //executionContext
    //host
    //anchorIsContainer
    //contentFactory
    //skipContentProcessing

    //originalAttrName
  }
}

export class TargetInstruction {
  constructor(){

  }
}
