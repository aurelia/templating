import core from 'core-js';
import * as LogManager from 'aurelia-logging';
// import {Origin} from 'aurelia-metadata';
import {Loader,TemplateRegistryEntry} from 'aurelia-loader';
import {Container} from 'aurelia-dependency-injection';
import {ViewCompiler} from './view-compiler';
import {ResourceRegistry, ViewResources} from './resource-registry';
// import {ModuleAnalyzer} from './module-analyzer';

// ----------- module analyzer

// import {Metadata, ResourceType} from 'aurelia-metadata';
// import {TemplateRegistryEntry} from 'aurelia-loader';
import {ValueConverterResource} from 'aurelia-binding';
// import {HtmlBehaviorResource} from './html-behavior';
import {ViewStrategy,TemplateRegistryViewStrategy} from './view-strategy';
import {hyphenate} from './util';

// ------------ html behavior

import {Metadata, Origin, ResourceType} from 'aurelia-metadata';
import {ObserverLocator} from 'aurelia-binding';
import {TaskQueue} from 'aurelia-task-queue';
// import {ViewStrategy} from './view-strategy';
// import {ViewEngine} from './view-engine';
import {ContentSelector} from './content-selector';
// import {hyphenate} from './util';
import {BindableProperty} from './bindable-property';
import {BehaviorInstance} from './behavior-instance';

// ------------

var logger = LogManager.getLogger('templating');

function ensureRegistryEntry(loader, urlOrRegistryEntry){
  if(urlOrRegistryEntry instanceof TemplateRegistryEntry){
    return Promise.resolve(urlOrRegistryEntry);
  }

  return loader.loadTemplate(urlOrRegistryEntry);
}

export class ViewEngine {
  static inject() { return [Loader, Container, ViewCompiler, ModuleAnalyzer, ResourceRegistry]; }
  constructor(loader, container, viewCompiler, moduleAnalyzer, appResources){
    this.loader = loader;
    this.container = container;
    this.viewCompiler = viewCompiler;
    this.moduleAnalyzer = moduleAnalyzer;
    this.appResources = appResources;
  }

  loadViewFactory(urlOrRegistryEntry, compileOptions, associatedModuleId){
    return ensureRegistryEntry(this.loader, urlOrRegistryEntry).then(viewRegistryEntry => {
      if(viewRegistryEntry.isReady){
        return viewRegistryEntry.factory;
      }

      return this.loadTemplateResources(viewRegistryEntry, associatedModuleId).then(resources => {
        if(viewRegistryEntry.isReady){
          return viewRegistryEntry.factory;
        }

        viewRegistryEntry.setResources(resources);

        var viewFactory = this.viewCompiler.compile(viewRegistryEntry.template, resources, compileOptions);
        viewRegistryEntry.setFactory(viewFactory);
        return viewFactory;
      });
    });
  }

  loadTemplateResources(viewRegistryEntry, associatedModuleId){
    var resources = new ViewResources(this.appResources, viewRegistryEntry.id),
        dependencies = viewRegistryEntry.dependencies,
        importIds, names;

    if(dependencies.length === 0 && !associatedModuleId){
      return Promise.resolve(resources);
    }

    importIds = dependencies.map(x => x.src);
    names = dependencies.map(x => x.name);
    logger.debug(`importing resources for ${viewRegistryEntry.id}`, importIds);

    return this.importViewResources(importIds, names, resources, associatedModuleId);
  }

  importViewModelResource(moduleImport, moduleMember){
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

  importViewResources(moduleIds, names, resources, associatedModuleId){
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

      if(associatedModuleId){
        associatedModule = moduleAnalyzer.getAnalysis(associatedModuleId);

        if(associatedModule){
          associatedModule.register(resources);
        }
      }

      //cause compile/load of any associated views second
      //as a result all globals have access to all other globals during compilation
      for(i = 0, ii = allAnalysis.length; i < ii; ++i){
        allAnalysis[i] = allAnalysis[i].load(container);
      }

      return Promise.all(allAnalysis).then(() => resources);
    });
  }
}

// -------------- module analyzer

class ResourceModule {
  constructor(moduleId){
    this.id = moduleId;
    this.moduleInstance = null;
    this.mainResource = null;
    this.resources = null;
    this.viewStrategy = null;
    this.isAnalyzed = false;
  }

  analyze(container){
    var current = this.mainResource,
        resources = this.resources,
        viewStrategy = this.viewStrategy,
        i, ii, metadata;

    if(this.isAnalyzed){
      return;
    }

    this.isAnalyzed = true;

    if(current){
      metadata = current.metadata;
      metadata.viewStrategy = viewStrategy;

      if('analyze' in metadata && !metadata.isAnalyzed){
        metadata.isAnalyzed = true;
        metadata.analyze(container, current.value);
      }
    }

    for(i = 0, ii = resources.length; i < ii; ++i){
      current = resources[i];
      metadata = current.metadata;
      metadata.viewStrategy = viewStrategy;

      if('analyze' in metadata && !metadata.isAnalyzed){
        metadata.isAnalyzed = true;
        metadata.analyze(container, current.value);
      }
    }
  }

