import {getAnnotation, Origin} from 'aurelia-metadata';
import {Behavior, hyphenate} from './behavior';
import {ContentSelector} from './content-selector';
import {ViewEngine} from './view-engine';
import {UseView, ConventionalView} from './use-view';

var defaultInstruction = { suppressBind:false },
    contentSelectorFactoryOptions = { suppressBind:true },
    dynamicElementTag = 'aurelia-dynamic-element',
    hasShadowDOM = !!HTMLElement.prototype.createShadowRoot;

export class UseShadowDOM {}

export class CustomElement extends Behavior {
  constructor(tagName){
    super();
    this.tagName = tagName;
  }

  static anonymous(container, target, useView) {
    if(typeof target !== 'function'){
      target = target.constructor;
    }

    return new CustomElement(dynamicElementTag).load(container, target, useView);
  }

  static convention(name){
    if(name.endsWith('CustomElement')){
      return new CustomElement(hyphenate(name.substring(0, name.length-13)));
    }
  }

  load(container, target, useView){
    var annotation, options;

    this.setTarget(container, target);

    this.targetShadowDOM = getAnnotation(target, UseShadowDOM) !== null;
    this.usesShadowDOM = this.targetShadowDOM && hasShadowDOM;

    if(!this.tagName){
      this.tagName = hyphenate(target.name);
    }

    if(!useView){
      useView = getAnnotation(target, UseView);
      if(!useView){
        annotation = Origin.get(target);
        useView = new ConventionalView(annotation.moduleId);
      }
    }

    options = { targetShadowDOM:this.targetShadowDOM };

    return useView.loadViewFactory(container.get(ViewEngine), options).then(viewFactory => {
      this.viewFactory = viewFactory;
      return this;
    });
  }

  register(registry, name){
    registry.registerElement(name || this.tagName, this);
  }

  compile(compiler, resources, node, instruction){
    if(!this.usesShadowDOM && node.hasChildNodes()){
      var fragment = document.createDocumentFragment(),
          currentChild = node.firstChild,
          nextSibling;

      while (currentChild) {
        nextSibling = currentChild.nextSibling;
        fragment.appendChild(currentChild);
        currentChild = nextSibling;
      }

      instruction.contentFactory = compiler.compile(fragment, resources);
    }

    instruction.suppressBind = true;
    
    return node;
  }

  create(container, instruction=defaultInstruction, element=null){
    var behaviorInstance = super.create(container, instruction),
        host;

    if(this.viewFactory){
      behaviorInstance.view = this.viewFactory.create(container, behaviorInstance.executionContext, instruction);
    }

    if(element){
      element.elementBehavior = behaviorInstance;
      element.primaryBehavior = behaviorInstance;

      if(behaviorInstance.view){
        if(this.usesShadowDOM) {
          host = element.createShadowRoot();
        }else{
          host = element;

          if(instruction.contentFactory){
            var contentView = instruction.contentFactory.create(container, null, contentSelectorFactoryOptions);

            ContentSelector.applySelectors(
              contentView, 
              behaviorInstance.view.contentSelectors, 
              (contentSelector, group) => contentSelector.add(group)
              );

            behaviorInstance.contentView = contentView;
          }
        }

        if(this.childExpression){
          behaviorInstance.view.addBinding(this.childExpression.createBinding(host, behaviorInstance.executionContext));
        }

        behaviorInstance.view.appendNodesTo(host);
      }
    }else if(behaviorInstance.view){
      behaviorInstance.view.owner = behaviorInstance;
    }

    return behaviorInstance;
  }
}