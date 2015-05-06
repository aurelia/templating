'use strict';

var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } };

exports.__esModule = true;

var _Origin = require('aurelia-metadata');

var _ObserverLocator = require('aurelia-binding');

var _TaskQueue = require('aurelia-task-queue');

var _ViewStrategy = require('./view-strategy');

var _ViewEngine = require('./view-engine');

var _ContentSelector = require('./content-selector');

var _hyphenate = require('./util');

var _BindableProperty = require('./bindable-property');

var _BehaviorInstance = require('./behavior-instance');

var defaultInstruction = { suppressBind: false },
    contentSelectorFactoryOptions = { suppressBind: true },
    hasShadowDOM = !!HTMLElement.prototype.createShadowRoot;

var HtmlBehaviorResource = (function () {
  function HtmlBehaviorResource() {
    _classCallCheck(this, HtmlBehaviorResource);

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

  HtmlBehaviorResource.convention = function convention(name, existing) {
    var behavior;

    if (name.endsWith('CustomAttribute')) {
      behavior = existing || new HtmlBehaviorResource();
      behavior.attributeName = _hyphenate.hyphenate(name.substring(0, name.length - 15));
    }

    if (name.endsWith('CustomElement')) {
      behavior = existing || new HtmlBehaviorResource();
      behavior.elementName = _hyphenate.hyphenate(name.substring(0, name.length - 13));
    }

    return behavior;
  };

  HtmlBehaviorResource.prototype.analyze = function analyze(container, target) {
    var proto = target.prototype,
        properties = this.properties,
        attributeName = this.attributeName,
        i,
        ii,
        current;

    this.observerLocator = container.get(_ObserverLocator.ObserverLocator);
    this.taskQueue = container.get(_TaskQueue.TaskQueue);

    this.target = target;
    this.usesShadowDOM = this.targetShadowDOM && hasShadowDOM;
    this.handlesCreated = 'created' in proto;
    this.handlesBind = 'bind' in proto;
    this.handlesUnbind = 'unbind' in proto;
    this.handlesAttached = 'attached' in proto;
    this.handlesDetached = 'detached' in proto;
    this.apiName = (this.elementName || this.attributeName).replace(/-([a-z])/g, function (m, w) {
      return w.toUpperCase();
    });

    if (attributeName !== null) {
      if (properties.length === 0) {
        new _BindableProperty.BindableProperty({
          name: 'value',
          changeHandler: 'valueChanged' in proto ? 'valueChanged' : null,
          attribute: attributeName
        }).registerWith(target, this);
      }

      current = properties[0];

      if (properties.length === 1 && current.name === 'value') {
        current.isDynamic = current.hasOptions = this.hasDynamicOptions;
        current.defineOn(target, this);
      } else {
        for (i = 0, ii = properties.length; i < ii; ++i) {
          properties[i].defineOn(target, this);
        }

        current = new _BindableProperty.BindableProperty({
          name: 'value',
          changeHandler: 'valueChanged' in proto ? 'valueChanged' : null,
          attribute: attributeName
        });

        current.hasOptions = true;
        current.registerWith(target, this);
      }
    } else {
      for (i = 0, ii = properties.length; i < ii; ++i) {
        properties[i].defineOn(target, this);
      }
    }
  };

  HtmlBehaviorResource.prototype.load = function load(container, target, viewStrategy, transientView) {
    var _this = this;

    var options;

    if (this.elementName !== null) {
      viewStrategy = viewStrategy || this.viewStrategy || _ViewStrategy.ViewStrategy.getDefault(target);
      options = {
        targetShadowDOM: this.targetShadowDOM,
        beforeCompile: target.beforeCompile
      };

      if (!viewStrategy.moduleId) {
        viewStrategy.moduleId = _Origin.Origin.get(target).moduleId;
      }

      return viewStrategy.loadViewFactory(container.get(_ViewEngine.ViewEngine), options).then(function (viewFactory) {
        if (!transientView) {
          _this.viewFactory = viewFactory;
        }

        return viewFactory;
      });
    }

    return Promise.resolve(this);
  };

  HtmlBehaviorResource.prototype.register = function register(registry, name) {
    if (this.attributeName !== null) {
      registry.registerAttribute(name || this.attributeName, this, this.attributeName);
    }

    if (this.elementName !== null) {
      registry.registerElement(name || this.elementName, this);
    }
  };

  HtmlBehaviorResource.prototype.compile = function compile(compiler, resources, node, instruction, parentNode) {
    if (this.liftsContent) {
      if (!instruction.viewFactory) {
        var template = document.createElement('template'),
            fragment = document.createDocumentFragment();

        node.removeAttribute(instruction.originalAttrName);

        if (node.parentNode) {
          node.parentNode.replaceChild(template, node);
        } else if (window.ShadowDOMPolyfill) {
          ShadowDOMPolyfill.unwrap(parentNode).replaceChild(ShadowDOMPolyfill.unwrap(template), ShadowDOMPolyfill.unwrap(node));
        } else {
          parentNode.replaceChild(template, node);
        }

        fragment.appendChild(node);

        instruction.viewFactory = compiler.compile(fragment, resources);
        node = template;
      }
    } else if (this.elementName !== null && !this.usesShadowDOM && !this.skipContentProcessing && node.hasChildNodes()) {
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
  };

  HtmlBehaviorResource.prototype.create = function create(container, _x, _x2, bindings) {
    var instruction = arguments[1] === undefined ? defaultInstruction : arguments[1];
    var element = arguments[2] === undefined ? null : arguments[2];

    var executionContext = instruction.executionContext || container.get(this.target),
        behaviorInstance = new _BehaviorInstance.BehaviorInstance(this, executionContext, instruction),
        viewFactory,
        host;

    if (this.liftsContent) {
      element.primaryBehavior = behaviorInstance;
    } else if (this.elementName !== null) {
      viewFactory = instruction.viewFactory || this.viewFactory;

      if (viewFactory) {
        behaviorInstance.view = viewFactory.create(container, behaviorInstance.executionContext, instruction);
      }

      if (element) {
        element.primaryBehavior = behaviorInstance;

        if (this.usesShadowDOM) {
          host = element.createShadowRoot();
        } else {
          host = element;
        }

        if (behaviorInstance.view) {
          if (!this.usesShadowDOM) {
            if (instruction.contentFactory) {
              var contentView = instruction.contentFactory.create(container, null, contentSelectorFactoryOptions);

              _ContentSelector.ContentSelector.applySelectors(contentView, behaviorInstance.view.contentSelectors, function (contentSelector, group) {
                return contentSelector.add(group);
              });

              behaviorInstance.contentView = contentView;
            }
          }

          if (this.childExpression) {
            behaviorInstance.view.addBinding(this.childExpression.createBinding(host, behaviorInstance.executionContext));
          }

          behaviorInstance.view.appendNodesTo(host);
        }
      } else if (behaviorInstance.view) {
        behaviorInstance.view.owner = behaviorInstance;
      }
    } else if (this.childExpression) {
      bindings.push(this.childExpression.createBinding(element, behaviorInstance.executionContext));
    }

    if (element && !(this.apiName in element)) {
      element[this.apiName] = behaviorInstance.executionContext;
    }

    return behaviorInstance;
  };

  HtmlBehaviorResource.prototype.ensurePropertiesDefined = function ensurePropertiesDefined(instance, lookup) {
    var properties, i, ii, observer;

    if ('__propertiesDefined__' in lookup) {
      return;
    }

    lookup.__propertiesDefined__ = true;
    properties = this.properties;

    for (i = 0, ii = properties.length; i < ii; ++i) {
      observer = properties[i].createObserver(instance);

      if (observer !== undefined) {
        lookup[observer.propertyName] = observer;
      }
    }
  };

  return HtmlBehaviorResource;
})();

exports.HtmlBehaviorResource = HtmlBehaviorResource;