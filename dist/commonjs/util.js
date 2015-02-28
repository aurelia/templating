"use strict";

exports.hyphenate = hyphenate;
var capitalMatcher = /([A-Z])/g;

function addHyphenAndLower(char) {
  return "-" + char.toLowerCase();
}

function hyphenate(name) {
  return (name.charAt(0).toLowerCase() + name.slice(1)).replace(capitalMatcher, addHyphenAndLower);
}

Object.defineProperty(exports, "__esModule", {
  value: true
});