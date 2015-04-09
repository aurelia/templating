System.register([], function (_export) {
  var _classCallCheck, _createClass, BindingLanguage;

  return {
    setters: [],
    execute: function () {
      'use strict';

      _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } };

      _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

      BindingLanguage = (function () {
        function BindingLanguage() {
          _classCallCheck(this, BindingLanguage);
        }

        _createClass(BindingLanguage, [{
          key: 'inspectAttribute',
          value: function inspectAttribute(resources, attrName, attrValue) {
            throw new Error('A BindingLanguage must implement inspectAttribute(...)');
          }
        }, {
          key: 'createAttributeInstruction',
          value: function createAttributeInstruction(resources, element, info, existingInstruction) {
            throw new Error('A BindingLanguage must implement createAttributeInstruction(...)');
          }
        }, {
          key: 'parseText',
          value: function parseText(resources, value) {
            throw new Error('A BindingLanguage must implement parseText(...)');
          }
        }]);

        return BindingLanguage;
      })();

      _export('BindingLanguage', BindingLanguage);
    }
  };
});