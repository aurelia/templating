import {Origin} from 'aurelia-metadata';
import {ObserverLocator, BindingExpression, Binding} from 'aurelia-binding';
import {TaskQueue} from 'aurelia-task-queue';
import {Container} from 'aurelia-dependency-injection';
import {ViewStrategy} from './view-strategy';
import {ViewEngine} from './view-engine';
import {ViewCompiler} from './view-compiler';
import {ContentSelector} from './content-selector';
import {hyphenate} from './util';
import {BindableProperty} from './bindable-property';
import {BehaviorInstance} from './behavior-instance';
import {ViewResources} from './view-resources';
import {DOMBoundary, replaceNode, removeNode, hasShadowDOM} from './dom';
import {ResourceLoadContext, ViewCompileInstruction, BehaviorInstruction} from './instructions';

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
