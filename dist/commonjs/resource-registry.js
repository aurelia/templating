"use strict";

var _extends = function (child, parent) {
  child.prototype = Object.create(parent.prototype, {
    constructor: {
      value: child,
      enumerable: false,
      writable: true,
      configurable: true
    }
  });
  child.__proto__ = parent;
};

function register(lookup, name, resource, type) {
  if (!name) {
    return;
  }

  var existing = lookup[name];
  if (existing) {
    if (existing != resource) {
      throw new Error("Attempted to register an " + type + " when one with the same name already exists. Name: " + name + ".");
    }

    return;
  }

  lookup[name] = resource;
}

var ResourceRegistry = (function () {
  var ResourceRegistry = function ResourceRegistry() {
    this.attributes = {};
    this.elements = {};
    this.filters = {};
  };

  ResourceRegistry.prototype.registerElement = function (tagName, behavior) {
    register(this.elements, tagName, behavior, "element");
  };

  ResourceRegistry.prototype.getElement = function (tagName) {
    return this.elements[tagName];
  };

  ResourceRegistry.prototype.registerAttribute = function (attribute, behavior) {
    register(this.attributes, attribute, behavior, "attribute");
  };

  ResourceRegistry.prototype.getAttribute = function (attribute) {
    return this.attributes[attribute];
  };

  ResourceRegistry.prototype.registerFilter = function (name, filter) {
    register(this.filters, name, filter, "filter");
  };

  ResourceRegistry.prototype.getFilter = function (name) {
    return this.filters[name];
  };

  return ResourceRegistry;
})();

exports.ResourceRegistry = ResourceRegistry;
var ViewResources = (function (ResourceRegistry) {
  var ViewResources = function ViewResources(parent) {
    ResourceRegistry.call(this);
    this.parent = parent;
    this.filterLookupFunction = this.getFilter.bind(this);
  };

  _extends(ViewResources, ResourceRegistry);

  ViewResources.prototype.getElement = function (tagName) {
    return this.elements[tagName] || this.parent.getElement(tagName);
  };

  ViewResources.prototype.getAttribute = function (attribute) {
    return this.attributes[attribute] || this.parent.getAttribute(attribute);
  };

  ViewResources.prototype.getFilter = function (name) {
    return this.filterLookup[name] || this.parent.getFilter(name);
  };

  return ViewResources;
})(ResourceRegistry);

exports.ViewResources = ViewResources;