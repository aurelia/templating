import * as core from 'core-js';
import * as LogManager from 'aurelia-logging';
import {Metadata,Origin,Decorators} from 'aurelia-metadata';
import {relativeToFile} from 'aurelia-path';
import {TemplateRegistryEntry,Loader} from 'aurelia-loader';
import {ValueConverter,Binding,bindingMode,ObserverLocator,BindingExpression,ValueConverterResource,EventManager} from 'aurelia-binding';
import {Container,inject} from 'aurelia-dependency-injection';
import {TaskQueue} from 'aurelia-task-queue';

let needsTemplateFixup = !('content' in document.createElement('template'));
let shadowPoly = window.ShadowDOMPolyfill || null;

export let DOMBoundary = 'aurelia-dom-boundary';
export let hasShadowDOM = !!HTMLElement.prototype.createShadowRoot;

export function nextElementSibling(element:Node):Element {
  if (element.nextElementSibling){ return element.nextElementSibling; }
  do { element = element.nextSibling }
  while (element && element.nodeType !== 1);
  return element;
}

export function createTemplateFromMarkup(markup:string):Element{
  let parser = document.createElement('div');
  parser.innerHTML = markup;

  let temp = parser.firstElementChild;

  if(needsTemplateFixup){
    temp.content = document.createDocumentFragment();
    while(temp.firstChild){
      temp.content.appendChild(temp.firstChild);
    }
  }

  return temp;
}

export function replaceNode(newNode:Node, node:Node, parentNode:Node):void{
  if(node.parentNode){
    node.parentNode.replaceChild(newNode, node);
  }else if(shadowPoly){ //HACK: IE template element and shadow dom polyfills not quite right...
    shadowPoly.unwrap(parentNode).replaceChild(
      shadowPoly.unwrap(newNode),
      shadowPoly.unwrap(node)
      );
  }else{ //HACK: same as above
    parentNode.replaceChild(newNode, node);
  }
}

export function removeNode(node:Node, parentNode:Node):void {
  if(node.parentNode){
    node.parentNode.removeChild(node);
  }else if(shadowPoly){ //HACK: IE template element and shadow dom polyfills not quite right...
    shadowPoly.unwrap(parentNode).removeChild(
      shadowPoly.unwrap(node)
      );
  }else{ //HACK: same as above
    parentNode.removeChild(node);
  }
}

export function injectStyles(styles: string, destination?: Element, prepend?:boolean) {
  let node = document.createElement('style');
  node.innerHTML = styles;
  node.type = 'text/css';

  destination = destination || document.head;

  if(prepend && destination.childNodes.length > 0){
    destination.insertBefore(node, destination.childNodes[0]);
  }else{
    destination.appendChild(node);
  }

  return node;
}

export const animationEvent = {
  enterBegin:   'animation:enter:begin',
  enterActive:  'animation:enter:active',
  enterDone:    'animation:enter:done',
  enterTimeout: 'animation:enter:timeout',

  leaveBegin:   'animation:leave:begin',
  leaveActive:  'animation:leave:active',
  leaveDone:    'animation:leave:done',
  leaveTimeout: 'animation:leave:timeout',

  staggerNext:  'animation:stagger:next',

  removeClassBegin:   'animation:remove-class:begin',
  removeClassActive:  'animation:remove-class:active',
  removeClassDone:    'animation:remove-class:done',
  removeClassTimeout: 'animation:remove-class:timeout',

  addClassBegin:   'animation:add-class:begin',
  addClassActive:  'animation:add-class:active',
  addClassDone:    'animation:add-class:done',
  addClassTimeout: 'animation:add-class:timeout',

  animateBegin:   'animation:animate:begin',
  animateActive:  'animation:animate:active',
  animateDone:    'animation:animate:done',
  animateTimeout: 'animation:animate:timeout',

  sequenceBegin: 'animation:sequence:begin',
  sequenceDone:  'animation:sequence:done'
};

export class Animator {
  static configureDefault(container, animatorInstance){
    container.registerInstance(Animator, Animator.instance = (animatorInstance || new Animator()));
  }

  move() {
    return Promise.resolve(false);
  }

  /**
   * Execute an 'enter' animation on an element
   * 
   * @param element {HTMLElement}         Element to animate
   * 
   * @returns {Promise}                   Resolved when the animation is done
   */
  enter(element) {
    return Promise.resolve(false);
  }

  /**
   * Execute a 'leave' animation on an element
   * 
   * @param element {HTMLElement}         Element to animate
   * 
   * @returns {Promise}                   Resolved when the animation is done
   */
  leave(element) {
    return Promise.resolve(false);
  }

  /**
   * Add a class to an element to trigger an animation.
   * 
   * @param element {HTMLElement}         Element to animate
   * @param className {String}            Properties to animate or name of the effect to use
   * 
   * @returns {Promise}                   Resolved when the animation is done
   */
  removeClass(element, className) {
    return Promise.resolve(false);
  }

  /**
   * Add a class to an element to trigger an animation.
   * 
   * @param element {HTMLElement}         Element to animate
   * @param className {String}            Properties to animate or name of the effect to use
   * 
   * @returns {Promise}                   Resolved when the animation is done
   */
  addClass(element, className) {
    return Promise.resolve(false);
  }
  
  /**
   * Execute a single animation.
   * 
   * @param element {HTMLElement}         Element to animate
   * @param className {Object|String}    Properties to animate or name of the effect to use
   *                                      For css animators this represents the className to 
   *                                      be added and removed right after the animation is done
   * @param options {Object}              options for the animation (duration, easing, ...)
   * 
   * @returns {Promise}                   Resolved when the animation is done
   */
  animate(element,className,options) {
    return Promise.resolve(false);
  }

  /**
   * Run a sequence of animations one after the other.
   * for example : animator.runSequence("fadeIn","callout")
   * 
   * @param sequence {Array}          An array of effectNames or classNames
   * 
   * @returns {Promise}               Resolved when all animations are done
   */
  runSequence(sequence){}

  /**
   * Register an effect (for JS based animators)
   * 
   * @param effectName {String}          name identifier of the effect
   * @param properties {Object}          Object with properties for the effect
   * 
   */
  registerEffect(effectName, properties){}

  /**
   * Unregister an effect (for JS based animators)
   * 
   * @param effectName {String}          name identifier of the effect
   */
  unregisterEffect(effectName){} 

}
var capitalMatcher = /([A-Z])/g;

function addHyphenAndLower(char){
  return "-" + char.toLowerCase();
}

export function hyphenate(name){
  return (name.charAt(0).toLowerCase() + name.slice(1)).replace(capitalMatcher, addHyphenAndLower);
}

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

export class ViewStrategy {
  static metadataKey:string = 'aurelia:view-strategy';

  makeRelativeTo(baseUrl:string):void{}

  static normalize(value:string|ViewStrategy):ViewStrategy{
    if(typeof value === 'string'){
      value = new UseViewStrategy(value);
    }

    if(value && !(value instanceof ViewStrategy)){
      throw new Error('The view must be a string or an instance of ViewStrategy.');
    }

    return value;
  }

  static getDefault(target:any):ViewStrategy{
    var strategy, annotation;

    if(typeof target !== 'function'){
      target = target.constructor;
    }

    annotation = Origin.get(target);
    strategy = Metadata.get(ViewStrategy.metadataKey, target);

    if(!strategy){
      if(!annotation){
        throw new Error('Cannot determinte default view strategy for object.', target);
      }

      strategy = new ConventionalViewStrategy(annotation.moduleId);
    }else if(annotation){
      strategy.moduleId = annotation.moduleId;
    }

    return strategy;
  }
}

export class UseViewStrategy extends ViewStrategy {
  constructor(path:string){
    super();
    this.path = path;
  }

  loadViewFactory(viewEngine:ViewEngine, compileInstruction:ViewCompileInstruction, loadContext?:ResourceLoadContext):Promise<ViewFactory>{
    if(!this.absolutePath && this.moduleId){
      this.absolutePath = relativeToFile(this.path, this.moduleId);
    }

    compileInstruction.associatedModuleId = this.moduleId;
    return viewEngine.loadViewFactory(this.absolutePath || this.path, compileInstruction, loadContext);
  }

  makeRelativeTo(file:string):void{
    this.absolutePath = relativeToFile(this.path, file);
  }
}

export class ConventionalViewStrategy extends ViewStrategy {
  constructor(moduleId:string){
    super();
    this.moduleId = moduleId;
    this.viewUrl = ConventionalViewStrategy.convertModuleIdToViewUrl(moduleId);
  }

  loadViewFactory(viewEngine:ViewEngine, compileInstruction:ViewCompileInstruction, loadContext?:ResourceLoadContext):Promise<ViewFactory>{
    compileInstruction.associatedModuleId = this.moduleId;
    return viewEngine.loadViewFactory(this.viewUrl, compileInstruction, loadContext);
  }

  static convertModuleIdToViewUrl(moduleId:string):string{
    var id = (moduleId.endsWith('.js') || moduleId.endsWith('.ts')) ? moduleId.substring(0, moduleId.length - 3) : moduleId;
    return id + '.html';
  }
}

export class NoViewStrategy extends ViewStrategy {
  loadViewFactory(viewEngine:ViewEngine, compileInstruction:ViewCompileInstruction, loadContext?:ResourceLoadContext):Promise<ViewFactory>{
    return Promise.resolve(null);
  }
}

export class TemplateRegistryViewStrategy extends ViewStrategy {
  constructor(moduleId:string, entry:TemplateRegistryEntry){
    super();
    this.moduleId = moduleId;
    this.entry = entry;
  }

  loadViewFactory(viewEngine:ViewEngine, compileInstruction:ViewCompileInstruction, loadContext?:ResourceLoadContext):Promise<ViewFactory>{
    let entry = this.entry;

    if(entry.isReady){
      return Promise.resolve(entry.factory);
    }

    compileInstruction.associatedModuleId = this.moduleId;
    return viewEngine.loadViewFactory(entry, compileInstruction, loadContext);
  }
}

export class InlineViewStrategy extends ViewStrategy {
  constructor(markup:string, dependencies?:Array<string|Function|Object>, dependencyBaseUrl?:string){
    super();
    this.markup = markup;
    this.dependencies = dependencies || null;
    this.dependencyBaseUrl = dependencyBaseUrl || '';
  }

  loadViewFactory(viewEngine:ViewEngine, compileInstruction:ViewCompileInstruction, loadContext?:ResourceLoadContext):Promise<ViewFactory>{
    let entry = this.entry,
        dependencies = this.dependencies;

    if(entry && entry.isReady){
      return Promise.resolve(entry.factory);
    }

    this.entry = entry = new TemplateRegistryEntry(this.moduleId || this.dependencyBaseUrl);
    entry.setTemplate(createTemplateFromMarkup(this.markup));

    if(dependencies !== null){
      for(let i = 0, ii = dependencies.length; i < ii; ++i){
        let current = dependencies[i];

        if(typeof current === 'string' || typeof current === 'function'){
          entry.addDependency(current);
        }else{
          entry.addDependency(current.from, current.as);
        }
      }
    }

    compileInstruction.associatedModuleId = this.moduleId
    return viewEngine.loadViewFactory(entry, compileInstruction, loadContext);
  }
}

export class BindingLanguage {
  inspectAttribute(resources, attrName, attrValue){
    throw new Error('A BindingLanguage must implement inspectAttribute(...)');
  }

  createAttributeInstruction(resources, element, info, existingInstruction){
    throw new Error('A BindingLanguage must implement createAttributeInstruction(...)');
  }

  parseText(resources, value){
    throw new Error('A BindingLanguage must implement parseText(...)');
  }
}
function register(lookup, name, resource, type){
  if(!name){
    return;
  }

  var existing = lookup[name];
  if(existing){
    if(existing !== resource) {
      throw new Error(`Attempted to register ${type} when one with the same name already exists. Name: ${name}.`);
    }

    return;
  }

  lookup[name] = resource;
}

interface ViewEngineHooks {
  beforeCompile?: (content: DocumentFragment, resources: ViewResources, instruction: ViewCompileInstruction) => void;
  afterCompile?: (viewFactory: ViewFactory) => void;
  beforeCreate?: (viewFactory: ViewFactory, container: Container, content: DocumentFragment, instruction: ViewCreateInstruction, bindingContext?:Object) => void;
  afterCreate?: (view: View) => void;
}

export class ViewResources {
  constructor(parent?:ViewResources, viewUrl?:string){
    this.parent = parent || null;
    this.hasParent = this.parent !== null;
    this.viewUrl = viewUrl || '';
    this.valueConverterLookupFunction = this.getValueConverter.bind(this);
    this.attributes = {};
    this.elements = {};
    this.valueConverters = {};
    this.attributeMap = {};
    this.bindingLanguage = null;
    this.hook1 = null;
    this.hook2 = null;
    this.hook3 = null;
    this.additionalHooks = null;
  }

