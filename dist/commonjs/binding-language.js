'use strict';

var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } };

exports.__esModule = true;

var BindingLanguage = (function () {
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

exports.BindingLanguage = BindingLanguage;