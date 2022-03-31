System.register(['aurelia-pal', 'aurelia-loader', 'aurelia-metadata', 'aurelia-path', 'aurelia-logging', 'aurelia-binding', 'aurelia-dependency-injection', 'aurelia-task-queue'], (function (exports) {
    'use strict';
    var DOM, FEATURE, PLATFORM, TemplateRegistryEntry, Loader, metadata, Origin, protocol, relativeToFile, LogManager, subscriberCollection, bindingMode, createOverrideContext, ValueConverterResource, BindingBehaviorResource, ObserverLocator, camelCase, EventManager, Container, resolver, inject, TaskQueue;
    return {
        setters: [function (module) {
            DOM = module.DOM;
            FEATURE = module.FEATURE;
            PLATFORM = module.PLATFORM;
        }, function (module) {
            TemplateRegistryEntry = module.TemplateRegistryEntry;
            Loader = module.Loader;
        }, function (module) {
            metadata = module.metadata;
            Origin = module.Origin;
            protocol = module.protocol;
        }, function (module) {
            relativeToFile = module.relativeToFile;
        }, function (module) {
            LogManager = module;
        }, function (module) {
            subscriberCollection = module.subscriberCollection;
            bindingMode = module.bindingMode;
            createOverrideContext = module.createOverrideContext;
            ValueConverterResource = module.ValueConverterResource;
            BindingBehaviorResource = module.BindingBehaviorResource;
            ObserverLocator = module.ObserverLocator;
            camelCase = module.camelCase;
            EventManager = module.EventManager;
        }, function (module) {
            Container = module.Container;
            resolver = module.resolver;
            inject = module.inject;
        }, function (module) {
            TaskQueue = module.TaskQueue;
        }],
        execute: (function () {

            exports({
                _hyphenate: _hyphenate,
                _isAllWhitespace: _isAllWhitespace,
                behavior: behavior,
                bindable: bindable,
                child: child,
                children: children,
                containerless: containerless,
                customAttribute: customAttribute,
                customElement: customElement,
                dynamicOptions: dynamicOptions,
                elementConfig: elementConfig,
                inlineView: inlineView,
                noView: noView,
                processAttributes: processAttributes,
                processContent: processContent,
                resource: resource,
                templateController: templateController,
                useShadowDOM: useShadowDOM,
                useView: useView,
                useViewStrategy: useViewStrategy,
                validateBehaviorName: validateBehaviorName,
                view: view,
                viewEngineHooks: viewEngineHooks,
                viewResources: viewResources
            });

            var ElementEvents = exports('ElementEvents', (function () {
                function ElementEvents(element) {
                    this.element = element;
                    this.subscriptions = {};
                }
                ElementEvents.prototype._enqueueHandler = function (handler) {
                    this.subscriptions[handler.eventName] = this.subscriptions[handler.eventName] || [];
                    this.subscriptions[handler.eventName].push(handler);
                };
                ElementEvents.prototype._dequeueHandler = function (handler) {
                    var index;
                    var subscriptions = this.subscriptions[handler.eventName];
                    if (subscriptions) {
                        index = subscriptions.indexOf(handler);
                        if (index > -1) {
                            subscriptions.splice(index, 1);
                        }
                    }
                    return handler;
                };
                ElementEvents.prototype.publish = function (eventName, detail, bubbles, cancelable) {
                    if (detail === void 0) { detail = {}; }
                    if (bubbles === void 0) { bubbles = true; }
                    if (cancelable === void 0) { cancelable = true; }
                    var event = DOM.createCustomEvent(eventName, { cancelable: cancelable, bubbles: bubbles, detail: detail });
                    this.element.dispatchEvent(event);
                };
                ElementEvents.prototype.subscribe = function (eventName, handler, captureOrOptions) {
                    if (typeof handler === 'function') {
                        if (captureOrOptions === undefined) {
                            captureOrOptions = ElementEvents.defaultListenerOptions;
                        }
                        var eventHandler = new EventHandlerImpl(this, eventName, handler, captureOrOptions, false);
                        return eventHandler;
                    }
                    return undefined;
                };
                ElementEvents.prototype.subscribeOnce = function (eventName, handler, captureOrOptions) {
                    if (typeof handler === 'function') {
                        if (captureOrOptions === undefined) {
                            captureOrOptions = ElementEvents.defaultListenerOptions;
                        }
                        var eventHandler = new EventHandlerImpl(this, eventName, handler, captureOrOptions, true);
                        return eventHandler;
                    }
                    return undefined;
                };
                ElementEvents.prototype.dispose = function (eventName) {
                    if (eventName && typeof eventName === 'string') {
                        var subscriptions = this.subscriptions[eventName];
                        if (subscriptions) {
                            while (subscriptions.length) {
                                var subscription = subscriptions.pop();
                                if (subscription) {
                                    subscription.dispose();
                                }
                            }
                        }
                    }
                    else {
                        this.disposeAll();
                    }
                };
                ElementEvents.prototype.disposeAll = function () {
                    for (var key in this.subscriptions) {
                        this.dispose(key);
                    }
                };
                ElementEvents.defaultListenerOptions = true;
                return ElementEvents;
            }()));
            var EventHandlerImpl = (function () {
                function EventHandlerImpl(owner, eventName, handler, captureOrOptions, once) {
                    this.owner = owner;
                    this.eventName = eventName;
                    this.handler = handler;
                    this.capture = typeof captureOrOptions === 'boolean' ? captureOrOptions : captureOrOptions.capture;
                    this.bubbles = !this.capture;
                    this.captureOrOptions = captureOrOptions;
                    this.once = once;
                    owner.element.addEventListener(eventName, this, captureOrOptions);
                    owner._enqueueHandler(this);
                }
                EventHandlerImpl.prototype.handleEvent = function (e) {
                    var fn = this.handler;
                    fn(e);
                    if (this.once) {
                        this.dispose();
                    }
                };
                EventHandlerImpl.prototype.dispose = function () {
                    this.owner.element.removeEventListener(this.eventName, this, this.captureOrOptions);
                    this.owner._dequeueHandler(this);
                    this.owner = this.handler = null;
                };
                return EventHandlerImpl;
            }());

            var ResourceLoadContext = exports('ResourceLoadContext', (function () {
                function ResourceLoadContext() {
                    this.dependencies = {};
                }
                ResourceLoadContext.prototype.addDependency = function (url) {
                    this.dependencies[url] = true;
                };
                ResourceLoadContext.prototype.hasDependency = function (url) {
                    return url in this.dependencies;
                };
                return ResourceLoadContext;
            }()));
            var ViewCompileInstruction = exports('ViewCompileInstruction', (function () {
                function ViewCompileInstruction(targetShadowDOM, compileSurrogate) {
                    if (targetShadowDOM === void 0) { targetShadowDOM = false; }
                    if (compileSurrogate === void 0) { compileSurrogate = false; }
                    this.targetShadowDOM = targetShadowDOM;
                    this.compileSurrogate = compileSurrogate;
                    this.associatedModuleId = null;
                }
                ViewCompileInstruction.normal = new ViewCompileInstruction();
                return ViewCompileInstruction;
            }()));
            var BehaviorInstruction = exports('BehaviorInstruction', (function () {
                function BehaviorInstruction() {
                }
                BehaviorInstruction.enhance = function () {
                    var instruction = new BehaviorInstruction();
                    instruction.enhance = true;
                    return instruction;
                };
                BehaviorInstruction.unitTest = function (type, attributes) {
                    var instruction = new BehaviorInstruction();
                    instruction.type = type;
                    instruction.attributes = attributes || {};
                    return instruction;
                };
                BehaviorInstruction.element = function (node, type) {
                    var instruction = new BehaviorInstruction();
                    instruction.type = type;
                    instruction.attributes = {};
                    instruction.anchorIsContainer = !(node.hasAttribute('containerless') || type.containerless);
                    instruction.initiatedByBehavior = true;
                    return instruction;
                };
                BehaviorInstruction.attribute = function (attrName, type) {
                    var instruction = new BehaviorInstruction();
                    instruction.attrName = attrName;
                    instruction.type = type || null;
                    instruction.attributes = {};
                    return instruction;
                };
                BehaviorInstruction.dynamic = function (host, viewModel, viewFactory) {
                    var instruction = new BehaviorInstruction();
                    instruction.host = host;
                    instruction.viewModel = viewModel;
                    instruction.viewFactory = viewFactory;
                    instruction.inheritBindingContext = true;
                    return instruction;
                };
                BehaviorInstruction.normal = new BehaviorInstruction();
                return BehaviorInstruction;
            }()));
            var biProto = BehaviorInstruction.prototype;
            biProto.initiatedByBehavior = false;
            biProto.enhance = false;
            biProto.partReplacements = null;
            biProto.viewFactory = null;
            biProto.originalAttrName = null;
            biProto.skipContentProcessing = false;
            biProto.contentFactory = null;
            biProto.viewModel = null;
            biProto.anchorIsContainer = false;
            biProto.host = null;
            biProto.attributes = null;
            biProto.type = null;
            biProto.attrName = null;
            biProto.inheritBindingContext = false;
            var TargetInstruction = exports('TargetInstruction', (function () {
                function TargetInstruction() {
                }
                TargetInstruction.shadowSlot = function (parentInjectorId) {
                    var instruction = new TargetInstruction();
                    instruction.parentInjectorId = parentInjectorId;
                    instruction.shadowSlot = true;
                    return instruction;
                };
                TargetInstruction.contentExpression = function (expression) {
                    var instruction = new TargetInstruction();
                    instruction.contentExpression = expression;
                    return instruction;
                };
                TargetInstruction.letElement = function (expressions) {
                    var instruction = new TargetInstruction();
                    instruction.expressions = expressions;
                    instruction.letElement = true;
                    return instruction;
                };
                TargetInstruction.lifting = function (parentInjectorId, liftingInstruction) {
                    var instruction = new TargetInstruction();
                    instruction.parentInjectorId = parentInjectorId;
                    instruction.expressions = TargetInstruction.noExpressions;
                    instruction.behaviorInstructions = [liftingInstruction];
                    instruction.viewFactory = liftingInstruction.viewFactory;
                    instruction.providers = [liftingInstruction.type.target];
                    instruction.lifting = true;
                    return instruction;
                };
                TargetInstruction.normal = function (injectorId, parentInjectorId, providers, behaviorInstructions, expressions, elementInstruction) {
                    var instruction = new TargetInstruction();
                    instruction.injectorId = injectorId;
                    instruction.parentInjectorId = parentInjectorId;
                    instruction.providers = providers;
                    instruction.behaviorInstructions = behaviorInstructions;
                    instruction.expressions = expressions;
                    instruction.anchorIsContainer = elementInstruction ? elementInstruction.anchorIsContainer : true;
                    instruction.elementInstruction = elementInstruction;
                    return instruction;
                };
                TargetInstruction.surrogate = function (providers, behaviorInstructions, expressions, values) {
                    var instruction = new TargetInstruction();
                    instruction.expressions = expressions;
                    instruction.behaviorInstructions = behaviorInstructions;
                    instruction.providers = providers;
                    instruction.values = values;
                    return instruction;
                };
                TargetInstruction.noExpressions = Object.freeze([]);
                return TargetInstruction;
            }()));
            var tiProto = TargetInstruction.prototype;
            tiProto.injectorId = null;
            tiProto.parentInjectorId = null;
            tiProto.shadowSlot = false;
            tiProto.slotName = null;
            tiProto.slotFallbackFactory = null;
            tiProto.contentExpression = null;
            tiProto.letElement = false;
            tiProto.expressions = null;
            tiProto.expressions = null;
            tiProto.providers = null;
            tiProto.viewFactory = null;
            tiProto.anchorIsContainer = false;
            tiProto.elementInstruction = null;
            tiProto.lifting = false;
            tiProto.values = null;

            /*! *****************************************************************************
            Copyright (c) Microsoft Corporation.

            Permission to use, copy, modify, and/or distribute this software for any
            purpose with or without fee is hereby granted.

            THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
            REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
            AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
            INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
            LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
            OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
            PERFORMANCE OF THIS SOFTWARE.
            ***************************************************************************** */

            function __decorate(decorators, target, key, desc) {
                var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
                if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
                else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
                return c > 3 && r && Object.defineProperty(target, key, r), r;
            }

            var capitalMatcher = /([A-Z])/g;
            function addHyphenAndLower(char) {
                return '-' + char.toLowerCase();
            }
            function _hyphenate(name) {
                return (name.charAt(0).toLowerCase() + name.slice(1)).replace(capitalMatcher, addHyphenAndLower);
            }
            function _isAllWhitespace(node) {
                return !(node.auInterpolationTarget || (/[^\t\n\r ]/.test(node.textContent)));
            }

            var BehaviorPropertyObserver = exports('BehaviorPropertyObserver', (function () {
                function BehaviorPropertyObserver(taskQueue, obj, propertyName, selfSubscriber, initialValue) {
                    this.taskQueue = taskQueue;
                    this.obj = obj;
                    this.propertyName = propertyName;
                    this.notqueued = true;
                    this.publishing = false;
                    this.selfSubscriber = selfSubscriber;
                    this.currentValue = this.oldValue = initialValue;
                }
                BehaviorPropertyObserver.prototype.getValue = function () {
                    return this.currentValue;
                };
                BehaviorPropertyObserver.prototype.setValue = function (newValue) {
                    var oldValue = this.currentValue;
                    if (!Object.is(newValue, oldValue)) {
                        this.oldValue = oldValue;
                        this.currentValue = newValue;
                        if (this.publishing && this.notqueued) {
                            if (this.taskQueue.flushing) {
                                this.call();
                            }
                            else {
                                this.notqueued = false;
                                this.taskQueue.queueMicroTask(this);
                            }
                        }
                    }
                };
                BehaviorPropertyObserver.prototype.call = function () {
                    var oldValue = this.oldValue;
                    var newValue = this.currentValue;
                    this.notqueued = true;
                    if (Object.is(newValue, oldValue)) {
                        return;
                    }
                    if (this.selfSubscriber) {
                        this.selfSubscriber(newValue, oldValue);
                    }
                    this.callSubscribers(newValue, oldValue);
                    this.oldValue = newValue;
                };
                BehaviorPropertyObserver.prototype.callSubscribers = function (newValue, oldValue) {
                    throw new Error('Method not implemented.');
                };
                BehaviorPropertyObserver.prototype.subscribe = function (context, callable) {
                    this.addSubscriber(context, callable);
                };
                BehaviorPropertyObserver.prototype.addSubscriber = function (context, callable) {
                    throw new Error('Method not implemented.');
                };
                BehaviorPropertyObserver.prototype.unsubscribe = function (context, callable) {
                    this.removeSubscriber(context, callable);
                };
                BehaviorPropertyObserver.prototype.removeSubscriber = function (context, callable) {
                    throw new Error('Method not implemented.');
                };
                BehaviorPropertyObserver = __decorate([
                    subscriberCollection()
                ], BehaviorPropertyObserver);
                return BehaviorPropertyObserver;
            }()));

            function getObserver(instance, name) {
                var lookup = instance.__observers__;
                if (lookup === undefined) {
                    var ctor = Object.getPrototypeOf(instance).constructor;
                    var behavior = metadata.get(metadata.resource, ctor);
                    if (!behavior.isInitialized) {
                        behavior.initialize(Container.instance || new Container(), instance.constructor);
                    }
                    lookup = behavior.observerLocator.getOrCreateObserversLookup(instance);
                    behavior._ensurePropertiesDefined(instance, lookup);
                }
                return lookup[name];
            }
            var BindableProperty = exports('BindableProperty', (function () {
                function BindableProperty(nameOrConfig) {
                    if (typeof nameOrConfig === 'string') {
                        this.name = nameOrConfig;
                    }
                    else {
                        Object.assign(this, nameOrConfig);
                    }
                    this.attribute = this.attribute || _hyphenate(this.name);
                    var defaultBindingMode = this.defaultBindingMode;
                    if (defaultBindingMode === null || defaultBindingMode === undefined) {
                        this.defaultBindingMode = bindingMode.oneWay;
                    }
                    else if (typeof defaultBindingMode === 'string') {
                        this.defaultBindingMode = bindingMode[defaultBindingMode] || bindingMode.oneWay;
                    }
                    this.changeHandler = this.changeHandler || null;
                    this.owner = null;
                    this.descriptor = null;
                }
                BindableProperty.prototype.registerWith = function (target, behavior, descriptor) {
                    behavior.properties.push(this);
                    behavior.attributes[this.attribute] = this;
                    this.owner = behavior;
                    if (descriptor) {
                        this.descriptor = descriptor;
                        return this._configureDescriptor(descriptor);
                    }
                    return undefined;
                };
                BindableProperty.prototype._configureDescriptor = function (descriptor) {
                    var name = this.name;
                    descriptor.configurable = true;
                    descriptor.enumerable = true;
                    if ('initializer' in descriptor) {
                        this.defaultValue = descriptor.initializer;
                        delete descriptor.initializer;
                        delete descriptor.writable;
                    }
                    if ('value' in descriptor) {
                        this.defaultValue = descriptor.value;
                        delete descriptor.value;
                        delete descriptor.writable;
                    }
                    descriptor.get = function () {
                        return getObserver(this, name).getValue();
                    };
                    descriptor.set = function (value) {
                        getObserver(this, name).setValue(value);
                    };
                    descriptor.get.getObserver = function (obj) {
                        return getObserver(obj, name);
                    };
                    return descriptor;
                };
                BindableProperty.prototype.defineOn = function (target, behavior) {
                    var name = this.name;
                    var handlerName;
                    if (this.changeHandler === null) {
                        handlerName = name + 'Changed';
                        if (handlerName in target.prototype) {
                            this.changeHandler = handlerName;
                        }
                    }
                    if (this.descriptor === null) {
                        Object.defineProperty(target.prototype, name, this._configureDescriptor({}));
                    }
                };
                BindableProperty.prototype.createObserver = function (viewModel) {
                    var selfSubscriber = null;
                    var defaultValue = this.defaultValue;
                    var changeHandlerName = this.changeHandler;
                    var name = this.name;
                    var initialValue;
                    if (this.hasOptions) {
                        return undefined;
                    }
                    if (changeHandlerName in viewModel) {
                        if ('propertyChanged' in viewModel) {
                            selfSubscriber = function (newValue, oldValue) {
                                viewModel[changeHandlerName](newValue, oldValue);
                                viewModel.propertyChanged(name, newValue, oldValue);
                            };
                        }
                        else {
                            selfSubscriber = function (newValue, oldValue) { return viewModel[changeHandlerName](newValue, oldValue); };
                        }
                    }
                    else if ('propertyChanged' in viewModel) {
                        selfSubscriber = function (newValue, oldValue) { return viewModel.propertyChanged(name, newValue, oldValue); };
                    }
                    else if (changeHandlerName !== null) {
                        throw new Error("Change handler ".concat(changeHandlerName, " was specified but not declared on the class."));
                    }
                    if (defaultValue !== undefined) {
                        initialValue = typeof defaultValue === 'function' ? defaultValue.call(viewModel) : defaultValue;
                    }
                    return new BehaviorPropertyObserver(this.owner.taskQueue, viewModel, this.name, selfSubscriber, initialValue);
                };
                BindableProperty.prototype._initialize = function (viewModel, observerLookup, attributes, behaviorHandlesBind, boundProperties) {
                    var selfSubscriber;
                    var observer;
                    var attribute;
                    var defaultValue = this.defaultValue;
                    if (this.isDynamic) {
                        for (var key in attributes) {
                            this._createDynamicProperty(viewModel, observerLookup, behaviorHandlesBind, key, attributes[key], boundProperties);
                        }
                    }
                    else if (!this.hasOptions) {
                        observer = observerLookup[this.name];
                        if (attributes !== null) {
                            selfSubscriber = observer.selfSubscriber;
                            attribute = attributes[this.attribute];
                            if (behaviorHandlesBind) {
                                observer.selfSubscriber = null;
                            }
                            if (typeof attribute === 'string') {
                                viewModel[this.name] = attribute;
                                observer.call();
                            }
                            else if (attribute) {
                                boundProperties.push({ observer: observer, binding: attribute.createBinding(viewModel) });
                            }
                            else if (defaultValue !== undefined) {
                                observer.call();
                            }
                            observer.selfSubscriber = selfSubscriber;
                        }
                        observer.publishing = true;
                    }
                };
                BindableProperty.prototype._createDynamicProperty = function (viewModel, observerLookup, behaviorHandlesBind, name, attribute, boundProperties) {
                    var changeHandlerName = name + 'Changed';
                    var selfSubscriber = null;
                    var observer;
                    var info;
                    if (changeHandlerName in viewModel) {
                        if ('propertyChanged' in viewModel) {
                            selfSubscriber = function (newValue, oldValue) {
                                viewModel[changeHandlerName](newValue, oldValue);
                                viewModel.propertyChanged(name, newValue, oldValue);
                            };
                        }
                        else {
                            selfSubscriber = function (newValue, oldValue) { return viewModel[changeHandlerName](newValue, oldValue); };
                        }
                    }
                    else if ('propertyChanged' in viewModel) {
                        selfSubscriber = function (newValue, oldValue) { return viewModel.propertyChanged(name, newValue, oldValue); };
                    }
                    observer = observerLookup[name] = new BehaviorPropertyObserver(this.owner.taskQueue, viewModel, name, selfSubscriber);
                    Object.defineProperty(viewModel, name, {
                        configurable: true,
                        enumerable: true,
                        get: observer.getValue.bind(observer),
                        set: observer.setValue.bind(observer)
                    });
                    if (behaviorHandlesBind) {
                        observer.selfSubscriber = null;
                    }
                    if (typeof attribute === 'string') {
                        viewModel[name] = attribute;
                        observer.call();
                    }
                    else if (attribute) {
                        info = { observer: observer, binding: attribute.createBinding(viewModel) };
                        boundProperties.push(info);
                    }
                    observer.publishing = true;
                    observer.selfSubscriber = selfSubscriber;
                };
                return BindableProperty;
            }()));

            var ViewLocator = exports('ViewLocator', (function () {
                function ViewLocator() {
                }
                ViewLocator.prototype.getViewStrategy = function (value) {
                    if (!value) {
                        return null;
                    }
                    if (typeof value === 'object' && 'getViewStrategy' in value) {
                        var origin_1 = Origin.get(value.constructor);
                        value = value.getViewStrategy();
                        if (typeof value === 'string') {
                            value = new RelativeViewStrategy(value);
                        }
                        viewStrategy.assert(value);
                        if (origin_1.moduleId) {
                            value.makeRelativeTo(origin_1.moduleId);
                        }
                        return value;
                    }
                    if (typeof value === 'string') {
                        value = new RelativeViewStrategy(value);
                    }
                    if (viewStrategy.validate(value)) {
                        return value;
                    }
                    if (typeof value !== 'function') {
                        value = value.constructor;
                    }
                    if ('$view' in value) {
                        var c = value.$view;
                        var view = void 0;
                        c = typeof c === 'function' ? c.call(value) : c;
                        if (c === null) {
                            view = new NoViewStrategy();
                        }
                        else {
                            view = c instanceof StaticViewStrategy ? c : new StaticViewStrategy(c);
                        }
                        metadata.define(ViewLocator.viewStrategyMetadataKey, view, value);
                        return view;
                    }
                    var origin = Origin.get(value);
                    var strategy = metadata.get(ViewLocator.viewStrategyMetadataKey, value);
                    if (!strategy) {
                        if (!origin.moduleId) {
                            throw new Error('Cannot determine default view strategy for object.\n' + value);
                        }
                        strategy = this.createFallbackViewStrategy(origin);
                    }
                    else if (origin.moduleId) {
                        strategy.moduleId = origin.moduleId;
                    }
                    return strategy;
                };
                ViewLocator.prototype.createFallbackViewStrategy = function (origin) {
                    return new ConventionalViewStrategy(this, origin);
                };
                ViewLocator.prototype.convertOriginToViewUrl = function (origin) {
                    var moduleId = origin.moduleId;
                    var id = (moduleId.endsWith('.js') || moduleId.endsWith('.ts')) ? moduleId.substring(0, moduleId.length - 3) : moduleId;
                    return id + '.html';
                };
                ViewLocator.viewStrategyMetadataKey = 'aurelia:view-strategy';
                return ViewLocator;
            }()));

            function mi(name) {
                throw new Error("BindingLanguage must implement ".concat(name, "()."));
            }
            var BindingLanguage = exports('BindingLanguage', (function () {
                function BindingLanguage() {
                }
                BindingLanguage.prototype.inspectAttribute = function (resources, elementName, attrName, attrValue) {
                    mi('inspectAttribute');
                };
                BindingLanguage.prototype.createAttributeInstruction = function (resources, element, info, existingInstruction, context) {
                    mi('createAttributeInstruction');
                };
                BindingLanguage.prototype.createLetExpressions = function (resources, element) {
                    mi('createLetExpressions');
                };
                BindingLanguage.prototype.inspectTextContent = function (resources, value) {
                    mi('inspectTextContent');
                };
                return BindingLanguage;
            }()));

            var noNodes = Object.freeze([]);
            var SlotCustomAttribute = exports('SlotCustomAttribute', (function () {
                function SlotCustomAttribute(element) {
                    this.element = element;
                    this.element.auSlotAttribute = this;
                }
                SlotCustomAttribute.inject = function () {
                    return [DOM.Element];
                };
                SlotCustomAttribute.prototype.valueChanged = function (newValue, oldValue) { };
                return SlotCustomAttribute;
            }()));
            var PassThroughSlot = exports('PassThroughSlot', (function () {
                function PassThroughSlot(anchor, name, destinationName, fallbackFactory) {
                    this.anchor = anchor;
                    this.anchor.viewSlot = this;
                    this.name = name;
                    this.destinationName = destinationName;
                    this.fallbackFactory = fallbackFactory;
                    this.destinationSlot = null;
                    this.projections = 0;
                    this.contentView = null;
                    var attr = new SlotCustomAttribute(this.anchor);
                    attr.value = this.destinationName;
                }
                Object.defineProperty(PassThroughSlot.prototype, "needsFallbackRendering", {
                    get: function () {
                        return this.fallbackFactory && this.projections === 0;
                    },
                    enumerable: false,
                    configurable: true
                });
                PassThroughSlot.prototype.renderFallbackContent = function (view, nodes, projectionSource, index) {
                    if (this.contentView === null) {
                        this.contentView = this.fallbackFactory.create(this.ownerView.container);
                        this.contentView.bind(this.ownerView.bindingContext, this.ownerView.overrideContext);
                        var slots = Object.create(null);
                        slots[this.destinationSlot.name] = this.destinationSlot;
                        ShadowDOM.distributeView(this.contentView, slots, projectionSource, index, this.destinationSlot.name);
                    }
                };
                PassThroughSlot.prototype.passThroughTo = function (destinationSlot) {
                    this.destinationSlot = destinationSlot;
                };
                PassThroughSlot.prototype.addNode = function (view, node, projectionSource, index) {
                    if (this.contentView !== null) {
                        this.contentView.removeNodes();
                        this.contentView.detached();
                        this.contentView.unbind();
                        this.contentView = null;
                    }
                    if (node.viewSlot instanceof PassThroughSlot) {
                        node.viewSlot.passThroughTo(this);
                        return;
                    }
                    this.projections++;
                    this.destinationSlot.addNode(view, node, projectionSource, index);
                };
                PassThroughSlot.prototype.removeView = function (view, projectionSource) {
                    this.projections--;
                    this.destinationSlot.removeView(view, projectionSource);
                    if (this.needsFallbackRendering) {
                        this.renderFallbackContent(null, noNodes, projectionSource);
                    }
                };
                PassThroughSlot.prototype.removeAll = function (projectionSource) {
                    this.projections = 0;
                    this.destinationSlot.removeAll(projectionSource);
                    if (this.needsFallbackRendering) {
                        this.renderFallbackContent(null, noNodes, projectionSource);
                    }
                };
                PassThroughSlot.prototype.projectFrom = function (view, projectionSource) {
                    this.destinationSlot.projectFrom(view, projectionSource);
                };
                PassThroughSlot.prototype.created = function (ownerView) {
                    this.ownerView = ownerView;
                };
                PassThroughSlot.prototype.bind = function (view) {
                    if (this.contentView) {
                        this.contentView.bind(view.bindingContext, view.overrideContext);
                    }
                };
                PassThroughSlot.prototype.attached = function () {
                    if (this.contentView) {
                        this.contentView.attached();
                    }
                };
                PassThroughSlot.prototype.detached = function () {
                    if (this.contentView) {
                        this.contentView.detached();
                    }
                };
                PassThroughSlot.prototype.unbind = function () {
                    if (this.contentView) {
                        this.contentView.unbind();
                    }
                };
                return PassThroughSlot;
            }()));
            var ShadowSlot = exports('ShadowSlot', (function () {
                function ShadowSlot(anchor, name, fallbackFactory) {
                    this.anchor = anchor;
                    this.anchor.isContentProjectionSource = true;
                    this.anchor.viewSlot = this;
                    this.name = name;
                    this.fallbackFactory = fallbackFactory;
                    this.contentView = null;
                    this.projections = 0;
                    this.children = [];
                    this.projectFromAnchors = null;
                    this.destinationSlots = null;
                }
                Object.defineProperty(ShadowSlot.prototype, "needsFallbackRendering", {
                    get: function () {
                        return this.fallbackFactory && this.projections === 0;
                    },
                    enumerable: false,
                    configurable: true
                });
                ShadowSlot.prototype.addNode = function (view, node, projectionSource, index, destination) {
                    var $node = node;
                    if (this.contentView !== null) {
                        this.contentView.removeNodes();
                        this.contentView.detached();
                        this.contentView.unbind();
                        this.contentView = null;
                    }
                    if ($node.viewSlot instanceof PassThroughSlot) {
                        $node.viewSlot.passThroughTo(this);
                        return;
                    }
                    if (this.destinationSlots !== null) {
                        ShadowDOM.distributeNodes(view, [$node], this.destinationSlots, this, index);
                    }
                    else {
                        $node.auOwnerView = view;
                        $node.auProjectionSource = projectionSource;
                        $node.auAssignedSlot = this;
                        var anchor = this._findAnchor(view, $node, projectionSource, index);
                        var parent_1 = anchor.parentNode;
                        parent_1.insertBefore($node, anchor);
                        this.children.push($node);
                        this.projections++;
                    }
                };
                ShadowSlot.prototype.removeView = function (view, projectionSource) {
                    if (this.destinationSlots !== null) {
                        ShadowDOM.undistributeView(view, this.destinationSlots, this);
                    }
                    else if (this.contentView && this.contentView.hasSlots) {
                        ShadowDOM.undistributeView(view, this.contentView.slots, projectionSource);
                    }
                    else {
                        var found = this.children.find(function (x) { return x.auSlotProjectFrom === projectionSource; });
                        if (found) {
                            var children = found.auProjectionChildren;
                            var ownChildren = this.children;
                            for (var i = 0, ii = children.length; i < ii; ++i) {
                                var child = children[i];
                                if (child.auOwnerView === view) {
                                    children.splice(i, 1);
                                    view.fragment.appendChild(child);
                                    i--;
                                    ii--;
                                    this.projections--;
                                    var idx = ownChildren.indexOf(child);
                                    if (idx > -1) {
                                        ownChildren.splice(idx, 1);
                                    }
                                }
                            }
                            if (this.needsFallbackRendering) {
                                this.renderFallbackContent(view, noNodes, projectionSource);
                            }
                        }
                    }
                };
                ShadowSlot.prototype.removeAll = function (projectionSource) {
                    if (this.destinationSlots !== null) {
                        ShadowDOM.undistributeAll(this.destinationSlots, this);
                    }
                    else if (this.contentView && this.contentView.hasSlots) {
                        ShadowDOM.undistributeAll(this.contentView.slots, projectionSource);
                    }
                    else {
                        var found = this.children.find(function (x) { return x.auSlotProjectFrom === projectionSource; });
                        if (found) {
                            var children = found.auProjectionChildren;
                            var ownChildren = this.children;
                            for (var i = 0, ii = children.length; i < ii; ++i) {
                                var child = children[i];
                                child.auOwnerView.fragment.appendChild(child);
                                this.projections--;
                                var idx = ownChildren.indexOf(child);
                                if (idx > -1) {
                                    ownChildren.splice(idx, 1);
                                }
                            }
                            found.auProjectionChildren = [];
                            if (this.needsFallbackRendering) {
                                this.renderFallbackContent(null, noNodes, projectionSource);
                            }
                        }
                    }
                };
                ShadowSlot.prototype._findAnchor = function (view, node, projectionSource, index) {
                    if (projectionSource) {
                        var found = this.children.find(function (x) { return x.auSlotProjectFrom === projectionSource; });
                        if (found) {
                            if (index !== undefined) {
                                var children = found.auProjectionChildren;
                                var viewIndex = -1;
                                var lastView = void 0;
                                for (var i = 0, ii = children.length; i < ii; ++i) {
                                    var current = children[i];
                                    if (current.auOwnerView !== lastView) {
                                        viewIndex++;
                                        lastView = current.auOwnerView;
                                        if (viewIndex >= index && lastView !== view) {
                                            children.splice(i, 0, node);
                                            return current;
                                        }
                                    }
                                }
                            }
                            found.auProjectionChildren.push(node);
                            return found;
                        }
                    }
                    return this.anchor;
                };
                ShadowSlot.prototype.projectTo = function (slots) {
                    this.destinationSlots = slots;
                };
                ShadowSlot.prototype.projectFrom = function (view, projectionSource) {
                    var anchor = DOM.createComment('anchor');
                    var parent = this.anchor.parentNode;
                    anchor.auSlotProjectFrom = projectionSource;
                    anchor.auOwnerView = view;
                    anchor.auProjectionChildren = [];
                    parent.insertBefore(anchor, this.anchor);
                    this.children.push(anchor);
                    if (this.projectFromAnchors === null) {
                        this.projectFromAnchors = [];
                    }
                    this.projectFromAnchors.push(anchor);
                };
                ShadowSlot.prototype.renderFallbackContent = function (view, nodes, projectionSource, index) {
                    if (this.contentView === null) {
                        this.contentView = this.fallbackFactory.create(this.ownerView.container);
                        this.contentView.bind(this.ownerView.bindingContext, this.ownerView.overrideContext);
                        this.contentView.insertNodesBefore(this.anchor);
                    }
                    if (this.contentView.hasSlots) {
                        var slots = this.contentView.slots;
                        var projectFromAnchors = this.projectFromAnchors;
                        if (projectFromAnchors !== null) {
                            for (var slotName in slots) {
                                var slot = slots[slotName];
                                for (var i = 0, ii = projectFromAnchors.length; i < ii; ++i) {
                                    var anchor = projectFromAnchors[i];
                                    slot.projectFrom(anchor.auOwnerView, anchor.auSlotProjectFrom);
                                }
                            }
                        }
                        this.fallbackSlots = slots;
                        ShadowDOM.distributeNodes(view, nodes, slots, projectionSource, index);
                    }
                };
                ShadowSlot.prototype.created = function (ownerView) {
                    this.ownerView = ownerView;
                };
                ShadowSlot.prototype.bind = function (view) {
                    if (this.contentView) {
                        this.contentView.bind(view.bindingContext, view.overrideContext);
                    }
                };
                ShadowSlot.prototype.attached = function () {
                    if (this.contentView) {
                        this.contentView.attached();
                    }
                };
                ShadowSlot.prototype.detached = function () {
                    if (this.contentView) {
                        this.contentView.detached();
                    }
                };
                ShadowSlot.prototype.unbind = function () {
                    if (this.contentView) {
                        this.contentView.unbind();
                    }
                };
                return ShadowSlot;
            }()));
            var ShadowDOM = exports('ShadowDOM', (function () {
                function ShadowDOM() {
                }
                ShadowDOM.getSlotName = function (node) {
                    if (node.auSlotAttribute === undefined) {
                        return ShadowDOM.defaultSlotKey;
                    }
                    return node.auSlotAttribute.value;
                };
                ShadowDOM.distributeView = function (view, slots, projectionSource, index, destinationOverride) {
                    var nodes;
                    if (view === null) {
                        nodes = noNodes;
                    }
                    else {
                        var childNodes = view.fragment.childNodes;
                        var ii = childNodes.length;
                        nodes = new Array(ii);
                        for (var i = 0; i < ii; ++i) {
                            nodes[i] = childNodes[i];
                        }
                    }
                    ShadowDOM.distributeNodes(view, nodes, slots, projectionSource, index, destinationOverride);
                };
                ShadowDOM.undistributeView = function (view, slots, projectionSource) {
                    for (var slotName in slots) {
                        slots[slotName].removeView(view, projectionSource);
                    }
                };
                ShadowDOM.undistributeAll = function (slots, projectionSource) {
                    for (var slotName in slots) {
                        slots[slotName].removeAll(projectionSource);
                    }
                };
                ShadowDOM.distributeNodes = function (view, nodes, slots, projectionSource, index, destinationOverride) {
                    for (var i = 0, ii = nodes.length; i < ii; ++i) {
                        var currentNode = nodes[i];
                        var nodeType = currentNode.nodeType;
                        if (currentNode.isContentProjectionSource) {
                            currentNode.viewSlot.projectTo(slots);
                            for (var slotName in slots) {
                                slots[slotName].projectFrom(view, currentNode.viewSlot);
                            }
                            nodes.splice(i, 1);
                            ii--;
                            i--;
                        }
                        else if (nodeType === 1 || nodeType === 3 || currentNode.viewSlot instanceof PassThroughSlot) {
                            if (nodeType === 3 && _isAllWhitespace(currentNode)) {
                                nodes.splice(i, 1);
                                ii--;
                                i--;
                            }
                            else {
                                var found = slots[destinationOverride || ShadowDOM.getSlotName(currentNode)];
                                if (found) {
                                    found.addNode(view, currentNode, projectionSource, index);
                                    nodes.splice(i, 1);
                                    ii--;
                                    i--;
                                }
                            }
                        }
                        else {
                            nodes.splice(i, 1);
                            ii--;
                            i--;
                        }
                    }
                    for (var slotName in slots) {
                        var slot = slots[slotName];
                        if (slot.needsFallbackRendering) {
                            slot.renderFallbackContent(view, nodes, projectionSource, index);
                        }
                    }
                };
                ShadowDOM.defaultSlotKey = '__au-default-slot-key__';
                return ShadowDOM;
            }()));

            var CompositionTransactionNotifier = exports('CompositionTransactionNotifier', (function () {
                function CompositionTransactionNotifier(owner) {
                    this.owner = owner;
                    this.owner._compositionCount++;
                }
                CompositionTransactionNotifier.prototype.done = function () {
                    this.owner._compositionCount--;
                    this.owner._tryCompleteTransaction();
                };
                return CompositionTransactionNotifier;
            }()));
            var CompositionTransactionOwnershipToken = exports('CompositionTransactionOwnershipToken', (function () {
                function CompositionTransactionOwnershipToken(owner) {
                    this.owner = owner;
                    this.owner._ownershipToken = this;
                    this.thenable = this._createThenable();
                }
                CompositionTransactionOwnershipToken.prototype.waitForCompositionComplete = function () {
                    this.owner._tryCompleteTransaction();
                    return this.thenable;
                };
                CompositionTransactionOwnershipToken.prototype.resolve = function () {
                    this._resolveCallback();
                };
                CompositionTransactionOwnershipToken.prototype._resolveCallback = function () {
                    throw new Error("Method not implemented.");
                };
                CompositionTransactionOwnershipToken.prototype._createThenable = function () {
                    var _this = this;
                    return new Promise(function (resolve) {
                        _this._resolveCallback = resolve;
                    });
                };
                return CompositionTransactionOwnershipToken;
            }()));
            var CompositionTransaction = exports('CompositionTransaction', (function () {
                function CompositionTransaction() {
                    this._ownershipToken = null;
                    this._compositionCount = 0;
                }
                CompositionTransaction.prototype.tryCapture = function () {
                    return this._ownershipToken === null
                        ? new CompositionTransactionOwnershipToken(this)
                        : null;
                };
                CompositionTransaction.prototype.enlist = function () {
                    return new CompositionTransactionNotifier(this);
                };
                CompositionTransaction.prototype._tryCompleteTransaction = function () {
                    if (this._compositionCount <= 0) {
                        this._compositionCount = 0;
                        if (this._ownershipToken !== null) {
                            var token = this._ownershipToken;
                            this._ownershipToken = null;
                            token.resolve();
                        }
                    }
                };
                return CompositionTransaction;
            }()));

            var View = exports('View', (function () {
                function View(container, viewFactory, fragment, controllers, bindings, children, slots) {
                    this.container = container;
                    this.viewFactory = viewFactory;
                    this.resources = viewFactory.resources;
                    this.fragment = fragment;
                    this.firstChild = fragment.firstChild;
                    this.lastChild = fragment.lastChild;
                    this.controllers = controllers;
                    this.bindings = bindings;
                    this.children = children;
                    this.slots = slots;
                    this.hasSlots = false;
                    this.fromCache = false;
                    this.isBound = false;
                    this.isAttached = false;
                    this.bindingContext = null;
                    this.overrideContext = null;
                    this.controller = null;
                    this.viewModelScope = null;
                    this.animatableElement = undefined;
                    this._isUserControlled = false;
                    this.contentView = null;
                    for (var _ in slots) {
                        this.hasSlots = true;
                        break;
                    }
                }
                View.prototype.returnToCache = function () {
                    this.viewFactory.returnViewToCache(this);
                };
                View.prototype.created = function () {
                    var i;
                    var ii;
                    var controllers = this.controllers;
                    for (i = 0, ii = controllers.length; i < ii; ++i) {
                        controllers[i].created(this);
                    }
                };
                View.prototype.bind = function (bindingContext, overrideContext, _systemUpdate) {
                    var controllers;
                    var bindings;
                    var children;
                    var i;
                    var ii;
                    if (_systemUpdate && this._isUserControlled) {
                        return;
                    }
                    if (this.isBound) {
                        if (this.bindingContext === bindingContext) {
                            return;
                        }
                        this.unbind();
                    }
                    this.isBound = true;
                    this.bindingContext = bindingContext;
                    this.overrideContext = overrideContext || createOverrideContext(bindingContext);
                    this.resources._invokeHook('beforeBind', this);
                    bindings = this.bindings;
                    for (i = 0, ii = bindings.length; i < ii; ++i) {
                        bindings[i].bind(this);
                    }
                    if (this.viewModelScope !== null) {
                        bindingContext.bind(this.viewModelScope.bindingContext, this.viewModelScope.overrideContext);
                        this.viewModelScope = null;
                    }
                    controllers = this.controllers;
                    for (i = 0, ii = controllers.length; i < ii; ++i) {
                        controllers[i].bind(this);
                    }
                    children = this.children;
                    for (i = 0, ii = children.length; i < ii; ++i) {
                        children[i].bind(bindingContext, overrideContext, true);
                    }
                    if (this.hasSlots) {
                        ShadowDOM.distributeView(this.contentView, this.slots);
                    }
                };
                View.prototype.addBinding = function (binding) {
                    this.bindings.push(binding);
                    if (this.isBound) {
                        binding.bind(this);
                    }
                };
                View.prototype.unbind = function () {
                    var controllers;
                    var bindings;
                    var children;
                    var i;
                    var ii;
                    if (this.isBound) {
                        this.isBound = false;
                        this.resources._invokeHook('beforeUnbind', this);
                        if (this.controller !== null) {
                            this.controller.unbind();
                        }
                        bindings = this.bindings;
                        for (i = 0, ii = bindings.length; i < ii; ++i) {
                            bindings[i].unbind();
                        }
                        controllers = this.controllers;
                        for (i = 0, ii = controllers.length; i < ii; ++i) {
                            controllers[i].unbind();
                        }
                        children = this.children;
                        for (i = 0, ii = children.length; i < ii; ++i) {
                            children[i].unbind();
                        }
                        this.bindingContext = null;
                        this.overrideContext = null;
                    }
                };
                View.prototype.insertNodesBefore = function (refNode) {
                    refNode.parentNode.insertBefore(this.fragment, refNode);
                };
                View.prototype.appendNodesTo = function (parent) {
                    parent.appendChild(this.fragment);
                };
                View.prototype.removeNodes = function () {
                    var fragment = this.fragment;
                    var current = this.firstChild;
                    var end = this.lastChild;
                    var next;
                    while (current) {
                        next = current.nextSibling;
                        fragment.appendChild(current);
                        if (current === end) {
                            break;
                        }
                        current = next;
                    }
                };
                View.prototype.attached = function () {
                    var controllers;
                    var children;
                    var i;
                    var ii;
                    if (this.isAttached) {
                        return;
                    }
                    this.isAttached = true;
                    if (this.controller !== null) {
                        this.controller.attached();
                    }
                    controllers = this.controllers;
                    for (i = 0, ii = controllers.length; i < ii; ++i) {
                        controllers[i].attached();
                    }
                    children = this.children;
                    for (i = 0, ii = children.length; i < ii; ++i) {
                        children[i].attached();
                    }
                };
                View.prototype.detached = function () {
                    var controllers;
                    var children;
                    var i;
                    var ii;
                    if (this.isAttached) {
                        this.isAttached = false;
                        if (this.controller !== null) {
                            this.controller.detached();
                        }
                        controllers = this.controllers;
                        for (i = 0, ii = controllers.length; i < ii; ++i) {
                            controllers[i].detached();
                        }
                        children = this.children;
                        for (i = 0, ii = children.length; i < ii; ++i) {
                            children[i].detached();
                        }
                    }
                };
                return View;
            }()));

            var Animator = exports('Animator', (function () {
                function Animator() {
                }
                Animator.prototype.enter = function (element) {
                    return Promise.resolve(false);
                };
                Animator.prototype.leave = function (element) {
                    return Promise.resolve(false);
                };
                Animator.prototype.removeClass = function (element, className) {
                    element.classList.remove(className);
                    return Promise.resolve(false);
                };
                Animator.prototype.addClass = function (element, className) {
                    element.classList.add(className);
                    return Promise.resolve(false);
                };
                Animator.prototype.animate = function (element, className) {
                    return Promise.resolve(false);
                };
                Animator.prototype.runSequence = function (animations) {
                    return Promise.resolve(false);
                };
                Animator.prototype.registerEffect = function (effectName, properties) { };
                Animator.prototype.unregisterEffect = function (effectName) { };
                return Animator;
            }()));

            function getAnimatableElement(view) {
                if (view.animatableElement !== undefined) {
                    return view.animatableElement;
                }
                var current = view.firstChild;
                while (current && current.nodeType !== 1) {
                    current = current.nextSibling;
                }
                if (current && current.nodeType === 1) {
                    return (view.animatableElement = current.classList.contains('au-animate') ? current : null);
                }
                return (view.animatableElement = null);
            }
            var ViewSlot = exports('ViewSlot', (function () {
                function ViewSlot(anchor, anchorIsContainer, animator) {
                    if (animator === void 0) { animator = Animator.instance; }
                    this.anchor = anchor;
                    this.anchorIsContainer = anchorIsContainer;
                    this.bindingContext = null;
                    this.overrideContext = null;
                    this.animator = animator;
                    this.children = [];
                    this.isBound = false;
                    this.isAttached = false;
                    this.contentSelectors = null;
                    anchor.viewSlot = this;
                    anchor.isContentProjectionSource = false;
                }
                ViewSlot.prototype.animateView = function (view, direction) {
                    if (direction === void 0) { direction = 'enter'; }
                    var animatableElement = getAnimatableElement(view);
                    if (animatableElement !== null) {
                        switch (direction) {
                            case 'enter':
                                return this.animator.enter(animatableElement);
                            case 'leave':
                                return this.animator.leave(animatableElement);
                            default:
                                throw new Error('Invalid animation direction: ' + direction);
                        }
                    }
                };
                ViewSlot.prototype.transformChildNodesIntoView = function () {
                    var parent = this.anchor;
                    this.children.push({
                        fragment: parent,
                        firstChild: parent.firstChild,
                        lastChild: parent.lastChild,
                        returnToCache: function () { },
                        removeNodes: function () {
                            var last;
                            while (last = parent.lastChild) {
                                parent.removeChild(last);
                            }
                        },
                        created: function () { },
                        bind: function () { },
                        unbind: function () { },
                        attached: function () { },
                        detached: function () { }
                    });
                };
                ViewSlot.prototype.bind = function (bindingContext, overrideContext) {
                    var i;
                    var ii;
                    var children;
                    if (this.isBound) {
                        if (this.bindingContext === bindingContext) {
                            return;
                        }
                        this.unbind();
                    }
                    this.isBound = true;
                    this.bindingContext = bindingContext = bindingContext || this.bindingContext;
                    this.overrideContext = overrideContext = overrideContext || this.overrideContext;
                    children = this.children;
                    for (i = 0, ii = children.length; i < ii; ++i) {
                        children[i].bind(bindingContext, overrideContext, true);
                    }
                };
                ViewSlot.prototype.unbind = function () {
                    if (this.isBound) {
                        var i = void 0;
                        var ii = void 0;
                        var children = this.children;
                        this.isBound = false;
                        this.bindingContext = null;
                        this.overrideContext = null;
                        for (i = 0, ii = children.length; i < ii; ++i) {
                            children[i].unbind();
                        }
                    }
                };
                ViewSlot.prototype.add = function (view) {
                    if (this.anchorIsContainer) {
                        view.appendNodesTo(this.anchor);
                    }
                    else {
                        view.insertNodesBefore(this.anchor);
                    }
                    this.children.push(view);
                    if (this.isAttached) {
                        view.attached();
                        return this.animateView(view, 'enter');
                    }
                };
                ViewSlot.prototype.insert = function (index, view) {
                    var children = this.children;
                    var length = children.length;
                    if ((index === 0 && length === 0) || index >= length) {
                        return this.add(view);
                    }
                    view.insertNodesBefore(children[index].firstChild);
                    children.splice(index, 0, view);
                    if (this.isAttached) {
                        view.attached();
                        return this.animateView(view, 'enter');
                    }
                };
                ViewSlot.prototype.move = function (sourceIndex, targetIndex) {
                    if (sourceIndex === targetIndex) {
                        return;
                    }
                    var children = this.children;
                    var view = children[sourceIndex];
                    view.removeNodes();
                    view.insertNodesBefore(children[targetIndex].firstChild);
                    children.splice(sourceIndex, 1);
                    children.splice(targetIndex, 0, view);
                };
                ViewSlot.prototype.remove = function (view, returnToCache, skipAnimation) {
                    return this.removeAt(this.children.indexOf(view), returnToCache, skipAnimation);
                };
                ViewSlot.prototype.removeMany = function (viewsToRemove, returnToCache, skipAnimation) {
                    var _this = this;
                    var children = this.children;
                    var ii = viewsToRemove.length;
                    var i;
                    var rmPromises = [];
                    viewsToRemove.forEach(function (child) {
                        if (skipAnimation) {
                            child.removeNodes();
                            return;
                        }
                        var animation = _this.animateView(child, 'leave');
                        if (animation) {
                            rmPromises.push(animation.then(function () { return child.removeNodes(); }));
                        }
                        else {
                            child.removeNodes();
                        }
                    });
                    var removeAction = function () {
                        if (_this.isAttached) {
                            for (i = 0; i < ii; ++i) {
                                viewsToRemove[i].detached();
                            }
                        }
                        if (returnToCache) {
                            for (i = 0; i < ii; ++i) {
                                viewsToRemove[i].returnToCache();
                            }
                        }
                        for (i = 0; i < ii; ++i) {
                            var index = children.indexOf(viewsToRemove[i]);
                            if (index >= 0) {
                                children.splice(index, 1);
                            }
                        }
                    };
                    if (rmPromises.length > 0) {
                        return Promise.all(rmPromises).then(function () { return removeAction(); });
                    }
                    return removeAction();
                };
                ViewSlot.prototype.removeAt = function (index, returnToCache, skipAnimation) {
                    var _this = this;
                    var view = this.children[index];
                    var removeAction = function () {
                        index = _this.children.indexOf(view);
                        view.removeNodes();
                        _this.children.splice(index, 1);
                        if (_this.isAttached) {
                            view.detached();
                        }
                        if (returnToCache) {
                            view.returnToCache();
                        }
                        return view;
                    };
                    if (!skipAnimation) {
                        var animation = this.animateView(view, 'leave');
                        if (animation) {
                            return animation.then(function () { return removeAction(); });
                        }
                    }
                    return removeAction();
                };
                ViewSlot.prototype.removeAll = function (returnToCache, skipAnimation) {
                    var _this = this;
                    var children = this.children;
                    var ii = children.length;
                    var i;
                    var rmPromises = [];
                    children.forEach(function (child) {
                        if (skipAnimation) {
                            child.removeNodes();
                            return;
                        }
                        var animation = _this.animateView(child, 'leave');
                        if (animation) {
                            rmPromises.push(animation.then(function () { return child.removeNodes(); }));
                        }
                        else {
                            child.removeNodes();
                        }
                    });
                    var removeAction = function () {
                        if (_this.isAttached) {
                            for (i = 0; i < ii; ++i) {
                                children[i].detached();
                            }
                        }
                        if (returnToCache) {
                            for (i = 0; i < ii; ++i) {
                                var child = children[i];
                                if (child) {
                                    child.returnToCache();
                                }
                            }
                        }
                        _this.children = [];
                    };
                    if (rmPromises.length > 0) {
                        return Promise.all(rmPromises).then(function () { return removeAction(); });
                    }
                    return removeAction();
                };
                ViewSlot.prototype.attached = function () {
                    var i;
                    var ii;
                    var children;
                    var child;
                    if (this.isAttached) {
                        return;
                    }
                    this.isAttached = true;
                    children = this.children;
                    for (i = 0, ii = children.length; i < ii; ++i) {
                        child = children[i];
                        child.attached();
                        this.animateView(child, 'enter');
                    }
                };
                ViewSlot.prototype.detached = function () {
                    var i;
                    var ii;
                    var children;
                    if (this.isAttached) {
                        this.isAttached = false;
                        children = this.children;
                        for (i = 0, ii = children.length; i < ii; ++i) {
                            children[i].detached();
                        }
                    }
                };
                ViewSlot.prototype.projectTo = function (slots) {
                    var _this = this;
                    this.projectToSlots = slots;
                    this.add = this._projectionAdd;
                    this.insert = this._projectionInsert;
                    this.move = this._projectionMove;
                    this.remove = this._projectionRemove;
                    this.removeAt = this._projectionRemoveAt;
                    this.removeMany = this._projectionRemoveMany;
                    this.removeAll = this._projectionRemoveAll;
                    this.children.forEach(function (view) { return ShadowDOM.distributeView(view, slots, _this); });
                };
                ViewSlot.prototype._projectionAdd = function (view) {
                    ShadowDOM.distributeView(view, this.projectToSlots, this);
                    this.children.push(view);
                    if (this.isAttached) {
                        view.attached();
                    }
                };
                ViewSlot.prototype._projectionInsert = function (index, view) {
                    if ((index === 0 && !this.children.length) || index >= this.children.length) {
                        this.add(view);
                    }
                    else {
                        ShadowDOM.distributeView(view, this.projectToSlots, this, index);
                        this.children.splice(index, 0, view);
                        if (this.isAttached) {
                            view.attached();
                        }
                    }
                };
                ViewSlot.prototype._projectionMove = function (sourceIndex, targetIndex) {
                    if (sourceIndex === targetIndex) {
                        return;
                    }
                    var children = this.children;
                    var view = children[sourceIndex];
                    ShadowDOM.undistributeView(view, this.projectToSlots, this);
                    ShadowDOM.distributeView(view, this.projectToSlots, this, targetIndex);
                    children.splice(sourceIndex, 1);
                    children.splice(targetIndex, 0, view);
                };
                ViewSlot.prototype._projectionRemove = function (view, returnToCache) {
                    ShadowDOM.undistributeView(view, this.projectToSlots, this);
                    this.children.splice(this.children.indexOf(view), 1);
                    if (this.isAttached) {
                        view.detached();
                    }
                    if (returnToCache) {
                        view.returnToCache();
                    }
                };
                ViewSlot.prototype._projectionRemoveAt = function (index, returnToCache) {
                    var view = this.children[index];
                    ShadowDOM.undistributeView(view, this.projectToSlots, this);
                    this.children.splice(index, 1);
                    if (this.isAttached) {
                        view.detached();
                    }
                    if (returnToCache) {
                        view.returnToCache();
                    }
                };
                ViewSlot.prototype._projectionRemoveMany = function (viewsToRemove, returnToCache) {
                    var _this = this;
                    viewsToRemove.forEach(function (view) { return _this.remove(view, returnToCache); });
                };
                ViewSlot.prototype._projectionRemoveAll = function (returnToCache) {
                    ShadowDOM.undistributeAll(this.projectToSlots, this);
                    var children = this.children;
                    var ii = children.length;
                    for (var i = 0; i < ii; ++i) {
                        if (returnToCache) {
                            children[i].returnToCache();
                        }
                        else if (this.isAttached) {
                            children[i].detached();
                        }
                    }
                    this.children = [];
                };
                return ViewSlot;
            }()));

            var $resolver = resolver;
            var ProviderResolver = (function () {
                function ProviderResolver() {
                }
                ProviderResolver.prototype.get = function (container, key) {
                    var id = key.__providerId__;
                    return id in container ? container[id] : (container[id] = container.invoke(key));
                };
                ProviderResolver = __decorate([
                    $resolver
                ], ProviderResolver);
                return ProviderResolver;
            }());
            var providerResolverInstance = new ProviderResolver();
            function elementContainerGet(key) {
                if (key === DOM.Element) {
                    return this.element;
                }
                if (key === BoundViewFactory) {
                    if (this.boundViewFactory) {
                        return this.boundViewFactory;
                    }
                    var factory = this.instruction.viewFactory;
                    var partReplacements = this.partReplacements;
                    if (partReplacements) {
                        factory = partReplacements[factory.part] || factory;
                    }
                    this.boundViewFactory = new BoundViewFactory(this, factory, partReplacements);
                    return this.boundViewFactory;
                }
                if (key === ViewSlot) {
                    if (this.viewSlot === undefined) {
                        this.viewSlot = new ViewSlot(this.element, this.instruction.anchorIsContainer);
                        this.element.isContentProjectionSource = this.instruction.lifting;
                        this.children.push(this.viewSlot);
                    }
                    return this.viewSlot;
                }
                if (key === ElementEvents) {
                    return this.elementEvents || (this.elementEvents = new ElementEvents(this.element));
                }
                if (key === CompositionTransaction) {
                    return this.compositionTransaction || (this.compositionTransaction = this.parent.get(key));
                }
                if (key === ViewResources) {
                    return this.viewResources;
                }
                if (key === TargetInstruction) {
                    return this.instruction;
                }
                return this.superGet(key);
            }
            function createElementContainer(parent, element, instruction, children, partReplacements, resources) {
                var container = parent.createChild();
                var providers;
                var i;
                container.element = element;
                container.instruction = instruction;
                container.children = children;
                container.viewResources = resources;
                container.partReplacements = partReplacements;
                providers = instruction.providers;
                i = providers.length;
                while (i--) {
                    container._resolvers.set(providers[i], providerResolverInstance);
                }
                container.superGet = container.get;
                container.get = elementContainerGet;
                return container;
            }
            function hasAttribute(name) {
                return this._element.hasAttribute(name);
            }
            function getAttribute(name) {
                return this._element.getAttribute(name);
            }
            function setAttribute(name, value) {
                this._element.setAttribute(name, value);
            }
            function makeElementIntoAnchor(element, elementInstruction) {
                var anchor = DOM.createComment('anchor');
                if (elementInstruction) {
                    var firstChild = element.firstChild;
                    if (firstChild && firstChild.tagName === 'AU-CONTENT') {
                        anchor.contentElement = firstChild;
                    }
                    anchor._element = element;
                    anchor.hasAttribute = hasAttribute;
                    anchor.getAttribute = getAttribute;
                    anchor.setAttribute = setAttribute;
                }
                DOM.replaceNode(anchor, element);
                return anchor;
            }
            function applyInstructions(containers, element, instruction, controllers, bindings, children, shadowSlots, partReplacements, resources) {
                var behaviorInstructions = instruction.behaviorInstructions;
                var expressions = instruction.expressions;
                var elementContainer;
                var i;
                var ii;
                var current;
                var instance;
                if (instruction.contentExpression) {
                    bindings.push(instruction.contentExpression.createBinding(element.nextSibling));
                    element.nextSibling.auInterpolationTarget = true;
                    element.parentNode.removeChild(element);
                    return;
                }
                if (instruction.shadowSlot) {
                    var commentAnchor = DOM.createComment('slot');
                    var slot = void 0;
                    if (instruction.slotDestination) {
                        slot = new PassThroughSlot(commentAnchor, instruction.slotName, instruction.slotDestination, instruction.slotFallbackFactory);
                    }
                    else {
                        slot = new ShadowSlot(commentAnchor, instruction.slotName, instruction.slotFallbackFactory);
                    }
                    DOM.replaceNode(commentAnchor, element);
                    shadowSlots[instruction.slotName] = slot;
                    controllers.push(slot);
                    return;
                }
                if (instruction.letElement) {
                    for (i = 0, ii = expressions.length; i < ii; ++i) {
                        bindings.push(expressions[i].createBinding());
                    }
                    element.parentNode.removeChild(element);
                    return;
                }
                if (behaviorInstructions.length) {
                    if (!instruction.anchorIsContainer) {
                        element = makeElementIntoAnchor(element, instruction.elementInstruction);
                    }
                    containers[instruction.injectorId] = elementContainer =
                        createElementContainer(containers[instruction.parentInjectorId], element, instruction, children, partReplacements, resources);
                    for (i = 0, ii = behaviorInstructions.length; i < ii; ++i) {
                        current = behaviorInstructions[i];
                        instance = current.type.create(elementContainer, current, element, bindings);
                        controllers.push(instance);
                    }
                }
                for (i = 0, ii = expressions.length; i < ii; ++i) {
                    bindings.push(expressions[i].createBinding(element));
                }
            }
            function styleStringToObject(style, target) {
                var attributes = style.split(';');
                var firstIndexOfColon;
                var i;
                var current;
                var key;
                var value;
                target = target || {};
                for (i = 0; i < attributes.length; i++) {
                    current = attributes[i];
                    firstIndexOfColon = current.indexOf(':');
                    key = current.substring(0, firstIndexOfColon).trim();
                    value = current.substring(firstIndexOfColon + 1).trim();
                    target[key] = value;
                }
                return target;
            }
            function styleObjectToString(obj) {
                var result = '';
                for (var key in obj) {
                    result += key + ':' + obj[key] + ';';
                }
                return result;
            }
            function applySurrogateInstruction(container, element, instruction, controllers, bindings, children) {
                var behaviorInstructions = instruction.behaviorInstructions;
                var expressions = instruction.expressions;
                var providers = instruction.providers;
                var values = instruction.values;
                var i;
                var ii;
                var current;
                var instance;
                var currentAttributeValue;
                i = providers.length;
                while (i--) {
                    container._resolvers.set(providers[i], providerResolverInstance);
                }
                for (var key in values) {
                    currentAttributeValue = element.getAttribute(key);
                    if (currentAttributeValue) {
                        if (key === 'class') {
                            element.setAttribute('class', currentAttributeValue + ' ' + values[key]);
                        }
                        else if (key === 'style') {
                            var styleObject = styleStringToObject(values[key]);
                            styleStringToObject(currentAttributeValue, styleObject);
                            element.setAttribute('style', styleObjectToString(styleObject));
                        }
                    }
                    else {
                        element.setAttribute(key, values[key]);
                    }
                }
                if (behaviorInstructions.length) {
                    for (i = 0, ii = behaviorInstructions.length; i < ii; ++i) {
                        current = behaviorInstructions[i];
                        instance = current.type.create(container, current, element, bindings);
                        if (instance.contentView) {
                            children.push(instance.contentView);
                        }
                        controllers.push(instance);
                    }
                }
                for (i = 0, ii = expressions.length; i < ii; ++i) {
                    bindings.push(expressions[i].createBinding(element));
                }
            }
            var BoundViewFactory = exports('BoundViewFactory', (function () {
                function BoundViewFactory(parentContainer, viewFactory, partReplacements) {
                    this.parentContainer = parentContainer;
                    this.viewFactory = viewFactory;
                    this.factoryCreateInstruction = { partReplacements: partReplacements };
                }
                BoundViewFactory.prototype.create = function () {
                    var view = this.viewFactory.create(this.parentContainer.createChild(), this.factoryCreateInstruction);
                    view._isUserControlled = true;
                    return view;
                };
                Object.defineProperty(BoundViewFactory.prototype, "isCaching", {
                    get: function () {
                        return this.viewFactory.isCaching;
                    },
                    enumerable: false,
                    configurable: true
                });
                BoundViewFactory.prototype.setCacheSize = function (size, doNotOverrideIfAlreadySet) {
                    this.viewFactory.setCacheSize(size, doNotOverrideIfAlreadySet);
                };
                BoundViewFactory.prototype.getCachedView = function () {
                    return this.viewFactory.getCachedView();
                };
                BoundViewFactory.prototype.returnViewToCache = function (view) {
                    this.viewFactory.returnViewToCache(view);
                };
                return BoundViewFactory;
            }()));
            var ViewFactory = exports('ViewFactory', (function () {
                function ViewFactory(template, instructions, resources) {
                    this.isCaching = false;
                    this.template = template;
                    this.instructions = instructions;
                    this.resources = resources;
                    this.cacheSize = -1;
                    this.cache = null;
                }
                ViewFactory.prototype.setCacheSize = function (size, doNotOverrideIfAlreadySet) {
                    if (size) {
                        if (size === '*') {
                            size = Number.MAX_VALUE;
                        }
                        else if (typeof size === 'string') {
                            size = parseInt(size, 10);
                        }
                    }
                    if (this.cacheSize === -1 || !doNotOverrideIfAlreadySet) {
                        this.cacheSize = Number(size);
                    }
                    if (this.cacheSize > 0) {
                        this.cache = [];
                    }
                    else {
                        this.cache = null;
                    }
                    this.isCaching = this.cacheSize > 0;
                };
                ViewFactory.prototype.getCachedView = function () {
                    return this.cache !== null ? (this.cache.pop() || null) : null;
                };
                ViewFactory.prototype.returnViewToCache = function (view) {
                    if (view.isAttached) {
                        view.detached();
                    }
                    if (view.isBound) {
                        view.unbind();
                    }
                    if (this.cache !== null && this.cache.length < this.cacheSize) {
                        view.fromCache = true;
                        this.cache.push(view);
                    }
                };
                ViewFactory.prototype.create = function (container, createInstruction, element) {
                    createInstruction = createInstruction || BehaviorInstruction.normal;
                    var cachedView = this.getCachedView();
                    if (cachedView !== null) {
                        return cachedView;
                    }
                    var fragment = createInstruction.enhance ? this.template : this.template.cloneNode(true);
                    var instructables = fragment.querySelectorAll('.au-target');
                    var instructions = this.instructions;
                    var resources = this.resources;
                    var controllers = [];
                    var bindings = [];
                    var children = [];
                    var shadowSlots = Object.create(null);
                    var containers = { root: container };
                    var partReplacements = createInstruction.partReplacements;
                    var i;
                    var ii;
                    var view;
                    var instructable;
                    var instruction;
                    this.resources._invokeHook('beforeCreate', this, container, fragment, createInstruction);
                    if (element && this.surrogateInstruction !== null) {
                        applySurrogateInstruction(container, element, this.surrogateInstruction, controllers, bindings, children);
                    }
                    if (createInstruction.enhance && fragment.hasAttribute('au-target-id')) {
                        instructable = fragment;
                        instruction = instructions[instructable.getAttribute('au-target-id')];
                        applyInstructions(containers, instructable, instruction, controllers, bindings, children, shadowSlots, partReplacements, resources);
                    }
                    for (i = 0, ii = instructables.length; i < ii; ++i) {
                        instructable = instructables[i];
                        instruction = instructions[instructable.getAttribute('au-target-id')];
                        applyInstructions(containers, instructable, instruction, controllers, bindings, children, shadowSlots, partReplacements, resources);
                    }
                    view = new View(container, this, fragment, controllers, bindings, children, shadowSlots);
                    if (!createInstruction.initiatedByBehavior) {
                        view.created();
                    }
                    this.resources._invokeHook('afterCreate', view);
                    return view;
                };
                return ViewFactory;
            }()));

            var nextInjectorId = 0;
            function getNextInjectorId() {
                return ++nextInjectorId;
            }
            var lastAUTargetID = 0;
            function getNextAUTargetID() {
                return (++lastAUTargetID).toString();
            }
            function makeIntoInstructionTarget(element) {
                var value = element.getAttribute('class');
                var auTargetID = getNextAUTargetID();
                element.setAttribute('class', (value ? value + ' au-target' : 'au-target'));
                element.setAttribute('au-target-id', auTargetID);
                return auTargetID;
            }
            function makeShadowSlot(compiler, resources, node, instructions, parentInjectorId) {
                var auShadowSlot = DOM.createElement('au-shadow-slot');
                DOM.replaceNode(auShadowSlot, node);
                var auTargetID = makeIntoInstructionTarget(auShadowSlot);
                var instruction = TargetInstruction.shadowSlot(parentInjectorId);
                instruction.slotName = node.getAttribute('name') || ShadowDOM.defaultSlotKey;
                instruction.slotDestination = node.getAttribute('slot');
                if (node.innerHTML.trim()) {
                    var fragment = DOM.createDocumentFragment();
                    var child = void 0;
                    while (child = node.firstChild) {
                        fragment.appendChild(child);
                    }
                    instruction.slotFallbackFactory = compiler.compile(fragment, resources);
                }
                instructions[auTargetID] = instruction;
                return auShadowSlot;
            }
            var defaultLetHandler = BindingLanguage.prototype.createLetExpressions;
            var ViewCompiler = exports('ViewCompiler', (function () {
                function ViewCompiler(bindingLanguage, resources) {
                    this.bindingLanguage = bindingLanguage;
                    this.resources = resources;
                }
                ViewCompiler.inject = function () {
                    return [BindingLanguage, ViewResources];
                };
                ViewCompiler.prototype.compile = function (source, resources, compileInstruction) {
                    resources = resources || this.resources;
                    compileInstruction = compileInstruction || ViewCompileInstruction.normal;
                    source = typeof source === 'string' ? DOM.createTemplateFromMarkup(source) : source;
                    var content;
                    var part;
                    var cacheSize;
                    if (source.content) {
                        part = source.getAttribute('part');
                        cacheSize = source.getAttribute('view-cache');
                        content = DOM.adoptNode(source.content);
                    }
                    else {
                        content = source;
                    }
                    compileInstruction.targetShadowDOM = compileInstruction.targetShadowDOM && FEATURE.shadowDOM;
                    resources._invokeHook('beforeCompile', content, resources, compileInstruction);
                    var instructions = {};
                    this._compileNode(content, resources, instructions, source, 'root', !compileInstruction.targetShadowDOM);
                    var firstChild = content.firstChild;
                    if (firstChild && firstChild.nodeType === 1) {
                        var targetId = firstChild.getAttribute('au-target-id');
                        if (targetId) {
                            var ins = instructions[targetId];
                            if (ins.shadowSlot || ins.lifting || (ins.elementInstruction && !ins.elementInstruction.anchorIsContainer)) {
                                content.insertBefore(DOM.createComment('view'), firstChild);
                            }
                        }
                    }
                    var factory = new ViewFactory(content, instructions, resources);
                    factory.surrogateInstruction = compileInstruction.compileSurrogate ? this._compileSurrogate(source, resources) : null;
                    factory.part = part;
                    if (cacheSize) {
                        factory.setCacheSize(cacheSize);
                    }
                    resources._invokeHook('afterCompile', factory);
                    return factory;
                };
                ViewCompiler.prototype._compileNode = function (node, resources, instructions, parentNode, parentInjectorId, targetLightDOM) {
                    switch (node.nodeType) {
                        case 1:
                            return this._compileElement(node, resources, instructions, parentNode, parentInjectorId, targetLightDOM);
                        case 3:
                            var expression = resources.getBindingLanguage(this.bindingLanguage).inspectTextContent(resources, node.wholeText);
                            if (expression) {
                                var marker = DOM.createElement('au-marker');
                                var auTargetID = makeIntoInstructionTarget(marker);
                                (node.parentNode || parentNode).insertBefore(marker, node);
                                node.textContent = ' ';
                                instructions[auTargetID] = TargetInstruction.contentExpression(expression);
                                while (node.nextSibling && node.nextSibling.nodeType === 3) {
                                    (node.parentNode || parentNode).removeChild(node.nextSibling);
                                }
                            }
                            else {
                                while (node.nextSibling && node.nextSibling.nodeType === 3) {
                                    node = node.nextSibling;
                                }
                            }
                            return node.nextSibling;
                        case 11:
                            var currentChild = node.firstChild;
                            while (currentChild) {
                                currentChild = this._compileNode(currentChild, resources, instructions, node, parentInjectorId, targetLightDOM);
                            }
                            break;
                    }
                    return node.nextSibling;
                };
                ViewCompiler.prototype._compileSurrogate = function (node, resources) {
                    var tagName = node.tagName.toLowerCase();
                    var attributes = node.attributes;
                    var bindingLanguage = resources.getBindingLanguage(this.bindingLanguage);
                    var knownAttribute;
                    var property;
                    var instruction;
                    var i;
                    var ii;
                    var attr;
                    var attrName;
                    var attrValue;
                    var info;
                    var type;
                    var expressions = [];
                    var expression;
                    var behaviorInstructions = [];
                    var values = {};
                    var hasValues = false;
                    var providers = [];
                    for (i = 0, ii = attributes.length; i < ii; ++i) {
                        attr = attributes[i];
                        attrName = attr.name;
                        attrValue = attr.value;
                        info = bindingLanguage.inspectAttribute(resources, tagName, attrName, attrValue);
                        type = resources.getAttribute(info.attrName);
                        if (type) {
                            knownAttribute = resources.mapAttribute(info.attrName);
                            if (knownAttribute) {
                                property = type.attributes[knownAttribute];
                                if (property) {
                                    info.defaultBindingMode = property.defaultBindingMode;
                                    if (!info.command && !info.expression) {
                                        info.command = property.hasOptions ? 'options' : null;
                                    }
                                    if (info.command && (info.command !== 'options') && type.primaryProperty) {
                                        var primaryProperty = type.primaryProperty;
                                        attrName = info.attrName = primaryProperty.attribute;
                                        info.defaultBindingMode = primaryProperty.defaultBindingMode;
                                    }
                                }
                            }
                        }
                        instruction = bindingLanguage.createAttributeInstruction(resources, node, info, undefined, type);
                        if (instruction) {
                            if (instruction.alteredAttr) {
                                type = resources.getAttribute(instruction.attrName);
                            }
                            if (instruction.discrete) {
                                expressions.push(instruction);
                            }
                            else {
                                if (type) {
                                    instruction.type = type;
                                    this._configureProperties(instruction, resources);
                                    if (type.liftsContent) {
                                        throw new Error('You cannot place a template controller on a surrogate element.');
                                    }
                                    else {
                                        behaviorInstructions.push(instruction);
                                    }
                                }
                                else {
                                    expressions.push(instruction.attributes[instruction.attrName]);
                                }
                            }
                        }
                        else {
                            if (type) {
                                instruction = BehaviorInstruction.attribute(attrName, type);
                                instruction.attributes[resources.mapAttribute(attrName)] = attrValue;
                                if (type.liftsContent) {
                                    throw new Error('You cannot place a template controller on a surrogate element.');
                                }
                                else {
                                    behaviorInstructions.push(instruction);
                                }
                            }
                            else if (attrName !== 'id' && attrName !== 'part' && attrName !== 'replace-part') {
                                hasValues = true;
                                values[attrName] = attrValue;
                            }
                        }
                    }
                    if (expressions.length || behaviorInstructions.length || hasValues) {
                        for (i = 0, ii = behaviorInstructions.length; i < ii; ++i) {
                            instruction = behaviorInstructions[i];
                            instruction.type.compile(this, resources, node, instruction);
                            providers.push(instruction.type.target);
                        }
                        for (i = 0, ii = expressions.length; i < ii; ++i) {
                            expression = expressions[i];
                            if (expression.attrToRemove !== undefined) {
                                node.removeAttribute(expression.attrToRemove);
                            }
                        }
                        return TargetInstruction.surrogate(providers, behaviorInstructions, expressions, values);
                    }
                    return null;
                };
                ViewCompiler.prototype._compileElement = function (node, resources, instructions, parentNode, parentInjectorId, targetLightDOM) {
                    var tagName = node.tagName.toLowerCase();
                    var attributes = node.attributes;
                    var expressions = [];
                    var expression;
                    var behaviorInstructions = [];
                    var providers = [];
                    var bindingLanguage = resources.getBindingLanguage(this.bindingLanguage);
                    var liftingInstruction;
                    var viewFactory;
                    var type;
                    var elementInstruction;
                    var elementProperty;
                    var i;
                    var ii;
                    var attr;
                    var attrName;
                    var attrValue;
                    var originalAttrName;
                    var instruction;
                    var info;
                    var property;
                    var knownAttribute;
                    var auTargetID;
                    var injectorId;
                    if (tagName === 'slot') {
                        if (targetLightDOM) {
                            node = makeShadowSlot(this, resources, node, instructions, parentInjectorId);
                        }
                        return node.nextSibling;
                    }
                    else if (tagName === 'template') {
                        if (!('content' in node)) {
                            throw new Error('You cannot place a template element within ' + node.namespaceURI + ' namespace');
                        }
                        viewFactory = this.compile(node, resources);
                        viewFactory.part = node.getAttribute('part');
                    }
                    else {
                        type = resources.getElement(node.getAttribute('as-element') || tagName);
                        if (tagName === 'let' && !type && bindingLanguage.createLetExpressions !== defaultLetHandler) {
                            expressions = bindingLanguage.createLetExpressions(resources, node);
                            auTargetID = makeIntoInstructionTarget(node);
                            instructions[auTargetID] = TargetInstruction.letElement(expressions);
                            return node.nextSibling;
                        }
                        if (type) {
                            elementInstruction = BehaviorInstruction.element(node, type);
                            type.processAttributes(this, resources, node, attributes, elementInstruction);
                            behaviorInstructions.push(elementInstruction);
                        }
                    }
                    for (i = 0, ii = attributes.length; i < ii; ++i) {
                        attr = attributes[i];
                        originalAttrName = attrName = attr.name;
                        attrValue = attr.value;
                        info = bindingLanguage.inspectAttribute(resources, tagName, attrName, attrValue);
                        if (targetLightDOM && info.attrName === 'slot') {
                            info.attrName = attrName = 'au-slot';
                        }
                        type = resources.getAttribute(info.attrName);
                        elementProperty = null;
                        if (type) {
                            knownAttribute = resources.mapAttribute(info.attrName);
                            if (knownAttribute) {
                                property = type.attributes[knownAttribute];
                                if (property) {
                                    info.defaultBindingMode = property.defaultBindingMode;
                                    if (!info.command && !info.expression) {
                                        info.command = property.hasOptions ? 'options' : null;
                                    }
                                    if (info.command && (info.command !== 'options') && type.primaryProperty) {
                                        var primaryProperty = type.primaryProperty;
                                        attrName = info.attrName = primaryProperty.attribute;
                                        info.defaultBindingMode = primaryProperty.defaultBindingMode;
                                    }
                                }
                            }
                        }
                        else if (elementInstruction) {
                            elementProperty = elementInstruction.type.attributes[info.attrName];
                            if (elementProperty) {
                                info.defaultBindingMode = elementProperty.defaultBindingMode;
                            }
                        }
                        if (elementProperty) {
                            instruction = bindingLanguage.createAttributeInstruction(resources, node, info, elementInstruction);
                        }
                        else {
                            instruction = bindingLanguage.createAttributeInstruction(resources, node, info, undefined, type);
                        }
                        if (instruction) {
                            if (instruction.alteredAttr) {
                                type = resources.getAttribute(instruction.attrName);
                            }
                            if (instruction.discrete) {
                                expressions.push(instruction);
                            }
                            else {
                                if (type) {
                                    instruction.type = type;
                                    this._configureProperties(instruction, resources);
                                    if (type.liftsContent) {
                                        instruction.originalAttrName = originalAttrName;
                                        liftingInstruction = instruction;
                                        break;
                                    }
                                    else {
                                        behaviorInstructions.push(instruction);
                                    }
                                }
                                else if (elementProperty) {
                                    elementInstruction.attributes[info.attrName].targetProperty = elementProperty.name;
                                }
                                else {
                                    expressions.push(instruction.attributes[instruction.attrName]);
                                }
                            }
                        }
                        else {
                            if (type) {
                                instruction = BehaviorInstruction.attribute(attrName, type);
                                instruction.attributes[resources.mapAttribute(attrName)] = attrValue;
                                if (type.liftsContent) {
                                    instruction.originalAttrName = originalAttrName;
                                    liftingInstruction = instruction;
                                    break;
                                }
                                else {
                                    behaviorInstructions.push(instruction);
                                }
                            }
                            else if (elementProperty) {
                                elementInstruction.attributes[attrName] = attrValue;
                            }
                        }
                    }
                    if (liftingInstruction) {
                        liftingInstruction.viewFactory = viewFactory;
                        node = liftingInstruction.type.compile(this, resources, node, liftingInstruction, parentNode);
                        auTargetID = makeIntoInstructionTarget(node);
                        instructions[auTargetID] = TargetInstruction.lifting(parentInjectorId, liftingInstruction);
                    }
                    else {
                        var skipContentProcessing = false;
                        if (expressions.length || behaviorInstructions.length) {
                            injectorId = behaviorInstructions.length ? getNextInjectorId() : false;
                            for (i = 0, ii = behaviorInstructions.length; i < ii; ++i) {
                                instruction = behaviorInstructions[i];
                                instruction.type.compile(this, resources, node, instruction, parentNode);
                                providers.push(instruction.type.target);
                                skipContentProcessing = skipContentProcessing || instruction.skipContentProcessing;
                            }
                            for (i = 0, ii = expressions.length; i < ii; ++i) {
                                expression = expressions[i];
                                if (expression.attrToRemove !== undefined) {
                                    node.removeAttribute(expression.attrToRemove);
                                }
                            }
                            auTargetID = makeIntoInstructionTarget(node);
                            instructions[auTargetID] = TargetInstruction.normal(injectorId, parentInjectorId, providers, behaviorInstructions, expressions, elementInstruction);
                        }
                        if (skipContentProcessing) {
                            return node.nextSibling;
                        }
                        var currentChild = node.firstChild;
                        while (currentChild) {
                            currentChild = this._compileNode(currentChild, resources, instructions, node, injectorId || parentInjectorId, targetLightDOM);
                        }
                    }
                    return node.nextSibling;
                };
                ViewCompiler.prototype._configureProperties = function (instruction, resources) {
                    var type = instruction.type;
                    var attrName = instruction.attrName;
                    var attributes = instruction.attributes;
                    var property;
                    var key;
                    var value;
                    var knownAttribute = resources.mapAttribute(attrName);
                    if (knownAttribute && attrName in attributes && knownAttribute !== attrName) {
                        attributes[knownAttribute] = attributes[attrName];
                        delete attributes[attrName];
                    }
                    for (key in attributes) {
                        value = attributes[key];
                        if (value !== null && typeof value === 'object') {
                            property = type.attributes[key];
                            if (property !== undefined) {
                                value.targetProperty = property.name;
                            }
                            else {
                                value.targetProperty = key;
                            }
                        }
                    }
                };
                return ViewCompiler;
            }()));

            var ViewEngineHooksResource = exports('ViewEngineHooksResource', (function () {
                function ViewEngineHooksResource() {
                }
                ViewEngineHooksResource.prototype.initialize = function (container, target) {
                    this.instance = container.get(target);
                };
                ViewEngineHooksResource.prototype.register = function (registry, name) {
                    registry.registerViewEngineHooks(this.instance);
                };
                ViewEngineHooksResource.prototype.load = function (container, target) { };
                ViewEngineHooksResource.convention = function (name) {
                    if (name.endsWith('ViewEngineHooks')) {
                        return new ViewEngineHooksResource();
                    }
                };
                return ViewEngineHooksResource;
            }()));
            function viewEngineHooks(target) {
                var deco = function (t) {
                    metadata.define(metadata.resource, new ViewEngineHooksResource(), t);
                };
                return target ? deco(target) : deco;
            }

            var ResourceModule = exports('ResourceModule', (function () {
                function ResourceModule(moduleId) {
                    this.id = moduleId;
                    this.moduleInstance = null;
                    this.mainResource = null;
                    this.resources = null;
                    this.viewStrategy = null;
                    this.isInitialized = false;
                    this.onLoaded = null;
                    this.loadContext = null;
                }
                ResourceModule.prototype.initialize = function (container) {
                    var current = this.mainResource;
                    var resources = this.resources;
                    var vs = this.viewStrategy;
                    if (this.isInitialized) {
                        return;
                    }
                    this.isInitialized = true;
                    if (current !== undefined) {
                        current.metadata.viewStrategy = vs;
                        current.initialize(container);
                    }
                    for (var i = 0, ii = resources.length; i < ii; ++i) {
                        current = resources[i];
                        current.metadata.viewStrategy = vs;
                        current.initialize(container);
                    }
                };
                ResourceModule.prototype.register = function (registry, name) {
                    var main = this.mainResource;
                    var resources = this.resources;
                    if (main !== undefined) {
                        main.register(registry, name);
                        name = null;
                    }
                    for (var i = 0, ii = resources.length; i < ii; ++i) {
                        resources[i].register(registry, name);
                        name = null;
                    }
                };
                ResourceModule.prototype.load = function (container, loadContext) {
                    if (this.onLoaded !== null) {
                        return this.loadContext === loadContext ? Promise.resolve() : this.onLoaded;
                    }
                    var main = this.mainResource;
                    var resources = this.resources;
                    var loads;
                    if (main !== undefined) {
                        loads = new Array(resources.length + 1);
                        loads[0] = main.load(container, loadContext);
                        for (var i = 0, ii = resources.length; i < ii; ++i) {
                            loads[i + 1] = resources[i].load(container, loadContext);
                        }
                    }
                    else {
                        loads = new Array(resources.length);
                        for (var i = 0, ii = resources.length; i < ii; ++i) {
                            loads[i] = resources[i].load(container, loadContext);
                        }
                    }
                    this.loadContext = loadContext;
                    this.onLoaded = Promise.all(loads);
                    return this.onLoaded;
                };
                return ResourceModule;
            }()));
            var ResourceDescription = exports('ResourceDescription', (function () {
                function ResourceDescription(key, exportedValue, resourceTypeMeta) {
                    if (!resourceTypeMeta) {
                        resourceTypeMeta = metadata.get(metadata.resource, exportedValue);
                        if (!resourceTypeMeta) {
                            resourceTypeMeta = new HtmlBehaviorResource();
                            resourceTypeMeta.elementName = _hyphenate(key);
                            metadata.define(metadata.resource, resourceTypeMeta, exportedValue);
                        }
                    }
                    if (resourceTypeMeta instanceof HtmlBehaviorResource) {
                        if (resourceTypeMeta.elementName === undefined) {
                            resourceTypeMeta.elementName = _hyphenate(key);
                        }
                        else if (resourceTypeMeta.attributeName === undefined) {
                            resourceTypeMeta.attributeName = _hyphenate(key);
                        }
                        else if (resourceTypeMeta.attributeName === null && resourceTypeMeta.elementName === null) {
                            HtmlBehaviorResource.convention(key, resourceTypeMeta);
                        }
                    }
                    else if (!resourceTypeMeta.name) {
                        resourceTypeMeta.name = _hyphenate(key);
                    }
                    this.metadata = resourceTypeMeta;
                    this.value = exportedValue;
                }
                ResourceDescription.prototype.initialize = function (container) {
                    this.metadata.initialize(container, this.value);
                };
                ResourceDescription.prototype.register = function (registry, name) {
                    this.metadata.register(registry, name);
                };
                ResourceDescription.prototype.load = function (container, loadContext) {
                    return this.metadata.load(container, this.value, loadContext);
                };
                return ResourceDescription;
            }()));
            var ModuleAnalyzer = exports('ModuleAnalyzer', (function () {
                function ModuleAnalyzer() {
                    this.cache = Object.create(null);
                }
                ModuleAnalyzer.prototype.getAnalysis = function (moduleId) {
                    return this.cache[moduleId];
                };
                ModuleAnalyzer.prototype.analyze = function (moduleId, moduleInstance, mainResourceKey) {
                    var mainResource;
                    var fallbackValue;
                    var fallbackKey;
                    var resourceTypeMeta;
                    var key;
                    var exportedValue;
                    var resources = [];
                    var conventional;
                    var vs;
                    var resourceModule;
                    resourceModule = this.cache[moduleId];
                    if (resourceModule) {
                        return resourceModule;
                    }
                    resourceModule = new ResourceModule(moduleId);
                    this.cache[moduleId] = resourceModule;
                    if (typeof moduleInstance === 'function') {
                        moduleInstance = { 'default': moduleInstance };
                    }
                    if (mainResourceKey) {
                        mainResource = new ResourceDescription(mainResourceKey, moduleInstance[mainResourceKey]);
                    }
                    for (key in moduleInstance) {
                        exportedValue = moduleInstance[key];
                        if (key === mainResourceKey || typeof exportedValue !== 'function') {
                            continue;
                        }
                        resourceTypeMeta = metadata.get(metadata.resource, exportedValue);
                        if (resourceTypeMeta) {
                            if (resourceTypeMeta instanceof HtmlBehaviorResource) {
                                ViewResources.convention(exportedValue, resourceTypeMeta);
                                if (resourceTypeMeta.attributeName === null && resourceTypeMeta.elementName === null) {
                                    HtmlBehaviorResource.convention(key, resourceTypeMeta);
                                }
                                if (resourceTypeMeta.attributeName === null && resourceTypeMeta.elementName === null) {
                                    resourceTypeMeta.elementName = _hyphenate(key);
                                }
                            }
                            if (!mainResource && resourceTypeMeta instanceof HtmlBehaviorResource && resourceTypeMeta.elementName !== null) {
                                mainResource = new ResourceDescription(key, exportedValue, resourceTypeMeta);
                            }
                            else {
                                resources.push(new ResourceDescription(key, exportedValue, resourceTypeMeta));
                            }
                        }
                        else if (viewStrategy.decorates(exportedValue)) {
                            vs = exportedValue;
                        }
                        else if (exportedValue instanceof TemplateRegistryEntry) {
                            vs = new TemplateRegistryViewStrategy(moduleId, exportedValue);
                        }
                        else {
                            if (conventional = ViewResources.convention(exportedValue)) {
                                if (conventional.elementName !== null && !mainResource) {
                                    mainResource = new ResourceDescription(key, exportedValue, conventional);
                                }
                                else {
                                    resources.push(new ResourceDescription(key, exportedValue, conventional));
                                }
                                metadata.define(metadata.resource, conventional, exportedValue);
                            }
                            else if (conventional = HtmlBehaviorResource.convention(key)) {
                                if (conventional.elementName !== null && !mainResource) {
                                    mainResource = new ResourceDescription(key, exportedValue, conventional);
                                }
                                else {
                                    resources.push(new ResourceDescription(key, exportedValue, conventional));
                                }
                                metadata.define(metadata.resource, conventional, exportedValue);
                            }
                            else if (conventional = ValueConverterResource.convention(key)
                                || BindingBehaviorResource.convention(key)
                                || ViewEngineHooksResource.convention(key)) {
                                resources.push(new ResourceDescription(key, exportedValue, conventional));
                                metadata.define(metadata.resource, conventional, exportedValue);
                            }
                            else if (!fallbackValue) {
                                fallbackValue = exportedValue;
                                fallbackKey = key;
                            }
                        }
                    }
                    if (!mainResource && fallbackValue) {
                        mainResource = new ResourceDescription(fallbackKey, fallbackValue);
                    }
                    resourceModule.moduleInstance = moduleInstance;
                    resourceModule.mainResource = mainResource;
                    resourceModule.resources = resources;
                    resourceModule.viewStrategy = vs;
                    return resourceModule;
                };
                return ModuleAnalyzer;
            }()));

            var logger = LogManager.getLogger('templating');
            function ensureRegistryEntry(loader, urlOrRegistryEntry) {
                if (urlOrRegistryEntry instanceof TemplateRegistryEntry) {
                    return Promise.resolve(urlOrRegistryEntry);
                }
                return loader.loadTemplate(urlOrRegistryEntry);
            }
            var ProxyViewFactory = (function () {
                function ProxyViewFactory(promise) {
                    var _this = this;
                    promise.then(function (x) { return _this.viewFactory = x; });
                }
                ProxyViewFactory.prototype.create = function (container, bindingContext, createInstruction, element) {
                    return this.viewFactory.create(container, bindingContext, createInstruction, element);
                };
                Object.defineProperty(ProxyViewFactory.prototype, "isCaching", {
                    get: function () {
                        return this.viewFactory.isCaching;
                    },
                    enumerable: false,
                    configurable: true
                });
                ProxyViewFactory.prototype.setCacheSize = function (size, doNotOverrideIfAlreadySet) {
                    this.viewFactory.setCacheSize(size, doNotOverrideIfAlreadySet);
                };
                ProxyViewFactory.prototype.getCachedView = function () {
                    return this.viewFactory.getCachedView();
                };
                ProxyViewFactory.prototype.returnViewToCache = function (view) {
                    this.viewFactory.returnViewToCache(view);
                };
                return ProxyViewFactory;
            }());
            var auSlotBehavior = null;
            var ViewEngine = exports('ViewEngine', (function () {
                function ViewEngine(loader, container, viewCompiler, moduleAnalyzer, appResources) {
                    this.loader = loader;
                    this.container = container;
                    this.viewCompiler = viewCompiler;
                    this.moduleAnalyzer = moduleAnalyzer;
                    this.appResources = appResources;
                    this._pluginMap = {};
                    if (auSlotBehavior === null) {
                        auSlotBehavior = new HtmlBehaviorResource();
                        auSlotBehavior.attributeName = 'au-slot';
                        metadata.define(metadata.resource, auSlotBehavior, SlotCustomAttribute);
                    }
                    auSlotBehavior.initialize(container, SlotCustomAttribute);
                    auSlotBehavior.register(appResources);
                }
                ViewEngine.inject = function () {
                    return [Loader, Container, ViewCompiler, ModuleAnalyzer, ViewResources];
                };
                ViewEngine.prototype.addResourcePlugin = function (extension, implementation) {
                    var name = extension.replace('.', '') + '-resource-plugin';
                    this._pluginMap[extension] = name;
                    this.loader.addPlugin(name, implementation);
                };
                ViewEngine.prototype.loadViewFactory = function (urlOrRegistryEntry, compileInstruction, loadContext, target) {
                    var _this = this;
                    loadContext = loadContext || new ResourceLoadContext();
                    return ensureRegistryEntry(this.loader, urlOrRegistryEntry).then(function (registryEntry) {
                        var url = registryEntry.address;
                        if (registryEntry.onReady) {
                            if (!loadContext.hasDependency(url)) {
                                loadContext.addDependency(url);
                                return registryEntry.onReady;
                            }
                            if (registryEntry.template === null) {
                                return registryEntry.onReady;
                            }
                            return Promise.resolve(new ProxyViewFactory(registryEntry.onReady));
                        }
                        loadContext.addDependency(url);
                        registryEntry.onReady = _this.loadTemplateResources(registryEntry, compileInstruction, loadContext, target).then(function (resources) {
                            registryEntry.resources = resources;
                            if (registryEntry.template === null) {
                                return registryEntry.factory = null;
                            }
                            var viewFactory = _this.viewCompiler.compile(registryEntry.template, resources, compileInstruction);
                            return registryEntry.factory = viewFactory;
                        });
                        return registryEntry.onReady;
                    });
                };
                ViewEngine.prototype.loadTemplateResources = function (registryEntry, compileInstruction, loadContext, target) {
                    var resources = new ViewResources(this.appResources, registryEntry.address);
                    var dependencies = registryEntry.dependencies;
                    var importIds;
                    var names;
                    compileInstruction = compileInstruction || ViewCompileInstruction.normal;
                    if (dependencies.length === 0 && !compileInstruction.associatedModuleId) {
                        return Promise.resolve(resources);
                    }
                    importIds = dependencies.map(function (x) { return x.src; });
                    names = dependencies.map(function (x) { return x.name; });
                    logger.debug("importing resources for ".concat(registryEntry.address), importIds);
                    if (target) {
                        var viewModelRequires = metadata.get(ViewEngine.viewModelRequireMetadataKey, target);
                        if (viewModelRequires) {
                            var templateImportCount = importIds.length;
                            for (var i = 0, ii = viewModelRequires.length; i < ii; ++i) {
                                var req = viewModelRequires[i];
                                var importId = typeof req === 'function'
                                    ? Origin.get(req).moduleId
                                    : relativeToFile(req.src || req, registryEntry.address);
                                if (importIds.indexOf(importId) === -1) {
                                    importIds.push(importId);
                                    names.push(req.as);
                                }
                            }
                            logger.debug("importing ViewModel resources for ".concat(compileInstruction.associatedModuleId), importIds.slice(templateImportCount));
                        }
                    }
                    return this.importViewResources(importIds, names, resources, compileInstruction, loadContext);
                };
                ViewEngine.prototype.importViewModelResource = function (moduleImport, moduleMember) {
                    var _this = this;
                    return this.loader.loadModule(moduleImport).then(function (viewModelModule) {
                        var normalizedId = Origin.get(viewModelModule).moduleId;
                        var resourceModule = _this.moduleAnalyzer.analyze(normalizedId, viewModelModule, moduleMember);
                        if (!resourceModule.mainResource) {
                            throw new Error("No view model found in module \"".concat(moduleImport, "\"."));
                        }
                        resourceModule.initialize(_this.container);
                        return resourceModule.mainResource;
                    });
                };
                ViewEngine.prototype.importViewResources = function (moduleIds, names, resources, compileInstruction, loadContext) {
                    var _this = this;
                    loadContext = loadContext || new ResourceLoadContext();
                    compileInstruction = compileInstruction || ViewCompileInstruction.normal;
                    moduleIds = moduleIds.map(function (x) { return _this._applyLoaderPlugin(x); });
                    return this.loader.loadAllModules(moduleIds).then(function (imports) {
                        var i;
                        var ii;
                        var analysis;
                        var normalizedId;
                        var current;
                        var associatedModule;
                        var container = _this.container;
                        var moduleAnalyzer = _this.moduleAnalyzer;
                        var allAnalysis = new Array(imports.length);
                        for (i = 0, ii = imports.length; i < ii; ++i) {
                            current = imports[i];
                            normalizedId = Origin.get(current).moduleId;
                            analysis = moduleAnalyzer.analyze(normalizedId, current);
                            analysis.initialize(container);
                            analysis.register(resources, names[i]);
                            allAnalysis[i] = analysis;
                        }
                        if (compileInstruction.associatedModuleId) {
                            associatedModule = moduleAnalyzer.getAnalysis(compileInstruction.associatedModuleId);
                            if (associatedModule) {
                                associatedModule.register(resources);
                            }
                        }
                        for (i = 0, ii = allAnalysis.length; i < ii; ++i) {
                            allAnalysis[i] = allAnalysis[i].load(container, loadContext);
                        }
                        return Promise.all(allAnalysis).then(function () { return resources; });
                    });
                };
                ViewEngine.prototype._applyLoaderPlugin = function (id) {
                    var index = id.lastIndexOf('.');
                    if (index !== -1) {
                        var ext = id.substring(index);
                        var pluginName = this._pluginMap[ext];
                        if (pluginName === undefined) {
                            return id;
                        }
                        return this.loader.applyPluginToUrl(id, pluginName);
                    }
                    return id;
                };
                ViewEngine.viewModelRequireMetadataKey = 'aurelia:view-model-require';
                return ViewEngine;
            }()));

            var Controller = exports('Controller', (function () {
                function Controller(behavior, instruction, viewModel, container) {
                    this.behavior = behavior;
                    this.instruction = instruction;
                    this.viewModel = viewModel;
                    this.isAttached = false;
                    this.view = null;
                    this.isBound = false;
                    this.scope = null;
                    this.container = container;
                    this.elementEvents = container.elementEvents || null;
                    var observerLookup = behavior.observerLocator.getOrCreateObserversLookup(viewModel);
                    var handlesBind = behavior.handlesBind;
                    var attributes = instruction.attributes;
                    var boundProperties = this.boundProperties = [];
                    var properties = behavior.properties;
                    var i;
                    var ii;
                    behavior._ensurePropertiesDefined(viewModel, observerLookup);
                    for (i = 0, ii = properties.length; i < ii; ++i) {
                        properties[i]._initialize(viewModel, observerLookup, attributes, handlesBind, boundProperties);
                    }
                }
                Controller.prototype.created = function (owningView) {
                    if (this.behavior.handlesCreated) {
                        this.viewModel.created(owningView, this.view);
                    }
                };
                Controller.prototype.automate = function (overrideContext, owningView) {
                    this.view.bindingContext = this.viewModel;
                    this.view.overrideContext = overrideContext || createOverrideContext(this.viewModel);
                    this.view._isUserControlled = true;
                    if (this.behavior.handlesCreated) {
                        this.viewModel.created(owningView || null, this.view);
                    }
                    this.bind(this.view);
                };
                Controller.prototype.bind = function (scope) {
                    var skipSelfSubscriber = this.behavior.handlesBind;
                    var boundProperties = this.boundProperties;
                    var i;
                    var ii;
                    var x;
                    var observer;
                    var selfSubscriber;
                    if (this.isBound) {
                        if (this.scope === scope) {
                            return;
                        }
                        this.unbind();
                    }
                    this.isBound = true;
                    this.scope = scope;
                    for (i = 0, ii = boundProperties.length; i < ii; ++i) {
                        x = boundProperties[i];
                        observer = x.observer;
                        selfSubscriber = observer.selfSubscriber;
                        observer.publishing = false;
                        if (skipSelfSubscriber) {
                            observer.selfSubscriber = null;
                        }
                        x.binding.bind(scope);
                        observer.call();
                        observer.publishing = true;
                        observer.selfSubscriber = selfSubscriber;
                    }
                    var overrideContext;
                    if (this.view !== null) {
                        if (skipSelfSubscriber) {
                            this.view.viewModelScope = scope;
                        }
                        if (this.viewModel === scope.overrideContext.bindingContext) {
                            overrideContext = scope.overrideContext;
                        }
                        else if (this.instruction.inheritBindingContext) {
                            overrideContext = createOverrideContext(this.viewModel, scope.overrideContext);
                        }
                        else {
                            overrideContext = createOverrideContext(this.viewModel);
                            overrideContext.__parentOverrideContext = scope.overrideContext;
                        }
                        this.view.bind(this.viewModel, overrideContext);
                    }
                    else if (skipSelfSubscriber) {
                        overrideContext = scope.overrideContext;
                        if (scope.overrideContext.__parentOverrideContext !== undefined
                            && this.viewModel.viewFactory && this.viewModel.viewFactory.factoryCreateInstruction.partReplacements) {
                            overrideContext = Object.assign({}, scope.overrideContext);
                            overrideContext.parentOverrideContext = scope.overrideContext.__parentOverrideContext;
                        }
                        this.viewModel.bind(scope.bindingContext, overrideContext);
                    }
                };
                Controller.prototype.unbind = function () {
                    if (this.isBound) {
                        var boundProperties = this.boundProperties;
                        var i = void 0;
                        var ii = void 0;
                        this.isBound = false;
                        this.scope = null;
                        if (this.view !== null) {
                            this.view.unbind();
                        }
                        if (this.behavior.handlesUnbind) {
                            this.viewModel.unbind();
                        }
                        if (this.elementEvents !== null) {
                            this.elementEvents.disposeAll();
                        }
                        for (i = 0, ii = boundProperties.length; i < ii; ++i) {
                            boundProperties[i].binding.unbind();
                        }
                    }
                };
                Controller.prototype.attached = function () {
                    if (this.isAttached) {
                        return;
                    }
                    this.isAttached = true;
                    if (this.behavior.handlesAttached) {
                        this.viewModel.attached();
                    }
                    if (this.view !== null) {
                        this.view.attached();
                    }
                };
                Controller.prototype.detached = function () {
                    if (this.isAttached) {
                        this.isAttached = false;
                        if (this.view !== null) {
                            this.view.detached();
                        }
                        if (this.behavior.handlesDetached) {
                            this.viewModel.detached();
                        }
                    }
                };
                return Controller;
            }()));

            var lastProviderId = 0;
            function nextProviderId() {
                return ++lastProviderId;
            }
            function doProcessContent() { return true; }
            function doProcessAttributes() { }
            var HtmlBehaviorResource = exports('HtmlBehaviorResource', (function () {
                function HtmlBehaviorResource() {
                    this.elementName = null;
                    this.attributeName = null;
                    this.attributeDefaultBindingMode = undefined;
                    this.liftsContent = false;
                    this.targetShadowDOM = false;
                    this.shadowDOMOptions = null;
                    this.processAttributes = doProcessAttributes;
                    this.processContent = doProcessContent;
                    this.usesShadowDOM = false;
                    this.childBindings = null;
                    this.hasDynamicOptions = false;
                    this.containerless = false;
                    this.properties = [];
                    this.attributes = {};
                    this.isInitialized = false;
                    this.primaryProperty = null;
                }
                HtmlBehaviorResource.convention = function (name, existing) {
                    var behavior;
                    if (name.endsWith('CustomAttribute')) {
                        behavior = existing || new HtmlBehaviorResource();
                        behavior.attributeName = _hyphenate(name.substring(0, name.length - 15));
                    }
                    if (name.endsWith('CustomElement')) {
                        behavior = existing || new HtmlBehaviorResource();
                        behavior.elementName = _hyphenate(name.substring(0, name.length - 13));
                    }
                    return behavior;
                };
                HtmlBehaviorResource.prototype.addChildBinding = function (behavior) {
                    if (this.childBindings === null) {
                        this.childBindings = [];
                    }
                    this.childBindings.push(behavior);
                };
                HtmlBehaviorResource.prototype.initialize = function (container, target) {
                    var proto = target.prototype;
                    var properties = this.properties;
                    var attributeName = this.attributeName;
                    var attributeDefaultBindingMode = this.attributeDefaultBindingMode;
                    var i;
                    var ii;
                    var current;
                    if (this.isInitialized) {
                        return;
                    }
                    this.isInitialized = true;
                    target.__providerId__ = nextProviderId();
                    this.observerLocator = container.get(ObserverLocator);
                    this.taskQueue = container.get(TaskQueue);
                    this.target = target;
                    this.usesShadowDOM = this.targetShadowDOM && FEATURE.shadowDOM;
                    this.handlesCreated = ('created' in proto);
                    this.handlesBind = ('bind' in proto);
                    this.handlesUnbind = ('unbind' in proto);
                    this.handlesAttached = ('attached' in proto);
                    this.handlesDetached = ('detached' in proto);
                    this.htmlName = this.elementName || this.attributeName;
                    if (attributeName !== null) {
                        if (properties.length === 0) {
                            new BindableProperty({
                                name: 'value',
                                changeHandler: 'valueChanged' in proto ? 'valueChanged' : null,
                                attribute: attributeName,
                                defaultBindingMode: attributeDefaultBindingMode
                            }).registerWith(target, this);
                        }
                        current = properties[0];
                        if (properties.length === 1 && current.name === 'value') {
                            current.isDynamic = current.hasOptions = this.hasDynamicOptions;
                            current.defineOn(target, this);
                        }
                        else {
                            for (i = 0, ii = properties.length; i < ii; ++i) {
                                properties[i].defineOn(target, this);
                                if (properties[i].primaryProperty) {
                                    if (this.primaryProperty) {
                                        throw new Error('Only one bindable property on a custom element can be defined as the default');
                                    }
                                    this.primaryProperty = properties[i];
                                }
                            }
                            current = new BindableProperty({
                                name: 'value',
                                changeHandler: 'valueChanged' in proto ? 'valueChanged' : null,
                                attribute: attributeName,
                                defaultBindingMode: attributeDefaultBindingMode
                            });
                            current.hasOptions = true;
                            current.registerWith(target, this);
                        }
                    }
                    else {
                        for (i = 0, ii = properties.length; i < ii; ++i) {
                            properties[i].defineOn(target, this);
                        }
                        this._copyInheritedProperties(container, target);
                    }
                };
                HtmlBehaviorResource.prototype.register = function (registry, name) {
                    var _this = this;
                    if (this.attributeName !== null) {
                        registry.registerAttribute(name || this.attributeName, this, this.attributeName);
                        if (Array.isArray(this.aliases)) {
                            this.aliases
                                .forEach(function (alias) {
                                registry.registerAttribute(alias, _this, _this.attributeName);
                            });
                        }
                    }
                    if (this.elementName !== null) {
                        registry.registerElement(name || this.elementName, this);
                    }
                };
                HtmlBehaviorResource.prototype.aliases = function (aliases) {
                    throw new Error('Method not implemented.');
                };
                HtmlBehaviorResource.prototype.load = function (container, target, loadContext, viewStrategy, transientView) {
                    var _this = this;
                    var options;
                    if (this.elementName !== null) {
                        viewStrategy = container.get(ViewLocator).getViewStrategy(viewStrategy || this.viewStrategy || target);
                        options = new ViewCompileInstruction(this.targetShadowDOM, true);
                        if (!viewStrategy.moduleId) {
                            viewStrategy.moduleId = Origin.get(target).moduleId;
                        }
                        return viewStrategy
                            .loadViewFactory(container.get(ViewEngine), options, loadContext, target)
                            .then(function (viewFactory) {
                            if (!transientView || !_this.viewFactory) {
                                _this.viewFactory = viewFactory;
                            }
                            return viewFactory;
                        });
                    }
                    return Promise.resolve(this);
                };
                HtmlBehaviorResource.prototype.compile = function (compiler, resources, node, instruction, parentNode) {
                    if (this.liftsContent) {
                        if (!instruction.viewFactory) {
                            var template = DOM.createElement('template');
                            var fragment = DOM.createDocumentFragment();
                            var cacheSize = node.getAttribute('view-cache');
                            var part = node.getAttribute('part');
                            node.removeAttribute(instruction.originalAttrName);
                            DOM.replaceNode(template, node, parentNode);
                            fragment.appendChild(node);
                            instruction.viewFactory = compiler.compile(fragment, resources);
                            if (part) {
                                instruction.viewFactory.part = part;
                                node.removeAttribute('part');
                            }
                            if (cacheSize) {
                                instruction.viewFactory.setCacheSize(cacheSize);
                                node.removeAttribute('view-cache');
                            }
                            node = template;
                        }
                    }
                    else if (this.elementName !== null) {
                        var partReplacements = {};
                        if (this.processContent(compiler, resources, node, instruction) && node.hasChildNodes()) {
                            var currentChild = node.firstChild;
                            var contentElement = this.usesShadowDOM ? null : DOM.createElement('au-content');
                            var nextSibling = void 0;
                            var toReplace = void 0;
                            while (currentChild) {
                                nextSibling = currentChild.nextSibling;
                                if (currentChild.tagName === 'TEMPLATE' && (toReplace = currentChild.getAttribute('replace-part'))) {
                                    partReplacements[toReplace] = compiler.compile(currentChild, resources);
                                    DOM.removeNode(currentChild, parentNode);
                                    instruction.partReplacements = partReplacements;
                                }
                                else if (contentElement !== null) {
                                    if (currentChild.nodeType === 3 && _isAllWhitespace(currentChild)) {
                                        DOM.removeNode(currentChild, parentNode);
                                    }
                                    else {
                                        contentElement.appendChild(currentChild);
                                    }
                                }
                                currentChild = nextSibling;
                            }
                            if (contentElement !== null && contentElement.hasChildNodes()) {
                                node.appendChild(contentElement);
                            }
                            instruction.skipContentProcessing = false;
                        }
                        else {
                            instruction.skipContentProcessing = true;
                        }
                    }
                    else if (!this.processContent(compiler, resources, node, instruction)) {
                        instruction.skipContentProcessing = true;
                    }
                    return node;
                };
                HtmlBehaviorResource.prototype.create = function (container, instruction, element, bindings) {
                    var viewHost;
                    var au = null;
                    instruction = instruction || BehaviorInstruction.normal;
                    element = element || null;
                    bindings = bindings || null;
                    if (this.elementName !== null && element) {
                        if (this.usesShadowDOM) {
                            viewHost = element.attachShadow(this.shadowDOMOptions);
                            container.registerInstance(DOM.boundary, viewHost);
                        }
                        else {
                            viewHost = element;
                            if (this.targetShadowDOM) {
                                container.registerInstance(DOM.boundary, viewHost);
                            }
                        }
                    }
                    if (element !== null) {
                        element.au = au = element.au || {};
                    }
                    var viewModel = instruction.viewModel || container.get(this.target);
                    var controller = new Controller(this, instruction, viewModel, container);
                    var childBindings = this.childBindings;
                    var viewFactory;
                    if (this.liftsContent) {
                        au.controller = controller;
                    }
                    else if (this.elementName !== null) {
                        viewFactory = instruction.viewFactory || this.viewFactory;
                        container.viewModel = viewModel;
                        if (viewFactory) {
                            controller.view = viewFactory.create(container, instruction, element);
                        }
                        if (element !== null) {
                            au.controller = controller;
                            if (controller.view) {
                                if (!this.usesShadowDOM && (element.childNodes.length === 1 || element.contentElement)) {
                                    var contentElement = element.childNodes[0] || element.contentElement;
                                    controller.view.contentView = { fragment: contentElement };
                                    contentElement.parentNode && DOM.removeNode(contentElement);
                                }
                                if (instruction.anchorIsContainer) {
                                    if (childBindings !== null) {
                                        for (var i = 0, ii = childBindings.length; i < ii; ++i) {
                                            controller.view.addBinding(childBindings[i].create(element, viewModel, controller));
                                        }
                                    }
                                    controller.view.appendNodesTo(viewHost);
                                }
                                else {
                                    controller.view.insertNodesBefore(viewHost);
                                }
                            }
                            else if (childBindings !== null) {
                                for (var i = 0, ii = childBindings.length; i < ii; ++i) {
                                    bindings.push(childBindings[i].create(element, viewModel, controller));
                                }
                            }
                        }
                        else if (controller.view) {
                            controller.view.controller = controller;
                            if (childBindings !== null) {
                                for (var i = 0, ii = childBindings.length; i < ii; ++i) {
                                    controller.view.addBinding(childBindings[i].create(instruction.host, viewModel, controller));
                                }
                            }
                        }
                        else if (childBindings !== null) {
                            for (var i = 0, ii = childBindings.length; i < ii; ++i) {
                                bindings.push(childBindings[i].create(instruction.host, viewModel, controller));
                            }
                        }
                    }
                    else if (childBindings !== null) {
                        for (var i = 0, ii = childBindings.length; i < ii; ++i) {
                            bindings.push(childBindings[i].create(element, viewModel, controller));
                        }
                    }
                    if (au !== null) {
                        au[this.htmlName] = controller;
                    }
                    if (instruction.initiatedByBehavior && viewFactory) {
                        controller.view.created();
                    }
                    return controller;
                };
                HtmlBehaviorResource.prototype._ensurePropertiesDefined = function (instance, lookup) {
                    var properties;
                    var i;
                    var ii;
                    var observer;
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
                HtmlBehaviorResource.prototype._copyInheritedProperties = function (container, target) {
                    var behavior;
                    var derived = target;
                    while (true) {
                        var proto = Object.getPrototypeOf(target.prototype);
                        target = proto && proto.constructor;
                        if (!target) {
                            return;
                        }
                        behavior = metadata.getOwn(metadata.resource, target);
                        if (behavior) {
                            break;
                        }
                    }
                    behavior.initialize(container, target);
                    var _loop_1 = function (i, ii) {
                        var prop = behavior.properties[i];
                        if (this_1.properties.some(function (p) { return p.name === prop.name; })) {
                            return "continue";
                        }
                        new BindableProperty(prop).registerWith(derived, this_1);
                    };
                    var this_1 = this;
                    for (var i = 0, ii = behavior.properties.length; i < ii; ++i) {
                        _loop_1(i);
                    }
                };
                return HtmlBehaviorResource;
            }()));

            function register(lookup, name, resource, type) {
                if (!name) {
                    return;
                }
                var existing = lookup[name];
                if (existing) {
                    if (existing !== resource) {
                        throw new Error("Attempted to register ".concat(type, " when one with the same name already exists. Name: ").concat(name, "."));
                    }
                    return;
                }
                lookup[name] = resource;
            }
            function validateBehaviorName(name, type) {
                if (/[A-Z]/.test(name)) {
                    var newName = _hyphenate(name);
                    LogManager
                        .getLogger('templating')
                        .warn("'".concat(name, "' is not a valid ").concat(type, " name and has been converted to '").concat(newName, "'. Upper-case letters are not allowed because the DOM is not case-sensitive."));
                    return newName;
                }
                return name;
            }
            var conventionMark = '__au_resource__';
            var ViewResources = exports('ViewResources', (function () {
                function ViewResources(parent, viewUrl) {
                    this.bindingLanguage = null;
                    this.parent = parent || null;
                    this.hasParent = this.parent !== null;
                    this.viewUrl = viewUrl || '';
                    this.lookupFunctions = {
                        valueConverters: this.getValueConverter.bind(this),
                        bindingBehaviors: this.getBindingBehavior.bind(this)
                    };
                    this.attributes = Object.create(null);
                    this.elements = Object.create(null);
                    this.valueConverters = Object.create(null);
                    this.bindingBehaviors = Object.create(null);
                    this.attributeMap = Object.create(null);
                    this.values = Object.create(null);
                    this.beforeCompile = this.afterCompile = this.beforeCreate = this.afterCreate = this.beforeBind = this.beforeUnbind = false;
                }
                ViewResources.convention = function (target, existing) {
                    var resource;
                    if (existing && conventionMark in existing) {
                        return existing;
                    }
                    if ('$resource' in target) {
                        var config = target.$resource;
                        if (typeof config === 'string') {
                            resource = existing || new HtmlBehaviorResource();
                            resource[conventionMark] = true;
                            if (!resource.elementName) {
                                resource.elementName = validateBehaviorName(config, 'custom element');
                            }
                        }
                        else {
                            if (typeof config === 'function') {
                                config = config.call(target);
                            }
                            if (typeof config === 'string') {
                                config = { name: config };
                            }
                            config = Object.assign({}, config);
                            var resourceType = config.type || 'element';
                            var name_1 = config.name;
                            switch (resourceType) {
                                case 'element':
                                case 'attribute':
                                    resource = existing || new HtmlBehaviorResource();
                                    resource[conventionMark] = true;
                                    if (resourceType === 'element') {
                                        if (!resource.elementName) {
                                            resource.elementName = name_1
                                                ? validateBehaviorName(name_1, 'custom element')
                                                : _hyphenate(target.name);
                                        }
                                    }
                                    else {
                                        if (!resource.attributeName) {
                                            resource.attributeName = name_1
                                                ? validateBehaviorName(name_1, 'custom attribute')
                                                : _hyphenate(target.name);
                                        }
                                    }
                                    if ('templateController' in config) {
                                        config.liftsContent = config.templateController;
                                        delete config.templateController;
                                    }
                                    if ('defaultBindingMode' in config && resource.attributeDefaultBindingMode !== undefined) {
                                        config.attributeDefaultBindingMode = config.defaultBindingMode;
                                        delete config.defaultBindingMode;
                                    }
                                    delete config.name;
                                    Object.assign(resource, config);
                                    break;
                                case 'valueConverter':
                                    resource = new ValueConverterResource(camelCase(name_1 || target.name));
                                    break;
                                case 'bindingBehavior':
                                    resource = new BindingBehaviorResource(camelCase(name_1 || target.name));
                                    break;
                                case 'viewEngineHooks':
                                    resource = new ViewEngineHooksResource();
                                    break;
                            }
                        }
                        if (resource instanceof HtmlBehaviorResource) {
                            var bindables = typeof config === 'string' ? undefined : config.bindables;
                            var currentProps = resource.properties;
                            if (Array.isArray(bindables)) {
                                for (var i = 0, ii = bindables.length; ii > i; ++i) {
                                    var prop = bindables[i];
                                    if (!prop || (typeof prop !== 'string' && !prop.name)) {
                                        throw new Error("Invalid bindable property at \"".concat(i, "\" for class \"").concat(target.name, "\". Expected either a string or an object with \"name\" property."));
                                    }
                                    var newProp = new BindableProperty(prop);
                                    var existed = false;
                                    for (var j = 0, jj = currentProps.length; jj > j; ++j) {
                                        if (currentProps[j].name === newProp.name) {
                                            existed = true;
                                            break;
                                        }
                                    }
                                    if (existed) {
                                        continue;
                                    }
                                    newProp.registerWith(target, resource);
                                }
                            }
                        }
                    }
                    return resource;
                };
                ViewResources.prototype._tryAddHook = function (obj, name) {
                    if (typeof obj[name] === 'function') {
                        var func = obj[name].bind(obj);
                        var counter = 1;
                        var callbackName = void 0;
                        while (this[callbackName = name + counter.toString()] !== undefined) {
                            counter++;
                        }
                        this[name] = true;
                        this[callbackName] = func;
                    }
                };
                ViewResources.prototype._invokeHook = function (name, one, two, three, four) {
                    if (this.hasParent) {
                        this.parent._invokeHook(name, one, two, three, four);
                    }
                    if (this[name]) {
                        this[name + '1'](one, two, three, four);
                        var callbackName = name + '2';
                        if (this[callbackName]) {
                            this[callbackName](one, two, three, four);
                            callbackName = name + '3';
                            if (this[callbackName]) {
                                this[callbackName](one, two, three, four);
                                var counter = 4;
                                while (this[callbackName = name + counter.toString()] !== undefined) {
                                    this[callbackName](one, two, three, four);
                                    counter++;
                                }
                            }
                        }
                    }
                };
                ViewResources.prototype.registerViewEngineHooks = function (hooks) {
                    this._tryAddHook(hooks, 'beforeCompile');
                    this._tryAddHook(hooks, 'afterCompile');
                    this._tryAddHook(hooks, 'beforeCreate');
                    this._tryAddHook(hooks, 'afterCreate');
                    this._tryAddHook(hooks, 'beforeBind');
                    this._tryAddHook(hooks, 'beforeUnbind');
                };
                ViewResources.prototype.getBindingLanguage = function (bindingLanguageFallback) {
                    return this.bindingLanguage || (this.bindingLanguage = bindingLanguageFallback);
                };
                ViewResources.prototype.patchInParent = function (newParent) {
                    var originalParent = this.parent;
                    this.parent = newParent || null;
                    this.hasParent = this.parent !== null;
                    if (newParent.parent === null) {
                        newParent.parent = originalParent;
                        newParent.hasParent = originalParent !== null;
                    }
                };
                ViewResources.prototype.relativeToView = function (path) {
                    return relativeToFile(path, this.viewUrl);
                };
                ViewResources.prototype.registerElement = function (tagName, behavior) {
                    register(this.elements, tagName, behavior, 'an Element');
                };
                ViewResources.prototype.getElement = function (tagName) {
                    return this.elements[tagName] || (this.hasParent ? this.parent.getElement(tagName) : null);
                };
                ViewResources.prototype.mapAttribute = function (attribute) {
                    return this.attributeMap[attribute] || (this.hasParent ? this.parent.mapAttribute(attribute) : null);
                };
                ViewResources.prototype.registerAttribute = function (attribute, behavior, knownAttribute) {
                    this.attributeMap[attribute] = knownAttribute;
                    register(this.attributes, attribute, behavior, 'an Attribute');
                };
                ViewResources.prototype.getAttribute = function (attribute) {
                    return this.attributes[attribute] || (this.hasParent ? this.parent.getAttribute(attribute) : null);
                };
                ViewResources.prototype.registerValueConverter = function (name, valueConverter) {
                    register(this.valueConverters, name, valueConverter, 'a ValueConverter');
                };
                ViewResources.prototype.getValueConverter = function (name) {
                    return this.valueConverters[name] || (this.hasParent ? this.parent.getValueConverter(name) : null);
                };
                ViewResources.prototype.registerBindingBehavior = function (name, bindingBehavior) {
                    register(this.bindingBehaviors, name, bindingBehavior, 'a BindingBehavior');
                };
                ViewResources.prototype.getBindingBehavior = function (name) {
                    return this.bindingBehaviors[name] || (this.hasParent ? this.parent.getBindingBehavior(name) : null);
                };
                ViewResources.prototype.registerValue = function (name, value) {
                    register(this.values, name, value, 'a value');
                };
                ViewResources.prototype.getValue = function (name) {
                    return this.values[name] || (this.hasParent ? this.parent.getValue(name) : null);
                };
                ViewResources.prototype.autoRegister = function (container, impl) {
                    var resourceTypeMeta = metadata.getOwn(metadata.resource, impl);
                    if (resourceTypeMeta) {
                        if (resourceTypeMeta instanceof HtmlBehaviorResource) {
                            ViewResources.convention(impl, resourceTypeMeta);
                            if (resourceTypeMeta.attributeName === null && resourceTypeMeta.elementName === null) {
                                HtmlBehaviorResource.convention(impl.name, resourceTypeMeta);
                            }
                            if (resourceTypeMeta.attributeName === null && resourceTypeMeta.elementName === null) {
                                resourceTypeMeta.elementName = _hyphenate(impl.name);
                            }
                        }
                    }
                    else {
                        resourceTypeMeta = ViewResources.convention(impl)
                            || HtmlBehaviorResource.convention(impl.name)
                            || ValueConverterResource.convention(impl.name)
                            || BindingBehaviorResource.convention(impl.name)
                            || ViewEngineHooksResource.convention(impl.name);
                        if (!resourceTypeMeta) {
                            resourceTypeMeta = new HtmlBehaviorResource();
                            resourceTypeMeta.elementName = _hyphenate(impl.name);
                        }
                        metadata.define(metadata.resource, resourceTypeMeta, impl);
                    }
                    resourceTypeMeta.initialize(container, impl);
                    resourceTypeMeta.register(this, undefined);
                    return resourceTypeMeta;
                };
                return ViewResources;
            }()));

            var viewStrategy = exports('viewStrategy', protocol.create('aurelia:view-strategy', {
                validate: function (target) {
                    if (!(typeof target.loadViewFactory === 'function')) {
                        return 'View strategies must implement: loadViewFactory(viewEngine: ViewEngine, compileInstruction: ViewCompileInstruction, loadContext?: ResourceLoadContext): Promise<ViewFactory>';
                    }
                    return true;
                },
                compose: function (target) {
                    if (!(typeof target.makeRelativeTo === 'function')) {
                        target.makeRelativeTo = PLATFORM.noop;
                    }
                }
            }));
            var RelativeViewStrategy = exports('RelativeViewStrategy', (function () {
                function RelativeViewStrategy(path) {
                    this.path = path;
                    this.absolutePath = null;
                }
                RelativeViewStrategy.prototype.loadViewFactory = function (viewEngine, compileInstruction, loadContext, target) {
                    if (this.absolutePath === null && this.moduleId) {
                        this.absolutePath = relativeToFile(this.path, this.moduleId);
                    }
                    compileInstruction.associatedModuleId = this.moduleId;
                    return viewEngine.loadViewFactory(this.absolutePath || this.path, compileInstruction, loadContext, target);
                };
                RelativeViewStrategy.prototype.makeRelativeTo = function (file) {
                    if (this.absolutePath === null) {
                        this.absolutePath = relativeToFile(this.path, file);
                    }
                };
                RelativeViewStrategy = __decorate([
                    viewStrategy()
                ], RelativeViewStrategy);
                return RelativeViewStrategy;
            }()));
            var ConventionalViewStrategy = exports('ConventionalViewStrategy', (function () {
                function ConventionalViewStrategy(viewLocator, origin) {
                    this.moduleId = origin.moduleId;
                    this.viewUrl = viewLocator.convertOriginToViewUrl(origin);
                }
                ConventionalViewStrategy.prototype.loadViewFactory = function (viewEngine, compileInstruction, loadContext, target) {
                    compileInstruction.associatedModuleId = this.moduleId;
                    return viewEngine.loadViewFactory(this.viewUrl, compileInstruction, loadContext, target);
                };
                ConventionalViewStrategy = __decorate([
                    viewStrategy()
                ], ConventionalViewStrategy);
                return ConventionalViewStrategy;
            }()));
            var NoViewStrategy = exports('NoViewStrategy', (function () {
                function NoViewStrategy(dependencies, dependencyBaseUrl) {
                    this.dependencies = dependencies || null;
                    this.dependencyBaseUrl = dependencyBaseUrl || '';
                }
                NoViewStrategy.prototype.loadViewFactory = function (viewEngine, compileInstruction, loadContext, target) {
                    var entry = this.entry;
                    var dependencies = this.dependencies;
                    if (entry && entry.factoryIsReady) {
                        return Promise.resolve(null);
                    }
                    this.entry = entry = new TemplateRegistryEntry(this.moduleId || this.dependencyBaseUrl);
                    entry.dependencies = [];
                    entry.templateIsLoaded = true;
                    if (dependencies !== null) {
                        for (var i = 0, ii = dependencies.length; i < ii; ++i) {
                            var current = dependencies[i];
                            if (typeof current === 'string' || typeof current === 'function') {
                                entry.addDependency(current);
                            }
                            else {
                                entry.addDependency(current.from, current.as);
                            }
                        }
                    }
                    compileInstruction.associatedModuleId = this.moduleId;
                    return viewEngine.loadViewFactory(entry, compileInstruction, loadContext, target);
                };
                NoViewStrategy = __decorate([
                    viewStrategy()
                ], NoViewStrategy);
                return NoViewStrategy;
            }()));
            var TemplateRegistryViewStrategy = exports('TemplateRegistryViewStrategy', (function () {
                function TemplateRegistryViewStrategy(moduleId, entry) {
                    this.moduleId = moduleId;
                    this.entry = entry;
                }
                TemplateRegistryViewStrategy.prototype.loadViewFactory = function (viewEngine, compileInstruction, loadContext, target) {
                    var entry = this.entry;
                    if (entry.factoryIsReady) {
                        return Promise.resolve(entry.factory);
                    }
                    compileInstruction.associatedModuleId = this.moduleId;
                    return viewEngine.loadViewFactory(entry, compileInstruction, loadContext, target);
                };
                TemplateRegistryViewStrategy = __decorate([
                    viewStrategy()
                ], TemplateRegistryViewStrategy);
                return TemplateRegistryViewStrategy;
            }()));
            var InlineViewStrategy = exports('InlineViewStrategy', (function () {
                function InlineViewStrategy(markup, dependencies, dependencyBaseUrl) {
                    this.markup = markup;
                    this.dependencies = dependencies || null;
                    this.dependencyBaseUrl = dependencyBaseUrl || '';
                }
                InlineViewStrategy.prototype.loadViewFactory = function (viewEngine, compileInstruction, loadContext, target) {
                    var entry = this.entry;
                    var dependencies = this.dependencies;
                    if (entry && entry.factoryIsReady) {
                        return Promise.resolve(entry.factory);
                    }
                    this.entry = entry = new TemplateRegistryEntry(this.moduleId || this.dependencyBaseUrl);
                    entry.template = DOM.createTemplateFromMarkup(this.markup);
                    if (dependencies !== null) {
                        for (var i = 0, ii = dependencies.length; i < ii; ++i) {
                            var current = dependencies[i];
                            if (typeof current === 'string' || typeof current === 'function') {
                                entry.addDependency(current);
                            }
                            else {
                                entry.addDependency(current.from, current.as);
                            }
                        }
                    }
                    compileInstruction.associatedModuleId = this.moduleId;
                    return viewEngine.loadViewFactory(entry, compileInstruction, loadContext, target);
                };
                InlineViewStrategy = __decorate([
                    viewStrategy()
                ], InlineViewStrategy);
                return InlineViewStrategy;
            }()));
            var StaticViewStrategy = exports('StaticViewStrategy', (function () {
                function StaticViewStrategy(config) {
                    if (typeof config === 'string' || (config instanceof DOM.Element && config.tagName === 'TEMPLATE')) {
                        config = {
                            template: config
                        };
                    }
                    this.template = config.template;
                    this.dependencies = config.dependencies || [];
                    this.factoryIsReady = false;
                    this.onReady = null;
                    this.moduleId = 'undefined';
                }
                StaticViewStrategy.prototype.loadViewFactory = function (viewEngine, compileInstruction, loadContext, target) {
                    var _this = this;
                    if (this.factoryIsReady) {
                        return Promise.resolve(this.factory);
                    }
                    var $deps = this.dependencies;
                    var deps = typeof $deps === 'function' ? $deps() : $deps;
                    deps = deps ? deps : [];
                    deps = Array.isArray(deps) ? deps : [deps];
                    return Promise.all(deps).then(function (dependencies) {
                        var container = viewEngine.container;
                        var appResources = viewEngine.appResources;
                        var viewCompiler = viewEngine.viewCompiler;
                        var viewResources = new ViewResources(appResources);
                        var resource;
                        var elDeps = [];
                        if (target) {
                            viewResources.autoRegister(container, target);
                        }
                        for (var _i = 0, dependencies_1 = dependencies; _i < dependencies_1.length; _i++) {
                            var dep = dependencies_1[_i];
                            if (typeof dep === 'function') {
                                resource = viewResources.autoRegister(container, dep);
                                if (resource.elementName !== null) {
                                    elDeps.push(resource);
                                }
                            }
                            else if (dep && typeof dep === 'object') {
                                for (var key in dep) {
                                    var exported = dep[key];
                                    if (typeof exported === 'function') {
                                        resource = viewResources.autoRegister(container, exported);
                                        if (resource.elementName !== null) {
                                            elDeps.push(resource);
                                        }
                                    }
                                }
                            }
                            else {
                                throw new Error("dependency neither function nor object. Received: \"".concat(typeof dep, "\""));
                            }
                        }
                        return Promise.all(elDeps.map(function (el) { return el.load(container, el.target); })).then(function () {
                            var factory = _this.template !== null
                                ? viewCompiler.compile(_this.template, viewResources, compileInstruction)
                                : null;
                            _this.factoryIsReady = true;
                            _this.factory = factory;
                            return factory;
                        });
                    });
                };
                StaticViewStrategy = __decorate([
                    viewStrategy()
                ], StaticViewStrategy);
                return StaticViewStrategy;
            }()));

            function remove(viewSlot, previous) {
                return Array.isArray(previous)
                    ? viewSlot.removeMany(previous, true)
                    : viewSlot.remove(previous, true);
            }
            var SwapStrategies = exports('SwapStrategies', {
                before: function (viewSlot, previous, callback) {
                    return (previous === undefined)
                        ? callback()
                        : callback().then(function () { return remove(viewSlot, previous); });
                },
                with: function (viewSlot, previous, callback) {
                    return (previous === undefined)
                        ? callback()
                        : Promise.all([remove(viewSlot, previous), callback()]);
                },
                after: function (viewSlot, previous, callback) {
                    return Promise.resolve(viewSlot.removeAll(true)).then(callback);
                }
            });

            function tryActivateViewModel(context) {
                if (context.skipActivation || typeof context.viewModel.activate !== 'function') {
                    return Promise.resolve();
                }
                return context.viewModel.activate(context.model) || Promise.resolve();
            }
            var CompositionEngine = exports('CompositionEngine', (function () {
                function CompositionEngine(viewEngine, viewLocator) {
                    this.viewEngine = viewEngine;
                    this.viewLocator = viewLocator;
                }
                CompositionEngine.prototype._swap = function (context, view) {
                    var swapStrategy = SwapStrategies[context.swapOrder] || SwapStrategies.after;
                    var previousViews = context.viewSlot.children.slice();
                    return swapStrategy(context.viewSlot, previousViews, function () {
                        return Promise.resolve(context.viewSlot.add(view)).then(function () {
                            if (context.currentController) {
                                context.currentController.unbind();
                            }
                        });
                    }).then(function () {
                        if (context.compositionTransactionNotifier) {
                            context.compositionTransactionNotifier.done();
                        }
                    });
                };
                CompositionEngine.prototype._createControllerAndSwap = function (context) {
                    var _this = this;
                    return this.createController(context).then(function (controller) {
                        if (context.compositionTransactionOwnershipToken) {
                            return context.compositionTransactionOwnershipToken
                                .waitForCompositionComplete()
                                .then(function () {
                                controller.automate(context.overrideContext, context.owningView);
                                return _this._swap(context, controller.view);
                            })
                                .then(function () { return controller; });
                        }
                        controller.automate(context.overrideContext, context.owningView);
                        return _this._swap(context, controller.view).then(function () { return controller; });
                    });
                };
                CompositionEngine.prototype.createController = function (context) {
                    var _this = this;
                    var childContainer;
                    var viewModel;
                    var viewModelResource;
                    var m;
                    return this
                        .ensureViewModel(context)
                        .then(tryActivateViewModel)
                        .then(function () {
                        childContainer = context.childContainer;
                        viewModel = context.viewModel;
                        viewModelResource = context.viewModelResource;
                        m = viewModelResource.metadata;
                        var viewStrategy = _this.viewLocator.getViewStrategy(context.view || viewModel);
                        if (context.viewResources) {
                            viewStrategy.makeRelativeTo(context.viewResources.viewUrl);
                        }
                        return m.load(childContainer, viewModelResource.value, null, viewStrategy, true);
                    }).then(function (viewFactory) { return m.create(childContainer, BehaviorInstruction.dynamic(context.host, viewModel, viewFactory)); });
                };
                CompositionEngine.prototype.ensureViewModel = function (context) {
                    var childContainer = context.childContainer = (context.childContainer || context.container.createChild());
                    if (typeof context.viewModel === 'string') {
                        context.viewModel = context.viewResources
                            ? context.viewResources.relativeToView(context.viewModel)
                            : context.viewModel;
                        return this.viewEngine.importViewModelResource(context.viewModel).then(function (viewModelResource) {
                            childContainer.autoRegister(viewModelResource.value);
                            if (context.host) {
                                childContainer.registerInstance(DOM.Element, context.host);
                            }
                            context.viewModel = childContainer.viewModel = childContainer.get(viewModelResource.value);
                            context.viewModelResource = viewModelResource;
                            return context;
                        });
                    }
                    var ctor = context.viewModel.constructor;
                    var isClass = typeof context.viewModel === 'function';
                    if (isClass) {
                        ctor = context.viewModel;
                        childContainer.autoRegister(ctor);
                    }
                    var m = metadata.getOrCreateOwn(metadata.resource, HtmlBehaviorResource, ctor);
                    m.elementName = m.elementName || 'dynamic-element';
                    m.initialize(isClass ? childContainer : (context.container || childContainer), ctor);
                    context.viewModelResource = { metadata: m, value: ctor };
                    if (context.host) {
                        childContainer.registerInstance(DOM.Element, context.host);
                    }
                    childContainer.viewModel = context.viewModel = isClass ? childContainer.get(ctor) : context.viewModel;
                    return Promise.resolve(context);
                };
                CompositionEngine.prototype.compose = function (context) {
                    var _this = this;
                    context.childContainer = context.childContainer || context.container.createChild();
                    context.view = this.viewLocator.getViewStrategy(context.view);
                    var transaction = context.childContainer.get(CompositionTransaction);
                    var compositionTransactionOwnershipToken = transaction.tryCapture();
                    if (compositionTransactionOwnershipToken) {
                        context.compositionTransactionOwnershipToken = compositionTransactionOwnershipToken;
                    }
                    else {
                        context.compositionTransactionNotifier = transaction.enlist();
                    }
                    if (context.viewModel) {
                        return this._createControllerAndSwap(context);
                    }
                    else if (context.view) {
                        if (context.viewResources) {
                            context.view.makeRelativeTo(context.viewResources.viewUrl);
                        }
                        return context.view.loadViewFactory(this.viewEngine, new ViewCompileInstruction()).then(function (viewFactory) {
                            var result = viewFactory.create(context.childContainer);
                            result.bind(context.bindingContext, context.overrideContext);
                            if (context.compositionTransactionOwnershipToken) {
                                return context.compositionTransactionOwnershipToken.waitForCompositionComplete()
                                    .then(function () { return _this._swap(context, result); })
                                    .then(function () { return result; });
                            }
                            return _this._swap(context, result).then(function () { return result; });
                        });
                    }
                    else if (context.viewSlot) {
                        context.viewSlot.removeAll();
                        if (context.compositionTransactionNotifier) {
                            context.compositionTransactionNotifier.done();
                        }
                        return Promise.resolve(null);
                    }
                    return Promise.resolve(null);
                };
                CompositionEngine = __decorate([
                    inject(ViewEngine, ViewLocator)
                ], CompositionEngine);
                return CompositionEngine;
            }()));

            var animationEvent = exports('animationEvent', {
                enterBegin: 'animation:enter:begin',
                enterActive: 'animation:enter:active',
                enterDone: 'animation:enter:done',
                enterTimeout: 'animation:enter:timeout',
                leaveBegin: 'animation:leave:begin',
                leaveActive: 'animation:leave:active',
                leaveDone: 'animation:leave:done',
                leaveTimeout: 'animation:leave:timeout',
                staggerNext: 'animation:stagger:next',
                removeClassBegin: 'animation:remove-class:begin',
                removeClassActive: 'animation:remove-class:active',
                removeClassDone: 'animation:remove-class:done',
                removeClassTimeout: 'animation:remove-class:timeout',
                addClassBegin: 'animation:add-class:begin',
                addClassActive: 'animation:add-class:active',
                addClassDone: 'animation:add-class:done',
                addClassTimeout: 'animation:add-class:timeout',
                animateBegin: 'animation:animate:begin',
                animateActive: 'animation:animate:active',
                animateDone: 'animation:animate:done',
                animateTimeout: 'animation:animate:timeout',
                sequenceBegin: 'animation:sequence:begin',
                sequenceDone: 'animation:sequence:done'
            });

            function createChildObserverDecorator(selectorOrConfig, all) {
                return function (target, key, descriptor) {
                    var actualTarget = typeof key === 'string' ? target.constructor : target;
                    var r = metadata.getOrCreateOwn(metadata.resource, HtmlBehaviorResource, actualTarget);
                    if (typeof selectorOrConfig === 'string') {
                        selectorOrConfig = {
                            selector: selectorOrConfig,
                            name: key
                        };
                    }
                    if (descriptor) {
                        descriptor.writable = true;
                        descriptor.configurable = true;
                    }
                    selectorOrConfig.all = all;
                    r.addChildBinding(new ChildObserver(selectorOrConfig));
                };
            }
            function children(selectorOrConfig) {
                return createChildObserverDecorator(selectorOrConfig, true);
            }
            function child(selectorOrConfig) {
                return createChildObserverDecorator(selectorOrConfig, false);
            }
            var ChildObserver = (function () {
                function ChildObserver(config) {
                    this.name = config.name;
                    this.changeHandler = config.changeHandler || this.name + 'Changed';
                    this.selector = config.selector;
                    this.all = config.all;
                }
                ChildObserver.prototype.create = function (viewHost, viewModel, controller) {
                    return new ChildObserverBinder(this.selector, viewHost, this.name, viewModel, controller, this.changeHandler, this.all);
                };
                return ChildObserver;
            }());
            var noMutations = [];
            function trackMutation(groupedMutations, binder, record) {
                var mutations = groupedMutations.get(binder);
                if (!mutations) {
                    mutations = [];
                    groupedMutations.set(binder, mutations);
                }
                mutations.push(record);
            }
            function onChildChange(mutations, observer) {
                var binders = observer.binders;
                var bindersLength = binders.length;
                var groupedMutations = new Map();
                for (var i = 0, ii = mutations.length; i < ii; ++i) {
                    var record = mutations[i];
                    var added = record.addedNodes;
                    var removed = record.removedNodes;
                    for (var j = 0, jj = removed.length; j < jj; ++j) {
                        var node = removed[j];
                        if (node.nodeType === 1) {
                            for (var k = 0; k < bindersLength; ++k) {
                                var binder = binders[k];
                                if (binder.onRemove(node)) {
                                    trackMutation(groupedMutations, binder, record);
                                }
                            }
                        }
                    }
                    for (var j = 0, jj = added.length; j < jj; ++j) {
                        var node = added[j];
                        if (node.nodeType === 1) {
                            for (var k = 0; k < bindersLength; ++k) {
                                var binder = binders[k];
                                if (binder.onAdd(node)) {
                                    trackMutation(groupedMutations, binder, record);
                                }
                            }
                        }
                    }
                }
                groupedMutations.forEach(function (mutationRecords, binder) {
                    if (binder.isBound && binder.changeHandler !== null) {
                        binder.viewModel[binder.changeHandler](mutationRecords);
                    }
                });
            }
            var ChildObserverBinder = (function () {
                function ChildObserverBinder(selector, viewHost, property, viewModel, controller, changeHandler, all) {
                    this.selector = selector;
                    this.viewHost = viewHost;
                    this.property = property;
                    this.viewModel = viewModel;
                    this.controller = controller;
                    this.changeHandler = changeHandler in viewModel ? changeHandler : null;
                    this.usesShadowDOM = controller.behavior.usesShadowDOM;
                    this.all = all;
                    if (!this.usesShadowDOM && controller.view && controller.view.contentView) {
                        this.contentView = controller.view.contentView;
                    }
                    else {
                        this.contentView = null;
                    }
                    this.source = null;
                    this.isBound = false;
                }
                ChildObserverBinder.prototype.matches = function (element) {
                    if (element.matches(this.selector)) {
                        if (this.contentView === null) {
                            return true;
                        }
                        var contentView = this.contentView;
                        var assignedSlot = element.auAssignedSlot;
                        if (assignedSlot && assignedSlot.projectFromAnchors) {
                            var anchors = assignedSlot.projectFromAnchors;
                            for (var i = 0, ii = anchors.length; i < ii; ++i) {
                                if (anchors[i].auOwnerView === contentView) {
                                    return true;
                                }
                            }
                            return false;
                        }
                        return element.auOwnerView === contentView;
                    }
                    return false;
                };
                ChildObserverBinder.prototype.bind = function (source) {
                    if (this.isBound) {
                        if (this.source === source) {
                            return;
                        }
                        this.source = source;
                    }
                    this.isBound = true;
                    var viewHost = this.viewHost;
                    var viewModel = this.viewModel;
                    var observer = viewHost.__childObserver__;
                    if (!observer) {
                        observer = viewHost.__childObserver__ = DOM.createMutationObserver(onChildChange);
                        var options = {
                            childList: true,
                            subtree: !this.usesShadowDOM
                        };
                        observer.observe(viewHost, options);
                        observer.binders = [];
                    }
                    observer.binders.push(this);
                    if (this.usesShadowDOM) {
                        var current = viewHost.firstElementChild;
                        if (this.all) {
                            var items = viewModel[this.property];
                            if (!items) {
                                items = viewModel[this.property] = [];
                            }
                            else {
                                items.splice(0);
                            }
                            while (current) {
                                if (this.matches(current)) {
                                    items.push(current.au && current.au.controller ? current.au.controller.viewModel : current);
                                }
                                current = current.nextElementSibling;
                            }
                            if (this.changeHandler !== null) {
                                this.viewModel[this.changeHandler](noMutations);
                            }
                        }
                        else {
                            while (current) {
                                if (this.matches(current)) {
                                    var value = current.au && current.au.controller ? current.au.controller.viewModel : current;
                                    this.viewModel[this.property] = value;
                                    if (this.changeHandler !== null) {
                                        this.viewModel[this.changeHandler](value);
                                    }
                                    break;
                                }
                                current = current.nextElementSibling;
                            }
                        }
                    }
                };
                ChildObserverBinder.prototype.onRemove = function (element) {
                    if (this.matches(element)) {
                        var value = element.au && element.au.controller ? element.au.controller.viewModel : element;
                        if (this.all) {
                            var items = (this.viewModel[this.property] || (this.viewModel[this.property] = []));
                            var index = items.indexOf(value);
                            if (index !== -1) {
                                items.splice(index, 1);
                            }
                            return true;
                        }
                        var currentValue = this.viewModel[this.property];
                        if (currentValue === value) {
                            this.viewModel[this.property] = null;
                            if (this.isBound && this.changeHandler !== null) {
                                this.viewModel[this.changeHandler](value);
                            }
                        }
                    }
                    return false;
                };
                ChildObserverBinder.prototype.onAdd = function (element) {
                    if (this.matches(element)) {
                        var value = element.au && element.au.controller ? element.au.controller.viewModel : element;
                        if (this.all) {
                            var items = (this.viewModel[this.property] || (this.viewModel[this.property] = []));
                            if (this.selector === '*') {
                                items.push(value);
                                return true;
                            }
                            var index = 0;
                            var prev = element.previousElementSibling;
                            while (prev) {
                                if (this.matches(prev)) {
                                    index++;
                                }
                                prev = prev.previousElementSibling;
                            }
                            items.splice(index, 0, value);
                            return true;
                        }
                        this.viewModel[this.property] = value;
                        if (this.isBound && this.changeHandler !== null) {
                            this.viewModel[this.changeHandler](value);
                        }
                    }
                    return false;
                };
                ChildObserverBinder.prototype.unbind = function () {
                    if (!this.isBound) {
                        return;
                    }
                    this.isBound = false;
                    this.source = null;
                    var childObserver = this.viewHost.__childObserver__;
                    if (childObserver) {
                        var binders = childObserver.binders;
                        if (binders && binders.length) {
                            var idx = binders.indexOf(this);
                            if (idx !== -1) {
                                binders.splice(idx, 1);
                            }
                            if (binders.length === 0) {
                                childObserver.disconnect();
                                this.viewHost.__childObserver__ = null;
                            }
                        }
                        if (this.usesShadowDOM) {
                            this.viewModel[this.property] = null;
                        }
                    }
                };
                return ChildObserverBinder;
            }());

            var ElementConfigResource = exports('ElementConfigResource', (function () {
                function ElementConfigResource() {
                }
                ElementConfigResource.prototype.initialize = function (container, target) { };
                ElementConfigResource.prototype.register = function (registry, name) { };
                ElementConfigResource.prototype.load = function (container, target) {
                    var config = new target();
                    var eventManager = container.get(EventManager);
                    eventManager.registerElementConfig(config);
                };
                return ElementConfigResource;
            }()));

            function resource(instanceOrConfig) {
                return function (target) {
                    var isConfig = typeof instanceOrConfig === 'string' || Object.getPrototypeOf(instanceOrConfig) === Object.prototype;
                    if (isConfig) {
                        target.$resource = instanceOrConfig;
                    }
                    else {
                        metadata.define(metadata.resource, instanceOrConfig, target);
                    }
                };
            }
            function behavior(override) {
                return function (target) {
                    if (override instanceof HtmlBehaviorResource) {
                        metadata.define(metadata.resource, override, target);
                    }
                    else {
                        var r = metadata.getOrCreateOwn(metadata.resource, HtmlBehaviorResource, target);
                        Object.assign(r, override);
                    }
                };
            }
            function customElement(name) {
                return function (target) {
                    var r = metadata.getOrCreateOwn(metadata.resource, HtmlBehaviorResource, target);
                    r.elementName = validateBehaviorName(name, 'custom element');
                };
            }
            function customAttribute(name, defaultBindingMode, aliases) {
                return function (target) {
                    var r = metadata.getOrCreateOwn(metadata.resource, HtmlBehaviorResource, target);
                    r.attributeName = validateBehaviorName(name, 'custom attribute');
                    r.attributeDefaultBindingMode = defaultBindingMode;
                    r.aliases = aliases;
                };
            }
            function templateController(target) {
                var deco = function (t) {
                    var r = metadata.getOrCreateOwn(metadata.resource, HtmlBehaviorResource, t);
                    r.liftsContent = true;
                };
                return target ? deco(target) : deco;
            }
            function bindable(nameOrConfigOrTarget, key, descriptor) {
                var deco = function (target, key2, descriptor2) {
                    var actualTarget = key2 ? target.constructor : target;
                    var r = metadata.getOrCreateOwn(metadata.resource, HtmlBehaviorResource, actualTarget);
                    var prop;
                    if (key2) {
                        nameOrConfigOrTarget = nameOrConfigOrTarget || {};
                        nameOrConfigOrTarget.name = key2;
                    }
                    prop = new BindableProperty(nameOrConfigOrTarget);
                    return prop.registerWith(actualTarget, r, descriptor2);
                };
                if (!nameOrConfigOrTarget) {
                    return deco;
                }
                if (key) {
                    var target = nameOrConfigOrTarget;
                    nameOrConfigOrTarget = null;
                    return deco(target, key, descriptor);
                }
                return deco;
            }
            function dynamicOptions(target) {
                var deco = function (t) {
                    var r = metadata.getOrCreateOwn(metadata.resource, HtmlBehaviorResource, t);
                    r.hasDynamicOptions = true;
                };
                return target ? deco(target) : deco;
            }
            var defaultShadowDOMOptions = { mode: 'open' };
            function useShadowDOM(targetOrOptions) {
                var options = typeof targetOrOptions === 'function' || !targetOrOptions
                    ? defaultShadowDOMOptions
                    : targetOrOptions;
                var deco = function (t) {
                    var r = metadata.getOrCreateOwn(metadata.resource, HtmlBehaviorResource, t);
                    r.targetShadowDOM = true;
                    r.shadowDOMOptions = options;
                };
                return typeof targetOrOptions === 'function' ? deco(targetOrOptions) : deco;
            }
            function processAttributes(processor) {
                return function (t) {
                    var r = metadata.getOrCreateOwn(metadata.resource, HtmlBehaviorResource, t);
                    r.processAttributes = function (compiler, resources, node, attributes, elementInstruction) {
                        try {
                            processor(compiler, resources, node, attributes, elementInstruction);
                        }
                        catch (error) {
                            LogManager.getLogger('templating').error(error);
                        }
                    };
                };
            }
            function doNotProcessContent() { return false; }
            function processContent(processor) {
                return function (t) {
                    var r = metadata.getOrCreateOwn(metadata.resource, HtmlBehaviorResource, t);
                    r.processContent = processor ? function (compiler, resources, node, instruction) {
                        try {
                            return processor(compiler, resources, node, instruction);
                        }
                        catch (error) {
                            LogManager.getLogger('templating').error(error);
                            return false;
                        }
                    } : doNotProcessContent;
                };
            }
            function containerless(target) {
                var deco = function (t) {
                    var r = metadata.getOrCreateOwn(metadata.resource, HtmlBehaviorResource, t);
                    r.containerless = true;
                };
                return target ? deco(target) : deco;
            }
            function useViewStrategy(strategy) {
                return function (target) {
                    metadata.define(ViewLocator.viewStrategyMetadataKey, strategy, target);
                };
            }
            function useView(path) {
                return useViewStrategy(new RelativeViewStrategy(path));
            }
            function inlineView(markup, dependencies, dependencyBaseUrl) {
                return useViewStrategy(new InlineViewStrategy(markup, dependencies, dependencyBaseUrl));
            }
            function noView(targetOrDependencies, dependencyBaseUrl) {
                var target;
                var dependencies;
                if (typeof targetOrDependencies === 'function') {
                    target = targetOrDependencies;
                }
                else {
                    dependencies = targetOrDependencies;
                    target = undefined;
                }
                var deco = function (t) {
                    metadata.define(ViewLocator.viewStrategyMetadataKey, new NoViewStrategy(dependencies, dependencyBaseUrl), t);
                };
                return target ? deco(target) : deco;
            }
            function view(templateOrConfig) {
                return function (target) {
                    target.$view = templateOrConfig;
                };
            }
            function elementConfig(target) {
                var deco = function (t) {
                    metadata.define(metadata.resource, new ElementConfigResource(), t);
                };
                return target ? deco(target) : deco;
            }
            function viewResources() {
                var resources = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    resources[_i] = arguments[_i];
                }
                return function (target) {
                    metadata.define(ViewEngine.viewModelRequireMetadataKey, resources, target);
                };
            }

            var TemplatingEngine = exports('TemplatingEngine', (function () {
                function TemplatingEngine(container, moduleAnalyzer, viewCompiler, compositionEngine) {
                    this._container = container;
                    this._moduleAnalyzer = moduleAnalyzer;
                    this._viewCompiler = viewCompiler;
                    this._compositionEngine = compositionEngine;
                    container.registerInstance(Animator, Animator.instance = new Animator());
                }
                TemplatingEngine.prototype.configureAnimator = function (animator) {
                    this._container.unregister(Animator);
                    this._container.registerInstance(Animator, Animator.instance = animator);
                };
                TemplatingEngine.prototype.compose = function (context) {
                    return this._compositionEngine.compose(context);
                };
                TemplatingEngine.prototype.enhance = function (instruction) {
                    if (instruction instanceof DOM.Element) {
                        instruction = { element: instruction };
                    }
                    var compilerInstructions = { letExpressions: [] };
                    var resources = instruction.resources || this._container.get(ViewResources);
                    this._viewCompiler._compileNode(instruction.element, resources, compilerInstructions, instruction.element.parentNode, 'root', true);
                    var factory = new ViewFactory(instruction.element, compilerInstructions, resources);
                    var container = instruction.container || this._container.createChild();
                    var view = factory.create(container, BehaviorInstruction.enhance());
                    view.bind(instruction.bindingContext || {}, instruction.overrideContext);
                    view.firstChild = view.lastChild = view.fragment;
                    view.fragment = DOM.createDocumentFragment();
                    view.attached();
                    return view;
                };
                TemplatingEngine.inject = [Container, ModuleAnalyzer, ViewCompiler, CompositionEngine];
                return TemplatingEngine;
            }()));

        })
    };
}));
//# sourceMappingURL=aurelia-templating.js.map
