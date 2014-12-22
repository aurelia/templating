"use strict";

var Loader = require('aurelia-loader').Loader;
var Container = require('aurelia-dependency-injection').Container;
var getAnnotation = require('aurelia-metadata').getAnnotation;
var addAnnotation = require('aurelia-metadata').addAnnotation;
var ResourceType = require('aurelia-metadata').ResourceType;
var Origin = require('aurelia-metadata').Origin;
var Filter = require('aurelia-binding').Filter;
var CustomElement = require('./custom-element').CustomElement;
var AttachedBehavior = require('./attached-behavior').AttachedBehavior;
var TemplateController = require('./template-controller').TemplateController;
var ViewEngine = require('./view-engine').ViewEngine;
var ResourceCoordinator = (function () {
  var ResourceCoordinator = function ResourceCoordinator(loader, container, viewEngine) {
    this.loader = loader;
    this.container = container;
    this.viewEngine = viewEngine;
    this.importedModules = {};
    this.importedAnonymous = {};
    viewEngine.resourceCoordinator = this;
  };

  ResourceCoordinator.inject = function () {
    return [Loader, Container, ViewEngine];
  };

  ResourceCoordinator.prototype._loadAndAnalyzeModule = function (moduleImport, moduleMember, cache) {
    var _this = this;
    var existing = cache[moduleImport];

    if (existing) {
      return Promise.resolve(existing.element);
    }

    return this.loader.loadModule(moduleImport).then(function (elementModule) {
      var analysis = analyzeModule(elementModule, moduleMember), resources = analysis.resources, container = _this.container, loads = [], type, current, i, ii;

      if (!analysis.element) {
        throw new Error("No element found in module \"" + moduleImport + "\".");
      }

      for (i = 0, ii = resources.length; i < ii; ++i) {
        current = resources[i];
        type = current.type;

        if (!type.isLoaded) {
          type.isLoaded = true;
          loads.push(type.load(container, current.value));
        }
      }

      cache[moduleImport] = analysis;

      return Promise.all(loads).then(function () {
        return analysis.element;
      });
    });
  };

  ResourceCoordinator.prototype.loadViewModelType = function (moduleImport, moduleMember) {
    return this._loadAndAnalyzeModule(moduleImport, moduleMember, this.importedAnonymous).then(function (info) {
      return info.value;
    });
  };

  ResourceCoordinator.prototype.loadAnonymousElement = function (moduleImport, moduleMember, viewStategy) {
    var _this2 = this;
    return this.loadViewModelType(moduleImport, moduleMember).then(function (viewModelType) {
      return CustomElement.anonymous(_this2.container, viewModelType, viewStategy);
    });
  };

  ResourceCoordinator.prototype.loadElement = function (moduleImport, moduleMember, viewStategy) {
    var _this3 = this;
    return this._loadAndAnalyzeModule(moduleImport, moduleMember, this.importedModules).then(function (info) {
      var type = info.type;

      if (type.isLoaded) {
        return type;
      }

      type.isLoaded = true;

      return type.load(_this3.container, info.value, viewStategy);
    });
  };

  ResourceCoordinator.prototype.importResources = function (imports, importIds) {
    var i, ii;

    for (i = 0, ii = imports.length; i < ii; ++i) {
      imports[i] = { "default": imports[i] };
    }

    return this.importResourcesFromModules(imports, importIds);
  };

  ResourceCoordinator.prototype.importResourcesFromModules = function (imports, importIds) {
    var loads = [], i, ii, analysis, type, key, annotation, j, jj, resources, current, existing = this.importedModules;

    if (!importIds) {
      importIds = new Array(imports.length);

      for (i = 0, ii = imports.length; i < ii; ++i) {
        current = imports[i];

        for (key in current) {
          type = current[key];
          annotation = Origin.get(type);
          if (annotation) {
            importIds[i] = annotation.moduleId;
            break;
          }
        }
      }
    }

    for (i = 0, ii = imports.length; i < ii; ++i) {
      analysis = analyzeModule(imports[i]);
      existing[importIds[i]] = analysis;
      resources = analysis.resources;

      for (j = 0, jj = resources.length; j < jj; ++j) {
        current = resources[j];
        type = current.type;

        if (!type.isLoaded) {
          type.isLoaded = true;
          loads.push(type.load(this.container, current.value));
        } else {
          loads.push(type);
        }
      }

      if (analysis.element) {
        type = analysis.element.type;

        if (!type.isLoaded) {
          type.isLoaded = true;
          loads.push(type.load(this.container, analysis.element.value));
        } else {
          loads.push(type);
        }
      }
    }

    return Promise.all(loads);
  };

  ResourceCoordinator.prototype.importResourcesFromModuleIds = function (importIds) {
    var _this4 = this;
    var existing = this.importedModules, analysis, resources, toLoad = [], toLoadIds = [], ready = [], i, ii, j, jj, current;

    for (i = 0, ii = importIds.length; i < ii; ++i) {
      current = importIds[i];
      analysis = existing[current];

      if (!analysis) {
        toLoadIds.push(current);
        toLoad.push(current);
      } else {
        resources = analysis.resources;

        for (j = 0, jj = resources.length; j < jj; ++j) {
          ready.push(resources[j].type);
        }

        if (analysis.element) {
          ready.push(analysis.element.type);
        }
      }
    }

    if (toLoad.length === 0) {
      return Promise.resolve(ready);
    }

    return this.loader.loadAllModules(toLoad).then(function (imports) {
      return _this4.importResourcesFromModules(imports, toLoadIds).then(function (resources) {
        return ready.concat(resources);
      });
    });
  };

  return ResourceCoordinator;
})();

exports.ResourceCoordinator = ResourceCoordinator;


function analyzeModule(moduleInstance, viewModelMember) {
  var viewModelType, fallback, annotation, key, exportedValue, resources = [], name, conventional;

  if (viewModelMember) {
    viewModelType = moduleInstance[viewModelMember];
  }

  for (key in moduleInstance) {
    exportedValue = moduleInstance[key];

    if (key === viewModelMember || typeof exportedValue !== "function") {
      continue;
    }

    annotation = getAnnotation(exportedValue, ResourceType);
    if (annotation) {
      if (!viewModelType && annotation instanceof CustomElement) {
        viewModelType = exportedValue;
      } else {
        resources.push({ type: annotation, value: exportedValue });
      }
    } else {
      name = exportedValue.name;

      if (conventional = CustomElement.convention(name)) {
        if (!viewModelType) {
          addAnnotation(exportedValue, conventional);
          viewModelType = exportedValue;
        } else {
          resources.push({ type: conventional, value: exportedValue });
        }
      } else if (conventional = AttachedBehavior.convention(name)) {
        resources.push({ type: conventional, value: exportedValue });
      } else if (conventional = TemplateController.convention(name)) {
        resources.push({ type: conventional, value: exportedValue });
      } else if (conventional = Filter.convention(name)) {
        resources.push({ type: conventional, value: exportedValue });
      } else if (!fallback) {
        fallback = exportedValue;
      }
    }
  }

  viewModelType = viewModelType || fallback;

  return {
    source: moduleInstance,
    element: viewModelType ? {
      value: viewModelType,
      type: getAnnotation(viewModelType, CustomElement) || new CustomElement()
    } : null,
    resources: resources
  };
}