  onBeforeCompile(content: DocumentFragment, resources: ViewResources, instruction: ViewCompileInstruction): void {
    if(this.hasParent){
      this.parent.onBeforeCompile(content, resources, instruction);
    }

    if(this.hook1 !== null){
      this.hook1.beforeCompile(content, resources, instruction);

      if(this.hook2 !== null){
        this.hook2.beforeCompile(content, resources, instruction);

        if(this.hook3 !== null){
          this.hook3.beforeCompile(content, resources, instruction);

          if(this.additionalHooks !== null){
            let hooks = this.additionalHooks;
            for(let i = 0, length = hooks.length; i < length; ++i){
              hooks[i].beforeCompile(content, resources, instruction);
            }
          }
        }
      }
    }
  }

  onAfterCompile(viewFactory: ViewFactory): void {
    if(this.hasParent){
      this.parent.onAfterCompile(viewFactory);
    }

    if(this.hook1 !== null){
      this.hook1.afterCompile(viewFactory);

      if(this.hook2 !== null){
        this.hook2.afterCompile(viewFactory);

        if(this.hook3 !== null){
          this.hook3.afterCompile(viewFactory);

          if(this.additionalHooks !== null){
            let hooks = this.additionalHooks;
            for(let i = 0, length = hooks.length; i < length; ++i){
              hooks[i].afterCompile(viewFactory);
            }
          }
        }
      }
    }
  }

  onBeforeCreate(viewFactory: ViewFactory, container: Container, content: DocumentFragment, instruction: ViewCreateInstruction, bindingContext?:Object): void {
    if(this.hasParent){
      this.parent.onBeforeCreate(viewFactory, container, content, instruction, bindingContext);
    }

    if(this.hook1 !== null){
      this.hook1.beforeCreate(viewFactory, container, content, instruction, bindingContext);

      if(this.hook2 !== null){
        this.hook2.beforeCreate(viewFactory, container, content, instruction, bindingContext);

        if(this.hook3 !== null){
          this.hook3.beforeCreate(viewFactory, container, content, instruction, bindingContext);

          if(this.additionalHooks !== null){
            let hooks = this.additionalHooks;
            for(let i = 0, length = hooks.length; i < length; ++i){
              hooks[i].beforeCreate(viewFactory, container, content, instruction, bindingContext);
            }
          }
        }
      }
    }
  }

  onAfterCreate(view: View): void {
    if(this.hasParent){
      this.parent.onAfterCreate(view);
    }

    if(this.hook1 !== null){
      this.hook1.afterCreate(view);

      if(this.hook2 !== null){
        this.hook2.afterCreate(view);

        if(this.hook3 !== null){
          this.hook3.afterCreate(view);

          if(this.additionalHooks !== null){
            let hooks = this.additionalHooks;
            for(let i = 0, length = hooks.length; i < length; ++i){
              hooks[i].afterCreate(view);
            }
          }
        }
      }
    }
  }

  registerViewEngineHooks(hooks:ViewEngineHooks): void {
    if(hooks.beforeCompile === undefined) hooks.beforeCompile = Metadata.noop;
    if(hooks.afterCompile === undefined) hooks.afterCompile = Metadata.noop;
    if(hooks.beforeCreate === undefined) hooks.beforeCreate = Metadata.noop;
    if(hooks.afterCreate === undefined) hooks.afterCreate = Metadata.noop;

    if(this.hook1 === null) this.hook1 = hooks;
    else if(this.hook2 === null) this.hook2 = hooks;
    else if(this.hook3 === null) this.hook3 = hooks;
    else {
      if(this.additionalHooks === null){
        this.additionalHooks = [];
      }

      this.additionalHooks.push(hooks);
    }
  }

  getBindingLanguage(bindingLanguageFallback: BindingLanguage): BindingLanguage {
    return this.bindingLanguage || (this.bindingLanguage = bindingLanguageFallback);
  }

  patchInParent(newParent:ViewResources): void {
    let originalParent = this.parent;

    this.parent = newParent || null;
    this.hasParent = this.parent !== null;

    if(newParent.parent === null){
      newParent.parent = originalParent;
      newParent.hasParent = originalParent !== null;
    }
  }

  relativeToView(path:string): string {
    return relativeToFile(path, this.viewUrl);
  }

  registerElement(tagName:string, behavior:HtmlBehaviorResource): void {
    register(this.elements, tagName, behavior, 'an Element');
  }

  getElement(tagName:string): HtmlBehaviorResource {
    return this.elements[tagName] || (this.hasParent ? this.parent.getElement(tagName) : null);
  }

  mapAttribute(attribute:string): string{
    return this.attributeMap[attribute] || (this.hasParent ? this.parent.mapAttribute(attribute) : null);
  }

  registerAttribute(attribute:string, behavior:HtmlBehaviorResource, knownAttribute:string): void {
    this.attributeMap[attribute] = knownAttribute;
    register(this.attributes, attribute, behavior, 'an Attribute');
  }

  getAttribute(attribute:string): HtmlBehaviorResource {
    return this.attributes[attribute] || (this.hasParent ? this.parent.getAttribute(attribute) : null);
  }

  registerValueConverter(name:string, valueConverter:ValueConverter): void {
    register(this.valueConverters, name, valueConverter, 'a ValueConverter');
  }

  getValueConverter(name:string): ValueConverter {
    return this.valueConverters[name] || (this.hasParent ? this.parent.getValueConverter(name) : null);
  }
}

//NOTE: Adding a fragment to the document causes the nodes to be removed from the fragment.
//NOTE: Adding to the fragment, causes the nodes to be removed from the document.

interface ViewNode {
  bind(bindingContext: Object, systemUpdate?: boolean): void;
  attached(): void;
  detached(): void;
  unbind(): void;
}

export class View {
  constructor(viewFactory: ViewFactory, container: Container, fragment: DocumentFragment, behaviors: BehaviorInstance[], bindings: Binding[], children: ViewNode[], systemControlled: boolean, contentSelectors: ContentSelector[]){
    this.viewFactory = viewFactory;
    this.container = container;
    this.fragment = fragment;
    this.behaviors = behaviors;
    this.bindings = bindings;
    this.children = children;
    this.systemControlled = systemControlled;
    this.contentSelectors = contentSelectors;
    this.firstChild = fragment.firstChild;
    this.lastChild = fragment.lastChild;
    this.isBound = false;
    this.isAttached = false;
    this.fromCache = false;
  }

  returnToCache(): void {
    this.viewFactory.returnViewToCache(this);
  }

  created(): void {
    var i, ii, behaviors = this.behaviors;
    for(i = 0, ii = behaviors.length; i < ii; ++i){
      behaviors[i].created(this);
    }
  }

  bind(bindingContext: Object, systemUpdate?: boolean): void {
    var context, behaviors, bindings, children, i, ii;

    if(systemUpdate && !this.systemControlled){
      context = this.bindingContext || bindingContext;
    }else{
      context = bindingContext || this.bindingContext;
    }

    if(this.isBound){
      if(this.bindingContext === context){
        return;
      }

      this.unbind();
    }

    this.isBound = true;
    this.bindingContext = context;

    if(this.owner){
      this.owner.bind(context);
    }

    bindings = this.bindings;
    for(i = 0, ii = bindings.length; i < ii; ++i){
      bindings[i].bind(context);
    }

    behaviors = this.behaviors;
    for(i = 0, ii = behaviors.length; i < ii; ++i){
      behaviors[i].bind(context);
    }

    children = this.children;
    for(i = 0, ii = children.length; i < ii; ++i){
      children[i].bind(context, true);
    }
  }

  addBinding(binding: Binding): void {
    this.bindings.push(binding);

    if(this.isBound){
      binding.bind(this.bindingContext);
    }
  }

  unbind(): void {
    var behaviors, bindings, children, i, ii;

    if(this.isBound){
      this.isBound = false;

      if(this.owner){
        this.owner.unbind();
      }

      bindings = this.bindings;
      for(i = 0, ii = bindings.length; i < ii; ++i){
        bindings[i].unbind();
      }

      behaviors = this.behaviors;
      for(i = 0, ii = behaviors.length; i < ii; ++i){
        behaviors[i].unbind();
      }

      children = this.children;
      for(i = 0, ii = children.length; i < ii; ++i){
        children[i].unbind();
      }
    }
  }

  insertNodesBefore(refNode: Node): void {
    var parent = refNode.parentNode;
    parent.insertBefore(this.fragment, refNode);
  }

  appendNodesTo(parent: Element): void {
    parent.appendChild(this.fragment);
  }

  removeNodes(): void {
    var start = this.firstChild,
        end = this.lastChild,
        fragment = this.fragment,
        next;

    var current = start,
        loop = true,
        nodes = [];

    while(loop){
      if(current === end){
        loop = false;
      }

      next = current.nextSibling;
      this.fragment.appendChild(current);
      current = next;
    }
  }

  attached(): void {
    var behaviors, children, i, ii;

    if(this.isAttached){
      return;
    }

    this.isAttached = true;

    if(this.owner){
      this.owner.attached();
    }

    behaviors = this.behaviors;
    for(i = 0, ii = behaviors.length; i < ii; ++i){
      behaviors[i].attached();
    }

    children = this.children;
    for(i = 0, ii = children.length; i < ii; ++i){
      children[i].attached();
    }
  }

  detached(): void {
    var behaviors, children, i, ii;

    if(this.isAttached){
      this.isAttached = false;

      if(this.owner){
        this.owner.detached();
      }

      behaviors = this.behaviors;
      for(i = 0, ii = behaviors.length; i < ii; ++i){
        behaviors[i].detached();
      }

      children = this.children;
      for(i = 0, ii = children.length; i < ii; ++i){
        children[i].detached();
      }
    }
  }
}

if (Element && !Element.prototype.matches) {
    var proto = Element.prototype;
    proto.matches = proto.matchesSelector ||
      proto.mozMatchesSelector || proto.msMatchesSelector ||
      proto.oMatchesSelector || proto.webkitMatchesSelector;
}

var placeholder = [];

function findInsertionPoint(groups, index){
  var insertionPoint;

  while(!insertionPoint && index >= 0){
    insertionPoint = groups[index][0];
    index--;
  }

  return insertionPoint;
}

