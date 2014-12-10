"use strict";

var noMutations = [];

var Children = (function () {
  var Children = function Children(property, changeHandler, selector) {
    this.selector = selector;
    this.changeHandler = changeHandler;
    this.property = property;
  };

  Children.prototype.createBinding = function (target, behavior) {
    return new ChildBinder(this.selector, target, this.property, behavior, this.changeHandler);
  };

  return Children;
})();

exports.Children = Children;
var ChildBinder = (function () {
  var ChildBinder = function ChildBinder(selector, target, property, behavior, changeHandler) {
    this.selector = selector;
    this.target = target;
    this.property = property;
    this.target = target;
    this.behavior = behavior;
    this.changeHandler = changeHandler;
    this.observer = new MutationObserver(this.onChange.bind(this));
  };

  ChildBinder.prototype.bind = function (source) {
    var items, results, i, ii, node, behavior = this.behavior;

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
  };

  ChildBinder.prototype.unbind = function () {
    this.observer.disconnect();
  };

  ChildBinder.prototype.onChange = function (mutations) {
    var items = this.behavior[this.property], selector = this.selector;

    mutations.forEach(function (record) {
      var added = record.addedNodes, removed = record.removedNodes, prev = record.previousSibling, i, ii, primary, index, node;

      for (i = 0, ii = removed.length; i < ii; i++) {
        node = removed[i];
        if (node.nodeType === 1 && node.matches(selector)) {
          primary = node.primaryBehavior ? node.primaryBehavior.executionContext : node;
          index = items.indexOf(primary);
          if (index != -1) {
            items.splice(index, 1);
          }
        }
      }

      for (i = 0, ii = added.length; i < ii; i++) {
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
  };

  return ChildBinder;
})();

exports.ChildBinder = ChildBinder;