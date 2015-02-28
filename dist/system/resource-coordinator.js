System.register(["aurelia-loader", "aurelia-path", "aurelia-dependency-injection", "aurelia-metadata", "aurelia-binding", "./custom-element", "./attached-behavior", "./template-controller", "./view-engine", "./resource-registry"], function (_export) {
  var Loader, relativeToFile, join, Container, Metadata, ResourceType, Origin, ValueConverter, CustomElement, AttachedBehavior, TemplateController, ViewEngine, ResourceRegistry, _prototypeProperties, _classCallCheck, id, ResourceCoordinator, ResourceModule;

  function nextId() {
    return ++id;
  }

  function analyzeModule(moduleInstance, viewModelMember) {
    var viewModelType,
        fallback,
        annotation,
        key,
        meta,
        exportedValue,
        resources = [],
        name,
        conventional;

    if (typeof moduleInstance === "function") {
      moduleInstance = { "default": moduleInstance };
    }

    if (viewModelMember) {
      viewModelType = moduleInstance[viewModelMember];
    }

    for (key in moduleInstance) {
      exportedValue = moduleInstance[key];

      if (key === viewModelMember || typeof exportedValue !== "function") {
        continue;
      }

      meta = Metadata.on(exportedValue);
      annotation = meta.first(ResourceType);

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
            meta.add(conventional);
            viewModelType = exportedValue;
          } else {
            resources.push({ type: conventional, value: exportedValue });
          }
        } else if (conventional = AttachedBehavior.convention(name)) {
          resources.push({ type: conventional, value: exportedValue });
        } else if (conventional = TemplateController.convention(name)) {
          resources.push({ type: conventional, value: exportedValue });
        } else if (conventional = ValueConverter.convention(name)) {
          resources.push({ type: conventional, value: exportedValue });
        } else if (!fallback) {
          fallback = exportedValue;
        }
      }
    }

    viewModelType = viewModelType || fallback;

    return new ResourceModule(moduleInstance, viewModelType ? {
      value: viewModelType,
      type: Metadata.on(viewModelType).first(CustomElement) || new CustomElement()
    } : null, resources);
  }
  return {
    setters: [function (_aureliaLoader) {
      Loader = _aureliaLoader.Loader;
    }, function (_aureliaPath) {
      relativeToFile = _aureliaPath.relativeToFile;
      join = _aureliaPath.join;
    }, function (_aureliaDependencyInjection) {
      Container = _aureliaDependencyInjection.Container;
    }, function (_aureliaMetadata) {
      Metadata = _aureliaMetadata.Metadata;
      ResourceType = _aureliaMetadata.ResourceType;
      Origin = _aureliaMetadata.Origin;
    }, function (_aureliaBinding) {
      ValueConverter = _aureliaBinding.ValueConverter;
    }, function (_customElement) {
      CustomElement = _customElement.CustomElement;
    }, function (_attachedBehavior) {
      AttachedBehavior = _attachedBehavior.AttachedBehavior;
    }, function (_templateController) {
      TemplateController = _templateController.TemplateController;
    }, function (_viewEngine) {
      ViewEngine = _viewEngine.ViewEngine;
    }, function (_resourceRegistry) {
      ResourceRegistry = _resourceRegistry.ResourceRegistry;
    }],
    execute: function () {
      "use strict";

      _prototypeProperties = function (child, staticProps, instanceProps) { if (staticProps) Object.defineProperties(child, staticProps); if (instanceProps) Object.defineProperties(child.prototype, instanceProps); };

      _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } };

      id = 0;
      ResourceCoordinator = _export("ResourceCoordinator", (function () {
        function ResourceCoordinator(loader, container, viewEngine, appResources) {
          _classCallCheck(this, ResourceCoordinator);

          this.loader = loader;
          this.container = container;
          this.viewEngine = viewEngine;
          this.importedModules = {};
          this.importedAnonymous = {};
          this.appResources = appResources;
          viewEngine.resourceCoordinator = this;
        }

        _prototypeProperties(ResourceCoordinator, {
          inject: {
            value: function inject() {
              return [Loader, Container, ViewEngine, ResourceRegistry];
            },
            writable: true,
            configurable: true
          }
        }, {
          getExistingModuleAnalysis: {
            value: function getExistingModuleAnalysis(id) {
              return this.importedModules[id] || this.importedAnonymous[id];
            },
            writable: true,
            configurable: true
          },
          loadViewModelInfo: {
            value: function loadViewModelInfo(moduleImport, moduleMember) {
              return this._loadAndAnalyzeModuleForElement(moduleImport, moduleMember, this.importedAnonymous, true);
            },
            writable: true,
            configurable: true
          },
          loadElement: {
            value: function loadElement(moduleImport, moduleMember, viewStategy) {
              var _this = this;

              return this._loadAndAnalyzeModuleForElement(moduleImport, moduleMember, this.importedModules, false).then(function (info) {
                var type = info.type;

                if (type.isLoaded) {
                  return type;
                }

                type.isLoaded = true;

                return type.load(_this.container, info.value, viewStategy);
              });
            },
            writable: true,
            configurable: true
          },
          _loadAndAnalyzeModuleForElement: {
            value: function _loadAndAnalyzeModuleForElement(moduleImport, moduleMember, cache, skipCacheLookup) {
              var _this = this;

              var existing = !skipCacheLookup && cache[moduleImport];

              if (existing) {
                return Promise.resolve(existing.element);
              }

              return this.loader.loadModule(moduleImport).then(function (elementModule) {
                var analysis = analyzeModule(elementModule, moduleMember),
                    resources = analysis.resources,
                    container = _this.container,
                    loads = [],
                    type,
                    current,
                    i,
                    ii;

                if (!analysis.element) {
                  throw new Error("No element found in module \"" + moduleImport + "\".");
                }

                analysis.analyze(container);

                for (i = 0, ii = resources.length; i < ii; ++i) {
                  current = resources[i];
                  type = current.type;

                  if (!type.isLoaded) {
                    type.isLoaded = true;
                    loads.push(type.load(container, current.value));
                  }
                }

                cache[analysis.id] = analysis;

                return Promise.all(loads).then(function () {
                  return analysis.element;
                });
              });
            },
            writable: true,
            configurable: true
          },
          importResources: {
            value: function importResources(imports, resourceManifestUrl) {
              var i,
                  ii,
                  current,
                  annotation,
                  existing,
                  lookup = {},
                  finalModules = [],
                  importIds = [],
                  analysis,
                  type;

              var container = this.container;

              for (i = 0, ii = imports.length; i < ii; ++i) {
                current = imports[i];
                annotation = Origin.get(current);

                if (!annotation) {
                  analysis = analyzeModule({ "default": current });
                  analysis.analyze(container);
                  type = (analysis.element || analysis.resources[0]).type;

                  if (resourceManifestUrl) {
                    annotation = new Origin(relativeToFile("./" + type.name, resourceManifestUrl));
                  } else {
                    annotation = new Origin(join(this.appResources.baseResourceUrl, type.name));
                  }

                  Origin.set(current, annotation);
                }

                existing = lookup[annotation.moduleId];

                if (!existing) {
                  existing = {};
                  importIds.push(annotation.moduleId);
                  finalModules.push(existing);
                  lookup[annotation.moduleId] = existing;
                }

                existing[nextId()] = current;
              }

              return this.importResourcesFromModules(finalModules, importIds);
            },
            writable: true,
            configurable: true
          },
          importResourcesFromModuleIds: {
            value: function importResourcesFromModuleIds(importIds) {
              var _this = this;

              return this.loader.loadAllModules(importIds).then(function (imports) {
                return _this.importResourcesFromModules(imports, importIds);
              });
            },
            writable: true,
            configurable: true
          },
          importResourcesFromModules: {
            value: function importResourcesFromModules(imports, importIds) {
              var loads = [],
                  i,
                  ii,
                  analysis,
                  type,
                  key,
                  annotation,
                  j,
                  jj,
                  resources,
                  current,
                  existing = this.importedModules,
                  container = this.container,
                  allAnalysis = new Array(imports.length);

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
                analysis = existing[importIds[i]];

                if (analysis) {
                  allAnalysis[i] = analysis;
                  continue;
                }

                analysis = analyzeModule(imports[i]);
                analysis.analyze(container);
                existing[analysis.id] = analysis;
                allAnalysis[i] = analysis;
                resources = analysis.resources;

                for (j = 0, jj = resources.length; j < jj; ++j) {
                  current = resources[j];
                  type = current.type;

                  if (!type.isLoaded) {
                    type.isLoaded = true;
                    loads.push(type.load(container, current.value));
                  }
                }

                if (analysis.element) {
                  type = analysis.element.type;

                  if (!type.isLoaded) {
                    type.isLoaded = true;
                    loads.push(type.load(container, analysis.element.value));
                  }
                }
              }

              return Promise.all(loads).then(function () {
                return allAnalysis;
              });
            },
            writable: true,
            configurable: true
          }
        });

        return ResourceCoordinator;
      })());

      ResourceModule = (function () {
        function ResourceModule(source, element, resources) {
          _classCallCheck(this, ResourceModule);

          var i, ii, org;

          this.source = source;
          this.element = element;
          this.resources = resources;

          if (element) {
            org = Origin.get(element.value);
          } else if (resources.length) {
            org = Origin.get(resources[0].value);
          } else {
            org = Origin.get(source);
          }

          if (org) {
            this.id = org.moduleId;
          }
        }

        _prototypeProperties(ResourceModule, null, {
          analyze: {
            value: function analyze(container) {
              var current = this.element,
                  resources = this.resources,
                  i,
                  ii;

              if (current) {
                if (!current.type.isAnalyzed) {
                  current.type.isAnalyzed = true;
                  current.type.analyze(container, current.value);
                }
              }

              for (i = 0, ii = resources.length; i < ii; ++i) {
                current = resources[i];

                if ("analyze" in current.type && !current.type.isAnalyzed) {
                  current.type.isAnalyzed = true;
                  current.type.analyze(container, current.value);
                }
              }
            },
            writable: true,
            configurable: true
          },
          register: {
            value: function register(registry, name) {
              var i,
                  ii,
                  resources = this.resources;

              if (this.element) {
                this.element.type.register(registry, name);
                name = null;
              }

              for (i = 0, ii = resources.length; i < ii; ++i) {
                resources[i].type.register(registry, name);
                name = null;
              }
            },
            writable: true,
            configurable: true
          }
        });

        return ResourceModule;
      })();
    }
  };
});