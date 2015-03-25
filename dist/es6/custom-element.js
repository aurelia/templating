import {Metadata, Origin, ResourceType} from 'aurelia-metadata';
import {BehaviorInstance} from './behavior-instance';
import {configureBehavior} from './behaviors';
import {ContentSelector} from './content-selector';
import {ViewEngine} from './view-engine';
import {ViewStrategy} from './view-strategy';
import {hyphenate} from './util';

var defaultInstruction = { suppressBind:false },
    contentSelectorFactoryOptions = { suppressBind:true },
    hasShadowDOM = !!HTMLElement.prototype.createShadowRoot,
    valuePropertyName = 'value';

export class UseShadowDOM {}
export class SkipContentProcessing {}

export class CustomElement extends ResourceType {
  constructor(tagName){
    this.name = tagName;
    this.properties = [];
    this.attributes = {};
  }

  static convention(name){
    if(name.endsWith('CustomElement')){
      return new CustomElement(hyphenate(name.substring(0, name.length-13)));
    }
  }

  analyze(container, target){
    var meta = Metadata.on(target);
    configureBehavior(container, this, target, valuePropertyName);
    this.targetShadowDOM = meta.has(UseShadowDOM);
    this.skipContentProcessing = meta.has(SkipContentProcessing);
    this.usesShadowDOM = this.targetShadowDOM && hasShadowDOM;
  }

  register(registry, name){
    registry.registerElement(name || this.name, this);
  }

  load(container, target, viewStrategy, transientView){
    var options;

    viewStrategy = viewStrategy || this.viewStrategy || ViewStrategy.getDefault(target);
    options = {
      targetShadowDOM:this.targetShadowDOM,
      beforeCompile:target.beforeCompile
    };

    if(!viewStrategy.moduleId){
      viewStrategy.moduleId = Origin.get(target).moduleId;
    }

    return viewStrategy.loadViewFactory(container.get(ViewEngine), options).then(viewFactory => {
      if(!transientView){
        this.viewFactory = viewFactory;
      }

      return viewFactory;
    });
  }

  compile(compiler, resources, node, instruction){
    if(!this.usesShadowDOM && !this.skipContentProcessing && node.hasChildNodes()){
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
    var executionContext = instruction.executionContext || container.get(this.target),
        behaviorInstance = new BehaviorInstance(this, executionContext, instruction),
        viewFactory = instruction.viewFactory || this.viewFactory,
        host;

    if(viewFactory){
      behaviorInstance.view = viewFactory.create(container, behaviorInstance.executionContext, instruction);
    }

    if(element){
      element.primaryBehavior = behaviorInstance;

      if(!(this.apiName in element)){
        element[this.apiName] = behaviorInstance.executionContext;
      }

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
