import {Behavior, Property, hyphenate} from './behavior';

export class TemplateController extends Behavior {
  constructor(attribute){
    super();
    this.attribute = attribute;
    this.liftsContent = true;
  }

  static convention(name){
    if(name.endsWith('TemplateController')){
      return new TemplateController(hyphenate(name.substring(0, name.length-18)));
    }
  }

  load(container, target){
    this.setTarget(container, target);

    if(!this.attribute){
      this.attribute = hyphenate(target.name);
    }

    if(this.properties.length === 0 && 'valueChanged' in target.prototype){
      new Property('value', 'valueChanged', this.attribute).load(this);
    }

    return Promise.resolve(this);
  }

  register(registry, name){
    registry.registerAttribute(name || this.attribute, this, this.attribute);
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
    var behaviorInstance = super.create(container, instruction, element);
    element.primaryBehavior = behaviorInstance;
    return behaviorInstance;
  }
}