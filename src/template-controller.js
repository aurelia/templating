import {ResourceType} from 'aurelia-metadata';
import {BehaviorInstance} from './behavior-instance';
import {configureBehavior} from './behaviors';
import {hyphenate} from './util';

export class TemplateController extends ResourceType {
  constructor(attribute){
    this.name = attribute;
    this.properties = [];
    this.attributes = {};
    this.liftsContent = true;
  }

  static convention(name){
    if(name.endsWith('TemplateController')){
      return new TemplateController(hyphenate(name.substring(0, name.length-18)));
    }
  }

  analyze(container, target){
    configureBehavior(container, this, target);
  }

  load(container, target){
    return Promise.resolve(this);
  }

  register(registry, name){
    registry.registerAttribute(name || this.name, this, this.name);
  }

  compile(compiler, resources, node, instruction, parentNode){
    if(!instruction.viewFactory){
      var template = document.createElement('template'),
          fragment = document.createDocumentFragment();

      node.removeAttribute(instruction.originalAttrName);

      if(node.parentNode){
        node.parentNode.replaceChild(template, node);
      }else if(window.ShadowDOMPolyfill){ //HACK: IE template element and shadow dom polyfills not quite right...
        ShadowDOMPolyfill.unwrap(parentNode).replaceChild(
          ShadowDOMPolyfill.unwrap(template),
          ShadowDOMPolyfill.unwrap(node)
          );
      }else{ //HACK: same as above
        parentNode.replaceChild(template, node);
      }

      fragment.appendChild(node);

      instruction.viewFactory = compiler.compile(fragment, resources);
      node = template;
    }

    instruction.suppressBind = true;

    return node;
  }

  create(container, instruction, element){
    var executionContext = instruction.executionContext || container.get(this.target),
        behaviorInstance = new BehaviorInstance(this, executionContext, instruction);

    element.primaryBehavior = behaviorInstance;

    if(!(this.apiName in element)){
      element[this.apiName] = behaviorInstance.executionContext;
    }

    return behaviorInstance;
  }
}
