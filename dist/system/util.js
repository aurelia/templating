System.register([], function (_export) {
  "use strict";

  var capitalMatcher;

  _export("hyphenate", hyphenate);

  _export("nextElementSibling", nextElementSibling);

  function addHyphenAndLower(char) {
    return "-" + char.toLowerCase();
  }

  function hyphenate(name) {
    return (name.charAt(0).toLowerCase() + name.slice(1)).replace(capitalMatcher, addHyphenAndLower);
  }

  function nextElementSibling(element) {
    if (element.nextElementSibling) {
      return element.nextElementSibling;
    }
    do {
      element = element.nextSibling;
    } while (element && element.nodeType !== 1);
    return element;
  }

  return {
    setters: [],
    execute: function () {
      capitalMatcher = /([A-Z])/g;
    }
  };
});