export class ContentSelector {
  static applySelectors(view, contentSelectors, callback){
    var currentChild = view.fragment.firstChild,
                       contentMap = new Map(),
                       nextSibling, i, ii, contentSelector;

    while (currentChild) {
      nextSibling = currentChild.nextSibling;

      if(currentChild.viewSlot){
        var viewSlotSelectors = contentSelectors.map(x => x.copyForViewSlot());
        currentChild.viewSlot.installContentSelectors(viewSlotSelectors);
      }else{
        for(i = 0, ii = contentSelectors.length; i < ii; i++){
          contentSelector = contentSelectors[i];
          if(contentSelector.matches(currentChild)){
            var elements = contentMap.get(contentSelector);
            if(!elements){
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

    for(i = 0, ii = contentSelectors.length; i < ii; ++i){
      contentSelector = contentSelectors[i];
      callback(contentSelector, contentMap.get(contentSelector) || placeholder);
    }
  }

  constructor(anchor, selector){
    this.anchor = anchor;
    this.selector = selector;
    this.all = !this.selector;
    this.groups = [];
  }

  copyForViewSlot(){
    return new ContentSelector(this.anchor, this.selector);
  }

  matches(node){
    return this.all ||
      (node.nodeType === 1 && node.matches(this.selector));
  }

  add(group){
    var anchor = this.anchor,
        parent = anchor.parentNode,
        i, ii;

    for(i = 0, ii = group.length; i < ii; ++i){
      parent.insertBefore(group[i], anchor);
    }

    this.groups.push(group);
  }

  insert(index, group){
    if(group.length){
      var anchor = findInsertionPoint(this.groups, index) || this.anchor,
          parent = anchor.parentNode,
          i, ii;

      for(i = 0, ii = group.length; i < ii; ++i){
        parent.insertBefore(group[i], anchor);
      }
    }

    this.groups.splice(index, 0, group);
  }

  removeAt(index, fragment){
    var group = this.groups[index],
        i, ii;

    for(i = 0, ii = group.length; i < ii; ++i){
      fragment.appendChild(group[i]);
    }

    this.groups.splice(index, 1);
  }
}

function getAnimatableElement(view){
  let firstChild = view.firstChild;

  if(firstChild !== null && firstChild !== undefined && firstChild.nodeType === 8){
    let element = nextElementSibling(firstChild);

    if(element !== null && element !== undefined &&
      element.nodeType === 1 &&
      element.classList.contains('au-animate')) {
      return element;
    }
  }

  return null;
}

export class ViewSlot {
  constructor(anchor: Node, anchorIsContainer: boolean, bindingContext?: Object, animator?: Animator = Animator.instance){
    this.anchor = anchor;
    this.viewAddMethod = anchorIsContainer ? 'appendNodesTo' : 'insertNodesBefore';
    this.bindingContext = bindingContext;
    this.animator = animator;
    this.children = [];
    this.isBound = false;
    this.isAttached = false;
    this.contentSelectors = null;
    anchor.viewSlot = this;
  }

  transformChildNodesIntoView(): void {
    var parent = this.anchor;

    this.children.push({
      fragment:parent,
      firstChild:parent.firstChild,
      lastChild:parent.lastChild,
      returnToCache(){},
      removeNodes(){
        var last;

        while(last = parent.lastChild) {
          parent.removeChild(last);
        }
      },
      created(){},
      bind(){},
      unbind(){},
      attached(){},
      detached(){}
    });
  }

  bind(bindingContext: Object): void {
    var i, ii, children;

    if(this.isBound){
      if(this.bindingContext === bindingContext){
        return;
      }

      this.unbind();
    }

    this.isBound = true;
    this.bindingContext = bindingContext = bindingContext || this.bindingContext;

    children = this.children;
    for(i = 0, ii = children.length; i < ii; ++i){
      children[i].bind(bindingContext, true);
    }
  }

  unbind(): void {
    var i, ii, children = this.children;
    this.isBound = false;

    for(i = 0, ii = children.length; i < ii; ++i){
      children[i].unbind();
    }
  }

  add(view: View): void {
    view[this.viewAddMethod](this.anchor);
    this.children.push(view);

    if(this.isAttached){
      view.attached();

      let animatableElement = getAnimatableElement(view);
      if(animatableElement !== null){
        return this.animator.enter(animatableElement);
      }
    }
  }

  insert(index: number, view: View): void | Promise<any> {
    let children = this.children,
        length = children.length;

    if((index === 0 && length === 0) || index >= length){
      return this.add(view);
    } else{
      view.insertNodesBefore(children[index].firstChild);
      children.splice(index, 0, view);

      if(this.isAttached){
        view.attached();

        let animatableElement = getAnimatableElement(view);
        if(animatableElement !== null){
          return this.animator.enter(animatableElement);
        }
      }
    }
  }

  remove(view: View, returnToCache?: boolean, skipAnimation?: boolean): void | Promise<View> {
    return this.removeAt(this.children.indexOf(view), returnToCache, skipAnimation);
  }

  removeAt(index: number, returnToCache?: boolean, skipAnimation?: boolean): void | Promise<View> {
    var view = this.children[index];

    var removeAction = () => {
      view.removeNodes();
      this.children.splice(index, 1);

      if(this.isAttached){
        view.detached();
      }

      if(returnToCache){
        view.returnToCache();
      }

      return view;
    };

    if(!skipAnimation){
      let animatableElement = getAnimatableElement(view);
      if(animatableElement !== null){
        return this.animator.leave(animatableElement).then(() => removeAction());
      }
    }

    return removeAction();
  }

  removeAll(returnToCache?: boolean, skipAnimation?: boolean): void | Promise<any> {
    var children = this.children,
        ii = children.length,
        i;

    var rmPromises = [];

    children.forEach(child => {
      if(skipAnimation){
        child.removeNodes();
        return;
      }

      let animatableElement = getAnimatableElement(child);
      if(animatableElement !== null){
        rmPromises.push(this.animator.leave(animatableElement).then(() => child.removeNodes()));
      } else {
        child.removeNodes();
      }
    });

    var removeAction = () => {
      if(this.isAttached){
        for(i = 0; i < ii; ++i){
          children[i].detached();
        }
      }

      if(returnToCache){
        for(i = 0; i < ii; ++i){
          children[i].returnToCache();
        }
      }

      this.children = [];
    };

    if(rmPromises.length > 0) {
      return Promise.all(rmPromises).then(() => removeAction());
    } else {
      removeAction();
    }
  }

  swap(view: View, returnToCache?: boolean): void | Promise<any> {
    var removeResponse = this.removeAll(returnToCache);

    if(removeResponse instanceof Promise){
      return removeResponse.then(() => this.add(view));
    } else{
      return this.add(view);
    }
  }

  attached(): void {
    var i, ii, children, child;

    if(this.isAttached){
      return;
    }

    this.isAttached = true;

    children = this.children;
    for(i = 0, ii = children.length; i < ii; ++i){
      child = children[i];
      child.attached();

      var element = child.firstChild ? nextElementSibling(child.firstChild) : null;
      if(child.firstChild &&
        child.firstChild.nodeType === 8 &&
         element &&
         element.nodeType === 1 &&
         element.classList.contains('au-animate')) {
        this.animator.enter(element);
      }
    }
  }

  detached(): void {
    var i, ii, children;

    if(this.isAttached){
      this.isAttached = false;
      children = this.children;
      for(i = 0, ii = children.length; i < ii; ++i){
        children[i].detached();
      }
    }
  }

  installContentSelectors(contentSelectors: ContentSelector[]): void {
    this.contentSelectors = contentSelectors;
    this.add = this._contentSelectorAdd;
    this.insert = this._contentSelectorInsert;
    this.remove = this._contentSelectorRemove;
    this.removeAt = this._contentSelectorRemoveAt;
    this.removeAll = this._contentSelectorRemoveAll;
  }

  _contentSelectorAdd(view){
    ContentSelector.applySelectors(
      view,
      this.contentSelectors,
      (contentSelector, group) => contentSelector.add(group)
      );

    this.children.push(view);

    if(this.isAttached){
      view.attached();
    }
  }

  _contentSelectorInsert(index, view){
    if((index === 0 && !this.children.length) || index >= this.children.length){
      this.add(view);
    } else{
      ContentSelector.applySelectors(
        view,
        this.contentSelectors,
        (contentSelector, group) => contentSelector.insert(index, group)
      );

      this.children.splice(index, 0, view);

      if(this.isAttached){
        view.attached();
      }
    }
  }

  _contentSelectorRemove(view){
    var index = this.children.indexOf(view),
        contentSelectors = this.contentSelectors,
        i, ii;

    for(i = 0, ii = contentSelectors.length; i < ii; ++i){
      contentSelectors[i].removeAt(index, view.fragment);
    }

    this.children.splice(index, 1);

    if(this.isAttached){
      view.detached();
    }
  }

  _contentSelectorRemoveAt(index){
    var view = this.children[index],
        contentSelectors = this.contentSelectors,
        i, ii;

    for(i = 0, ii = contentSelectors.length; i < ii; ++i){
      contentSelectors[i].removeAt(index, view.fragment);
    }

    this.children.splice(index, 1);

    if(this.isAttached){
      view.detached();
    }

    return view;
  }

  _contentSelectorRemoveAll(){
    var children = this.children,
        contentSelectors = this.contentSelectors,
        ii = children.length,
        jj = contentSelectors.length,
        i, j, view;

    for(i = 0; i < ii; ++i){
      view = children[i];

      for(j = 0; j < jj; ++j){
        contentSelectors[j].removeAt(0, view.fragment);
      }
    }

    if(this.isAttached){
      for(i = 0; i < ii; ++i){
        children[i].detached();
      }
    }

    this.children = [];
  }
}

function elementContainerGet(key){
  if(key === Element){
    return this.element;
  }

  if(key === BoundViewFactory){
    if(this.boundViewFactory){
      return this.boundViewFactory;
    }

    var factory = this.instruction.viewFactory,
        partReplacements = this.partReplacements;

    if(partReplacements){
      factory = partReplacements[factory.part] || factory;
    }

    return this.boundViewFactory = new BoundViewFactory(this, factory, this.bindingContext, partReplacements);
  }

  if(key === ViewSlot){
    if(this.viewSlot === undefined){
      this.viewSlot = new ViewSlot(this.element, this.instruction.anchorIsContainer, this.bindingContext);
      this.children.push(this.viewSlot);
    }

    return this.viewSlot;
  }

  if(key === ViewResources){
    return this.viewResources;
  }

  if(key === TargetInstruction){
    return this.instruction;
  }

  return this.superGet(key);
}

function createElementContainer(parent, element, instruction, bindingContext, children, partReplacements, resources){
  var container = parent.createChild(),
                  providers,
                  i;

  container.element = element;
  container.instruction = instruction;
  container.bindingContext = bindingContext;
  container.children = children;
  container.viewResources = resources;
  container.partReplacements = partReplacements;

  providers = instruction.providers;
  i = providers.length;

  while(i--) {
    container.registerSingleton(providers[i]);
  }

  container.superGet = container.get;
  container.get = elementContainerGet;

  return container;
}

function makeElementIntoAnchor(element, elementInstruction){
  var anchor = document.createComment('anchor');

  if(elementInstruction){
    anchor.hasAttribute = function(name) { return element.hasAttribute(name); };
    anchor.getAttribute = function(name){ return element.getAttribute(name); };
    anchor.setAttribute = function(name, value) { element.setAttribute(name, value); };
  }

  element.parentNode.replaceChild(anchor, element);

  return anchor;
}

function applyInstructions(containers, bindingContext, element, instruction,
  behaviors, bindings, children, contentSelectors, partReplacements, resources){
  var behaviorInstructions = instruction.behaviorInstructions,
      expressions = instruction.expressions,
      elementContainer, i, ii, current, instance;

  if(instruction.contentExpression){
    bindings.push(instruction.contentExpression.createBinding(element.nextSibling));
    element.parentNode.removeChild(element);
    return;
  }

  if(instruction.contentSelector){
    var commentAnchor = document.createComment('anchor');
    element.parentNode.replaceChild(commentAnchor, element);
    contentSelectors.push(new ContentSelector(commentAnchor, instruction.selector));
    return;
  }

  if(behaviorInstructions.length){
    if(!instruction.anchorIsContainer){
      element = makeElementIntoAnchor(element, instruction.elementInstruction);
    }

    containers[instruction.injectorId] = elementContainer =
      createElementContainer(
        containers[instruction.parentInjectorId],
        element,
        instruction,
        bindingContext,
        children,
        partReplacements,
        resources
        );

    for(i = 0, ii = behaviorInstructions.length; i < ii; ++i){
      current = behaviorInstructions[i];
      instance = current.type.create(elementContainer, current, element, bindings, current.partReplacements);

      if(instance.contentView){
        children.push(instance.contentView);
      }

      behaviors.push(instance);
    }
  }

  for(i = 0, ii = expressions.length; i < ii; ++i){
    bindings.push(expressions[i].createBinding(element));
  }
}

function styleStringToObject(style, target) {
    var attributes = style.split(';'),
        firstIndexOfColon, i, current, key, value;

    target = target || {};

    for(i = 0; i < attributes.length; i++) {
      current = attributes[i];
      firstIndexOfColon = current.indexOf(":");
      key = current.substring(0, firstIndexOfColon).trim();
      value = current.substring(firstIndexOfColon + 1).trim();
      target[key] = value;
    }

    return target;
}

function styleObjectToString(obj){
  let result = '';

  for(let key in obj){
    result += key + ':' + obj[key] + ';';
  }

  return result;
}

function applySurrogateInstruction(container, element, instruction, behaviors, bindings, children){
  let behaviorInstructions = instruction.behaviorInstructions,
      expressions = instruction.expressions,
      providers = instruction.providers,
      values = instruction.values,
      i, ii, current, instance, currentAttributeValue, styleParts;

  i = providers.length;
  while(i--) {
    container.registerSingleton(providers[i]);
  }

  //apply surrogate attributes
  for(let key in values){
    currentAttributeValue = element.getAttribute(key);

    if(currentAttributeValue){
      if(key === 'class'){
        //merge the surrogate classes
        element.setAttribute('class', currentAttributeValue + ' ' + values[key]);
      }else if(key === 'style'){
        //merge the surrogate styles
        let styleObject = styleStringToObject(values[key]);
        styleStringToObject(currentAttributeValue, styleObject);
        element.setAttribute('style', styleObjectToString(styleObject));
      }

      //otherwise, do not overwrite the consumer's attribute
    }else{
      //copy the surrogate attribute
      element.setAttribute(key, values[key]);
    }
  }

  //apply surrogate behaviors
  if(behaviorInstructions.length){
    for(i = 0, ii = behaviorInstructions.length; i < ii; ++i){
      current = behaviorInstructions[i];
      instance = current.type.create(container, current, element, bindings, current.partReplacements);

      if(instance.contentView){
        children.push(instance.contentView);
      }

      behaviors.push(instance);
    }
  }

  //apply surrogate bindings
  for(i = 0, ii = expressions.length; i < ii; ++i){
    bindings.push(expressions[i].createBinding(element));
  }
}

export class BoundViewFactory {
  constructor(parentContainer: Container, viewFactory: ViewFactory, bindingContext: Object, partReplacements?: Object){
    this.parentContainer = parentContainer;
    this.viewFactory = viewFactory;
    this.bindingContext = bindingContext;
    this.factoryCreateInstruction = { partReplacements:partReplacements };
  }

  create(bindingContext?: Object): View {
    var childContainer = this.parentContainer.createChild(),
        context = bindingContext || this.bindingContext;

    this.factoryCreateInstruction.systemControlled = !bindingContext;

    return this.viewFactory.create(childContainer, context, this.factoryCreateInstruction);
  }

  get isCaching(){
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

export class ViewFactory {
  constructor(template: DocumentFragment, instructions: Object, resources: ViewResources) {
    this.template = template;
    this.instructions = instructions;
    this.resources = resources;
    this.cacheSize = -1;
    this.cache = null;
    this.isCaching = false;
  }

  setCacheSize(size: number | string, doNotOverrideIfAlreadySet: boolean): void {
    if(size){
      if(size === '*'){
        size = Number.MAX_VALUE;
      } else if(typeof size === "string") {
        size = parseInt(size);
      }
    }

    if(this.cacheSize === -1 || !doNotOverrideIfAlreadySet){
      this.cacheSize = size;
    }

    if(this.cacheSize > 0){
      this.cache = [];
    } else {
      this.cache = null;
    }

    this.isCaching = this.cacheSize > 0;
  }

  getCachedView(): View {
    return this.cache !== null ? (this.cache.pop() || null) : null;
  }

  returnViewToCache(view: View): void {
    if(view.isAttached){
      view.detached();
    }

    if(view.isBound){
      view.unbind();
    }

    if(this.cache !== null && this.cache.length < this.cacheSize){
      view.fromCache = true;
      this.cache.push(view);
    }
  }

  create(container: Container, bindingContext?: Object, createInstruction?: ViewCreateInstruction, element?: Element): View {
    createInstruction = createInstruction || BehaviorInstruction.normal;
    element = element || null;

    let cachedView = this.getCachedView();
    if(cachedView !== null){
      if(!createInstruction.suppressBind){
        cachedView.bind(bindingContext);
      }

      return cachedView;
    }

    let fragment = createInstruction.enhance ? this.template : this.template.cloneNode(true),
        instructables = fragment.querySelectorAll('.au-target'),
        instructions = this.instructions,
        resources = this.resources,
        behaviors = [],
        bindings = [],
        children = [],
        contentSelectors = [],
        containers = { root:container },
        partReplacements = createInstruction.partReplacements,
        i, ii, view, instructable, instruction;

    this.resources.onBeforeCreate(this, container, fragment, createInstruction, bindingContext);

    if(element !== null && this.surrogateInstruction !== null){
      applySurrogateInstruction(container, element, this.surrogateInstruction, behaviors, bindings, children);
    }

    for(i = 0, ii = instructables.length; i < ii; ++i){
      instructable = instructables[i];
      instruction = instructions[instructable.getAttribute('au-target-id')];

      applyInstructions(containers, bindingContext, instructable,
        instruction, behaviors, bindings, children, contentSelectors, partReplacements, resources);
    }

    view = new View(this, container, fragment, behaviors, bindings, children, createInstruction.systemControlled, contentSelectors);

    //if iniated by an element behavior, let the behavior trigger this callback once it's done creating the element
    if(!createInstruction.initiatedByBehavior){
      view.created();
    }

    this.resources.onAfterCreate(view);

    //if the view creation is part of a larger creation, wait to bind until the root view initiates binding
    if(!createInstruction.suppressBind){
      view.bind(bindingContext);
    }

    return view;
  }
}

let nextInjectorId = 0;
function getNextInjectorId(){
  return ++nextInjectorId;
}

function configureProperties(instruction, resources){
  var type = instruction.type,
      attrName = instruction.attrName,
      attributes = instruction.attributes,
      property, key, value;

  var knownAttribute = resources.mapAttribute(attrName);
  if(knownAttribute && attrName in attributes && knownAttribute !== attrName){
    attributes[knownAttribute] = attributes[attrName];
    delete attributes[attrName];
  }

  for(key in attributes){
    value = attributes[key];

    if(value !== null && typeof value === 'object'){
      property = type.attributes[key];

      if(property !== undefined){
        value.targetProperty = property.name;
      }else{
        value.targetProperty = key;
      }
    }
  }
}

let lastAUTargetID = 0;
function getNextAUTargetID(){
  return (++lastAUTargetID).toString();
}

function makeIntoInstructionTarget(element){
  let value = element.getAttribute('class'),
      auTargetID = getNextAUTargetID();

  element.setAttribute('class', (value ? value += ' au-target' : 'au-target'));
  element.setAttribute('au-target-id', auTargetID);

  return auTargetID;
}

@inject(BindingLanguage, ViewResources)
export class ViewCompiler {
  constructor(bindingLanguage:BindingLanguage, resources:ViewResources){
    this.bindingLanguage = bindingLanguage;
    this.resources = resources;
  }

  compile(source: Element|DocumentFragment|string, resources?: ViewResources, compileInstruction?: ViewCompileInstruction): ViewFactory{
    resources = resources || this.resources;
    compileInstruction = compileInstruction || ViewCompileInstruction.normal;
    source = typeof source === 'string' ? createTemplateFromMarkup(source) : source;

    let content, part, cacheSize;

    if(source.content){
      part = source.getAttribute('part');
      cacheSize = source.getAttribute('view-cache');
      content = document.adoptNode(source.content, true);
    }else{
      content = source;
    }

    compileInstruction.targetShadowDOM = compileInstruction.targetShadowDOM && hasShadowDOM;
    resources.onBeforeCompile(content, resources, compileInstruction);

    let instructions = {};
    this.compileNode(content, resources, instructions, source, 'root', !compileInstruction.targetShadowDOM);
    content.insertBefore(document.createComment('<view>'), content.firstChild);
    content.appendChild(document.createComment('</view>'));

    let factory = new ViewFactory(content, instructions, resources);

    factory.surrogateInstruction = compileInstruction.compileSurrogate ? this.compileSurrogate(source, resources) : null;
    factory.part = part;

    if(cacheSize){
      factory.setCacheSize(cacheSize);
    }

    resources.onAfterCompile(factory);

    return factory;
  }

  compileNode(node, resources, instructions, parentNode, parentInjectorId, targetLightDOM){
    switch(node.nodeType){
      case 1: //element node
        return this.compileElement(node, resources, instructions, parentNode, parentInjectorId, targetLightDOM);
      case 3: //text node
        //use wholeText to retrieve the textContent of all adjacent text nodes.
        var expression = resources.getBindingLanguage(this.bindingLanguage).parseText(resources, node.wholeText);
        if(expression){
          let marker = document.createElement('au-marker'),
              auTargetID = makeIntoInstructionTarget(marker);
          (node.parentNode || parentNode).insertBefore(marker, node);
          node.textContent = ' ';
          instructions[auTargetID] = TargetInstruction.contentExpression(expression);
          //remove adjacent text nodes.
          while(node.nextSibling && node.nextSibling.nodeType === 3) {
            (node.parentNode || parentNode).removeChild(node.nextSibling);
          }
        } else {
          //skip parsing adjacent text nodes.
          while(node.nextSibling && node.nextSibling.nodeType === 3) {
            node = node.nextSibling;
          }
        }
        return node.nextSibling;
      case 11: //document fragment node
        var currentChild = node.firstChild;
        while (currentChild) {
          currentChild = this.compileNode(currentChild, resources, instructions, node, parentInjectorId, targetLightDOM);
        }
        break;
    }

    return node.nextSibling;
  }

  compileSurrogate(node, resources){
    let attributes = node.attributes,
        bindingLanguage = resources.getBindingLanguage(this.bindingLanguage),
        knownAttribute, property, instruction,
        i, ii, attr, attrName, attrValue, info, type,
        expressions = [], expression,
        behaviorInstructions = [],
        values = {}, hasValues = false,
        providers = [];

    for(i = 0, ii = attributes.length; i < ii; ++i){
      attr = attributes[i];
      attrName = attr.name;
      attrValue = attr.value;

      info = bindingLanguage.inspectAttribute(resources, attrName, attrValue);
      type = resources.getAttribute(info.attrName);

      if(type){ //do we have an attached behavior?
        knownAttribute = resources.mapAttribute(info.attrName); //map the local name to real name
        if(knownAttribute){
          property = type.attributes[knownAttribute];

          if(property){ //if there's a defined property
            info.defaultBindingMode = property.defaultBindingMode; //set the default binding mode

            if(!info.command && !info.expression){ // if there is no command or detected expression
              info.command = property.hasOptions ? 'options' : null; //and it is an optons property, set the options command
            }
          }
        }
      }

      instruction = bindingLanguage.createAttributeInstruction(resources, node, info);

      if(instruction){ //HAS BINDINGS
        if(instruction.alteredAttr){
          type = resources.getAttribute(instruction.attrName);
        }

        if(instruction.discrete){ //ref binding or listener binding
          expressions.push(instruction);
        }else{ //attribute bindings
          if(type){ //templator or attached behavior found
            instruction.type = type;
            configureProperties(instruction, resources);

            if(type.liftsContent){ //template controller
              throw new Error('You cannot place a template controller on a surrogate element.');
            }else{ //attached behavior
              behaviorInstructions.push(instruction);
            }
          } else{ //standard attribute binding
            expressions.push(instruction.attributes[instruction.attrName]);
          }
        }
      }else{ //NO BINDINGS
        if(type){ //templator or attached behavior found
          instruction = BehaviorInstruction.attribute(attrName, type);
          instruction.attributes[resources.mapAttribute(attrName)] = attrValue;

          if(type.liftsContent){ //template controller
            throw new Error('You cannot place a template controller on a surrogate element.');
          }else{ //attached behavior
            behaviorInstructions.push(instruction);
          }
        }else if(attrName !== 'id' && attrName !== 'part' && attrName !== 'replace-part'){
          hasValues = true;
          values[attrName] = attrValue;
        }
      }
    }

    if(expressions.length || behaviorInstructions.length || hasValues){
      for(i = 0, ii = behaviorInstructions.length; i < ii; ++i){
        instruction = behaviorInstructions[i];
        instruction.type.compile(this, resources, node, instruction);
        providers.push(instruction.type.target);
      }

      for(i = 0, ii = expressions.length; i < ii; ++i){
        expression =  expressions[i];
        if(expression.attrToRemove !== undefined){
          node.removeAttribute(expression.attrToRemove);
        }
      }

      return TargetInstruction.surrogate(providers, behaviorInstructions, expressions, values);
    }

    return null;
  }

  compileElement(node, resources, instructions, parentNode, parentInjectorId, targetLightDOM){
    var tagName = node.tagName.toLowerCase(),
        attributes = node.attributes,
        expressions = [], expression,
        behaviorInstructions = [],
        providers = [],
        bindingLanguage = resources.getBindingLanguage(this.bindingLanguage),
        liftingInstruction, viewFactory, type, elementInstruction,
        elementProperty, i, ii, attr, attrName, attrValue, instruction, info,
        property, knownAttribute, auTargetID, injectorId;

    if(tagName === 'content'){
      if(targetLightDOM){
        auTargetID = makeIntoInstructionTarget(node);
        instructions[auTargetID] = TargetInstruction.contentSelector(node, parentInjectorId);
      }
      return node.nextSibling;
    } else if(tagName === 'template'){
      viewFactory = this.compile(node, resources);
      viewFactory.part = node.getAttribute('part');
    } else{
      type = resources.getElement(tagName);
      if(type){
        elementInstruction = BehaviorInstruction.element(node, type);
        behaviorInstructions.push(elementInstruction);
      }
    }

    for(i = 0, ii = attributes.length; i < ii; ++i){
      attr = attributes[i];
      attrName = attr.name;
      attrValue = attr.value;
      info = bindingLanguage.inspectAttribute(resources, attrName, attrValue);
      type = resources.getAttribute(info.attrName);
      elementProperty = null;

      if(type){ //do we have an attached behavior?
        knownAttribute = resources.mapAttribute(info.attrName); //map the local name to real name
        if(knownAttribute){
          property = type.attributes[knownAttribute];

          if(property){ //if there's a defined property
            info.defaultBindingMode = property.defaultBindingMode; //set the default binding mode

            if(!info.command && !info.expression){ // if there is no command or detected expression
              info.command = property.hasOptions ? 'options' : null; //and it is an optons property, set the options command
            }
          }
        }
      }else if(elementInstruction){ //or if this is on a custom element
        elementProperty = elementInstruction.type.attributes[info.attrName];
        if(elementProperty){ //and this attribute is a custom property
          info.defaultBindingMode = elementProperty.defaultBindingMode; //set the default binding mode
        }
      }

      if(elementProperty){
        instruction = bindingLanguage.createAttributeInstruction(resources, node, info, elementInstruction);
      }else{
        instruction = bindingLanguage.createAttributeInstruction(resources, node, info);
      }

      if(instruction){ //HAS BINDINGS
        if(instruction.alteredAttr){
          type = resources.getAttribute(instruction.attrName);
        }

        if(instruction.discrete){ //ref binding or listener binding
          expressions.push(instruction);
        }else{ //attribute bindings
          if(type){ //templator or attached behavior found
            instruction.type = type;
            configureProperties(instruction, resources);

            if(type.liftsContent){ //template controller
              instruction.originalAttrName = attrName;
              liftingInstruction = instruction;
              break;
            }else{ //attached behavior
              behaviorInstructions.push(instruction);
            }
          }else if(elementProperty) { //custom element attribute
            elementInstruction.attributes[info.attrName].targetProperty = elementProperty.name;
          } else{ //standard attribute binding
            expressions.push(instruction.attributes[instruction.attrName]);
          }
        }
      }else{ //NO BINDINGS
        if(type){ //templator or attached behavior found
          instruction = BehaviorInstruction.attribute(attrName, type);
          instruction.attributes[resources.mapAttribute(attrName)] = attrValue;

          if(type.liftsContent){ //template controller
            instruction.originalAttrName = attrName;
            liftingInstruction = instruction;
            break;
          }else{ //attached behavior
            behaviorInstructions.push(instruction);
          }
        }else if(elementProperty){ //custom element attribute
          elementInstruction.attributes[attrName] = attrValue;
        }

        //else; normal attribute; do nothing
      }
    }

    if(liftingInstruction){
      liftingInstruction.viewFactory = viewFactory;
      node = liftingInstruction.type.compile(this, resources, node, liftingInstruction, parentNode);
      auTargetID = makeIntoInstructionTarget(node);
      instructions[auTargetID] = TargetInstruction.lifting(parentInjectorId, liftingInstruction);
    }else{
      if(expressions.length || behaviorInstructions.length){
        injectorId = behaviorInstructions.length ? getNextInjectorId() : false;

        for(i = 0, ii = behaviorInstructions.length; i < ii; ++i){
          instruction = behaviorInstructions[i];
          instruction.type.compile(this, resources, node, instruction, parentNode);
          providers.push(instruction.type.target);
        }

        for(i = 0, ii = expressions.length; i < ii; ++i){
          expression =  expressions[i];
          if(expression.attrToRemove !== undefined){
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

      if(elementInstruction && elementInstruction.skipContentProcessing){
        return node.nextSibling;
      }

      var currentChild = node.firstChild;
      while (currentChild) {
        currentChild = this.compileNode(currentChild, resources, instructions, node, injectorId || parentInjectorId, targetLightDOM);
      }
    }

    return node.nextSibling;
  }
}

var logger = LogManager.getLogger('templating');

function ensureRegistryEntry(loader, urlOrRegistryEntry){
  if(urlOrRegistryEntry instanceof TemplateRegistryEntry){
    return Promise.resolve(urlOrRegistryEntry);
  }

  return loader.loadTemplate(urlOrRegistryEntry);
}

class ProxyViewFactory {
  constructor(promise){
    promise.then(x => this.absorb(x));
  }

  absorb(factory){
    this.create = factory.create.bind(factory);
  }
}

export class ViewEngine {
  static inject() { return [Loader, Container, ViewCompiler, ModuleAnalyzer, ViewResources]; }
  constructor(loader:Loader, container:Container, viewCompiler:ViewCompiler, moduleAnalyzer:ModuleAnalyzer, appResources:ViewResources){
    this.loader = loader;
    this.container = container;
    this.viewCompiler = viewCompiler;
    this.moduleAnalyzer = moduleAnalyzer;
    this.appResources = appResources;
    this._pluginMap = {};
  }

  addResourcePlugin(extension: string, implementation: string){
     let name = extension.replace('.', '') + '-resource-plugin';
     this._pluginMap[extension] = name;
     this.loader.addPlugin(name, implementation);
  }

  enhance(container:Container, element:Element, resources:ViewResources, bindingContext?:Object):View{
    let instructions = {};
    this.viewCompiler.compileNode(element, resources, instructions, element.parentNode, 'root', true);

    let factory = new ViewFactory(element, instructions, resources);
    return factory.create(container, bindingContext, { enhance:true });
  }

  loadViewFactory(urlOrRegistryEntry:string|TemplateRegistryEntry, compileInstruction?:ViewCompileInstruction, loadContext?:ResourceLoadContext):Promise<ViewFactory>{
    loadContext = loadContext || new ResourceLoadContext();

    return ensureRegistryEntry(this.loader, urlOrRegistryEntry).then(viewRegistryEntry => {
      if(viewRegistryEntry.onReady){
        if(loadContext.doesNotHaveDependency(urlOrRegistryEntry)){
          loadContext.addDependency(urlOrRegistryEntry);
          return viewRegistryEntry.onReady;
        }

        return Promise.resolve(new ProxyViewFactory(viewRegistryEntry.onReady));
      }

      loadContext.addDependency(urlOrRegistryEntry);

      return viewRegistryEntry.onReady = this.loadTemplateResources(viewRegistryEntry, compileInstruction, loadContext).then(resources => {
        viewRegistryEntry.setResources(resources);
        var viewFactory = this.viewCompiler.compile(viewRegistryEntry.template, resources, compileInstruction);
        viewRegistryEntry.setFactory(viewFactory);
        return viewFactory;
      });
    });
  }

  loadTemplateResources(viewRegistryEntry:TemplateRegistryEntry, compileInstruction?:ViewCompileInstruction, loadContext?:ResourceLoadContext):Promise<ViewResources>{
    var resources = new ViewResources(this.appResources, viewRegistryEntry.address),
        dependencies = viewRegistryEntry.dependencies,
        importIds, names;

    compileInstruction = compileInstruction || ViewCompileInstruction.normal;

    if(dependencies.length === 0 && !compileInstruction.associatedModuleId){
      return Promise.resolve(resources);
    }

    importIds = dependencies.map(x => x.src);
    names = dependencies.map(x => x.name);
    logger.debug(`importing resources for ${viewRegistryEntry.address}`, importIds);

    return this.importViewResources(importIds, names, resources, compileInstruction, loadContext);
  }

  importViewModelResource(moduleImport:string, moduleMember:string):Promise<ResourceDescription>{
    return this.loader.loadModule(moduleImport).then(viewModelModule => {
      var normalizedId = Origin.get(viewModelModule).moduleId,
          resourceModule = this.moduleAnalyzer.analyze(normalizedId, viewModelModule, moduleMember);

      if(!resourceModule.mainResource){
        throw new Error(`No view model found in module "${moduleImport}".`);
      }

      resourceModule.analyze(this.container);

      return resourceModule.mainResource;
    });
  }

  importViewResources(moduleIds:string[], names:string[], resources:ViewResources, compileInstruction?:ViewCompileInstruction, loadContext?:ResourceLoadContext):Promise<ViewResources>{
    loadContext = loadContext || new ResourceLoadContext();
    compileInstruction = compileInstruction || ViewCompileInstruction.normal;

    moduleIds = moduleIds.map(x => this._applyLoaderPlugin(x));

    return this.loader.loadAllModules(moduleIds).then(imports => {
      var i, ii, analysis, normalizedId, current, associatedModule,
          container = this.container,
          moduleAnalyzer = this.moduleAnalyzer,
          allAnalysis = new Array(imports.length);

      //analyze and register all resources first
      //this enables circular references for global refs
      //and enables order independence
      for(i = 0, ii = imports.length; i < ii; ++i){
        current = imports[i];
        normalizedId = Origin.get(current).moduleId;

        analysis = moduleAnalyzer.analyze(normalizedId, current);
        analysis.analyze(container);
        analysis.register(resources, names[i]);

        allAnalysis[i] = analysis;
      }

      if(compileInstruction.associatedModuleId){
        associatedModule = moduleAnalyzer.getAnalysis(compileInstruction.associatedModuleId);

        if(associatedModule){
          associatedModule.register(resources);
        }
      }

      //cause compile/load of any associated views second
      //as a result all globals have access to all other globals during compilation
      for(i = 0, ii = allAnalysis.length; i < ii; ++i){
        allAnalysis[i] = allAnalysis[i].load(container, loadContext);
      }

      return Promise.all(allAnalysis).then(() => resources);
    });
  }

  _applyLoaderPlugin(id){
    let index = id.lastIndexOf('.');
    if(index !== -1){
      let ext = id.substring(index);
      let pluginName = this._pluginMap[ext];

      if(pluginName === undefined){
        return id;
      }

      return this.loader.applyPluginToUrl(id, pluginName);
    }

    return id;
  }
}

export class BehaviorInstance {
  constructor(behavior, bindingContext, instruction){
    this.behavior = behavior;
    this.bindingContext = bindingContext;
    this.isAttached = false;

    var observerLookup = behavior.observerLocator.getOrCreateObserversLookup(bindingContext),
        handlesBind = behavior.handlesBind,
        attributes = instruction.attributes,
        boundProperties = this.boundProperties = [],
        properties = behavior.properties,
        i, ii;

    behavior.ensurePropertiesDefined(bindingContext, observerLookup);

    for(i = 0, ii = properties.length; i < ii; ++i){
      properties[i].initialize(bindingContext, observerLookup, attributes, handlesBind, boundProperties);
    }
  }

  static createForUnitTest(type, attributes, bindingContext){
    let description = ResourceDescription.get(type);
    description.analyze(Container.instance);

    let behaviorContext = Container.instance.get(type);
    let behaviorInstance = new BehaviorInstance(description.metadata, behaviorContext, {attributes:attributes||{}});

    behaviorInstance.bind(bindingContext || {});

    return behaviorContext;
  }

  created(context){
    if(this.behavior.handlesCreated){
      this.bindingContext.created(context);
    }
  }

  bind(context){
    var skipSelfSubscriber = this.behavior.handlesBind,
        boundProperties = this.boundProperties,
        i, ii, x, observer, selfSubscriber;

    for(i = 0, ii = boundProperties.length; i < ii; ++i){
      x = boundProperties[i];
      observer = x.observer;
      selfSubscriber = observer.selfSubscriber;
      observer.publishing = false;

      if(skipSelfSubscriber){
        observer.selfSubscriber = null;
      }

      x.binding.bind(context);
      observer.call();

      observer.publishing = true;
      observer.selfSubscriber = selfSubscriber;
    }

    if(skipSelfSubscriber){
      this.bindingContext.bind(context);
    }

    if(this.view){
      this.view.bind(this.bindingContext);
    }
  }

  unbind(){
    var boundProperties = this.boundProperties,
        i, ii;

    if(this.view){
      this.view.unbind();
    }

    if(this.behavior.handlesUnbind){
      this.bindingContext.unbind();
    }

    for(i = 0, ii = boundProperties.length; i < ii; ++i){
      boundProperties[i].binding.unbind();
    }
  }

  attached(){
    if(this.isAttached){
      return;
    }

    this.isAttached = true;

    if(this.behavior.handlesAttached){
      this.bindingContext.attached();
    }

    if(this.view){
      this.view.attached();
    }
  }

  detached(){
    if(this.isAttached){
      this.isAttached = false;

      if(this.view){
        this.view.detached();
      }

      if(this.behavior.handlesDetached){
        this.bindingContext.detached();
      }
    }
  }
}

function getObserver(behavior, instance, name){
  var lookup = instance.__observers__;

  if(lookup === undefined){
    lookup = behavior.observerLocator.getOrCreateObserversLookup(instance);
    behavior.ensurePropertiesDefined(instance, lookup);
  }

  return lookup[name];
}

export class BindableProperty {
  constructor(nameOrConfig){
    if(typeof nameOrConfig === 'string'){
      this.name = nameOrConfig;
    }else{
      Object.assign(this, nameOrConfig);
    }

    this.attribute = this.attribute || hyphenate(this.name);
    this.defaultBindingMode = this.defaultBindingMode || bindingMode.oneWay;
    this.changeHandler = this.changeHandler || null;
    this.owner = null;
  }

  registerWith(target, behavior, descriptor){
    behavior.properties.push(this);
    behavior.attributes[this.attribute] = this;
    this.owner = behavior;

    if(descriptor){
      this.descriptor = descriptor;
      return this.configureDescriptor(behavior, descriptor);
    }
  }

  configureDescriptor(behavior, descriptor){
    var name = this.name;

    descriptor.configurable = true;
    descriptor.enumerable = true;

    if('initializer' in descriptor){
      this.defaultValue = descriptor.initializer;
      delete descriptor.initializer;
      delete descriptor.writable;
    }

    if('value' in descriptor){
      this.defaultValue = descriptor.value;
      delete descriptor.value;
      delete descriptor.writable;
    }

    descriptor.get = function(){
      return getObserver(behavior, this, name).getValue();
    };

    descriptor.set = function(value){
      getObserver(behavior, this, name).setValue(value);
    };

    descriptor.get.getObserver = function(obj){
      return getObserver(behavior, obj, name);
    };

    return descriptor;
  }

  defineOn(target, behavior){
    var name = this.name,
        handlerName;

    if(this.changeHandler === null){
      handlerName = name + 'Changed';
      if(handlerName in target.prototype){
        this.changeHandler = handlerName;
      }
    }

    if(!this.descriptor){
      Object.defineProperty(target.prototype, name, this.configureDescriptor(behavior, {}));
    }
  }

  createObserver(bindingContext){
    var selfSubscriber = null,
        defaultValue = this.defaultValue,
        changeHandlerName = this.changeHandler,
        name = this.name,
        initialValue;

    if(this.hasOptions){
      return;
    }

    if(changeHandlerName in bindingContext){
      if('propertyChanged' in bindingContext) {
        selfSubscriber = (newValue, oldValue) => {
          bindingContext[changeHandlerName](newValue, oldValue);
          bindingContext.propertyChanged(name, newValue, oldValue);
        };
      }else {
        selfSubscriber = (newValue, oldValue) => bindingContext[changeHandlerName](newValue, oldValue);
      }
    } else if('propertyChanged' in bindingContext) {
      selfSubscriber = (newValue, oldValue) => bindingContext.propertyChanged(name, newValue, oldValue);
    } else if(changeHandlerName !== null){
      throw new Error(`Change handler ${changeHandlerName} was specified but not delcared on the class.`);
    }

    if(defaultValue !== undefined){
      initialValue = typeof defaultValue === 'function' ? defaultValue.call(bindingContext) : defaultValue;
    }

    return new BehaviorPropertyObserver(this.owner.taskQueue, bindingContext, this.name, selfSubscriber, initialValue);
  }

  initialize(bindingContext, observerLookup, attributes, behaviorHandlesBind, boundProperties){
    var selfSubscriber, observer, attribute, defaultValue = this.defaultValue;

    if(this.isDynamic){
      for(let key in attributes){
        this.createDynamicProperty(bindingContext, observerLookup, behaviorHandlesBind, key, attributes[key], boundProperties);
      }
    } else if(!this.hasOptions){
      observer = observerLookup[this.name];

      if (attributes !== null) {
        selfSubscriber = observer.selfSubscriber;
        attribute = attributes[this.attribute];

        if(behaviorHandlesBind){
          observer.selfSubscriber = null;
        }

        if(typeof attribute === 'string'){
          bindingContext[this.name] = attribute;
          observer.call();
        }else if(attribute){
          boundProperties.push({observer:observer, binding:attribute.createBinding(bindingContext)});
        }else if(defaultValue !== undefined){
          observer.call();
        }

        observer.selfSubscriber = selfSubscriber;
      }

      observer.publishing = true;
    }
  }

  createDynamicProperty(bindingContext, observerLookup, behaviorHandlesBind, name, attribute, boundProperties){
    var changeHandlerName = name + 'Changed',
        selfSubscriber = null, observer, info;

    if(changeHandlerName in bindingContext){
      if('propertyChanged' in bindingContext) {
        selfSubscriber = (newValue, oldValue) => {
          bindingContext[changeHandlerName](newValue, oldValue);
          bindingContext.propertyChanged(name, newValue, oldValue);
        };
      }else {
        selfSubscriber = (newValue, oldValue) => bindingContext[changeHandlerName](newValue, oldValue);
      }
    }else if('propertyChanged' in bindingContext) {
      selfSubscriber = (newValue, oldValue) => bindingContext.propertyChanged(name, newValue, oldValue);
    }

    observer = observerLookup[name] = new BehaviorPropertyObserver(
        this.owner.taskQueue,
        bindingContext,
        name,
        selfSubscriber
        );

    Object.defineProperty(bindingContext, name, {
      configurable: true,
      enumerable: true,
      get: observer.getValue.bind(observer),
      set: observer.setValue.bind(observer)
    });

    if(behaviorHandlesBind){
      observer.selfSubscriber = null;
    }

    if(typeof attribute === 'string'){
      bindingContext[name] = attribute;
      observer.call();
    }else if(attribute){
      info = {observer:observer, binding:attribute.createBinding(bindingContext)};
      boundProperties.push(info);
    }

    observer.publishing = true;
    observer.selfSubscriber = selfSubscriber;
  }
}

class BehaviorPropertyObserver {
  constructor(taskQueue, obj, propertyName, selfSubscriber, initialValue){
    this.taskQueue = taskQueue;
    this.obj = obj;
    this.propertyName = propertyName;
    this.callbacks = [];
    this.notqueued = true;
    this.publishing = false;
    this.selfSubscriber = selfSubscriber;
    this.currentValue = this.oldValue = initialValue;
  }

  getValue(){
    return this.currentValue;
  }

  setValue(newValue){
    var oldValue = this.currentValue;

    if(oldValue !== newValue){
      if(this.publishing && this.notqueued){
        this.notqueued = false;
        this.taskQueue.queueMicroTask(this);
      }

      this.oldValue = oldValue;
      this.currentValue = newValue;
    }
  }

  call(){
    var callbacks = this.callbacks,
        i = callbacks.length,
        oldValue = this.oldValue,
        newValue = this.currentValue;

    this.notqueued = true;

    if(newValue !== oldValue){
      if(this.selfSubscriber !== null){
        this.selfSubscriber(newValue, oldValue);
      }

      while(i--) {
        callbacks[i](newValue, oldValue);
      }

      this.oldValue = newValue;
    }
  }

  subscribe(callback){
    var callbacks = this.callbacks;
    callbacks.push(callback);
    return function(){
      callbacks.splice(callbacks.indexOf(callback), 1);
    };
  }
}

var contentSelectorViewCreateInstruction = { suppressBind:true, enhance:false };

function doProcessContent(){
  return true;
}

export class HtmlBehaviorResource {
  constructor(){
    this.elementName = null;
    this.attributeName = null;
    this.attributeDefaultBindingMode = undefined;
    this.liftsContent = false;
    this.targetShadowDOM = false;
    this.processContent = doProcessContent;
    this.usesShadowDOM = false;
    this.childBindings = null;
    this.hasDynamicOptions = false;
    this.containerless = false;
    this.properties = [];
    this.attributes = {};
  }

  static convention(name:string, existing?:HtmlBehaviorResource):HtmlBehaviorResource{
    var behavior;

    if(name.endsWith('CustomAttribute')){
      behavior = existing || new HtmlBehaviorResource();
      behavior.attributeName = hyphenate(name.substring(0, name.length-15));
    }

    if(name.endsWith('CustomElement')){
      behavior = existing || new HtmlBehaviorResource();
      behavior.elementName = hyphenate(name.substring(0, name.length-13));
    }

    return behavior;
  }

  addChildBinding(behavior:BindingExpression):void{
    if(this.childBindings === null){
      this.childBindings = [];
    }

    this.childBindings.push(behavior);
  }

  analyze(container:Container, target:Function):void{
    var proto = target.prototype,
        properties = this.properties,
        attributeName = this.attributeName,
        attributeDefaultBindingMode = this.attributeDefaultBindingMode,
        i, ii, current;

    this.observerLocator = container.get(ObserverLocator);
    this.taskQueue = container.get(TaskQueue);

    this.target = target;
    this.usesShadowDOM = this.targetShadowDOM && hasShadowDOM;
    this.handlesCreated = ('created' in proto);
    this.handlesBind = ('bind' in proto);
    this.handlesUnbind = ('unbind' in proto);
    this.handlesAttached = ('attached' in proto);
    this.handlesDetached = ('detached' in proto);
    this.htmlName = this.elementName || this.attributeName;
    this.apiName = this.htmlName.replace(/-([a-z])/g, (m, w) => w.toUpperCase());

    if(attributeName !== null){
      if(properties.length === 0){ //default for custom attributes
        new BindableProperty({
          name:'value',
          changeHandler:'valueChanged' in proto ? 'valueChanged' : null,
          attribute:attributeName,
          defaultBindingMode: attributeDefaultBindingMode
        }).registerWith(target, this);
      }

      current = properties[0];

      if(properties.length === 1 && current.name === 'value'){ //default for custom attributes
        current.isDynamic = current.hasOptions = this.hasDynamicOptions;
        current.defineOn(target, this);
      } else{ //custom attribute with options
        for(i = 0, ii = properties.length; i < ii; ++i){
          properties[i].defineOn(target, this);
        }

        current = new BindableProperty({
          name:'value',
          changeHandler:'valueChanged' in proto ? 'valueChanged' : null,
          attribute:attributeName,
          defaultBindingMode: attributeDefaultBindingMode
        });

        current.hasOptions = true;
        current.registerWith(target, this);
      }
    }else{
      for(i = 0, ii = properties.length; i < ii; ++i){
        properties[i].defineOn(target, this);
      }
    }
  }

  load(container:Container, target:Function, viewStrategy?:ViewStrategy, transientView?:boolean, loadContext?:ResourceLoadContext):Promise<HtmlBehaviorResource>{
    var options;

    if(this.elementName !== null){
      viewStrategy = viewStrategy || this.viewStrategy || ViewStrategy.getDefault(target);
      options = new ViewCompileInstruction(this.targetShadowDOM, true);

      if(!viewStrategy.moduleId){
        viewStrategy.moduleId = Origin.get(target).moduleId;
      }

      return viewStrategy.loadViewFactory(container.get(ViewEngine), options, loadContext).then(viewFactory => {
        if(!transientView || !this.viewFactory){
          this.viewFactory = viewFactory;
        }

        return viewFactory;
      });
    }

    return Promise.resolve(this);
  }

  register(registry:ViewResources, name?:string):void{
    if(this.attributeName !== null) {
      registry.registerAttribute(name || this.attributeName, this, this.attributeName);
    }

    if(this.elementName !== null) {
      registry.registerElement(name || this.elementName, this);
    }
  }

  compile(compiler:ViewCompiler, resources:ViewResources, node:Node, instruction:BehaviorInstruction, parentNode?:Node):Node{
    if(this.liftsContent){
      if(!instruction.viewFactory){
        var template = document.createElement('template'),
            fragment = document.createDocumentFragment(),
            cacheSize = node.getAttribute('view-cache'),
            part = node.getAttribute('part');

        node.removeAttribute(instruction.originalAttrName);
        replaceNode(template, node, parentNode);
        fragment.appendChild(node);
        instruction.viewFactory = compiler.compile(fragment, resources);

        if(part){
          instruction.viewFactory.part = part;
          node.removeAttribute('part');
        }

        if(cacheSize){
          instruction.viewFactory.setCacheSize(cacheSize);
          node.removeAttribute('view-cache');
        }

        node = template;
      }
    } else if(this.elementName !== null){ //custom element
      var partReplacements = instruction.partReplacements = {};

      if(this.processContent(compiler, resources, node, instruction) && node.hasChildNodes()){
        if(this.usesShadowDOM){
          var currentChild = node.firstChild,
              nextSibling, toReplace;

          while (currentChild) {
            nextSibling = currentChild.nextSibling;

            if(currentChild.tagName === 'TEMPLATE' && (toReplace = currentChild.getAttribute('replace-part'))){
              partReplacements[toReplace] = compiler.compile(currentChild, resources);
              removeNode(currentChild, parentNode);
            }

            currentChild = nextSibling;
          }

          instruction.skipContentProcessing = false;
        }else{
          var fragment = document.createDocumentFragment(),
              currentChild = node.firstChild,
              nextSibling;

          while (currentChild) {
            nextSibling = currentChild.nextSibling;

            if(currentChild.tagName === 'TEMPLATE' && (toReplace = currentChild.getAttribute('replace-part'))){
              partReplacements[toReplace] = compiler.compile(currentChild, resources);
              removeNode(currentChild, parentNode);
            }else{
              fragment.appendChild(currentChild);
            }

            currentChild = nextSibling;
          }

          instruction.contentFactory = compiler.compile(fragment, resources);
          instruction.skipContentProcessing = true;
        }
      }else{
        instruction.skipContentProcessing = true;
      }
    }

    return node;
  }

  create(container:Container, instruction?:BehaviorInstruction, element?:Element, bindings?:Binding[]):BehaviorInstance{
    let host;

    instruction = instruction || BehaviorInstruction.normal;
    element = element || null;
    bindings = bindings || null;

    if(this.elementName !== null && element){
      if(this.usesShadowDOM) {
        host = element.createShadowRoot();
        container.registerInstance(DOMBoundary, host);
      }else{
        host = element;

        if(this.targetShadowDOM){
          container.registerInstance(DOMBoundary, host);
        }
      }
    }

    let bindingContext = instruction.bindingContext || container.get(this.target),
        behaviorInstance = new BehaviorInstance(this, bindingContext, instruction),
        childBindings = this.childBindings,
        viewFactory;

    if(this.liftsContent){
      //template controller
      element.primaryBehavior = behaviorInstance;
    } else if(this.elementName !== null){
      //custom element
      viewFactory = instruction.viewFactory || this.viewFactory;
      container.viewModel = bindingContext;

      if(viewFactory){
        behaviorInstance.view = viewFactory.create(container, bindingContext, instruction, element);
      }

      if(element){
        element.primaryBehavior = behaviorInstance;

        if(behaviorInstance.view){
          if(!this.usesShadowDOM) {
            if(instruction.contentFactory){
              var contentView = instruction.contentFactory.create(container, null, contentSelectorViewCreateInstruction);

              ContentSelector.applySelectors(
                contentView,
                behaviorInstance.view.contentSelectors,
                (contentSelector, group) => contentSelector.add(group)
              );

              behaviorInstance.contentView = contentView;
            }
          }

          if(instruction.anchorIsContainer){
            if(childBindings !== null){
              for(let i = 0, ii = childBindings.length; i < ii; ++i){
                behaviorInstance.view.addBinding(childBindings[i].create(host, bindingContext));
              }
            }

            behaviorInstance.view.appendNodesTo(host);
          }else{
            behaviorInstance.view.insertNodesBefore(host);
          }
        }else if(childBindings !== null){
          for(let i = 0, ii = childBindings.length; i < ii; ++i){
            bindings.push(childBindings[i].create(element, bindingContext));
          }
        }
      }else if(behaviorInstance.view){
        //dynamic element with view
        behaviorInstance.view.owner = behaviorInstance;

        if(childBindings !== null){
          for(let i = 0, ii = childBindings.length; i < ii; ++i){
            behaviorInstance.view.addBinding(childBindings[i].create(instruction.host, bindingContext));
          }
        }
      }else if(childBindings !== null){
        //dynamic element without view
        for(let i = 0, ii = childBindings.length; i < ii; ++i){
          bindings.push(childBindings[i].create(instruction.host, bindingContext));
        }
      }
    } else if(childBindings !== null){
      //custom attribute
      for(let i = 0, ii = childBindings.length; i < ii; ++i){
        bindings.push(childBindings[i].create(element, bindingContext));
      }
    }

    if(element){
      if(!(this.apiName in element)){
        element[this.apiName] = bindingContext;
      }

      if(!(this.htmlName in element)){
        element[this.htmlName] = behaviorInstance;
      }
    }

    if(instruction.initiatedByBehavior && viewFactory){
      behaviorInstance.view.created();
    }

    return behaviorInstance;
  }

  ensurePropertiesDefined(instance:Object, lookup:Object){
    var properties, i, ii, observer;

    if('__propertiesDefined__' in lookup){
      return;
    }

    lookup.__propertiesDefined__ = true;
    properties = this.properties;

    for(i = 0, ii = properties.length; i < ii; ++i){
      observer = properties[i].createObserver(instance);

      if(observer !== undefined){
        lookup[observer.propertyName] = observer;
      }
    }
  }
}

export class ResourceModule {
  constructor(moduleId:string){
    this.id = moduleId;
    this.moduleInstance = null;
    this.mainResource = null;
    this.resources = null;
    this.viewStrategy = null;
    this.isAnalyzed = false;
  }

  analyze(container:Container){
    var current = this.mainResource,
        resources = this.resources,
        viewStrategy = this.viewStrategy,
        i, ii;

    if(this.isAnalyzed){
      return;
    }

    this.isAnalyzed = true;

    if(current){
      current.metadata.viewStrategy = viewStrategy;
      current.analyze(container);
    }

    for(i = 0, ii = resources.length; i < ii; ++i){
      current = resources[i];
      current.metadata.viewStrategy = viewStrategy;
      current.analyze(container);
    }
  }

  register(registry:ViewResources, name?:string){
    var i, ii, resources = this.resources;

    if(this.mainResource){
      this.mainResource.register(registry, name);
      name = null;
    }

    for(i = 0, ii = resources.length; i < ii; ++i){
      resources[i].register(registry, name);
      name = null;
    }
  }

  load(container:Container, loadContext?:ResourceLoadContext):Promise<void>{
    if(this.onLoaded){
      return this.onLoaded;
    }

    var current = this.mainResource,
        resources = this.resources,
        i, ii, loads = [];

    if(current){
      loads.push(current.load(container, loadContext));
    }

    for(i = 0, ii = resources.length; i < ii; ++i){
      loads.push(resources[i].load(container, loadContext));
    }

    this.onLoaded = Promise.all(loads);
    return this.onLoaded;
  }
}

export class ResourceDescription {
  constructor(key:string, exportedValue:any, resourceTypeMeta:Object){
    if(!resourceTypeMeta){
      resourceTypeMeta = Metadata.get(Metadata.resource, exportedValue);

      if(!resourceTypeMeta){
        resourceTypeMeta = new HtmlBehaviorResource();
        resourceTypeMeta.elementName = hyphenate(key);
        Metadata.define(Metadata.resource, resourceTypeMeta, exportedValue);
      }
    }

    if(resourceTypeMeta instanceof HtmlBehaviorResource){
      if(resourceTypeMeta.elementName === undefined){
        //customeElement()
        resourceTypeMeta.elementName = hyphenate(key);
      } else if(resourceTypeMeta.attributeName === undefined){
        //customAttribute()
        resourceTypeMeta.attributeName = hyphenate(key);
      } else if(resourceTypeMeta.attributeName === null && resourceTypeMeta.elementName === null){
        //no customeElement or customAttribute but behavior added by other metadata
        HtmlBehaviorResource.convention(key, resourceTypeMeta);
      }
    }else if(!resourceTypeMeta.name){
      resourceTypeMeta.name = hyphenate(key);
    }

    this.metadata = resourceTypeMeta;
    this.value = exportedValue;
  }

  analyze(container:Container){
    let metadata = this.metadata,
        value = this.value;

    if('analyze' in metadata){
      metadata.analyze(container, value);
    }
  }

  register(registry:ViewResources, name?:string){
    this.metadata.register(registry, name);
  }

  load(container:Container, loadContext?:ResourceLoadContext):Promise<void>|void{
    let metadata = this.metadata,
        value = this.value;

    if('load' in metadata){
      return metadata.load(container, value, null, null, loadContext);
    }
  }

  static get(resource:any, key?:string='custom-resource'):ResourceDescription{
    var resourceTypeMeta = Metadata.get(Metadata.resource, resource),
        resourceDescription;

    if(resourceTypeMeta){
      if(resourceTypeMeta.attributeName === null && resourceTypeMeta.elementName === null){
        //no customeElement or customAttribute but behavior added by other metadata
        HtmlBehaviorResource.convention(key, resourceTypeMeta);
      }

      if(resourceTypeMeta.attributeName === null && resourceTypeMeta.elementName === null){
        //no convention and no customeElement or customAttribute but behavior added by other metadata
        resourceTypeMeta.elementName = hyphenate(key);
      }

      resourceDescription = new ResourceDescription(key, resource, resourceTypeMeta);
    } else {
      if(resourceTypeMeta = HtmlBehaviorResource.convention(key)){
        resourceDescription = new ResourceDescription(key, resource, resourceTypeMeta);
        Metadata.define(Metadata.resource, resourceTypeMeta, resource);
      } else if(resourceTypeMeta = ValueConverterResource.convention(key)) {
        resourceDescription = new ResourceDescription(key, resource, resourceTypeMeta);
        Metadata.define(Metadata.resource, resourceTypeMeta, resource);
      }
    }

    return resourceDescription;
  }
}

export class ModuleAnalyzer {
  constructor(){
    this.cache = {};
  }

  getAnalysis(moduleId:string):ResourceModule{
    return this.cache[moduleId];
  }

  analyze(moduleId:string, moduleInstance:any, viewModelMember?:string):ResourceModule{
    var mainResource, fallbackValue, fallbackKey, resourceTypeMeta, key,
        exportedValue, resources = [], conventional, viewStrategy, resourceModule;

    resourceModule = this.cache[moduleId];
    if(resourceModule){
      return resourceModule;
    }

    resourceModule = new ResourceModule(moduleId);
    this.cache[moduleId] = resourceModule;

    if(typeof moduleInstance === 'function'){
      moduleInstance = {'default': moduleInstance};
    }

    if(viewModelMember){
      mainResource = new ResourceDescription(viewModelMember, moduleInstance[viewModelMember]);
    }

    for(key in moduleInstance){
      exportedValue = moduleInstance[key];

      if(key === viewModelMember || typeof exportedValue !== 'function'){
        continue;
      }

      resourceTypeMeta = Metadata.get(Metadata.resource, exportedValue);

      if(resourceTypeMeta){
        if(resourceTypeMeta.attributeName === null && resourceTypeMeta.elementName === null){
          //no customeElement or customAttribute but behavior added by other metadata
          HtmlBehaviorResource.convention(key, resourceTypeMeta);
        }

        if(resourceTypeMeta.attributeName === null && resourceTypeMeta.elementName === null){
          //no convention and no customeElement or customAttribute but behavior added by other metadata
          resourceTypeMeta.elementName = hyphenate(key);
        }

        if(!mainResource && resourceTypeMeta instanceof HtmlBehaviorResource && resourceTypeMeta.elementName !== null){
          mainResource = new ResourceDescription(key, exportedValue, resourceTypeMeta);
        }else{
          resources.push(new ResourceDescription(key, exportedValue, resourceTypeMeta));
        }
      } else if(exportedValue instanceof ViewStrategy){
        viewStrategy = exportedValue;
      } else if(exportedValue instanceof TemplateRegistryEntry){
        viewStrategy = new TemplateRegistryViewStrategy(moduleId, exportedValue);
      } else {
        if(conventional = HtmlBehaviorResource.convention(key)){
          if(conventional.elementName !== null && !mainResource){
            mainResource = new ResourceDescription(key, exportedValue, conventional);
          }else{
            resources.push(new ResourceDescription(key, exportedValue, conventional));
          }

          Metadata.define(Metadata.resource, conventional, exportedValue);
        } else if(conventional = ValueConverterResource.convention(key)) {
          resources.push(new ResourceDescription(key, exportedValue, conventional));
          Metadata.define(Metadata.resource, conventional, exportedValue);
        } else if(!fallbackValue){
          fallbackValue = exportedValue;
          fallbackKey = key;
        }
      }
    }

    if(!mainResource && fallbackValue){
      mainResource = new ResourceDescription(fallbackKey, fallbackValue);
    }

    resourceModule.moduleInstance = moduleInstance;
    resourceModule.mainResource = mainResource;
    resourceModule.resources = resources;
    resourceModule.viewStrategy = viewStrategy;

    return resourceModule;
  }
}

var noMutations = [];

export class ChildObserver {
  constructor(config){
    this.name = config.name;
    this.changeHandler = config.changeHandler || this.name + 'Changed';
    this.selector = config.selector;
  }

  create(target, behavior){
    return new ChildObserverBinder(this.selector, target, this.name, behavior, this.changeHandler);
  }
}

//TODO: we really only want one child observer per element. Right now you can have many, via @sync.
//We need to enable a way to share the observer across all uses and direct matches to the correct source.
export class ChildObserverBinder {
  constructor(selector, target, property, behavior, changeHandler){
    this.selector = selector;
    this.target = target;
    this.property = property;
    this.behavior = behavior;
    this.changeHandler = changeHandler in behavior ? changeHandler : null;
    this.observer = new MutationObserver(this.onChange.bind(this));
  }

  bind(source){
    var items, results, i, ii, node, behavior = this.behavior;

    this.observer.observe(this.target, {childList:true, subtree: true});

    items = behavior[this.property];
    if(!items){
      items = behavior[this.property] = [];
    }else{
      items.length = 0;
    }

    results = this.target.querySelectorAll(this.selector);

    for(i = 0, ii = results.length; i < ii; ++i){
      node = results[i];
      items.push(node.primaryBehavior ? node.primaryBehavior.bindingContext : node);
    }

    if(this.changeHandler !== null){
      this.behavior[this.changeHandler](noMutations);
    }
  }

  unbind(){
    this.observer.disconnect();
  }

  onChange(mutations){
    var items = this.behavior[this.property],
        selector = this.selector;

    mutations.forEach(record => {
      var added = record.addedNodes,
          removed = record.removedNodes,
          prev = record.previousSibling,
          i, ii, primary, index, node;

      for(i = 0, ii = removed.length; i < ii; ++i){
        node = removed[i];
        if(node.nodeType === 1 && node.matches(selector)){
          primary = node.primaryBehavior ? node.primaryBehavior.bindingContext : node;
          index = items.indexOf(primary);
          if(index != -1){
            items.splice(index, 1);
          }
        }
      }

      for(i = 0, ii = added.length; i < ii; ++i){
        node = added[i];
        if(node.nodeType === 1 && node.matches(selector)){
          primary = node.primaryBehavior ? node.primaryBehavior.bindingContext : node;
          index = 0;

          while(prev){
            if(prev.nodeType === 1 && prev.matches(selector)){
              index++;
            }

            prev = prev.previousSibling;
          }

          items.splice(index, 0, primary);
        }
      }
    });

    if(this.changeHandler !== null){
      this.behavior[this.changeHandler](mutations);
    }
  }
}

export class CompositionEngine {
  static inject(){ return [ViewEngine]; }
  constructor(viewEngine){
    this.viewEngine = viewEngine;
  }

  activate(instruction){
    if(instruction.skipActivation || typeof instruction.viewModel.activate !== 'function'){
      return Promise.resolve();
    }

    return instruction.viewModel.activate(instruction.model) || Promise.resolve();
  }

  createBehaviorAndSwap(instruction){
    var removeResponse = instruction.viewSlot.removeAll(true);

    if(removeResponse instanceof Promise){
      return removeResponse.then(() => {
        return this.createBehavior(instruction).then(behavior => {
          if(instruction.currentBehavior){
            instruction.currentBehavior.unbind();
          }

          behavior.view.bind(behavior.bindingContext);
          instruction.viewSlot.add(behavior.view);

          return behavior;
        });
      });
    } else{
      return this.createBehavior(instruction).then(behavior => {
        if(instruction.currentBehavior){
          instruction.currentBehavior.unbind();
        }

        behavior.view.bind(behavior.bindingContext);
        instruction.viewSlot.add(behavior.view);

        return behavior;
      });
    }
  }

  createBehavior(instruction){
    var childContainer = instruction.childContainer,
        viewModelResource = instruction.viewModelResource,
        viewModel = instruction.viewModel,
        metadata;

    return this.activate(instruction).then(() => {
      var doneLoading, viewStrategyFromViewModel, origin;

      if('getViewStrategy' in viewModel && !instruction.view){
        viewStrategyFromViewModel = true;
        instruction.view = ViewStrategy.normalize(viewModel.getViewStrategy());
      }

      if (instruction.view) {
        if(viewStrategyFromViewModel){
          origin = Origin.get(viewModel.constructor);
          if(origin){
            instruction.view.makeRelativeTo(origin.moduleId);
          }
        }else if(instruction.viewResources){
          instruction.view.makeRelativeTo(instruction.viewResources.viewUrl);
        }
      }

      if(viewModelResource){
        metadata = viewModelResource.metadata;
        doneLoading = metadata.load(childContainer, viewModelResource.value, instruction.view, true);
      }else{
        metadata = new HtmlBehaviorResource();
        metadata.elementName = 'dynamic-element';
        metadata.analyze(instruction.container || childContainer, viewModel.constructor);
        doneLoading = metadata.load(childContainer, viewModel.constructor, instruction.view, true).then(viewFactory => {
          return viewFactory;
        });
      }

      return doneLoading.then(viewFactory => {
        return metadata.create(childContainer, BehaviorInstruction.dynamic(instruction.host, viewModel, viewFactory));
      });
    });
  }

  createViewModel(instruction){
    var childContainer = instruction.childContainer || instruction.container.createChild();

    instruction.viewModel = instruction.viewResources
        ? instruction.viewResources.relativeToView(instruction.viewModel)
        : instruction.viewModel;

    return this.viewEngine.importViewModelResource(instruction.viewModel).then(viewModelResource => {
      childContainer.autoRegister(viewModelResource.value);

      if(instruction.host){
        childContainer.registerInstance(Element, instruction.host);
      }

      instruction.viewModel = childContainer.viewModel = childContainer.get(viewModelResource.value);
      instruction.viewModelResource = viewModelResource;
      return instruction;
    });
  }

  compose(instruction){
    instruction.childContainer = instruction.childContainer || instruction.container.createChild();
    instruction.view = ViewStrategy.normalize(instruction.view);

    if(instruction.viewModel){
      if(typeof instruction.viewModel === 'string'){
        return this.createViewModel(instruction).then(instruction => {
          return this.createBehaviorAndSwap(instruction);
        });
      }else{
        return this.createBehaviorAndSwap(instruction);
      }
    }else if(instruction.view){
      if(instruction.viewResources){
        instruction.view.makeRelativeTo(instruction.viewResources.viewUrl);
      }

      return instruction.view.loadViewFactory(this.viewEngine, new ViewCompileInstruction()).then(viewFactory => {
        var removeResponse = instruction.viewSlot.removeAll(true);

        if(removeResponse instanceof Promise) {
          return removeResponse.then(() => {
            var result = viewFactory.create(instruction.childContainer, instruction.bindingContext);
            instruction.viewSlot.add(result);
            return result;
          });
        } else {
          var result = viewFactory.create(instruction.childContainer, instruction.bindingContext);
          instruction.viewSlot.add(result);
          return result;
        }
      });
    }else if(instruction.viewSlot){
      instruction.viewSlot.removeAll();
      return Promise.resolve(null);
    }
  }
}

export class ElementConfigResource {
  load(container, target){
    var config = new target(),
        eventManager = container.get(EventManager);

    eventManager.registerElementConfig(config);
    return Promise.resolve(this);
  }

  register(){}
}

function validateBehaviorName(name, type) {
  if (/[A-Z]/.test(name)) {
    throw new Error(`'${name}' is not a valid ${type} name.  Upper-case letters are not allowed because the DOM is not case-sensitive.`)
  }
}

export function resource(instance){
  return function(target){
    Metadata.define(Metadata.resource, instance, target);
  }
}

Decorators.configure.parameterizedDecorator('resource', resource);

export function behavior(override){
  return function(target){
    if(override instanceof HtmlBehaviorResource){
      Metadata.define(Metadata.resource, override, target);
    }else{
      var resource = Metadata.getOrCreateOwn(Metadata.resource, HtmlBehaviorResource, target);
      Object.assign(resource, override);
    }
  }
}

Decorators.configure.parameterizedDecorator('behavior', behavior);

export function customElement(name){
  validateBehaviorName(name, 'custom element');
  return function(target){
    var resource = Metadata.getOrCreateOwn(Metadata.resource, HtmlBehaviorResource, target);
    resource.elementName = name;
  }
}

Decorators.configure.parameterizedDecorator('customElement', customElement);

export function customAttribute(name, defaultBindingMode?){
  validateBehaviorName(name, 'custom attribute');
  return function(target){
    var resource = Metadata.getOrCreateOwn(Metadata.resource, HtmlBehaviorResource, target);
    resource.attributeName = name;
    resource.attributeDefaultBindingMode = defaultBindingMode;
  }
}

Decorators.configure.parameterizedDecorator('customAttribute', customAttribute);

export function templateController(target){
  var deco = function(target){
    var resource = Metadata.getOrCreateOwn(Metadata.resource, HtmlBehaviorResource, target);
    resource.liftsContent = true;
  };

  return target ? deco(target) : deco;
}

Decorators.configure.simpleDecorator('templateController', templateController);

export function bindable(nameOrConfigOrTarget?, key?, descriptor?){
  var deco = function(target, key, descriptor){
    var actualTarget = key ? target.constructor : target, //is it on a property or a class?
        resource = Metadata.getOrCreateOwn(Metadata.resource, HtmlBehaviorResource, actualTarget),
        prop;

    if(key){ //is it on a property or a class?
      nameOrConfigOrTarget = nameOrConfigOrTarget || {};
      nameOrConfigOrTarget.name = key;
    }

    prop = new BindableProperty(nameOrConfigOrTarget);
    return prop.registerWith(actualTarget, resource, descriptor);
  };

  if(!nameOrConfigOrTarget){ //placed on property initializer with parens
    return deco;
  }

  if(key){ //placed on a property initializer without parens
    var target = nameOrConfigOrTarget;
    nameOrConfigOrTarget = null;
    return deco(target, key, descriptor);
  }

  return deco; //placed on a class
}

Decorators.configure.parameterizedDecorator('bindable', bindable);

export function dynamicOptions(target){
  var deco = function(target){
    var resource = Metadata.getOrCreateOwn(Metadata.resource, HtmlBehaviorResource, target);
    resource.hasDynamicOptions = true;
  };

  return target ? deco(target) : deco;
}

Decorators.configure.simpleDecorator('dynamicOptions', dynamicOptions);

export function sync(selectorOrConfig){
  return function(target, key, descriptor){
    let actualTarget = key ? target.constructor : target, //is it on a property or a class?
        resource = Metadata.getOrCreateOwn(Metadata.resource, HtmlBehaviorResource, actualTarget);

    if(typeof selectorOrConfig === 'string'){
      selectorOrConfig = {
        selector: selectorOrConfig,
        name: key
      };
    }

    resource.addChildBinding(new ChildObserver(selectorOrConfig));
  }
}

Decorators.configure.parameterizedDecorator('sync', sync);

export function useShadowDOM(target){
  var deco = function(target){
    var resource = Metadata.getOrCreateOwn(Metadata.resource, HtmlBehaviorResource, target);
    resource.targetShadowDOM = true;
  };

  return target ? deco(target) : deco;
}

Decorators.configure.simpleDecorator('useShadowDOM', useShadowDOM);

function doNotProcessContent(){
  return false;
}

//this is now deprecated in favor of the processContent decorator
export function skipContentProcessing(target){
  var deco = function(target){
    var resource = Metadata.getOrCreateOwn(Metadata.resource, HtmlBehaviorResource, target);
    resource.processContent = doNotProcessContent;
    console.warn('The @skipContentProcessing decorator is deprecated and will be removed in a future release. Please use @processContent(false) instead.');
  };

  return target ? deco(target) : deco;
}

Decorators.configure.simpleDecorator('skipContentProcessing', skipContentProcessing);

export function processContent(processor){
  return function(target){
    var resource = Metadata.getOrCreateOwn(Metadata.resource, HtmlBehaviorResource, target);
    resource.processContent = processor || doNotProcessContent;
  }
}

Decorators.configure.parameterizedDecorator('processContent', processContent);

export function containerless(target){
  var deco = function(target){
    var resource = Metadata.getOrCreateOwn(Metadata.resource, HtmlBehaviorResource, target);
    resource.containerless = true;
  };

  return target ? deco(target) : deco;
}

Decorators.configure.simpleDecorator('containerless', containerless);

export function viewStrategy(strategy){
  return function(target){
    Metadata.define(ViewStrategy.metadataKey, strategy, target);
  }
}

Decorators.configure.parameterizedDecorator('viewStrategy', useView);

export function useView(path){
  return viewStrategy(new UseViewStrategy(path));
}

Decorators.configure.parameterizedDecorator('useView', useView);

export function inlineView(markup:string, dependencies?:Array<string|Function|Object>, dependencyBaseUrl?:string){
  return viewStrategy(new InlineViewStrategy(markup, dependencies, dependencyBaseUrl));
}

Decorators.configure.parameterizedDecorator('inlineView', inlineView);

export function noView(target){
  var deco = function(target){
    Metadata.define(ViewStrategy.metadataKey, new NoViewStrategy(), target);
  };

  return target ? deco(target) : deco;
}

Decorators.configure.simpleDecorator('noView', noView);

export function elementConfig(target){
  var deco = function(target){
    Metadata.define(Metadata.resource, new ElementConfigResource(), target);
  };

  return target ? deco(target) : deco;
}

Decorators.configure.simpleDecorator('elementConfig', elementConfig);
