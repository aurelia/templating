System.register([], function (_export) {
  "use strict";

  var _prototypeProperties, BindingLanguage;
  return {
    setters: [],
    execute: function () {
      _prototypeProperties = function (child, staticProps, instanceProps) {
        if (staticProps) Object.defineProperties(child, staticProps);
        if (instanceProps) Object.defineProperties(child.prototype, instanceProps);
      };

      BindingLanguage = (function () {
        var BindingLanguage = function BindingLanguage() {};

        _prototypeProperties(BindingLanguage, null, {
          inspectAttribute: {
            value: function (resources, attrName, attrValue) {
              throw new Error("A BindingLanguage must implement inspectAttribute(...)");
            },
            writable: true,
            enumerable: true,
            configurable: true
          },
          createAttributeInstruction: {
            value: function (resources, element, info, existingInstruction) {
              throw new Error("A BindingLanguage must implement createAttributeInstruction(...)");
            },
            writable: true,
            enumerable: true,
            configurable: true
          },
          parseText: {
            value: function (resources, value) {
              throw new Error("A BindingLanguage must implement parseText(...)");
            },
            writable: true,
            enumerable: true,
            configurable: true
          }
        });

        return BindingLanguage;
      })();
      _export("BindingLanguage", BindingLanguage);
    }
  };
});