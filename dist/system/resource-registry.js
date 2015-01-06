System.register(["aurelia-path"], function (_export) {
  "use strict";

  var relativeToFile, _inherits, ResourceRegistry, ViewResources;


  function register(lookup, name, resource, type) {
    if (!name) {
      return;
    }

    var existing = lookup[name];
    if (existing) {
      if (existing != resource) {
        throw new Error("Attempted to register " + type + " when one with the same name already exists. Name: " + name + ".");
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
      _inherits = function (child, parent) {
        if (typeof parent !== "function" && parent !== null) {
          throw new TypeError("Super expression must either be null or a function, not " + typeof parent);
        }
        child.prototype = Object.create(parent && parent.prototype, {
          constructor: {
            value: child,
            enumerable: false,
            writable: true,
            configurable: true
          }
        });
        if (parent) child.__proto__ = parent;
      };

      ResourceRegistry = function ResourceRegistry() {
        this.attributes = {};
        this.elements = {};
        this.valueConverters = {};
        this.attributeMap = {};
      };

      ResourceRegistry.prototype.registerElement = function (tagName, behavior) {
        register(this.elements, tagName, behavior, "an Element");
      };

      ResourceRegistry.prototype.getElement = function (tagName) {
        return this.elements[tagName];
      };

      ResourceRegistry.prototype.registerAttribute = function (attribute, behavior, knownAttribute) {
        this.attributeMap[attribute] = knownAttribute;
        register(this.attributes, attribute, behavior, "an Attribute");
      };

      ResourceRegistry.prototype.getAttribute = function (attribute) {
        return this.attributes[attribute];
      };

      ResourceRegistry.prototype.registerValueConverter = function (name, valueConverter) {
        register(this.valueConverters, name, valueConverter, "a ValueConverter");
      };

      ResourceRegistry.prototype.getValueConverter = function (name) {
        return this.valueConverters[name];
      };

      _export("ResourceRegistry", ResourceRegistry);

      ViewResources = (function () {
        var _ResourceRegistry = ResourceRegistry;
        var ViewResources = function ViewResources(parent, viewUrl) {
          _ResourceRegistry.call(this);
          this.parent = parent;
          this.viewUrl = viewUrl;
          this.valueConverterLookupFunction = this.getValueConverter.bind(this);
        };

        _inherits(ViewResources, _ResourceRegistry);

        ViewResources.prototype.relativeToView = function (path) {
          return relativeToFile(path, this.viewUrl);
        };

        ViewResources.prototype.getElement = function (tagName) {
          return this.elements[tagName] || this.parent.getElement(tagName);
        };

        ViewResources.prototype.getAttribute = function (attribute) {
          return this.attributes[attribute] || this.parent.getAttribute(attribute);
        };

        ViewResources.prototype.getValueConverter = function (name) {
          return this.valueConverters[name] || this.parent.getValueConverter(name);
        };

        return ViewResources;
      })();
      _export("ViewResources", ViewResources);
    }
  };
});