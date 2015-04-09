System.register(['aurelia-metadata', 'aurelia-binding'], function (_export) {
  var ResourceType, EventManager, _classCallCheck, _createClass, _inherits, ElementConfigResource;

  return {
    setters: [function (_aureliaMetadata) {
      ResourceType = _aureliaMetadata.ResourceType;
    }, function (_aureliaBinding) {
      EventManager = _aureliaBinding.EventManager;
    }],
    execute: function () {
      'use strict';

      _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } };

      _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

      _inherits = function (subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; };

      ElementConfigResource = (function (_ResourceType) {
        function ElementConfigResource() {
          _classCallCheck(this, ElementConfigResource);

          if (_ResourceType != null) {
            _ResourceType.apply(this, arguments);
          }
        }

        _inherits(ElementConfigResource, _ResourceType);

        _createClass(ElementConfigResource, [{
          key: 'load',
          value: function load(container, target) {
            var config = new target(),
                eventManager = container.get(EventManager);

            eventManager.registerElementConfig(config);
            return Promise.resolve(this);
          }
        }, {
          key: 'register',
          value: function register() {}
        }]);

        return ElementConfigResource;
      })(ResourceType);

      _export('ElementConfigResource', ElementConfigResource);
    }
  };
});