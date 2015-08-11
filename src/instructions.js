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

export class BehaviorInstruction {
  constructor(){
    this.systemControlled = false;
    this.suppressBind = false;
    this.enhance = false;

    //partReplacements
    //attributes
    //viewFactory
    //executionContext
    //host
  }
}

export class TargetInstruction {
  constructor(){

  }
}
