System.register(['aurelia-path'], function (_export) {
  var relativeToFile, _get, _inherits, _classCallCheck, _createClass, ResourceRegistry, ViewResources;

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

  return {
    setters: [function (_aureliaPath) {
      relativeToFile = _aureliaPath.relativeToFile;
    }],
    execute: function () {
      'use strict';

      _get = function get(object, property, receiver) { var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

      _inherits = function (subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; };

      _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } };

      _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

      ResourceRegistry = (function () {
        function ResourceRegistry() {
          _classCallCheck(this, ResourceRegistry);

          this.attributes = {};
          this.elements = {};
          this.valueConverters = {};
          this.attributeMap = {};
          this.baseResourceUrl = '';
        }

        _createClass(ResourceRegistry, [{
          key: 'registerElement',
          value: function registerElement(tagName, behavior) {
            register(this.elements, tagName, behavior, 'an Element');
          }
        }, {
          key: 'getElement',
          value: function getElement(tagName) {
            return this.elements[tagName];
          }
        }, {
          key: 'registerAttribute',
          value: function registerAttribute(attribute, behavior, knownAttribute) {
            this.attributeMap[attribute] = knownAttribute;
            register(this.attributes, attribute, behavior, 'an Attribute');
          }
        }, {
          key: 'getAttribute',
          value: function getAttribute(attribute) {
            return this.attributes[attribute];
          }
        }, {
          key: 'registerValueConverter',
          value: function registerValueConverter(name, valueConverter) {
            register(this.valueConverters, name, valueConverter, 'a ValueConverter');
          }
        }, {
          key: 'getValueConverter',
          value: function getValueConverter(name) {
            return this.valueConverters[name];
          }
        }]);

        return ResourceRegistry;
      })();

      _export('ResourceRegistry', ResourceRegistry);

      ViewResources = (function (_ResourceRegistry) {
        function ViewResources(parent, viewUrl) {
          _classCallCheck(this, ViewResources);

          _get(Object.getPrototypeOf(ViewResources.prototype), 'constructor', this).call(this);
          this.parent = parent;
          this.viewUrl = viewUrl;
          this.valueConverterLookupFunction = this.getValueConverter.bind(this);
        }

        _inherits(ViewResources, _ResourceRegistry);

        _createClass(ViewResources, [{
          key: 'relativeToView',
          value: function relativeToView(path) {
            return relativeToFile(path, this.viewUrl);
          }
        }, {
          key: 'getElement',
          value: function getElement(tagName) {
            return this.elements[tagName] || this.parent.getElement(tagName);
          }
        }, {
          key: 'mapAttribute',
          value: function mapAttribute(attribute) {
            return this.attributeMap[attribute] || this.parent.attributeMap[attribute];
          }
        }, {
          key: 'getAttribute',
          value: function getAttribute(attribute) {
            return this.attributes[attribute] || this.parent.getAttribute(attribute);
          }
        }, {
          key: 'getValueConverter',
          value: function getValueConverter(name) {
            return this.valueConverters[name] || this.parent.getValueConverter(name);
          }
        }]);

        return ViewResources;
      })(ResourceRegistry);

      _export('ViewResources', ViewResources);
    }
  };
});