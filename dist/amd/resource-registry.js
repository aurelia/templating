define(['exports', 'aurelia-path'], function (exports, _aureliaPath) {
  'use strict';

  var _inherits = function (subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; };

  var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } };

  exports.__esModule = true;

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
});