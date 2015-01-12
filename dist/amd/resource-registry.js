define(["exports", "aurelia-path"], function (exports, _aureliaPath) {
  "use strict";

  var _get = function get(object, property, receiver) {
    var desc = Object.getOwnPropertyDescriptor(object, property);

    if (desc === undefined) {
      var parent = Object.getPrototypeOf(object);

      if (parent === null) {
        return undefined;
      } else {
        return get(parent, property, receiver);
      }
    } else if ("value" in desc && desc.writable) {
      return desc.value;
    } else {
      var getter = desc.get;
      if (getter === undefined) {
        return undefined;
      }
      return getter.call(receiver);
    }
  };

  var _inherits = function (child, parent) {
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

  var _prototypeProperties = function (child, staticProps, instanceProps) {
    if (staticProps) Object.defineProperties(child, staticProps);
    if (instanceProps) Object.defineProperties(child.prototype, instanceProps);
  };

  var relativeToFile = _aureliaPath.relativeToFile;


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

  var ResourceRegistry = (function () {
    var ResourceRegistry = function ResourceRegistry() {
      this.attributes = {};
      this.elements = {};
      this.valueConverters = {};
      this.attributeMap = {};
    };

    _prototypeProperties(ResourceRegistry, null, {
      registerElement: {
        value: function (tagName, behavior) {
          register(this.elements, tagName, behavior, "an Element");
        },
        writable: true,
        enumerable: true,
        configurable: true
      },
      getElement: {
        value: function (tagName) {
          return this.elements[tagName];
        },
        writable: true,
        enumerable: true,
        configurable: true
      },
      registerAttribute: {
        value: function (attribute, behavior, knownAttribute) {
          this.attributeMap[attribute] = knownAttribute;
          register(this.attributes, attribute, behavior, "an Attribute");
        },
        writable: true,
        enumerable: true,
        configurable: true
      },
      getAttribute: {
        value: function (attribute) {
          return this.attributes[attribute];
        },
        writable: true,
        enumerable: true,
        configurable: true
      },
      registerValueConverter: {
        value: function (name, valueConverter) {
          register(this.valueConverters, name, valueConverter, "a ValueConverter");
        },
        writable: true,
        enumerable: true,
        configurable: true
      },
      getValueConverter: {
        value: function (name) {
          return this.valueConverters[name];
        },
        writable: true,
        enumerable: true,
        configurable: true
      }
    });

    return ResourceRegistry;
  })();

  exports.ResourceRegistry = ResourceRegistry;
  var ViewResources = (function (ResourceRegistry) {
    var ViewResources = function ViewResources(parent, viewUrl) {
      _get(Object.getPrototypeOf(ViewResources.prototype), "constructor", this).call(this);
      this.parent = parent;
      this.viewUrl = viewUrl;
      this.valueConverterLookupFunction = this.getValueConverter.bind(this);
    };

    _inherits(ViewResources, ResourceRegistry);

    _prototypeProperties(ViewResources, null, {
      relativeToView: {
        value: function (path) {
          return relativeToFile(path, this.viewUrl);
        },
        writable: true,
        enumerable: true,
        configurable: true
      },
      getElement: {
        value: function (tagName) {
          return this.elements[tagName] || this.parent.getElement(tagName);
        },
        writable: true,
        enumerable: true,
        configurable: true
      },
      getAttribute: {
        value: function (attribute) {
          return this.attributes[attribute] || this.parent.getAttribute(attribute);
        },
        writable: true,
        enumerable: true,
        configurable: true
      },
      getValueConverter: {
        value: function (name) {
          return this.valueConverters[name] || this.parent.getValueConverter(name);
        },
        writable: true,
        enumerable: true,
        configurable: true
      }
    });

    return ViewResources;
  })(ResourceRegistry);

  exports.ViewResources = ViewResources;
});