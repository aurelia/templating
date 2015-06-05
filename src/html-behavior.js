import {Origin} from 'aurelia-metadata';
import {ObserverLocator} from 'aurelia-binding';
import {TaskQueue} from 'aurelia-task-queue';
import {ViewStrategy} from './view-strategy';
import {ViewEngine} from './view-engine';
import {ContentSelector} from './content-selector';
import {hyphenate} from './util';
import {BindableProperty} from './bindable-property';
import {BehaviorInstance} from './behavior-instance';

var defaultInstruction = { suppressBind:false },
    contentSelectorFactoryOptions = { suppressBind:true },
    hasShadowDOM = !!HTMLElement.prototype.createShadowRoot;

export class HtmlBehaviorResource {
  constructor(){
    this.elementName = null;
    this.attributeName = null;
    this.attributeDefaultBindingMode = undefined;
    this.liftsContent = false;
    this.targetShadowDOM = false;
    this.skipContentProcessing = false;
    this.usesShadowDOM = false;
    this.childExpression = null;
    this.hasDynamicOptions = false;
    this.containerless = false;
    this.properties = [];
    this.attributes = {};
  }

  static convention(name, existing){
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

  analyze(container, target){
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
    this.apiName = (this.elementName || this.attributeName).replace(/-([a-z])/g, (m, w) => w.toUpperCase());

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

  load(container, target, viewStrategy, transientView){
    var options;

    if(this.elementName !== null){
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

    return Promise.resolve(this);
  }

  register(registry, name){
    if(this.attributeName !== null) {
      registry.registerAttribute(name || this.attributeName, this, this.attributeName);
    }

    if(this.elementName !== null) {
      registry.registerElement(name || this.elementName, this);
    }
  }

  compile(compiler, resources, node, instruction, parentNode){
    if(this.liftsContent){
      if(!instruction.viewFactory){
        var template = document.createElement('template'),
            fragment = document.createDocumentFragment(),
            part = node.getAttribute('part');

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

        if(part){
          instruction.viewFactory.part = part;
          node.removeAttribute('part');
        }

        node = template;
      }
    } else if(this.elementName !== null){ //custom element
      var partReplacements = {};

      if(!this.skipContentProcessing && node.hasChildNodes()){
        if(!this.usesShadowDOM){
          var fragment = document.createDocumentFragment(),
              currentChild = node.firstChild,
              nextSibling;

          while (currentChild) {
            nextSibling = currentChild.nextSibling;

            if(currentChild.tagName === 'TEMPLATE' && (toReplace = currentChild.getAttribute('replace-part'))){
              partReplacements[toReplace] = compiler.compile(currentChild, resources);
            }else{
              fragment.appendChild(currentChild);
            }

            currentChild = nextSibling;
          }

          instruction.contentFactory = compiler.compile(fragment, resources);
        }else{
          var currentChild = node.firstChild,
              nextSibling, toReplace;

          while (currentChild) {
            nextSibling = currentChild.nextSibling;

            if(currentChild.tagName === 'TEMPLATE' && (toReplace = currentChild.getAttribute('replace-part'))){
              partReplacements[toReplace] = compiler.compile(currentChild, resources);
            }

            currentChild = nextSibling;
          }
        }
      }
    }

    instruction.partReplacements = partReplacements;
    instruction.suppressBind = true;
    return node;
  }

  create(container, instruction=defaultInstruction, element=null, bindings=null){
    var executionContext = instruction.executionContext || container.get(this.target),
        behaviorInstance = new BehaviorInstance(this, executionContext, instruction),
        viewFactory, host;

    if(this.liftsContent){
      //template controller
      element.primaryBehavior = behaviorInstance;
    } else if(this.elementName !== null){
      //custom element
      viewFactory = instruction.viewFactory || this.viewFactory;

      if(viewFactory){
        //TODO: apply element instructions? var results = viewFactory.applyElementInstructions(container, behaviorInstance.executionContext, element);
        behaviorInstance.view = viewFactory.create(container, behaviorInstance.executionContext, instruction);
        //TODO: register results with view
      }

      if(element){
        element.primaryBehavior = behaviorInstance;

        if(this.usesShadowDOM) {
          host = element.createShadowRoot();
        }else{
          host = element;
        }

        if(behaviorInstance.view){
          if(!this.usesShadowDOM) {
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

          if(instruction.anchorIsContainer){
            if(this.childExpression){
              behaviorInstance.view.addBinding(this.childExpression.createBinding(host, behaviorInstance.executionContext));
            }

            behaviorInstance.view.appendNodesTo(host);
          }else{
            behaviorInstance.view.insertNodesBefore(host);
          }
        }else if(this.childExpression){
          bindings.push(this.childExpression.createBinding(element, behaviorInstance.executionContext));
        }
      }else if(behaviorInstance.view){
        //dynamic element with view
        behaviorInstance.view.owner = behaviorInstance;

        if(this.childExpression){
          behaviorInstance.view.addBinding(this.childExpression.createBinding(instruction.host, behaviorInstance.executionContext));
        }
      }else if(this.childExpression){
        //dynamic element without view
        bindings.push(this.childExpression.createBinding(instruction.host, behaviorInstance.executionContext));
      }
    } else if(this.childExpression){
      //custom attribute
      bindings.push(this.childExpression.createBinding(element, behaviorInstance.executionContext));
    }

    if(element && !(this.apiName in element)){
      element[this.apiName] = behaviorInstance.executionContext;
    }

    return behaviorInstance;
  }

  ensurePropertiesDefined(instance, lookup){
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
