"use strict";

var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } };

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

Object.defineProperty(exports, "__esModule", {
  value: true
});
var noMutations = [];

var ChildObserver = (function () {
  function ChildObserver(property, changeHandler, selector) {
    _classCallCheck(this, ChildObserver);

    this.selector = selector;
    this.changeHandler = changeHandler;
    this.property = property;
  }

  _createClass(ChildObserver, [{
    key: "createBinding",
    value: function createBinding(target, behavior) {
      return new ChildObserverBinder(this.selector, target, this.property, behavior, this.changeHandler);
    }
  }]);

  return ChildObserver;
})();

exports.ChildObserver = ChildObserver;

var ChildObserverBinder = (function () {
  function ChildObserverBinder(selector, target, property, behavior, changeHandler) {
    _classCallCheck(this, ChildObserverBinder);

    this.selector = selector;
    this.target = target;
    this.property = property;
    this.behavior = behavior;
    this.changeHandler = changeHandler;
    this.observer = new MutationObserver(this.onChange.bind(this));
  }

  _createClass(ChildObserverBinder, [{
    key: "bind",
    value: function bind(source) {
      var items,
          results,
          i,
          ii,
          node,
          behavior = this.behavior;

      this.observer.observe(this.target, { childList: true, subtree: true });

      items = behavior[this.property];
      if (!items) {
        items = behavior[this.property] = [];
      } else {
        items.length = 0;
      }

      results = this.target.querySelectorAll(this.selector);

      for (i = 0, ii = results.length; i < ii; ++i) {
        node = results[i];
        items.push(node.primaryBehavior ? node.primaryBehavior.executionContext : node);
      }

      if (this.changeHandler) {
        this.behavior[this.changeHandler](noMutations);
      }
    }
  }, {
    key: "unbind",
    value: function unbind() {
      this.observer.disconnect();
    }
  }, {
    key: "onChange",
    value: function onChange(mutations) {
      var items = this.behavior[this.property],
          selector = this.selector;

      mutations.forEach(function (record) {
        var added = record.addedNodes,
            removed = record.removedNodes,
            prev = record.previousSibling,
            i,
            ii,
            primary,
            index,
            node;

        for (i = 0, ii = removed.length; i < ii; ++i) {
          node = removed[i];
          if (node.nodeType === 1 && node.matches(selector)) {
            primary = node.primaryBehavior ? node.primaryBehavior.executionContext : node;
            index = items.indexOf(primary);
            if (index != -1) {
              items.splice(index, 1);
            }
          }
        }

        for (i = 0, ii = added.length; i < ii; ++i) {
          node = added[i];
          if (node.nodeType === 1 && node.matches(selector)) {
            primary = node.primaryBehavior ? node.primaryBehavior.executionContext : node;
            index = 0;

            while (prev) {
              if (prev.nodeType === 1 && prev.matches(selector)) {
                index++;
              }

              prev = prev.previousSibling;
            }

            items.splice(index, 0, primary);
          }
        }
      });

      if (this.changeHandler) {
        this.behavior[this.changeHandler](mutations);
      }
    }
  }]);

  return ChildObserverBinder;
})();

exports.ChildObserverBinder = ChildObserverBinder;