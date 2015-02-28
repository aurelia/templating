define(["exports"], function (exports) {
  "use strict";

  var _prototypeProperties = function (child, staticProps, instanceProps) { if (staticProps) Object.defineProperties(child, staticProps); if (instanceProps) Object.defineProperties(child.prototype, instanceProps); };

  var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } };

  var BindingLanguage = exports.BindingLanguage = (function () {
    function BindingLanguage() {
      _classCallCheck(this, BindingLanguage);
    }

    _prototypeProperties(BindingLanguage, null, {
      inspectAttribute: {
        value: function inspectAttribute(resources, attrName, attrValue) {
          throw new Error("A BindingLanguage must implement inspectAttribute(...)");
        },
        writable: true,
        configurable: true
      },
      createAttributeInstruction: {
        value: function createAttributeInstruction(resources, element, info, existingInstruction) {
          throw new Error("A BindingLanguage must implement createAttributeInstruction(...)");
        },
        writable: true,
        configurable: true
      },
      parseText: {
        value: function parseText(resources, value) {
          throw new Error("A BindingLanguage must implement parseText(...)");
        },
        writable: true,
        configurable: true
      }
    });

    return BindingLanguage;
  })();

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
});