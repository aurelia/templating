System.register([], function (_export) {
  "use strict";

  var BindingLanguage;
  return {
    setters: [],
    execute: function () {
      BindingLanguage = function BindingLanguage() {};

      BindingLanguage.prototype.parseAttribute = function (resources, element, attrName, attrValue, existingInstruction) {
        throw new Error("A BindingLanguage must implement parseAttribute(...)");
      };

      BindingLanguage.prototype.parseText = function (resources, value) {
        throw new Error("A BindingLanguage must implement parseText(...)");
      };

      _export("BindingLanguage", BindingLanguage);
    }
  };
});