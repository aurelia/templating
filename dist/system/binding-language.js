System.register([], function (_export) {
  var _classCallCheck, BindingLanguage;

  return {
    setters: [],
    execute: function () {
      'use strict';

      _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } };

      BindingLanguage = (function () {
        function BindingLanguage() {
          _classCallCheck(this, BindingLanguage);
        }

        BindingLanguage.prototype.inspectAttribute = function inspectAttribute(resources, attrName, attrValue) {
          throw new Error('A BindingLanguage must implement inspectAttribute(...)');
        };

        BindingLanguage.prototype.createAttributeInstruction = function createAttributeInstruction(resources, element, info, existingInstruction) {
          throw new Error('A BindingLanguage must implement createAttributeInstruction(...)');
        };

        BindingLanguage.prototype.parseText = function parseText(resources, value) {
          throw new Error('A BindingLanguage must implement parseText(...)');
        };

        return BindingLanguage;
      })();

      _export('BindingLanguage', BindingLanguage);
    }
  };
});