  register(registry, name){
    var i, ii, resources = this.resources;

    if(this.mainResource){
      this.mainResource.metadata.register(registry, name);
      name = null;
    }

    for(i = 0, ii = resources.length; i < ii; ++i){
      resources[i].metadata.register(registry, name);
      name = null;
    }
  }

  load(container){
    var current = this.mainResource,
        resources = this.resources,
        i, ii, metadata, loads;

    if(this.isLoaded){
      return Promise.resolve();
    }

    this.isLoaded = true;
    loads = [];

    if(current){
      metadata = current.metadata;

      if('load' in metadata && !metadata.isLoaded){
        metadata.isLoaded = true;
        loads.push(metadata.load(container, current.value));
      }
    }

    for(i = 0, ii = resources.length; i < ii; ++i){
      current = resources[i];
      metadata = current.metadata;

      if('load' in metadata && !metadata.isLoaded){
        metadata.isLoaded = true;
        loads.push(metadata.load(container, current.value));
      }
    }

    return Promise.all(loads);
  }
}

class ResourceDescription {
  constructor(key, exportedValue, allMetadata, resourceTypeMeta){
    if(!resourceTypeMeta){
      if(!allMetadata){
        allMetadata = Metadata.on(exportedValue);
      }

      resourceTypeMeta = allMetadata.first(ResourceType);

      if(!resourceTypeMeta){
        resourceTypeMeta = new HtmlBehaviorResource();
        resourceTypeMeta.elementName = hyphenate(key);
        allMetadata.add(resourceTypeMeta);
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
}

export class ModuleAnalyzer {
  constructor(){
    this.cache = {};
  }

  getAnalysis(moduleId){
    return this.cache[moduleId];
  }

  analyze(moduleId, moduleInstance, viewModelMember){
    var mainResource, fallbackValue, fallbackKey, fallbackMetadata, resourceTypeMeta, key, allMetadata,
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

      allMetadata = Metadata.on(exportedValue);
      resourceTypeMeta = allMetadata.first(ResourceType);

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
          mainResource = new ResourceDescription(key, exportedValue, allMetadata, resourceTypeMeta);
        }else{
          resources.push(new ResourceDescription(key, exportedValue, allMetadata, resourceTypeMeta));
        }
      } else if(exportedValue instanceof ViewStrategy){
        viewStrategy = exportedValue;
      } else if(exportedValue instanceof TemplateRegistryEntry){
        viewStrategy = new TemplateRegistryViewStrategy(moduleId, exportedValue);
      } else {
        if(conventional = HtmlBehaviorResource.convention(key)){
          if(conventional.elementName !== null && !mainResource){
            mainResource = new ResourceDescription(key, exportedValue, allMetadata, conventional);
          }else{
            resources.push(new ResourceDescription(key, exportedValue, allMetadata, conventional));
          }

          allMetadata.add(conventional);
        } else if(conventional = ValueConverterResource.convention(key)) {
          resources.push(new ResourceDescription(key, exportedValue, allMetadata, conventional));
          allMetadata.add(conventional);
        } else if(!fallbackValue){
          fallbackValue = exportedValue;
          fallbackKey = key;
          fallbackMetadata = allMetadata;
        }
      }
    }

    if(!mainResource && fallbackValue){
      mainResource = new ResourceDescription(fallbackKey, fallbackValue, fallbackMetadata);
    }

    resourceModule.moduleInstance = moduleInstance;
    resourceModule.mainResource = mainResource;
    resourceModule.resources = resources;
    resourceModule.viewStrategy = viewStrategy;

    return resourceModule;
  }
}

// -------------- html behavior

var defaultInstruction = { suppressBind:false },
    contentSelectorFactoryOptions = { suppressBind:true },
    hasShadowDOM = !!HTMLElement.prototype.createShadowRoot;

export class HtmlBehaviorResource extends ResourceType {
  constructor(){
    super();
    this.elementName = null;
    this.attributeName = null;
    this.liftsContent = false;
    this.targetShadowDOM = false;
    this.skipContentProcessing = false;
    this.usesShadowDOM = false;
    this.childExpression = null;
    this.hasDynamicOptions = false;
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
          attribute:attributeName
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
          attribute:attributeName
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
    } else if(this.elementName !== null && !this.usesShadowDOM && !this.skipContentProcessing && node.hasChildNodes()){
      //custom element
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

  create(container, instruction=defaultInstruction, element=null, bindings){
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
        behaviorInstance.view = viewFactory.create(container, behaviorInstance.executionContext, instruction);
      }

      if(element){
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
