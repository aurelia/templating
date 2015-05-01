'use strict';

var _interopRequireDefault = function (obj) { return obj && obj.__esModule ? obj : { 'default': obj }; };

var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } };

exports.__esModule = true;

var _core = require('core-js');

var _core2 = _interopRequireDefault(_core);

if (Element && !Element.prototype.matches) {
  var proto = Element.prototype;
  proto.matches = proto.matchesSelector || proto.mozMatchesSelector || proto.msMatchesSelector || proto.oMatchesSelector || proto.webkitMatchesSelector;
}

var placeholder = [];

function findInsertionPoint(groups, index) {
  var insertionPoint;

  while (!insertionPoint && index >= 0) {
    insertionPoint = groups[index][0];
    index--;
  }

  return insertionPoint;
}

var ContentSelector = (function () {
  function ContentSelector(anchor, selector) {
    _classCallCheck(this, ContentSelector);

    this.anchor = anchor;
    this.selector = selector;
    this.all = !this.selector;
    this.groups = [];
  }

  ContentSelector.applySelectors = function applySelectors(view, contentSelectors, callback) {
    var currentChild = view.fragment.firstChild,
        contentMap = new Map(),
        nextSibling,
        i,
        ii,
        contentSelector;

    while (currentChild) {
      nextSibling = currentChild.nextSibling;

      if (currentChild.viewSlot) {
        var viewSlotSelectors = contentSelectors.map(function (x) {
          return x.copyForViewSlot();
        });
        currentChild.viewSlot.installContentSelectors(viewSlotSelectors);
      } else {
        for (i = 0, ii = contentSelectors.length; i < ii; i++) {
          contentSelector = contentSelectors[i];
          if (contentSelector.matches(currentChild)) {
            var elements = contentMap.get(contentSelector);
            if (!elements) {
              elements = [];
              contentMap.set(contentSelector, elements);
            }

            elements.push(currentChild);
            break;
          }
        }
      }

      currentChild = nextSibling;
    }

    for (i = 0, ii = contentSelectors.length; i < ii; ++i) {
      contentSelector = contentSelectors[i];
      callback(contentSelector, contentMap.get(contentSelector) || placeholder);
    }
  };

  ContentSelector.prototype.copyForViewSlot = function copyForViewSlot() {
    return new ContentSelector(this.anchor, this.selector);
  };

  ContentSelector.prototype.matches = function matches(node) {
    return this.all || node.nodeType === 1 && node.matches(this.selector);
  };

  ContentSelector.prototype.add = function add(group) {
    var anchor = this.anchor,
        parent = anchor.parentNode,
        i,
        ii;

    for (i = 0, ii = group.length; i < ii; ++i) {
      parent.insertBefore(group[i], anchor);
    }

    this.groups.push(group);
  };

  ContentSelector.prototype.insert = function insert(index, group) {
    if (group.length) {
      var anchor = findInsertionPoint(this.groups, index) || this.anchor,
          parent = anchor.parentNode,
          i,
          ii;

      for (i = 0, ii = group.length; i < ii; ++i) {
        parent.insertBefore(group[i], anchor);
      }
    }

    this.groups.splice(index, 0, group);
  };

  ContentSelector.prototype.removeAt = function removeAt(index, fragment) {
    var group = this.groups[index],
        i,
        ii;

    for (i = 0, ii = group.length; i < ii; ++i) {
      fragment.appendChild(group[i]);
    }

    this.groups.splice(index, 1);
  };

  return ContentSelector;
})();

exports.ContentSelector = ContentSelector;