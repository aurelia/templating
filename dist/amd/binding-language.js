define(["exports"], function (exports) {
  "use strict";

  var BindingLanguage = (function () {
    var BindingLanguage = function BindingLanguage() {};

    BindingLanguage.prototype.parseAttribute = function (resources, element, attrName, attrValue, existingInstruction) {
      throw new Error("A BindingLanguage must implement parseAttribute(...)");
    };

    BindingLanguage.prototype.parseText = function (resources, value) {
      throw new Error("A BindingLanguage must implement parseText(...)");
    };

    return BindingLanguage;
  })();

  exports.BindingLanguage = BindingLanguage;
});