define(['exports', 'core-js', 'aurelia-metadata', 'aurelia-path', 'aurelia-loader', 'aurelia-dependency-injection', 'aurelia-binding', 'aurelia-task-queue', 'aurelia-logging'], function (exports, _coreJs, _aureliaMetadata, _aureliaPath, _aureliaLoader, _aureliaDependencyInjection, _aureliaBinding, _aureliaTaskQueue, _aureliaLogging) {
  'use strict';

  exports.__esModule = true;

  var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

  exports.createTemplateFromMarkup = createTemplateFromMarkup;
  exports.replaceNode = replaceNode;
  exports.removeNode = removeNode;
  exports.hyphenate = hyphenate;
  exports.nextElementSibling = nextElementSibling;
  exports.behavior = behavior;
  exports.customElement = customElement;
  exports.customAttribute = customAttribute;
  exports.templateController = templateController;
  exports.bindable = bindable;
  exports.dynamicOptions = dynamicOptions;
  exports.sync = sync;
  exports.useShadowDOM = useShadowDOM;
  exports.skipContentProcessing = skipContentProcessing;
  exports.processContent = processContent;
  exports.containerless = containerless;
  exports.viewStrategy = viewStrategy;
  exports.useView = useView;
  exports.inlineView = inlineView;
  exports.noView = noView;
  exports.elementConfig = elementConfig;

  function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

  function _inherits(subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; }

  function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

  var _core = _interopRequireDefault(_coreJs);

  var needsTemplateFixup = !('content' in document.createElement('template'));
  var shadowPoly = window.ShadowDOMPolyfill || null;

  var DOMBoundary = 'aurelia-dom-boundary';

  exports.DOMBoundary = DOMBoundary;

  function createTemplateFromMarkup(markup) {
    var temp = document.createElement('template');
    temp.innerHTML = markup;

    if (needsTemplateFixup) {
      temp.content = document.createDocumentFragment();
      while (temp.firstChild) {
        temp.content.appendChild(temp.firstChild);
      }
    }

    return temp;
  }

  function replaceNode(newNode, node, parentNode) {
    if (node.parentNode) {
      node.parentNode.replaceChild(newNode, node);
    } else if (shadowPoly) {
      shadowPoly.unwrap(parentNode).replaceChild(shadowPoly.unwrap(newNode), shadowPoly.unwrap(node));
    } else {
      parentNode.replaceChild(newNode, node);
    }
  }

  function removeNode(node, parentNode) {
    if (node.parentNode) {
      node.parentNode.removeChild(node);
    } else if (shadowPoly) {
      shadowPoly.unwrap(parentNode).removeChild(shadowPoly.unwrap(node));
    } else {
      parentNode.removeChild(node);
    }
  }

  var animationEvent = {
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
  };

  exports.animationEvent = animationEvent;

  var Animator = (function () {
    function Animator() {
      _classCallCheck(this, Animator);
    }

    Animator.configureDefault = function configureDefault(container, animatorInstance) {
      container.registerInstance(Animator, Animator.instance = animatorInstance || new Animator());
    };

    Animator.prototype.move = function move() {
      return Promise.resolve(false);
    };

    Animator.prototype.enter = function enter(element) {
      return Promise.resolve(false);
    };

    Animator.prototype.leave = function leave(element) {
      return Promise.resolve(false);
    };

    Animator.prototype.removeClass = function removeClass(element, className) {
      return Promise.resolve(false);
    };

    Animator.prototype.addClass = function addClass(element, className) {
      return Promise.resolve(false);
    };

    Animator.prototype.animate = function animate(element, className, options) {
      return Promise.resolve(false);
    };

    Animator.prototype.runSequence = function runSequence(sequence) {};

    Animator.prototype.registerEffect = function registerEffect(effectName, properties) {};

    Animator.prototype.unregisterEffect = function unregisterEffect(effectName) {};

    return Animator;
  })();

  exports.Animator = Animator;

  var capitalMatcher = /([A-Z])/g;

  function addHyphenAndLower(char) {
    return '-' + char.toLowerCase();
  }

  function hyphenate(name) {
    return (name.charAt(0).toLowerCase() + name.slice(1)).replace(capitalMatcher, addHyphenAndLower);
  }

  function nextElementSibling(element) {
    if (element.nextElementSibling) {
      return element.nextElementSibling;
    }
    do {
      element = element.nextSibling;
    } while (element && element.nodeType !== 1);
    return element;
  }

  var ViewStrategy = (function () {
    function ViewStrategy() {
      _classCallCheck(this, ViewStrategy);
    }

    ViewStrategy.prototype.makeRelativeTo = function makeRelativeTo(baseUrl) {};

    ViewStrategy.normalize = function normalize(value) {
      if (typeof value === 'string') {
        value = new UseViewStrategy(value);
      }

      if (value && !(value instanceof ViewStrategy)) {
        throw new Error('The view must be a string or an instance of ViewStrategy.');
      }

      return value;
    };

    ViewStrategy.getDefault = function getDefault(target) {
      var strategy, annotation;

      if (typeof target !== 'function') {
        target = target.constructor;
      }

      annotation = _aureliaMetadata.Origin.get(target);
      strategy = _aureliaMetadata.Metadata.get(ViewStrategy.metadataKey, target);

      if (!strategy) {
        if (!annotation) {
          throw new Error('Cannot determinte default view strategy for object.', target);
        }

        strategy = new ConventionalViewStrategy(annotation.moduleId);
      } else if (annotation) {
        strategy.moduleId = annotation.moduleId;
      }

      return strategy;
    };

    _createClass(ViewStrategy, null, [{
      key: 'metadataKey',
      value: 'aurelia:view-strategy',
      enumerable: true
    }]);

    return ViewStrategy;
  })();

  exports.ViewStrategy = ViewStrategy;

  var UseViewStrategy = (function (_ViewStrategy) {
    function UseViewStrategy(path) {
      _classCallCheck(this, UseViewStrategy);

      _ViewStrategy.call(this);
      this.path = path;
    }

    _inherits(UseViewStrategy, _ViewStrategy);

    UseViewStrategy.prototype.loadViewFactory = function loadViewFactory(viewEngine, options, loadContext) {
      if (!this.absolutePath && this.moduleId) {
        this.absolutePath = _aureliaPath.relativeToFile(this.path, this.moduleId);
      }

      return viewEngine.loadViewFactory(this.absolutePath || this.path, options, this.moduleId, loadContext);
    };

    UseViewStrategy.prototype.makeRelativeTo = function makeRelativeTo(file) {
      this.absolutePath = _aureliaPath.relativeToFile(this.path, file);
    };

    return UseViewStrategy;
  })(ViewStrategy);

  exports.UseViewStrategy = UseViewStrategy;

  var ConventionalViewStrategy = (function (_ViewStrategy2) {
    function ConventionalViewStrategy(moduleId) {
      _classCallCheck(this, ConventionalViewStrategy);

      _ViewStrategy2.call(this);
      this.moduleId = moduleId;
      this.viewUrl = ConventionalViewStrategy.convertModuleIdToViewUrl(moduleId);
    }

    _inherits(ConventionalViewStrategy, _ViewStrategy2);

    ConventionalViewStrategy.prototype.loadViewFactory = function loadViewFactory(viewEngine, options, loadContext) {
      return viewEngine.loadViewFactory(this.viewUrl, options, this.moduleId, loadContext);
    };

    ConventionalViewStrategy.convertModuleIdToViewUrl = function convertModuleIdToViewUrl(moduleId) {
      var id = moduleId.endsWith('.js') || moduleId.endsWith('.ts') ? moduleId.substring(0, moduleId.length - 3) : moduleId;
      return id + '.html';
    };

    return ConventionalViewStrategy;
  })(ViewStrategy);

  exports.ConventionalViewStrategy = ConventionalViewStrategy;

  var NoViewStrategy = (function (_ViewStrategy3) {
    function NoViewStrategy() {
      _classCallCheck(this, NoViewStrategy);

      _ViewStrategy3.apply(this, arguments);
    }

    _inherits(NoViewStrategy, _ViewStrategy3);

    NoViewStrategy.prototype.loadViewFactory = function loadViewFactory(viewEngine, options, loadContext) {
      return Promise.resolve(null);
    };

    return NoViewStrategy;
  })(ViewStrategy);

  exports.NoViewStrategy = NoViewStrategy;

  var TemplateRegistryViewStrategy = (function (_ViewStrategy4) {
    function TemplateRegistryViewStrategy(moduleId, entry) {
      _classCallCheck(this, TemplateRegistryViewStrategy);

      _ViewStrategy4.call(this);
      this.moduleId = moduleId;
      this.entry = entry;
    }

    _inherits(TemplateRegistryViewStrategy, _ViewStrategy4);

    TemplateRegistryViewStrategy.prototype.loadViewFactory = function loadViewFactory(viewEngine, options, loadContext) {
      var entry = this.entry;

      if (entry.isReady) {
        return Promise.resolve(entry.factory);
      }

      return viewEngine.loadViewFactory(entry, options, this.moduleId, loadContext);
    };

    return TemplateRegistryViewStrategy;
  })(ViewStrategy);

  exports.TemplateRegistryViewStrategy = TemplateRegistryViewStrategy;

  var InlineViewStrategy = (function (_ViewStrategy5) {
    function InlineViewStrategy(markup, dependencies, dependencyBaseUrl) {
      _classCallCheck(this, InlineViewStrategy);

      _ViewStrategy5.call(this);
      this.markup = markup;
      this.dependencies = dependencies || null;
      this.dependencyBaseUrl = dependencyBaseUrl || '';
    }

    _inherits(InlineViewStrategy, _ViewStrategy5);

    InlineViewStrategy.prototype.loadViewFactory = function loadViewFactory(viewEngine, options, loadContext) {
      var entry = this.entry,
          dependencies = this.dependencies;

      if (entry && entry.isReady) {
        return Promise.resolve(entry.factory);
      }

      this.entry = entry = new _aureliaLoader.TemplateRegistryEntry(this.moduleId || this.dependencyBaseUrl);
      entry.setTemplate(createTemplateFromMarkup(this.markup));

      if (dependencies !== null) {
        for (var i = 0, ii = dependencies.length; i < ii; ++i) {
          var current = dependencies[i];

          if (typeof current === 'string' || typeof current === 'function') {
            entry.addDependency(current);
          } else {
            entry.addDependency(current.from, current.as);
          }
        }
      }

      return viewEngine.loadViewFactory(entry, options, this.moduleId, loadContext);
    };

    return InlineViewStrategy;
  })(ViewStrategy);

  exports.InlineViewStrategy = InlineViewStrategy;

  var BindingLanguage = (function () {
    function BindingLanguage() {
      _classCallCheck(this, BindingLanguage);
    }

    BindingLanguage.prototype.inspectAttribute = function inspectAttribute(resources, attrName, attrValue) {
      throw new Error('A BindingLanguage must implement inspectAttribute(...)');
    };

    BindingLanguage.prototype.createAttributeInstruction = function createAttributeInstruction(resources, element, info, existingInstruction) {
      throw new Error('A BindingLanguage must implement createAttributeInstruction(...)');
    };

    BindingLanguage.prototype.parseText = function parseText(resources, value) {
      throw new Error('A BindingLanguage must implement parseText(...)');
    };

    return BindingLanguage;
  })();

  exports.BindingLanguage = BindingLanguage;

  function register(lookup, name, resource, type) {
    if (!name) {
      return;
    }

    var existing = lookup[name];
    if (existing) {
      if (existing != resource) {
        throw new Error('Attempted to register ' + type + ' when one with the same name already exists. Name: ' + name + '.');
      }

      return;
    }

    lookup[name] = resource;
  }

  var ResourceRegistry = (function () {
    function ResourceRegistry() {
      _classCallCheck(this, ResourceRegistry);

      this.attributes = {};
      this.elements = {};
      this.valueConverters = {};
      this.attributeMap = {};
      this.baseResourceUrl = '';
    }

    ResourceRegistry.prototype.registerElement = function registerElement(tagName, behavior) {
      register(this.elements, tagName, behavior, 'an Element');
    };

    ResourceRegistry.prototype.getElement = function getElement(tagName) {
      return this.elements[tagName];
    };

    ResourceRegistry.prototype.registerAttribute = function registerAttribute(attribute, behavior, knownAttribute) {
      this.attributeMap[attribute] = knownAttribute;
      register(this.attributes, attribute, behavior, 'an Attribute');
    };

    ResourceRegistry.prototype.getAttribute = function getAttribute(attribute) {
      return this.attributes[attribute];
    };

    ResourceRegistry.prototype.registerValueConverter = function registerValueConverter(name, valueConverter) {
      register(this.valueConverters, name, valueConverter, 'a ValueConverter');
    };

    ResourceRegistry.prototype.getValueConverter = function getValueConverter(name) {
      return this.valueConverters[name];
    };

    return ResourceRegistry;
  })();

  exports.ResourceRegistry = ResourceRegistry;

  var ViewResources = (function (_ResourceRegistry) {
    function ViewResources(parent, viewUrl) {
      _classCallCheck(this, ViewResources);

      _ResourceRegistry.call(this);
      this.parent = parent;
      this.viewUrl = viewUrl;
      this.valueConverterLookupFunction = this.getValueConverter.bind(this);
    }

    _inherits(ViewResources, _ResourceRegistry);

    ViewResources.prototype.relativeToView = function relativeToView(path) {
      return _aureliaPath.relativeToFile(path, this.viewUrl);
    };

    ViewResources.prototype.getElement = function getElement(tagName) {
      return this.elements[tagName] || this.parent.getElement(tagName);
    };

    ViewResources.prototype.mapAttribute = function mapAttribute(attribute) {
      return this.attributeMap[attribute] || this.parent.attributeMap[attribute];
    };

    ViewResources.prototype.getAttribute = function getAttribute(attribute) {
      return this.attributes[attribute] || this.parent.getAttribute(attribute);
    };

    ViewResources.prototype.getValueConverter = function getValueConverter(name) {
      return this.valueConverters[name] || this.parent.getValueConverter(name);
    };

    return ViewResources;
  })(ResourceRegistry);

  exports.ViewResources = ViewResources;

  var View = (function () {
    function View(container, fragment, behaviors, bindings, children, systemControlled, contentSelectors) {
      _classCallCheck(this, View);

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
    }

    View.prototype.created = function created(executionContext) {
      var i,
          ii,
          behaviors = this.behaviors;
      for (i = 0, ii = behaviors.length; i < ii; ++i) {
        behaviors[i].created(executionContext);
      }
    };

    View.prototype.bind = function bind(executionContext, systemUpdate) {
      var context, behaviors, bindings, children, i, ii;

      if (systemUpdate && !this.systemControlled) {
        context = this.executionContext || executionContext;
      } else {
        context = executionContext || this.executionContext;
      }

      if (this.isBound) {
        if (this.executionContext === context) {
          return;
        }

        this.unbind();
      }

      this.isBound = true;
      this.executionContext = context;

      if (this.owner) {
        this.owner.bind(context);
      }

      bindings = this.bindings;
      for (i = 0, ii = bindings.length; i < ii; ++i) {
        bindings[i].bind(context);
      }

      behaviors = this.behaviors;
      for (i = 0, ii = behaviors.length; i < ii; ++i) {
        behaviors[i].bind(context);
      }

      children = this.children;
      for (i = 0, ii = children.length; i < ii; ++i) {
        children[i].bind(context, true);
      }
    };

    View.prototype.addBinding = function addBinding(binding) {
      this.bindings.push(binding);

      if (this.isBound) {
        binding.bind(this.executionContext);
      }
    };

    View.prototype.unbind = function unbind() {
      var behaviors, bindings, children, i, ii;

      if (this.isBound) {
        this.isBound = false;

        if (this.owner) {
          this.owner.unbind();
        }

        bindings = this.bindings;
        for (i = 0, ii = bindings.length; i < ii; ++i) {
          bindings[i].unbind();
        }

        behaviors = this.behaviors;
        for (i = 0, ii = behaviors.length; i < ii; ++i) {
          behaviors[i].unbind();
        }

        children = this.children;
        for (i = 0, ii = children.length; i < ii; ++i) {
          children[i].unbind();
        }
      }
    };

    View.prototype.insertNodesBefore = function insertNodesBefore(refNode) {
      var parent = refNode.parentNode;
      parent.insertBefore(this.fragment, refNode);
    };

    View.prototype.appendNodesTo = function appendNodesTo(parent) {
      parent.appendChild(this.fragment);
    };

    View.prototype.removeNodes = function removeNodes() {
      var start = this.firstChild,
          end = this.lastChild,
          fragment = this.fragment,
          next;

      var current = start,
          loop = true,
          nodes = [];

      while (loop) {
        if (current === end) {
          loop = false;
        }

        next = current.nextSibling;
        this.fragment.appendChild(current);
        current = next;
      }
    };

    View.prototype.attached = function attached() {
      var behaviors, children, i, ii;

      if (this.isAttached) {
        return;
      }

      this.isAttached = true;

      if (this.owner) {
        this.owner.attached();
      }

      behaviors = this.behaviors;
      for (i = 0, ii = behaviors.length; i < ii; ++i) {
        behaviors[i].attached();
      }

      children = this.children;
      for (i = 0, ii = children.length; i < ii; ++i) {
        children[i].attached();
      }
    };

    View.prototype.detached = function detached() {
      var behaviors, children, i, ii;

      if (this.isAttached) {
        this.isAttached = false;

        if (this.owner) {
          this.owner.detached();
        }

        behaviors = this.behaviors;
        for (i = 0, ii = behaviors.length; i < ii; ++i) {
          behaviors[i].detached();
        }

        children = this.children;
        for (i = 0, ii = children.length; i < ii; ++i) {
          children[i].detached();
        }
      }
    };

    return View;
  })();

  exports.View = View;

  if (Element && !Element.prototype.matches) {
    var proto = Element.prototype;
    proto.matches = proto.matchesSelector || proto.mozMatchesSelector || proto.msMatchesSelector || proto.oMatchesSelector || proto.webkitMatchesSelector;
  }

  var placeholder = [];

  function findInsertionPoint(groups, index) {
    var insertionPoint;

    while (!insertionPoint && index >= 0) {
      insertionPoint = groups[index][0];
      index--;
    }

    return insertionPoint;
  }

  var ContentSelector = (function () {
    function ContentSelector(anchor, selector) {
      _classCallCheck(this, ContentSelector);

      this.anchor = anchor;
      this.selector = selector;
      this.all = !this.selector;
      this.groups = [];
    }

    ContentSelector.applySelectors = function applySelectors(view, contentSelectors, callback) {
      var currentChild = view.fragment.firstChild,
          contentMap = new Map(),
          nextSibling,
          i,
          ii,
          contentSelector;

      while (currentChild) {
        nextSibling = currentChild.nextSibling;

        if (currentChild.viewSlot) {
          var viewSlotSelectors = contentSelectors.map(function (x) {
            return x.copyForViewSlot();
          });
          currentChild.viewSlot.installContentSelectors(viewSlotSelectors);
        } else {
          for (i = 0, ii = contentSelectors.length; i < ii; i++) {
            contentSelector = contentSelectors[i];
            if (contentSelector.matches(currentChild)) {
              var elements = contentMap.get(contentSelector);
              if (!elements) {
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

      for (i = 0, ii = contentSelectors.length; i < ii; ++i) {
        contentSelector = contentSelectors[i];
        callback(contentSelector, contentMap.get(contentSelector) || placeholder);
      }
    };

    ContentSelector.prototype.copyForViewSlot = function copyForViewSlot() {
      return new ContentSelector(this.anchor, this.selector);
    };

    ContentSelector.prototype.matches = function matches(node) {
      return this.all || node.nodeType === 1 && node.matches(this.selector);
    };

    ContentSelector.prototype.add = function add(group) {
      var anchor = this.anchor,
          parent = anchor.parentNode,
          i,
          ii;

      for (i = 0, ii = group.length; i < ii; ++i) {
        parent.insertBefore(group[i], anchor);
      }

      this.groups.push(group);
    };

    ContentSelector.prototype.insert = function insert(index, group) {
      if (group.length) {
        var anchor = findInsertionPoint(this.groups, index) || this.anchor,
            parent = anchor.parentNode,
            i,
            ii;

        for (i = 0, ii = group.length; i < ii; ++i) {
          parent.insertBefore(group[i], anchor);
        }
      }

      this.groups.splice(index, 0, group);
    };

    ContentSelector.prototype.removeAt = function removeAt(index, fragment) {
      var group = this.groups[index],
          i,
          ii;

      for (i = 0, ii = group.length; i < ii; ++i) {
        fragment.appendChild(group[i]);
      }

      this.groups.splice(index, 1);
    };

    return ContentSelector;
  })();

  exports.ContentSelector = ContentSelector;

  function getAnimatableElement(view) {
    var firstChild = view.firstChild;

    if (firstChild !== null && firstChild !== undefined && firstChild.nodeType === 8) {
      var element = nextElementSibling(firstChild);

      if (element !== null && element !== undefined && element.nodeType === 1 && element.classList.contains('au-animate')) {
        return element;
      }
    }

    return null;
  }

  var ViewSlot = (function () {
    function ViewSlot(anchor, anchorIsContainer, executionContext) {
      var animator = arguments[3] === undefined ? Animator.instance : arguments[3];

      _classCallCheck(this, ViewSlot);

      this.anchor = anchor;
      this.viewAddMethod = anchorIsContainer ? 'appendNodesTo' : 'insertNodesBefore';
      this.executionContext = executionContext;
      this.animator = animator;
      this.children = [];
      this.isBound = false;
      this.isAttached = false;
      anchor.viewSlot = this;
    }

    ViewSlot.prototype.transformChildNodesIntoView = function transformChildNodesIntoView() {
      var parent = this.anchor;

      this.children.push({
        fragment: parent,
        firstChild: parent.firstChild,
        lastChild: parent.lastChild,
        removeNodes: function removeNodes() {
          var last;

          while (last = parent.lastChild) {
            parent.removeChild(last);
          }
        },
        created: function created() {},
        bind: function bind() {},
        unbind: function unbind() {},
        attached: function attached() {},
        detached: function detached() {}
      });
    };

    ViewSlot.prototype.bind = function bind(executionContext) {
      var i, ii, children;

      if (this.isBound) {
        if (this.executionContext === executionContext) {
          return;
        }

        this.unbind();
      }

      this.isBound = true;
      this.executionContext = executionContext = executionContext || this.executionContext;

      children = this.children;
      for (i = 0, ii = children.length; i < ii; ++i) {
        children[i].bind(executionContext, true);
      }
    };

    ViewSlot.prototype.unbind = function unbind() {
      var i,
          ii,
          children = this.children;
      this.isBound = false;

      for (i = 0, ii = children.length; i < ii; ++i) {
        children[i].unbind();
      }
    };

    ViewSlot.prototype.add = function add(view) {
      view[this.viewAddMethod](this.anchor);
      this.children.push(view);

      if (this.isAttached) {
        view.attached();

        var animatableElement = getAnimatableElement(view);
        if (animatableElement !== null) {
          return this.animator.enter(animatableElement);
        }
      }
    };

    ViewSlot.prototype.insert = function insert(index, view) {
      var children = this.children,
          length = children.length;

      if (index === 0 && length === 0 || index >= length) {
        return this.add(view);
      } else {
        view.insertNodesBefore(children[index].firstChild);
        children.splice(index, 0, view);

        if (this.isAttached) {
          view.attached();

          var animatableElement = getAnimatableElement(view);
          if (animatableElement !== null) {
            return this.animator.enter(animatableElement);
          }
        }
      }
    };

    ViewSlot.prototype.remove = function remove(view) {
      return this.removeAt(this.children.indexOf(view));
    };

    ViewSlot.prototype.removeAt = function removeAt(index) {
      var _this = this;

      var view = this.children[index];

      var removeAction = function removeAction() {
        view.removeNodes();
        _this.children.splice(index, 1);

        if (_this.isAttached) {
          view.detached();
        }

        return view;
      };

      var animatableElement = getAnimatableElement(view);
      if (animatableElement !== null) {
        return this.animator.leave(animatableElement).then(function () {
          return removeAction();
        });
      }

      return removeAction();
    };

    ViewSlot.prototype.removeAll = function removeAll() {
      var _this2 = this;

      var children = this.children,
          ii = children.length,
          i;

      var rmPromises = [];

      children.forEach(function (child) {
        var animatableElement = getAnimatableElement(child);
        if (animatableElement !== null) {
          rmPromises.push(_this2.animator.leave(animatableElement).then(function () {
            return child.removeNodes();
          }));
        } else {
          child.removeNodes();
        }
      });

      var removeAction = function removeAction() {
        if (_this2.isAttached) {
          for (i = 0; i < ii; ++i) {
            children[i].detached();
          }
        }

        _this2.children = [];
      };

      if (rmPromises.length > 0) {
        return Promise.all(rmPromises).then(function () {
          return removeAction();
        });
      } else {
        removeAction();
      }
    };

    ViewSlot.prototype.swap = function swap(view) {
      var _this3 = this;

      var removeResponse = this.removeAll();

      if (removeResponse !== undefined) {
        return removeResponse.then(function () {
          return _this3.add(view);
        });
      } else {
        return this.add(view);
      }
    };

    ViewSlot.prototype.attached = function attached() {
      var i, ii, children, child;

      if (this.isAttached) {
        return;
      }

      this.isAttached = true;

      children = this.children;
      for (i = 0, ii = children.length; i < ii; ++i) {
        child = children[i];
        child.attached();

        var element = child.firstChild ? nextElementSibling(child.firstChild) : null;
        if (child.firstChild && child.firstChild.nodeType === 8 && element && element.nodeType === 1 && element.classList.contains('au-animate')) {
          this.animator.enter(element);
        }
      }
    };

    ViewSlot.prototype.detached = function detached() {
      var i, ii, children;

      if (this.isAttached) {
        this.isAttached = false;
        children = this.children;
        for (i = 0, ii = children.length; i < ii; ++i) {
          children[i].detached();
        }
      }
    };

    ViewSlot.prototype.installContentSelectors = function installContentSelectors(contentSelectors) {
      this.contentSelectors = contentSelectors;
      this.add = this.contentSelectorAdd;
      this.insert = this.contentSelectorInsert;
      this.remove = this.contentSelectorRemove;
      this.removeAt = this.contentSelectorRemoveAt;
      this.removeAll = this.contentSelectorRemoveAll;
    };

    ViewSlot.prototype.contentSelectorAdd = function contentSelectorAdd(view) {
      ContentSelector.applySelectors(view, this.contentSelectors, function (contentSelector, group) {
        return contentSelector.add(group);
      });

      this.children.push(view);

      if (this.isAttached) {
        view.attached();
      }
    };

    ViewSlot.prototype.contentSelectorInsert = function contentSelectorInsert(index, view) {
      if (index === 0 && !this.children.length || index >= this.children.length) {
        this.add(view);
      } else {
        ContentSelector.applySelectors(view, this.contentSelectors, function (contentSelector, group) {
          return contentSelector.insert(index, group);
        });

        this.children.splice(index, 0, view);

        if (this.isAttached) {
          view.attached();
        }
      }
    };

    ViewSlot.prototype.contentSelectorRemove = function contentSelectorRemove(view) {
      var index = this.children.indexOf(view),
          contentSelectors = this.contentSelectors,
          i,
          ii;

      for (i = 0, ii = contentSelectors.length; i < ii; ++i) {
        contentSelectors[i].removeAt(index, view.fragment);
      }

      this.children.splice(index, 1);

      if (this.isAttached) {
        view.detached();
      }
    };

    ViewSlot.prototype.contentSelectorRemoveAt = function contentSelectorRemoveAt(index) {
      var view = this.children[index],
          contentSelectors = this.contentSelectors,
          i,
          ii;

      for (i = 0, ii = contentSelectors.length; i < ii; ++i) {
        contentSelectors[i].removeAt(index, view.fragment);
      }

      this.children.splice(index, 1);

      if (this.isAttached) {
        view.detached();
      }

      return view;
    };

    ViewSlot.prototype.contentSelectorRemoveAll = function contentSelectorRemoveAll() {
      var children = this.children,
          contentSelectors = this.contentSelectors,
          ii = children.length,
          jj = contentSelectors.length,
          i,
          j,
          view;

      for (i = 0; i < ii; ++i) {
        view = children[i];

        for (j = 0; j < jj; ++j) {
          contentSelectors[j].removeAt(0, view.fragment);
        }
      }

      if (this.isAttached) {
        for (i = 0; i < ii; ++i) {
          children[i].detached();
        }
      }

      this.children = [];
    };

    return ViewSlot;
  })();

  exports.ViewSlot = ViewSlot;

  function elementContainerGet(key) {
    if (key === Element) {
      return this.element;
    }

    if (key === BoundViewFactory) {
      if (this.boundViewFactory) {
        return this.boundViewFactory;
      }

      var factory = this.instruction.viewFactory,
          partReplacements = this.partReplacements;

      if (partReplacements) {
        factory = partReplacements[factory.part] || factory;
      }

      return this.boundViewFactory = new BoundViewFactory(this, factory, this.executionContext, partReplacements);
    }

    if (key === ViewSlot) {
      if (this.viewSlot === undefined) {
        this.viewSlot = new ViewSlot(this.element, this.instruction.anchorIsContainer, this.executionContext);
        this.children.push(this.viewSlot);
      }

      return this.viewSlot;
    }

    if (key === ViewResources) {
      return this.viewResources;
    }

    return this.superGet(key);
  }

  function createElementContainer(parent, element, instruction, executionContext, children, partReplacements, resources) {
    var container = parent.createChild(),
        providers,
        i;

    container.element = element;
    container.instruction = instruction;
    container.executionContext = executionContext;
    container.children = children;
    container.viewResources = resources;
    container.partReplacements = partReplacements;

    providers = instruction.providers;
    i = providers.length;

    while (i--) {
      container.registerSingleton(providers[i]);
    }

    container.superGet = container.get;
    container.get = elementContainerGet;

    return container;
  }

  function makeElementIntoAnchor(element, isCustomElement) {
    var anchor = document.createComment('anchor');

    if (isCustomElement) {
      anchor.hasAttribute = function (name) {
        return element.hasAttribute(name);
      };
      anchor.getAttribute = function (name) {
        return element.getAttribute(name);
      };
      anchor.setAttribute = function (name, value) {
        element.setAttribute(name, value);
      };
    }

    element.parentNode.replaceChild(anchor, element);

    return anchor;
  }

  function applyInstructions(containers, executionContext, element, instruction, behaviors, bindings, children, contentSelectors, partReplacements, resources) {
    var behaviorInstructions = instruction.behaviorInstructions,
        expressions = instruction.expressions,
        elementContainer,
        i,
        ii,
        current,
        instance;

    if (instruction.contentExpression) {
      bindings.push(instruction.contentExpression.createBinding(element.nextSibling));
      element.parentNode.removeChild(element);
      return;
    }

    if (instruction.contentSelector) {
      var commentAnchor = document.createComment('anchor');
      element.parentNode.replaceChild(commentAnchor, element);
      contentSelectors.push(new ContentSelector(commentAnchor, instruction.selector));
      return;
    }

    if (behaviorInstructions.length) {
      if (!instruction.anchorIsContainer) {
        element = makeElementIntoAnchor(element, instruction.isCustomElement);
      }

      containers[instruction.injectorId] = elementContainer = createElementContainer(containers[instruction.parentInjectorId], element, instruction, executionContext, children, partReplacements, resources);

      for (i = 0, ii = behaviorInstructions.length; i < ii; ++i) {
        current = behaviorInstructions[i];
        instance = current.type.create(elementContainer, current, element, bindings, current.partReplacements);

        if (instance.contentView) {
          children.push(instance.contentView);
        }

        behaviors.push(instance);
      }
    }

    for (i = 0, ii = expressions.length; i < ii; ++i) {
      bindings.push(expressions[i].createBinding(element));
    }
  }

  function styleStringToObject(style, target) {
    var attributes = style.split(';'),
        firstIndexOfColon,
        i,
        current,
        key,
        value;

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

  function applySurrogateInstruction(container, element, instruction, behaviors, bindings, children) {
    var behaviorInstructions = instruction.behaviorInstructions,
        expressions = instruction.expressions,
        providers = instruction.providers,
        values = instruction.values,
        i = undefined,
        ii = undefined,
        current = undefined,
        instance = undefined,
        currentAttributeValue = undefined,
        styleParts = undefined;

    i = providers.length;
    while (i--) {
      container.registerSingleton(providers[i]);
    }

    for (var key in values) {
      currentAttributeValue = element.getAttribute(key);

      if (currentAttributeValue) {
        if (key === 'class') {
          if (currentAttributeValue !== 'au-target') {
            element.setAttribute('class', currentAttributeValue + ' ' + values[key]);
          }
        } else if (key === 'style') {
          var styleObject = styleStringToObject(values[key]);
          styleStringToObject(currentAttributeValue, styleObject);
          element.setAttribute('style', styleObjectToString(styleObject));
        }
      } else {
        element.setAttribute(key, values[key]);
      }
    }

    if (behaviorInstructions.length) {
      for (i = 0, ii = behaviorInstructions.length; i < ii; ++i) {
        current = behaviorInstructions[i];
        instance = current.type.create(container, current, element, bindings, current.partReplacements);

        if (instance.contentView) {
          children.push(instance.contentView);
        }

        behaviors.push(instance);
      }
    }

    for (i = 0, ii = expressions.length; i < ii; ++i) {
      bindings.push(expressions[i].createBinding(element));
    }
  }

  var BoundViewFactory = (function () {
    function BoundViewFactory(parentContainer, viewFactory, executionContext, partReplacements) {
      _classCallCheck(this, BoundViewFactory);

      this.parentContainer = parentContainer;
      this.viewFactory = viewFactory;
      this.executionContext = executionContext;
      this.factoryOptions = { behaviorInstance: false, partReplacements: partReplacements };
    }

    BoundViewFactory.prototype.create = function create(executionContext) {
      var childContainer = this.parentContainer.createChild(),
          context = executionContext || this.executionContext;

      this.factoryOptions.systemControlled = !executionContext;

      return this.viewFactory.create(childContainer, context, this.factoryOptions);
    };

    return BoundViewFactory;
  })();

  exports.BoundViewFactory = BoundViewFactory;

  var defaultFactoryOptions = {
    systemControlled: false,
    suppressBind: false,
    enhance: false
  };

  var ViewFactory = (function () {
    function ViewFactory(template, instructions, resources) {
      _classCallCheck(this, ViewFactory);

      this.template = template;
      this.instructions = instructions;
      this.resources = resources;
    }

    ViewFactory.prototype.create = function create(container, executionContext) {
      var options = arguments[2] === undefined ? defaultFactoryOptions : arguments[2];
      var element = arguments[3] === undefined ? null : arguments[3];

      var fragment = options.enhance ? this.template : this.template.cloneNode(true),
          instructables = fragment.querySelectorAll('.au-target'),
          instructions = this.instructions,
          resources = this.resources,
          behaviors = [],
          bindings = [],
          children = [],
          contentSelectors = [],
          containers = { root: container },
          partReplacements = options.partReplacements,
          i,
          ii,
          view,
          instructable,
          instruction;

      if (element !== null && this.surrogateInstruction !== null) {
        applySurrogateInstruction(container, element, this.surrogateInstruction, behaviors, bindings, children);
      }

      for (i = 0, ii = instructables.length; i < ii; ++i) {
        instructable = instructables[i];
        instruction = instructions[instructable.getAttribute('au-target-id')];

        applyInstructions(containers, executionContext, instructable, instruction, behaviors, bindings, children, contentSelectors, partReplacements, resources);
      }

      view = new View(container, fragment, behaviors, bindings, children, options.systemControlled, contentSelectors);
      view.created(executionContext);

      if (!options.suppressBind) {
        view.bind(executionContext);
      }

      return view;
    };

    return ViewFactory;
  })();

  exports.ViewFactory = ViewFactory;

  var nextInjectorId = 0,
      defaultCompileOptions = { targetShadowDOM: false },
      hasShadowDOM = !!HTMLElement.prototype.createShadowRoot;

  function getNextInjectorId() {
    return ++nextInjectorId;
  }

  function configureProperties(instruction, resources) {
    var type = instruction.type,
        attrName = instruction.attrName,
        attributes = instruction.attributes,
        property,
        key,
        value;

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
        } else {
          value.targetProperty = key;
        }
      }
    }
  }

  var lastAUTargetID = 0;
  function getNextAUTargetID() {
    return (++lastAUTargetID).toString();
  }

  function makeIntoInstructionTarget(element) {
    var value = element.getAttribute('class'),
        auTargetID = getNextAUTargetID();

    element.setAttribute('class', value ? value += ' au-target' : 'au-target');
    element.setAttribute('au-target-id', auTargetID);

    return auTargetID;
  }

  var ViewCompiler = (function () {
    function ViewCompiler(bindingLanguage) {
      _classCallCheck(this, ViewCompiler);

      this.bindingLanguage = bindingLanguage;
    }

    ViewCompiler.inject = function inject() {
      return [BindingLanguage];
    };

    ViewCompiler.prototype.compile = function compile(templateOrFragment, resources) {
      var options = arguments[2] === undefined ? defaultCompileOptions : arguments[2];

      var instructions = {},
          targetShadowDOM = options.targetShadowDOM,
          content,
          part,
          factory;

      targetShadowDOM = targetShadowDOM && hasShadowDOM;

      if (options.beforeCompile) {
        options.beforeCompile(templateOrFragment);
      }

      if (typeof templateOrFragment === 'string') {
        templateOrFragment = createTemplateFromMarkup(templateOrFragment);
      }

      if (templateOrFragment.content) {
        part = templateOrFragment.getAttribute('part');
        content = document.adoptNode(templateOrFragment.content, true);
      } else {
        content = templateOrFragment;
      }

      this.compileNode(content, resources, instructions, templateOrFragment, 'root', !targetShadowDOM);

      content.insertBefore(document.createComment('<view>'), content.firstChild);
      content.appendChild(document.createComment('</view>'));

      var factory = new ViewFactory(content, instructions, resources);
      factory.surrogateInstruction = options.compileSurrogate ? this.compileSurrogate(templateOrFragment, resources) : null;

      if (part) {
        factory.part = part;
      }

      return factory;
    };

    ViewCompiler.prototype.compileNode = function compileNode(node, resources, instructions, parentNode, parentInjectorId, targetLightDOM) {
      switch (node.nodeType) {
        case 1:
          return this.compileElement(node, resources, instructions, parentNode, parentInjectorId, targetLightDOM);
        case 3:
          var expression = this.bindingLanguage.parseText(resources, node.wholeText);
          if (expression) {
            var marker = document.createElement('au-marker'),
                auTargetID = makeIntoInstructionTarget(marker);
            (node.parentNode || parentNode).insertBefore(marker, node);
            node.textContent = ' ';
            instructions[auTargetID] = { contentExpression: expression };

            while (node.nextSibling && node.nextSibling.nodeType === 3) {
              (node.parentNode || parentNode).removeChild(node.nextSibling);
            }
          } else {
            while (node.nextSibling && node.nextSibling.nodeType === 3) {
              node = node.nextSibling;
            }
          }
          return node.nextSibling;
        case 11:
          var currentChild = node.firstChild;
          while (currentChild) {
            currentChild = this.compileNode(currentChild, resources, instructions, node, parentInjectorId, targetLightDOM);
          }
          break;
      }

      return node.nextSibling;
    };

    ViewCompiler.prototype.compileSurrogate = function compileSurrogate(node, resources) {
      var attributes = node.attributes,
          bindingLanguage = this.bindingLanguage,
          knownAttribute = undefined,
          property = undefined,
          instruction = undefined,
          i = undefined,
          ii = undefined,
          attr = undefined,
          attrName = undefined,
          attrValue = undefined,
          info = undefined,
          type = undefined,
          expressions = [],
          expression = undefined,
          behaviorInstructions = [],
          values = {},
          hasValues = false,
          providers = [];

      for (i = 0, ii = attributes.length; i < ii; ++i) {
        attr = attributes[i];
        attrName = attr.name;
        attrValue = attr.value;

        info = bindingLanguage.inspectAttribute(resources, attrName, attrValue);
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
            }
          }
        }

        instruction = bindingLanguage.createAttributeInstruction(resources, node, info);

        if (instruction) {
          if (instruction.alteredAttr) {
            type = resources.getAttribute(instruction.attrName);
          }

          if (instruction.discrete) {
            expressions.push(instruction);
          } else {
            if (type) {
              instruction.type = type;
              configureProperties(instruction, resources);

              if (type.liftsContent) {
                throw new Error('You cannot place a template controller on a surrogate element.');
              } else {
                behaviorInstructions.push(instruction);
              }
            } else {
              expressions.push(instruction.attributes[instruction.attrName]);
            }
          }
        } else {
          if (type) {
            instruction = { attrName: attrName, type: type, attributes: {} };
            instruction.attributes[resources.mapAttribute(attrName)] = attrValue;

            if (type.liftsContent) {
              throw new Error('You cannot place a template controller on a surrogate element.');
            } else {
              behaviorInstructions.push(instruction);
            }
          } else if (attrName !== 'id' && attrName !== 'part' && attrName !== 'replace-part') {
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

        return {
          anchorIsContainer: false,
          isCustomElement: false,
          injectorId: null,
          parentInjectorId: null,
          expressions: expressions,
          behaviorInstructions: behaviorInstructions,
          providers: providers,
          values: values
        };
      }

      return null;
    };

    ViewCompiler.prototype.compileElement = function compileElement(node, resources, instructions, parentNode, parentInjectorId, targetLightDOM) {
      var tagName = node.tagName.toLowerCase(),
          attributes = node.attributes,
          expressions = [],
          expression,
          behaviorInstructions = [],
          providers = [],
          bindingLanguage = this.bindingLanguage,
          liftingInstruction,
          viewFactory,
          type,
          elementInstruction,
          elementProperty,
          i,
          ii,
          attr,
          attrName,
          attrValue,
          instruction,
          info,
          property,
          knownAttribute,
          auTargetID,
          injectorId;

      if (tagName === 'content') {
        if (targetLightDOM) {
          auTargetID = makeIntoInstructionTarget(node);
          instructions[auTargetID] = {
            parentInjectorId: parentInjectorId,
            contentSelector: true,
            selector: node.getAttribute('select'),
            suppressBind: true
          };
        }
        return node.nextSibling;
      } else if (tagName === 'template') {
        viewFactory = this.compile(node, resources);
        viewFactory.part = node.getAttribute('part');
      } else {
        type = resources.getElement(tagName);
        if (type) {
          elementInstruction = { type: type, attributes: {} };
          elementInstruction.anchorIsContainer = !node.hasAttribute('containerless') && !type.containerless;
          behaviorInstructions.push(elementInstruction);
        }
      }

      for (i = 0, ii = attributes.length; i < ii; ++i) {
        attr = attributes[i];
        attrName = attr.name;
        attrValue = attr.value;
        info = bindingLanguage.inspectAttribute(resources, attrName, attrValue);
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
            }
          }
        } else if (elementInstruction) {
          elementProperty = elementInstruction.type.attributes[info.attrName];
          if (elementProperty) {
            info.defaultBindingMode = elementProperty.defaultBindingMode;

            if (!info.command && !info.expression) {
              info.command = elementProperty.hasOptions ? 'options' : null;
            }
          }
        }

        if (elementProperty) {
          instruction = bindingLanguage.createAttributeInstruction(resources, node, info, elementInstruction);
        } else {
          instruction = bindingLanguage.createAttributeInstruction(resources, node, info);
        }

        if (instruction) {
          if (instruction.alteredAttr) {
            type = resources.getAttribute(instruction.attrName);
          }

          if (instruction.discrete) {
            expressions.push(instruction);
          } else {
            if (type) {
              instruction.type = type;
              configureProperties(instruction, resources);

              if (type.liftsContent) {
                instruction.originalAttrName = attrName;
                liftingInstruction = instruction;
                break;
              } else {
                behaviorInstructions.push(instruction);
              }
            } else if (elementProperty) {
              elementInstruction.attributes[info.attrName].targetProperty = elementProperty.name;
            } else {
              expressions.push(instruction.attributes[instruction.attrName]);
            }
          }
        } else {
          if (type) {
            instruction = { attrName: attrName, type: type, attributes: {} };
            instruction.attributes[resources.mapAttribute(attrName)] = attrValue;

            if (type.liftsContent) {
              instruction.originalAttrName = attrName;
              liftingInstruction = instruction;
              break;
            } else {
              behaviorInstructions.push(instruction);
            }
          } else if (elementProperty) {
            elementInstruction.attributes[attrName] = attrValue;
          }
        }
      }

      if (liftingInstruction) {
        liftingInstruction.viewFactory = viewFactory;
        node = liftingInstruction.type.compile(this, resources, node, liftingInstruction, parentNode);
        auTargetID = makeIntoInstructionTarget(node);
        instructions[auTargetID] = {
          anchorIsContainer: false,
          parentInjectorId: parentInjectorId,
          expressions: [],
          behaviorInstructions: [liftingInstruction],
          viewFactory: liftingInstruction.viewFactory,
          providers: [liftingInstruction.type.target]
        };
      } else {
        if (expressions.length || behaviorInstructions.length) {
          injectorId = behaviorInstructions.length ? getNextInjectorId() : false;

          for (i = 0, ii = behaviorInstructions.length; i < ii; ++i) {
            instruction = behaviorInstructions[i];
            instruction.type.compile(this, resources, node, instruction, parentNode);
            providers.push(instruction.type.target);
          }

          for (i = 0, ii = expressions.length; i < ii; ++i) {
            expression = expressions[i];
            if (expression.attrToRemove !== undefined) {
              node.removeAttribute(expression.attrToRemove);
            }
          }

          auTargetID = makeIntoInstructionTarget(node);
          instructions[auTargetID] = {
            anchorIsContainer: elementInstruction ? elementInstruction.anchorIsContainer : true,
            isCustomElement: !!elementInstruction,
            injectorId: injectorId,
            parentInjectorId: parentInjectorId,
            expressions: expressions,
            behaviorInstructions: behaviorInstructions,
            providers: providers
          };
        }

        if (elementInstruction && elementInstruction.skipContentProcessing) {
          return node.nextSibling;
        }

        var currentChild = node.firstChild;
        while (currentChild) {
          currentChild = this.compileNode(currentChild, resources, instructions, node, injectorId || parentInjectorId, targetLightDOM);
        }
      }

      return node.nextSibling;
    };

    return ViewCompiler;
  })();

  exports.ViewCompiler = ViewCompiler;

  var logger = _aureliaLogging.getLogger('templating');

  function ensureRegistryEntry(loader, urlOrRegistryEntry) {
    if (urlOrRegistryEntry instanceof _aureliaLoader.TemplateRegistryEntry) {
      return Promise.resolve(urlOrRegistryEntry);
    }

    return loader.loadTemplate(urlOrRegistryEntry);
  }

  var ProxyViewFactory = (function () {
    function ProxyViewFactory(promise) {
      var _this4 = this;

      _classCallCheck(this, ProxyViewFactory);

      promise.then(function (x) {
        return _this4.absorb(x);
      });
    }

    ProxyViewFactory.prototype.absorb = function absorb(factory) {
      this.create = factory.create.bind(factory);
    };

    return ProxyViewFactory;
  })();

  var ViewEngine = (function () {
    function ViewEngine(loader, container, viewCompiler, moduleAnalyzer, appResources) {
      _classCallCheck(this, ViewEngine);

      this.loader = loader;
      this.container = container;
      this.viewCompiler = viewCompiler;
      this.moduleAnalyzer = moduleAnalyzer;
      this.appResources = appResources;
    }

    ViewEngine.inject = function inject() {
      return [_aureliaLoader.Loader, _aureliaDependencyInjection.Container, ViewCompiler, ModuleAnalyzer, ResourceRegistry];
    };

    ViewEngine.prototype.enhance = function enhance(container, element, resources, bindingContext) {
      var instructions = {};

      this.viewCompiler.compileNode(element, resources, instructions, element.parentNode, 'root', true);

      var factory = new ViewFactory(element, instructions, resources);
      var options = {
        systemControlled: false,
        suppressBind: false,
        enhance: true
      };

      return factory.create(container, bindingContext, options);
    };

    ViewEngine.prototype.loadViewFactory = function loadViewFactory(urlOrRegistryEntry, compileOptions, associatedModuleId, loadContext) {
      var _this5 = this;

      loadContext = loadContext || [];

      return ensureRegistryEntry(this.loader, urlOrRegistryEntry).then(function (viewRegistryEntry) {
        if (viewRegistryEntry.onReady) {
          if (loadContext.indexOf(urlOrRegistryEntry) === -1) {
            loadContext.push(urlOrRegistryEntry);
            return viewRegistryEntry.onReady;
          }

          return Promise.resolve(new ProxyViewFactory(viewRegistryEntry.onReady));
        }

        loadContext.push(urlOrRegistryEntry);

        return viewRegistryEntry.onReady = _this5.loadTemplateResources(viewRegistryEntry, associatedModuleId, loadContext).then(function (resources) {
          viewRegistryEntry.setResources(resources);
          var viewFactory = _this5.viewCompiler.compile(viewRegistryEntry.template, resources, compileOptions);
          viewRegistryEntry.setFactory(viewFactory);
          return viewFactory;
        });
      });
    };

    ViewEngine.prototype.loadTemplateResources = function loadTemplateResources(viewRegistryEntry, associatedModuleId, loadContext) {
      var resources = new ViewResources(this.appResources, viewRegistryEntry.id),
          dependencies = viewRegistryEntry.dependencies,
          importIds,
          names;

      if (dependencies.length === 0 && !associatedModuleId) {
        return Promise.resolve(resources);
      }

      importIds = dependencies.map(function (x) {
        return x.src;
      });
      names = dependencies.map(function (x) {
        return x.name;
      });
      logger.debug('importing resources for ' + viewRegistryEntry.id, importIds);

      return this.importViewResources(importIds, names, resources, associatedModuleId, loadContext);
    };

    ViewEngine.prototype.importViewModelResource = function importViewModelResource(moduleImport, moduleMember) {
      var _this6 = this;

      return this.loader.loadModule(moduleImport).then(function (viewModelModule) {
        var normalizedId = _aureliaMetadata.Origin.get(viewModelModule).moduleId,
            resourceModule = _this6.moduleAnalyzer.analyze(normalizedId, viewModelModule, moduleMember);

        if (!resourceModule.mainResource) {
          throw new Error('No view model found in module "' + moduleImport + '".');
        }

        resourceModule.analyze(_this6.container);

        return resourceModule.mainResource;
      });
    };

    ViewEngine.prototype.importViewResources = function importViewResources(moduleIds, names, resources, associatedModuleId, loadContext) {
      var _this7 = this;

      loadContext = loadContext || [];

      return this.loader.loadAllModules(moduleIds).then(function (imports) {
        var i,
            ii,
            analysis,
            normalizedId,
            current,
            associatedModule,
            container = _this7.container,
            moduleAnalyzer = _this7.moduleAnalyzer,
            allAnalysis = new Array(imports.length);

        for (i = 0, ii = imports.length; i < ii; ++i) {
          current = imports[i];
          normalizedId = _aureliaMetadata.Origin.get(current).moduleId;

          analysis = moduleAnalyzer.analyze(normalizedId, current);
          analysis.analyze(container);
          analysis.register(resources, names[i]);

          allAnalysis[i] = analysis;
        }

        if (associatedModuleId) {
          associatedModule = moduleAnalyzer.getAnalysis(associatedModuleId);

          if (associatedModule) {
            associatedModule.register(resources);
          }
        }

        for (i = 0, ii = allAnalysis.length; i < ii; ++i) {
          allAnalysis[i] = allAnalysis[i].load(container, loadContext);
        }

        return Promise.all(allAnalysis).then(function () {
          return resources;
        });
      });
    };

    return ViewEngine;
  })();

  exports.ViewEngine = ViewEngine;

  var BehaviorInstance = (function () {
    function BehaviorInstance(behavior, executionContext, instruction) {
      _classCallCheck(this, BehaviorInstance);

      this.behavior = behavior;
      this.executionContext = executionContext;
      this.isAttached = false;

      var observerLookup = behavior.observerLocator.getOrCreateObserversLookup(executionContext),
          handlesBind = behavior.handlesBind,
          attributes = instruction.attributes,
          boundProperties = this.boundProperties = [],
          properties = behavior.properties,
          i,
          ii;

      behavior.ensurePropertiesDefined(executionContext, observerLookup);

      for (i = 0, ii = properties.length; i < ii; ++i) {
        properties[i].initialize(executionContext, observerLookup, attributes, handlesBind, boundProperties);
      }
    }

    BehaviorInstance.createForUnitTest = function createForUnitTest(type, attributes, bindingContext) {
      var description = ResourceDescription.get(type);
      description.analyze(_aureliaDependencyInjection.Container.instance);

      var executionContext = _aureliaDependencyInjection.Container.instance.get(type);
      var behaviorInstance = new BehaviorInstance(description.metadata, executionContext, { attributes: attributes || {} });

      behaviorInstance.bind(bindingContext || {});

      return executionContext;
    };

    BehaviorInstance.prototype.created = function created(context) {
      if (this.behavior.handlesCreated) {
        this.executionContext.created(context);
      }
    };

    BehaviorInstance.prototype.bind = function bind(context) {
      var skipSelfSubscriber = this.behavior.handlesBind,
          boundProperties = this.boundProperties,
          i,
          ii,
          x,
          observer,
          selfSubscriber;

      for (i = 0, ii = boundProperties.length; i < ii; ++i) {
        x = boundProperties[i];
        observer = x.observer;
        selfSubscriber = observer.selfSubscriber;
        observer.publishing = false;

        if (skipSelfSubscriber) {
          observer.selfSubscriber = null;
        }

        x.binding.bind(context);
        observer.call();

        observer.publishing = true;
        observer.selfSubscriber = selfSubscriber;
      }

      if (skipSelfSubscriber) {
        this.executionContext.bind(context);
      }

      if (this.view) {
        this.view.bind(this.executionContext);
      }
    };

    BehaviorInstance.prototype.unbind = function unbind() {
      var boundProperties = this.boundProperties,
          i,
          ii;

      if (this.view) {
        this.view.unbind();
      }

      if (this.behavior.handlesUnbind) {
        this.executionContext.unbind();
      }

      for (i = 0, ii = boundProperties.length; i < ii; ++i) {
        boundProperties[i].binding.unbind();
      }
    };

    BehaviorInstance.prototype.attached = function attached() {
      if (this.isAttached) {
        return;
      }

      this.isAttached = true;

      if (this.behavior.handlesAttached) {
        this.executionContext.attached();
      }

      if (this.view) {
        this.view.attached();
      }
    };

    BehaviorInstance.prototype.detached = function detached() {
      if (this.isAttached) {
        this.isAttached = false;

        if (this.view) {
          this.view.detached();
        }

        if (this.behavior.handlesDetached) {
          this.executionContext.detached();
        }
      }
    };

    return BehaviorInstance;
  })();

  exports.BehaviorInstance = BehaviorInstance;

  function getObserver(behavior, instance, name) {
    var lookup = instance.__observers__;

    if (lookup === undefined) {
      lookup = behavior.observerLocator.getOrCreateObserversLookup(instance);
      behavior.ensurePropertiesDefined(instance, lookup);
    }

    return lookup[name];
  }

  var BindableProperty = (function () {
    function BindableProperty(nameOrConfig) {
      _classCallCheck(this, BindableProperty);

      if (typeof nameOrConfig === 'string') {
        this.name = nameOrConfig;
      } else {
        Object.assign(this, nameOrConfig);
      }

      this.attribute = this.attribute || hyphenate(this.name);
      this.defaultBindingMode = this.defaultBindingMode || _aureliaBinding.bindingMode.oneWay;
      this.changeHandler = this.changeHandler || null;
      this.owner = null;
    }

    BindableProperty.prototype.registerWith = function registerWith(target, behavior, descriptor) {
      behavior.properties.push(this);
      behavior.attributes[this.attribute] = this;
      this.owner = behavior;

      if (descriptor) {
        this.descriptor = descriptor;
        return this.configureDescriptor(behavior, descriptor);
      }
    };

    BindableProperty.prototype.configureDescriptor = function configureDescriptor(behavior, descriptor) {
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
        return getObserver(behavior, this, name).getValue();
      };

      descriptor.set = function (value) {
        getObserver(behavior, this, name).setValue(value);
      };

      descriptor.get.getObserver = function (obj) {
        return getObserver(behavior, obj, name);
      };

      return descriptor;
    };

    BindableProperty.prototype.defineOn = function defineOn(target, behavior) {
      var name = this.name,
          handlerName;

      if (this.changeHandler === null) {
        handlerName = name + 'Changed';
        if (handlerName in target.prototype) {
          this.changeHandler = handlerName;
        }
      }

      if (!this.descriptor) {
        Object.defineProperty(target.prototype, name, this.configureDescriptor(behavior, {}));
      }
    };

    BindableProperty.prototype.createObserver = function createObserver(executionContext) {
      var selfSubscriber = null,
          defaultValue = this.defaultValue,
          changeHandlerName = this.changeHandler,
          name = this.name,
          initialValue;

      if (this.hasOptions) {
        return;
      }

      if (changeHandlerName in executionContext) {
        if ('propertyChanged' in executionContext) {
          selfSubscriber = function (newValue, oldValue) {
            executionContext[changeHandlerName](newValue, oldValue);
            executionContext.propertyChanged(name, newValue, oldValue);
          };
        } else {
          selfSubscriber = function (newValue, oldValue) {
            return executionContext[changeHandlerName](newValue, oldValue);
          };
        }
      } else if ('propertyChanged' in executionContext) {
        selfSubscriber = function (newValue, oldValue) {
          return executionContext.propertyChanged(name, newValue, oldValue);
        };
      } else if (changeHandlerName !== null) {
        throw new Error('Change handler ' + changeHandlerName + ' was specified but not delcared on the class.');
      }

      if (defaultValue !== undefined) {
        initialValue = typeof defaultValue === 'function' ? defaultValue.call(executionContext) : defaultValue;
      }

      return new BehaviorPropertyObserver(this.owner.taskQueue, executionContext, this.name, selfSubscriber, initialValue);
    };

    BindableProperty.prototype.initialize = function initialize(executionContext, observerLookup, attributes, behaviorHandlesBind, boundProperties) {
      var selfSubscriber,
          observer,
          attribute,
          defaultValue = this.defaultValue;

      if (this.isDynamic) {
        for (var key in attributes) {
          this.createDynamicProperty(executionContext, observerLookup, behaviorHandlesBind, key, attributes[key], boundProperties);
        }
      } else if (!this.hasOptions) {
        observer = observerLookup[this.name];

        if (attributes !== undefined) {
          selfSubscriber = observer.selfSubscriber;
          attribute = attributes[this.attribute];

          if (behaviorHandlesBind) {
            observer.selfSubscriber = null;
          }

          if (typeof attribute === 'string') {
            executionContext[this.name] = attribute;
            observer.call();
          } else if (attribute) {
            boundProperties.push({ observer: observer, binding: attribute.createBinding(executionContext) });
          } else if (defaultValue !== undefined) {
            observer.call();
          }

          observer.selfSubscriber = selfSubscriber;
        }

        observer.publishing = true;
      }
    };

    BindableProperty.prototype.createDynamicProperty = function createDynamicProperty(executionContext, observerLookup, behaviorHandlesBind, name, attribute, boundProperties) {
      var changeHandlerName = name + 'Changed',
          selfSubscriber = null,
          observer,
          info;

      if (changeHandlerName in executionContext) {
        if ('propertyChanged' in executionContext) {
          selfSubscriber = function (newValue, oldValue) {
            executionContext[changeHandlerName](newValue, oldValue);
            executionContext.propertyChanged(name, newValue, oldValue);
          };
        } else {
          selfSubscriber = function (newValue, oldValue) {
            return executionContext[changeHandlerName](newValue, oldValue);
          };
        }
      } else if ('propertyChanged' in executionContext) {
        selfSubscriber = function (newValue, oldValue) {
          return executionContext.propertyChanged(name, newValue, oldValue);
        };
      }

      observer = observerLookup[name] = new BehaviorPropertyObserver(this.owner.taskQueue, executionContext, name, selfSubscriber);

      Object.defineProperty(executionContext, name, {
        configurable: true,
        enumerable: true,
        get: observer.getValue.bind(observer),
        set: observer.setValue.bind(observer)
      });

      if (behaviorHandlesBind) {
        observer.selfSubscriber = null;
      }

      if (typeof attribute === 'string') {
        executionContext[name] = attribute;
        observer.call();
      } else if (attribute) {
        info = { observer: observer, binding: attribute.createBinding(executionContext) };
        boundProperties.push(info);
      }

      observer.publishing = true;
      observer.selfSubscriber = selfSubscriber;
    };

    return BindableProperty;
  })();

  exports.BindableProperty = BindableProperty;

  var BehaviorPropertyObserver = (function () {
    function BehaviorPropertyObserver(taskQueue, obj, propertyName, selfSubscriber, initialValue) {
      _classCallCheck(this, BehaviorPropertyObserver);

      this.taskQueue = taskQueue;
      this.obj = obj;
      this.propertyName = propertyName;
      this.callbacks = [];
      this.notqueued = true;
      this.publishing = false;
      this.selfSubscriber = selfSubscriber;
      this.currentValue = this.oldValue = initialValue;
    }

    BehaviorPropertyObserver.prototype.getValue = function getValue() {
      return this.currentValue;
    };

    BehaviorPropertyObserver.prototype.setValue = function setValue(newValue) {
      var oldValue = this.currentValue;

      if (oldValue !== newValue) {
        if (this.publishing && this.notqueued) {
          this.notqueued = false;
          this.taskQueue.queueMicroTask(this);
        }

        this.oldValue = oldValue;
        this.currentValue = newValue;
      }
    };

    BehaviorPropertyObserver.prototype.call = function call() {
      var callbacks = this.callbacks,
          i = callbacks.length,
          oldValue = this.oldValue,
          newValue = this.currentValue;

      this.notqueued = true;

      if (newValue !== oldValue) {
        if (this.selfSubscriber !== null) {
          this.selfSubscriber(newValue, oldValue);
        }

        while (i--) {
          callbacks[i](newValue, oldValue);
        }

        this.oldValue = newValue;
      }
    };

    BehaviorPropertyObserver.prototype.subscribe = function subscribe(callback) {
      var callbacks = this.callbacks;
      callbacks.push(callback);
      return function () {
        callbacks.splice(callbacks.indexOf(callback), 1);
      };
    };

    return BehaviorPropertyObserver;
  })();

  var defaultInstruction = { suppressBind: false },
      contentSelectorFactoryOptions = { suppressBind: true, enhance: false },
      hasShadowDOM = !!HTMLElement.prototype.createShadowRoot;

  function doProcessContent() {
    return true;
  }

  var HtmlBehaviorResource = (function () {
    function HtmlBehaviorResource() {
      _classCallCheck(this, HtmlBehaviorResource);

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

    HtmlBehaviorResource.convention = function convention(name, existing) {
      var behavior;

      if (name.endsWith('CustomAttribute')) {
        behavior = existing || new HtmlBehaviorResource();
        behavior.attributeName = hyphenate(name.substring(0, name.length - 15));
      }

      if (name.endsWith('CustomElement')) {
        behavior = existing || new HtmlBehaviorResource();
        behavior.elementName = hyphenate(name.substring(0, name.length - 13));
      }

      return behavior;
    };

    HtmlBehaviorResource.prototype.addChildBinding = function addChildBinding(behavior) {
      if (this.childBindings === null) {
        this.childBindings = [];
      }

      this.childBindings.push(behavior);
    };

    HtmlBehaviorResource.prototype.analyze = function analyze(container, target) {
      var proto = target.prototype,
          properties = this.properties,
          attributeName = this.attributeName,
          attributeDefaultBindingMode = this.attributeDefaultBindingMode,
          i,
          ii,
          current;

      this.observerLocator = container.get(_aureliaBinding.ObserverLocator);
      this.taskQueue = container.get(_aureliaTaskQueue.TaskQueue);

      this.target = target;
      this.usesShadowDOM = this.targetShadowDOM && hasShadowDOM;
      this.handlesCreated = 'created' in proto;
      this.handlesBind = 'bind' in proto;
      this.handlesUnbind = 'unbind' in proto;
      this.handlesAttached = 'attached' in proto;
      this.handlesDetached = 'detached' in proto;
      this.htmlName = this.elementName || this.attributeName;
      this.apiName = this.htmlName.replace(/-([a-z])/g, function (m, w) {
        return w.toUpperCase();
      });

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
        } else {
          for (i = 0, ii = properties.length; i < ii; ++i) {
            properties[i].defineOn(target, this);
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
      } else {
        for (i = 0, ii = properties.length; i < ii; ++i) {
          properties[i].defineOn(target, this);
        }
      }
    };

    HtmlBehaviorResource.prototype.load = function load(container, target, viewStrategy, transientView, loadContext) {
      var _this8 = this;

      var options;

      if (this.elementName !== null) {
        viewStrategy = viewStrategy || this.viewStrategy || ViewStrategy.getDefault(target);
        options = {
          targetShadowDOM: this.targetShadowDOM,
          beforeCompile: target.beforeCompile,
          compileSurrogate: true
        };

        if (!viewStrategy.moduleId) {
          viewStrategy.moduleId = _aureliaMetadata.Origin.get(target).moduleId;
        }

        return viewStrategy.loadViewFactory(container.get(ViewEngine), options, loadContext).then(function (viewFactory) {
          if (!transientView || !_this8.viewFactory) {
            _this8.viewFactory = viewFactory;
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
              fragment = document.createDocumentFragment(),
              part = node.getAttribute('part');

          node.removeAttribute(instruction.originalAttrName);
          replaceNode(template, node, parentNode);
          fragment.appendChild(node);
          instruction.viewFactory = compiler.compile(fragment, resources);

          if (part) {
            instruction.viewFactory.part = part;
            node.removeAttribute('part');
          }

          node = template;
        }
      } else if (this.elementName !== null) {
        var partReplacements = instruction.partReplacements = {};

        if (this.processContent(compiler, resources, node, instruction) && node.hasChildNodes()) {
          if (this.usesShadowDOM) {
            var currentChild = node.firstChild,
                nextSibling,
                toReplace;

            while (currentChild) {
              nextSibling = currentChild.nextSibling;

              if (currentChild.tagName === 'TEMPLATE' && (toReplace = currentChild.getAttribute('replace-part'))) {
                partReplacements[toReplace] = compiler.compile(currentChild, resources);
                removeNode(currentChild, parentNode);
              }

              currentChild = nextSibling;
            }

            instruction.skipContentProcessing = false;
          } else {
            var fragment = document.createDocumentFragment(),
                currentChild = node.firstChild,
                nextSibling;

            while (currentChild) {
              nextSibling = currentChild.nextSibling;

              if (currentChild.tagName === 'TEMPLATE' && (toReplace = currentChild.getAttribute('replace-part'))) {
                partReplacements[toReplace] = compiler.compile(currentChild, resources);
                removeNode(currentChild, parentNode);
              } else {
                fragment.appendChild(currentChild);
              }

              currentChild = nextSibling;
            }

            instruction.contentFactory = compiler.compile(fragment, resources);
            instruction.skipContentProcessing = true;
          }
        } else {
          instruction.skipContentProcessing = true;
        }
      }

      instruction.suppressBind = true;
      return node;
    };

    HtmlBehaviorResource.prototype.create = function create(container) {
      var instruction = arguments[1] === undefined ? defaultInstruction : arguments[1];
      var element = arguments[2] === undefined ? null : arguments[2];
      var bindings = arguments[3] === undefined ? null : arguments[3];

      var host = undefined;

      if (this.elementName !== null && element) {
        if (this.usesShadowDOM) {
          host = element.createShadowRoot();
          container.registerInstance(DOMBoundary, host);
        } else {
          host = element;

          if (this.targetShadowDOM) {
            container.registerInstance(DOMBoundary, host);
          }
        }
      }

      var executionContext = instruction.executionContext || container.get(this.target),
          behaviorInstance = new BehaviorInstance(this, executionContext, instruction),
          childBindings = this.childBindings,
          viewFactory = undefined;

      if (this.liftsContent) {
        element.primaryBehavior = behaviorInstance;
      } else if (this.elementName !== null) {
        viewFactory = instruction.viewFactory || this.viewFactory;
        container.viewModel = executionContext;

        if (viewFactory) {
          behaviorInstance.view = viewFactory.create(container, executionContext, instruction, element);
        }

        if (element) {
          element.primaryBehavior = behaviorInstance;

          if (behaviorInstance.view) {
            if (!this.usesShadowDOM) {
              if (instruction.contentFactory) {
                var contentView = instruction.contentFactory.create(container, null, contentSelectorFactoryOptions);

                ContentSelector.applySelectors(contentView, behaviorInstance.view.contentSelectors, function (contentSelector, group) {
                  return contentSelector.add(group);
                });

                behaviorInstance.contentView = contentView;
              }
            }

            if (instruction.anchorIsContainer) {
              if (childBindings !== null) {
                for (var i = 0, ii = childBindings.length; i < ii; ++i) {
                  behaviorInstance.view.addBinding(childBindings[i].create(host, executionContext));
                }
              }

              behaviorInstance.view.appendNodesTo(host);
            } else {
              behaviorInstance.view.insertNodesBefore(host);
            }
          } else if (childBindings !== null) {
            for (var i = 0, ii = childBindings.length; i < ii; ++i) {
              bindings.push(childBindings[i].create(element, executionContext));
            }
          }
        } else if (behaviorInstance.view) {
          behaviorInstance.view.owner = behaviorInstance;

          if (childBindings !== null) {
            for (var i = 0, ii = childBindings.length; i < ii; ++i) {
              behaviorInstance.view.addBinding(childBindings[i].create(instruction.host, executionContext));
            }
          }
        } else if (childBindings !== null) {
          for (var i = 0, ii = childBindings.length; i < ii; ++i) {
            bindings.push(childBindings[i].create(instruction.host, executionContext));
          }
        }
      } else if (childBindings !== null) {
        for (var i = 0, ii = childBindings.length; i < ii; ++i) {
          bindings.push(childBindings[i].create(element, executionContext));
        }
      }

      if (element) {
        if (!(this.apiName in element)) {
          element[this.apiName] = executionContext;
        }

        if (!(this.htmlName in element)) {
          element[this.htmlName] = behaviorInstance;
        }
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

  var ResourceModule = (function () {
    function ResourceModule(moduleId) {
      _classCallCheck(this, ResourceModule);

      this.id = moduleId;
      this.moduleInstance = null;
      this.mainResource = null;
      this.resources = null;
      this.viewStrategy = null;
      this.isAnalyzed = false;
    }

    ResourceModule.prototype.analyze = function analyze(container) {
      var current = this.mainResource,
          resources = this.resources,
          viewStrategy = this.viewStrategy,
          i,
          ii;

      if (this.isAnalyzed) {
        return;
      }

      this.isAnalyzed = true;

      if (current) {
        current.metadata.viewStrategy = viewStrategy;
        current.analyze(container);
      }

      for (i = 0, ii = resources.length; i < ii; ++i) {
        current = resources[i];
        current.metadata.viewStrategy = viewStrategy;
        current.analyze(container);
      }
    };

    ResourceModule.prototype.register = function register(registry, name) {
      var i,
          ii,
          resources = this.resources;

      if (this.mainResource) {
        this.mainResource.register(registry, name);
        name = null;
      }

      for (i = 0, ii = resources.length; i < ii; ++i) {
        resources[i].register(registry, name);
        name = null;
      }
    };

    ResourceModule.prototype.load = function load(container, loadContext) {
      if (this.onLoaded) {
        return this.onLoaded;
      }

      var current = this.mainResource,
          resources = this.resources,
          i,
          ii,
          loads = [];

      if (current) {
        loads.push(current.load(container, loadContext));
      }

      for (i = 0, ii = resources.length; i < ii; ++i) {
        loads.push(resources[i].load(container, loadContext));
      }

      this.onLoaded = Promise.all(loads);
      return this.onLoaded;
    };

    return ResourceModule;
  })();

  exports.ResourceModule = ResourceModule;

  var ResourceDescription = (function () {
    function ResourceDescription(key, exportedValue, resourceTypeMeta) {
      _classCallCheck(this, ResourceDescription);

      if (!resourceTypeMeta) {
        resourceTypeMeta = _aureliaMetadata.Metadata.get(_aureliaMetadata.Metadata.resource, exportedValue);

        if (!resourceTypeMeta) {
          resourceTypeMeta = new HtmlBehaviorResource();
          resourceTypeMeta.elementName = hyphenate(key);
          _aureliaMetadata.Metadata.define(_aureliaMetadata.Metadata.resource, resourceTypeMeta, exportedValue);
        }
      }

      if (resourceTypeMeta instanceof HtmlBehaviorResource) {
        if (resourceTypeMeta.elementName === undefined) {
          resourceTypeMeta.elementName = hyphenate(key);
        } else if (resourceTypeMeta.attributeName === undefined) {
          resourceTypeMeta.attributeName = hyphenate(key);
        } else if (resourceTypeMeta.attributeName === null && resourceTypeMeta.elementName === null) {
          HtmlBehaviorResource.convention(key, resourceTypeMeta);
        }
      } else if (!resourceTypeMeta.name) {
        resourceTypeMeta.name = hyphenate(key);
      }

      this.metadata = resourceTypeMeta;
      this.value = exportedValue;
    }

    ResourceDescription.prototype.analyze = function analyze(container) {
      var metadata = this.metadata,
          value = this.value;

      if ('analyze' in metadata) {
        metadata.analyze(container, value);
      }
    };

    ResourceDescription.prototype.register = function register(registry, name) {
      this.metadata.register(registry, name);
    };

    ResourceDescription.prototype.load = function load(container, loadContext) {
      var metadata = this.metadata,
          value = this.value;

      if ('load' in metadata) {
        return metadata.load(container, value, null, null, loadContext);
      }
    };

    ResourceDescription.get = function get(resource) {
      var key = arguments[1] === undefined ? 'custom-resource' : arguments[1];

      var resourceTypeMeta = _aureliaMetadata.Metadata.get(_aureliaMetadata.Metadata.resource, resource),
          resourceDescription;

      if (resourceTypeMeta) {
        if (resourceTypeMeta.attributeName === null && resourceTypeMeta.elementName === null) {
          HtmlBehaviorResource.convention(key, resourceTypeMeta);
        }

        if (resourceTypeMeta.attributeName === null && resourceTypeMeta.elementName === null) {
          resourceTypeMeta.elementName = hyphenate(key);
        }

        resourceDescription = new ResourceDescription(key, resource, resourceTypeMeta);
      } else {
        if (resourceTypeMeta = HtmlBehaviorResource.convention(key)) {
          resourceDescription = new ResourceDescription(key, resource, resourceTypeMeta);
          _aureliaMetadata.Metadata.define(_aureliaMetadata.Metadata.resource, resourceTypeMeta, resource);
        } else if (resourceTypeMeta = _aureliaBinding.ValueConverterResource.convention(key)) {
          resourceDescription = new ResourceDescription(key, resource, resourceTypeMeta);
          _aureliaMetadata.Metadata.define(_aureliaMetadata.Metadata.resource, resourceTypeMeta, resource);
        }
      }

      return resourceDescription;
    };

    return ResourceDescription;
  })();

  exports.ResourceDescription = ResourceDescription;

  var ModuleAnalyzer = (function () {
    function ModuleAnalyzer() {
      _classCallCheck(this, ModuleAnalyzer);

      this.cache = {};
    }

    ModuleAnalyzer.prototype.getAnalysis = function getAnalysis(moduleId) {
      return this.cache[moduleId];
    };

    ModuleAnalyzer.prototype.analyze = function analyze(moduleId, moduleInstance, viewModelMember) {
      var mainResource,
          fallbackValue,
          fallbackKey,
          resourceTypeMeta,
          key,
          exportedValue,
          resources = [],
          conventional,
          viewStrategy,
          resourceModule;

      resourceModule = this.cache[moduleId];
      if (resourceModule) {
        return resourceModule;
      }

      resourceModule = new ResourceModule(moduleId);
      this.cache[moduleId] = resourceModule;

      if (typeof moduleInstance === 'function') {
        moduleInstance = { 'default': moduleInstance };
      }

      if (viewModelMember) {
        mainResource = new ResourceDescription(viewModelMember, moduleInstance[viewModelMember]);
      }

      for (key in moduleInstance) {
        exportedValue = moduleInstance[key];

        if (key === viewModelMember || typeof exportedValue !== 'function') {
          continue;
        }

        resourceTypeMeta = _aureliaMetadata.Metadata.get(_aureliaMetadata.Metadata.resource, exportedValue);

        if (resourceTypeMeta) {
          if (resourceTypeMeta.attributeName === null && resourceTypeMeta.elementName === null) {
            HtmlBehaviorResource.convention(key, resourceTypeMeta);
          }

          if (resourceTypeMeta.attributeName === null && resourceTypeMeta.elementName === null) {
            resourceTypeMeta.elementName = hyphenate(key);
          }

          if (!mainResource && resourceTypeMeta instanceof HtmlBehaviorResource && resourceTypeMeta.elementName !== null) {
            mainResource = new ResourceDescription(key, exportedValue, resourceTypeMeta);
          } else {
            resources.push(new ResourceDescription(key, exportedValue, resourceTypeMeta));
          }
        } else if (exportedValue instanceof ViewStrategy) {
          viewStrategy = exportedValue;
        } else if (exportedValue instanceof _aureliaLoader.TemplateRegistryEntry) {
          viewStrategy = new TemplateRegistryViewStrategy(moduleId, exportedValue);
        } else {
          if (conventional = HtmlBehaviorResource.convention(key)) {
            if (conventional.elementName !== null && !mainResource) {
              mainResource = new ResourceDescription(key, exportedValue, conventional);
            } else {
              resources.push(new ResourceDescription(key, exportedValue, conventional));
            }

            _aureliaMetadata.Metadata.define(_aureliaMetadata.Metadata.resource, conventional, exportedValue);
          } else if (conventional = _aureliaBinding.ValueConverterResource.convention(key)) {
            resources.push(new ResourceDescription(key, exportedValue, conventional));
            _aureliaMetadata.Metadata.define(_aureliaMetadata.Metadata.resource, conventional, exportedValue);
          } else if (!fallbackValue) {
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
      resourceModule.viewStrategy = viewStrategy;

      return resourceModule;
    };

    return ModuleAnalyzer;
  })();

  exports.ModuleAnalyzer = ModuleAnalyzer;

  var noMutations = [];

  var ChildObserver = (function () {
    function ChildObserver(config) {
      _classCallCheck(this, ChildObserver);

      this.name = config.name;
      this.changeHandler = config.changeHandler || this.name + 'Changed';
      this.selector = config.selector;
    }

    ChildObserver.prototype.create = function create(target, behavior) {
      return new ChildObserverBinder(this.selector, target, this.name, behavior, this.changeHandler);
    };

    return ChildObserver;
  })();

  exports.ChildObserver = ChildObserver;

  var ChildObserverBinder = (function () {
    function ChildObserverBinder(selector, target, property, behavior, changeHandler) {
      _classCallCheck(this, ChildObserverBinder);

      this.selector = selector;
      this.target = target;
      this.property = property;
      this.behavior = behavior;
      this.changeHandler = changeHandler in behavior ? changeHandler : null;
      this.observer = new MutationObserver(this.onChange.bind(this));
    }

    ChildObserverBinder.prototype.bind = function bind(source) {
      var items,
          results,
          i,
          ii,
          node,
          behavior = this.behavior;

      this.observer.observe(this.target, { childList: true, subtree: true });

      items = behavior[this.property];
      if (!items) {
        items = behavior[this.property] = [];
      } else {
        items.length = 0;
      }

      results = this.target.querySelectorAll(this.selector);

      for (i = 0, ii = results.length; i < ii; ++i) {
        node = results[i];
        items.push(node.primaryBehavior ? node.primaryBehavior.executionContext : node);
      }

      if (this.changeHandler !== null) {
        this.behavior[this.changeHandler](noMutations);
      }
    };

    ChildObserverBinder.prototype.unbind = function unbind() {
      this.observer.disconnect();
    };

    ChildObserverBinder.prototype.onChange = function onChange(mutations) {
      var items = this.behavior[this.property],
          selector = this.selector;

      mutations.forEach(function (record) {
        var added = record.addedNodes,
            removed = record.removedNodes,
            prev = record.previousSibling,
            i,
            ii,
            primary,
            index,
            node;

        for (i = 0, ii = removed.length; i < ii; ++i) {
          node = removed[i];
          if (node.nodeType === 1 && node.matches(selector)) {
            primary = node.primaryBehavior ? node.primaryBehavior.executionContext : node;
            index = items.indexOf(primary);
            if (index != -1) {
              items.splice(index, 1);
            }
          }
        }

        for (i = 0, ii = added.length; i < ii; ++i) {
          node = added[i];
          if (node.nodeType === 1 && node.matches(selector)) {
            primary = node.primaryBehavior ? node.primaryBehavior.executionContext : node;
            index = 0;

            while (prev) {
              if (prev.nodeType === 1 && prev.matches(selector)) {
                index++;
              }

              prev = prev.previousSibling;
            }

            items.splice(index, 0, primary);
          }
        }
      });

      if (this.changeHandler !== null) {
        this.behavior[this.changeHandler](mutations);
      }
    };

    return ChildObserverBinder;
  })();

  exports.ChildObserverBinder = ChildObserverBinder;

  var CompositionEngine = (function () {
    function CompositionEngine(viewEngine) {
      _classCallCheck(this, CompositionEngine);

      this.viewEngine = viewEngine;
    }

    CompositionEngine.inject = function inject() {
      return [ViewEngine];
    };

    CompositionEngine.prototype.activate = function activate(instruction) {
      if (instruction.skipActivation || typeof instruction.viewModel.activate !== 'function') {
        return Promise.resolve();
      }

      return instruction.viewModel.activate(instruction.model) || Promise.resolve();
    };

    CompositionEngine.prototype.createBehaviorAndSwap = function createBehaviorAndSwap(instruction) {
      return this.createBehavior(instruction).then(function (behavior) {
        behavior.view.bind(behavior.executionContext);
        instruction.viewSlot.swap(behavior.view);

        if (instruction.currentBehavior) {
          instruction.currentBehavior.unbind();
        }

        return behavior;
      });
    };

    CompositionEngine.prototype.createBehavior = function createBehavior(instruction) {
      var childContainer = instruction.childContainer,
          viewModelResource = instruction.viewModelResource,
          viewModel = instruction.viewModel,
          metadata;

      return this.activate(instruction).then(function () {
        var doneLoading, viewStrategyFromViewModel, origin;

        if ('getViewStrategy' in viewModel && !instruction.view) {
          viewStrategyFromViewModel = true;
          instruction.view = ViewStrategy.normalize(viewModel.getViewStrategy());
        }

        if (instruction.view) {
          if (viewStrategyFromViewModel) {
            origin = _aureliaMetadata.Origin.get(viewModel.constructor);
            if (origin) {
              instruction.view.makeRelativeTo(origin.moduleId);
            }
          } else if (instruction.viewResources) {
            instruction.view.makeRelativeTo(instruction.viewResources.viewUrl);
          }
        }

        if (viewModelResource) {
          metadata = viewModelResource.metadata;
          doneLoading = metadata.load(childContainer, viewModelResource.value, instruction.view, true);
        } else {
          metadata = new HtmlBehaviorResource();
          metadata.elementName = 'dynamic-element';
          metadata.analyze(instruction.container || childContainer, viewModel.constructor);
          doneLoading = metadata.load(childContainer, viewModel.constructor, instruction.view, true).then(function (viewFactory) {
            return viewFactory;
          });
        }

        return doneLoading.then(function (viewFactory) {
          return metadata.create(childContainer, {
            executionContext: viewModel,
            viewFactory: viewFactory,
            suppressBind: true,
            host: instruction.host
          });
        });
      });
    };

    CompositionEngine.prototype.createViewModel = function createViewModel(instruction) {
      var childContainer = instruction.childContainer || instruction.container.createChild();

      instruction.viewModel = instruction.viewResources ? instruction.viewResources.relativeToView(instruction.viewModel) : instruction.viewModel;

      return this.viewEngine.importViewModelResource(instruction.viewModel).then(function (viewModelResource) {
        childContainer.autoRegister(viewModelResource.value);

        if (instruction.host) {
          childContainer.registerInstance(Element, instruction.host);
        }

        instruction.viewModel = childContainer.viewModel = childContainer.get(viewModelResource.value);
        instruction.viewModelResource = viewModelResource;
        return instruction;
      });
    };

    CompositionEngine.prototype.compose = function compose(instruction) {
      var _this9 = this;

      instruction.childContainer = instruction.childContainer || instruction.container.createChild();
      instruction.view = ViewStrategy.normalize(instruction.view);

      if (instruction.viewModel) {
        if (typeof instruction.viewModel === 'string') {
          return this.createViewModel(instruction).then(function (instruction) {
            return _this9.createBehaviorAndSwap(instruction);
          });
        } else {
          return this.createBehaviorAndSwap(instruction);
        }
      } else if (instruction.view) {
        if (instruction.viewResources) {
          instruction.view.makeRelativeTo(instruction.viewResources.viewUrl);
        }

        return instruction.view.loadViewFactory(this.viewEngine).then(function (viewFactory) {
          var result = viewFactory.create(instruction.childContainer, instruction.executionContext);
          instruction.viewSlot.swap(result);
          return result;
        });
      } else if (instruction.viewSlot) {
        instruction.viewSlot.removeAll();
        return Promise.resolve(null);
      }
    };

    return CompositionEngine;
  })();

  exports.CompositionEngine = CompositionEngine;

  var ElementConfigResource = (function () {
    function ElementConfigResource() {
      _classCallCheck(this, ElementConfigResource);
    }

    ElementConfigResource.prototype.load = function load(container, target) {
      var config = new target(),
          eventManager = container.get(_aureliaBinding.EventManager);

      eventManager.registerElementConfig(config);
      return Promise.resolve(this);
    };

    ElementConfigResource.prototype.register = function register() {};

    return ElementConfigResource;
  })();

  exports.ElementConfigResource = ElementConfigResource;

  function validateBehaviorName(name, type) {
    if (/[A-Z]/.test(name)) {
      throw new Error('\'' + name + '\' is not a valid ' + type + ' name.  Upper-case letters are not allowed because the DOM is not case-sensitive.');
    }
  }

  function behavior(override) {
    return function (target) {
      if (override instanceof HtmlBehaviorResource) {
        _aureliaMetadata.Metadata.define(_aureliaMetadata.Metadata.resource, override, target);
      } else {
        var resource = _aureliaMetadata.Metadata.getOrCreateOwn(_aureliaMetadata.Metadata.resource, HtmlBehaviorResource, target);
        Object.assign(resource, override);
      }
    };
  }

  _aureliaMetadata.Decorators.configure.parameterizedDecorator('behavior', behavior);

  function customElement(name) {
    validateBehaviorName(name, 'custom element');
    return function (target) {
      var resource = _aureliaMetadata.Metadata.getOrCreateOwn(_aureliaMetadata.Metadata.resource, HtmlBehaviorResource, target);
      resource.elementName = name;
    };
  }

  _aureliaMetadata.Decorators.configure.parameterizedDecorator('customElement', customElement);

  function customAttribute(name, defaultBindingMode) {
    validateBehaviorName(name, 'custom attribute');
    return function (target) {
      var resource = _aureliaMetadata.Metadata.getOrCreateOwn(_aureliaMetadata.Metadata.resource, HtmlBehaviorResource, target);
      resource.attributeName = name;
      resource.attributeDefaultBindingMode = defaultBindingMode;
    };
  }

  _aureliaMetadata.Decorators.configure.parameterizedDecorator('customAttribute', customAttribute);

  function templateController(target) {
    var deco = function deco(target) {
      var resource = _aureliaMetadata.Metadata.getOrCreateOwn(_aureliaMetadata.Metadata.resource, HtmlBehaviorResource, target);
      resource.liftsContent = true;
    };

    return target ? deco(target) : deco;
  }

  _aureliaMetadata.Decorators.configure.simpleDecorator('templateController', templateController);

  function bindable(nameOrConfigOrTarget, key, descriptor) {
    var deco = function deco(target, key, descriptor) {
      var actualTarget = key ? target.constructor : target,
          resource = _aureliaMetadata.Metadata.getOrCreateOwn(_aureliaMetadata.Metadata.resource, HtmlBehaviorResource, actualTarget),
          prop;

      if (key) {
        nameOrConfigOrTarget = nameOrConfigOrTarget || {};
        nameOrConfigOrTarget.name = key;
      }

      prop = new BindableProperty(nameOrConfigOrTarget);
      return prop.registerWith(actualTarget, resource, descriptor);
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

  _aureliaMetadata.Decorators.configure.parameterizedDecorator('bindable', bindable);

  function dynamicOptions(target) {
    var deco = function deco(target) {
      var resource = _aureliaMetadata.Metadata.getOrCreateOwn(_aureliaMetadata.Metadata.resource, HtmlBehaviorResource, target);
      resource.hasDynamicOptions = true;
    };

    return target ? deco(target) : deco;
  }

  _aureliaMetadata.Decorators.configure.simpleDecorator('dynamicOptions', dynamicOptions);

  function sync(selectorOrConfig) {
    return function (target, key, descriptor) {
      var actualTarget = key ? target.constructor : target,
          resource = _aureliaMetadata.Metadata.getOrCreateOwn(_aureliaMetadata.Metadata.resource, HtmlBehaviorResource, actualTarget);

      if (typeof selectorOrConfig === 'string') {
        selectorOrConfig = {
          selector: selectorOrConfig,
          name: key
        };
      }

      resource.addChildBinding(new ChildObserver(selectorOrConfig));
    };
  }

  _aureliaMetadata.Decorators.configure.parameterizedDecorator('sync', sync);

  function useShadowDOM(target) {
    var deco = function deco(target) {
      var resource = _aureliaMetadata.Metadata.getOrCreateOwn(_aureliaMetadata.Metadata.resource, HtmlBehaviorResource, target);
      resource.targetShadowDOM = true;
    };

    return target ? deco(target) : deco;
  }

  _aureliaMetadata.Decorators.configure.simpleDecorator('useShadowDOM', useShadowDOM);

  function doNotProcessContent() {
    return false;
  }

  function skipContentProcessing(target) {
    var deco = function deco(target) {
      var resource = _aureliaMetadata.Metadata.getOrCreateOwn(_aureliaMetadata.Metadata.resource, HtmlBehaviorResource, target);
      resource.processContent = doNotProcessContent;
      console.warn('The @skipContentProcessing decorator is deprecated and will be removed in a future release. Please use @processContent(false) instead.');
    };

    return target ? deco(target) : deco;
  }

  _aureliaMetadata.Decorators.configure.simpleDecorator('skipContentProcessing', skipContentProcessing);

  function processContent(processor) {
    return function (target) {
      var resource = _aureliaMetadata.Metadata.getOrCreateOwn(_aureliaMetadata.Metadata.resource, HtmlBehaviorResource, target);
      resource.processContent = processor || doNotProcessContent;
    };
  }

  _aureliaMetadata.Decorators.configure.parameterizedDecorator('processContent', processContent);

  function containerless(target) {
    var deco = function deco(target) {
      var resource = _aureliaMetadata.Metadata.getOrCreateOwn(_aureliaMetadata.Metadata.resource, HtmlBehaviorResource, target);
      resource.containerless = true;
    };

    return target ? deco(target) : deco;
  }

  _aureliaMetadata.Decorators.configure.simpleDecorator('containerless', containerless);

  function viewStrategy(strategy) {
    return function (target) {
      _aureliaMetadata.Metadata.define(ViewStrategy.metadataKey, strategy, target);
    };
  }

  _aureliaMetadata.Decorators.configure.parameterizedDecorator('viewStrategy', useView);

  function useView(path) {
    return viewStrategy(new UseViewStrategy(path));
  }

  _aureliaMetadata.Decorators.configure.parameterizedDecorator('useView', useView);

  function inlineView(markup, dependencies, dependencyBaseUrl) {
    return viewStrategy(new InlineViewStrategy(markup, dependencies, dependencyBaseUrl));
  }

  _aureliaMetadata.Decorators.configure.parameterizedDecorator('inlineView', inlineView);

  function noView(target) {
    var deco = function deco(target) {
      _aureliaMetadata.Metadata.define(ViewStrategy.metadataKey, new NoViewStrategy(), target);
    };

    return target ? deco(target) : deco;
  }

  _aureliaMetadata.Decorators.configure.simpleDecorator('noView', noView);

  function elementConfig(target) {
    var deco = function deco(target) {
      _aureliaMetadata.Metadata.define(_aureliaMetadata.Metadata.resource, new ElementConfigResource(), target);
    };

    return target ? deco(target) : deco;
  }

  _aureliaMetadata.Decorators.configure.simpleDecorator('elementConfig', elementConfig);
});