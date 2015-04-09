System.register(['aurelia-metadata', 'aurelia-path'], function (_export) {
  var Metadata, Origin, relativeToFile, _get, _inherits, _classCallCheck, _createClass, ViewStrategy, UseViewStrategy, ConventionalViewStrategy, NoViewStrategy, TemplateRegistryViewStrategy;

  return {
    setters: [function (_aureliaMetadata) {
      Metadata = _aureliaMetadata.Metadata;
      Origin = _aureliaMetadata.Origin;
    }, function (_aureliaPath) {
      relativeToFile = _aureliaPath.relativeToFile;
    }],
    execute: function () {
      'use strict';

      _get = function get(object, property, receiver) { var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

      _inherits = function (subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; };

      _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } };

      _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

      ViewStrategy = (function () {
        function ViewStrategy() {
          _classCallCheck(this, ViewStrategy);
        }

        _createClass(ViewStrategy, [{
          key: 'makeRelativeTo',
          value: function makeRelativeTo(baseUrl) {}
        }, {
          key: 'loadViewFactory',
          value: function loadViewFactory(viewEngine, options) {
            throw new Error('A ViewStrategy must implement loadViewFactory(viewEngine, options).');
          }
        }], [{
          key: 'normalize',
          value: function normalize(value) {
            if (typeof value === 'string') {
              value = new UseView(value);
            }

            if (value && !(value instanceof ViewStrategy)) {
              throw new Error('The view must be a string or an instance of ViewStrategy.');
            }

            return value;
          }
        }, {
          key: 'getDefault',
          value: function getDefault(target) {
            var strategy, annotation;

            if (typeof target !== 'function') {
              target = target.constructor;
            }

            annotation = Origin.get(target);
            strategy = Metadata.on(target).first(ViewStrategy);

            if (!strategy) {
              if (!annotation) {
                throw new Error('Cannot determinte default view strategy for object.', target);
              }

              strategy = new ConventionalViewStrategy(annotation.moduleId);
            } else if (annotation) {
              strategy.moduleId = annotation.moduleId;
            }

            return strategy;
          }
        }]);

        return ViewStrategy;
      })();

      _export('ViewStrategy', ViewStrategy);

      UseViewStrategy = (function (_ViewStrategy) {
        function UseViewStrategy(path) {
          _classCallCheck(this, UseViewStrategy);

          _get(Object.getPrototypeOf(UseViewStrategy.prototype), 'constructor', this).call(this);
          this.path = path;
        }

        _inherits(UseViewStrategy, _ViewStrategy);

        _createClass(UseViewStrategy, [{
          key: 'loadViewFactory',
          value: function loadViewFactory(viewEngine, options) {
            if (!this.absolutePath && this.moduleId) {
              this.absolutePath = relativeToFile(this.path, this.moduleId);
            }

            return viewEngine.loadViewFactory(this.absolutePath || this.path, options, this.moduleId);
          }
        }, {
          key: 'makeRelativeTo',
          value: function makeRelativeTo(file) {
            this.absolutePath = relativeToFile(this.path, file);
          }
        }]);

        return UseViewStrategy;
      })(ViewStrategy);

      _export('UseViewStrategy', UseViewStrategy);

      ConventionalViewStrategy = (function (_ViewStrategy2) {
        function ConventionalViewStrategy(moduleId) {
          _classCallCheck(this, ConventionalViewStrategy);

          _get(Object.getPrototypeOf(ConventionalViewStrategy.prototype), 'constructor', this).call(this);
          this.moduleId = moduleId;
          this.viewUrl = ConventionalViewStrategy.convertModuleIdToViewUrl(moduleId);
        }

        _inherits(ConventionalViewStrategy, _ViewStrategy2);

        _createClass(ConventionalViewStrategy, [{
          key: 'loadViewFactory',
          value: function loadViewFactory(viewEngine, options) {
            return viewEngine.loadViewFactory(this.viewUrl, options, this.moduleId);
          }
        }], [{
          key: 'convertModuleIdToViewUrl',
          value: function convertModuleIdToViewUrl(moduleId) {
            return moduleId + '.html';
          }
        }]);

        return ConventionalViewStrategy;
      })(ViewStrategy);

      _export('ConventionalViewStrategy', ConventionalViewStrategy);

      NoViewStrategy = (function (_ViewStrategy3) {
        function NoViewStrategy() {
          _classCallCheck(this, NoViewStrategy);

          if (_ViewStrategy3 != null) {
            _ViewStrategy3.apply(this, arguments);
          }
        }

        _inherits(NoViewStrategy, _ViewStrategy3);

        _createClass(NoViewStrategy, [{
          key: 'loadViewFactory',
          value: function loadViewFactory() {
            return Promise.resolve(null);
          }
        }]);

        return NoViewStrategy;
      })(ViewStrategy);

      _export('NoViewStrategy', NoViewStrategy);

      TemplateRegistryViewStrategy = (function (_ViewStrategy4) {
        function TemplateRegistryViewStrategy(moduleId, registryEntry) {
          _classCallCheck(this, TemplateRegistryViewStrategy);

          _get(Object.getPrototypeOf(TemplateRegistryViewStrategy.prototype), 'constructor', this).call(this);
          this.moduleId = moduleId;
          this.registryEntry = registryEntry;
        }

        _inherits(TemplateRegistryViewStrategy, _ViewStrategy4);

        _createClass(TemplateRegistryViewStrategy, [{
          key: 'loadViewFactory',
          value: function loadViewFactory(viewEngine, options) {
            if (this.registryEntry.isReady) {
              return Promise.resolve(this.registryEntry.factory);
            }

            return viewEngine.loadViewFactory(this.registryEntry, options, this.moduleId);
          }
        }]);

        return TemplateRegistryViewStrategy;
      })(ViewStrategy);

      _export('TemplateRegistryViewStrategy', TemplateRegistryViewStrategy);
    }
  };
});