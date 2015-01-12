System.register([], function (_export) {
  "use strict";

  var _prototypeProperties, noMutations, Children, ChildBinder;
  return {
    setters: [],
    execute: function () {
      _prototypeProperties = function (child, staticProps, instanceProps) {
        if (staticProps) Object.defineProperties(child, staticProps);
        if (instanceProps) Object.defineProperties(child.prototype, instanceProps);
      };

      noMutations = [];
      Children = (function () {
        var Children = function Children(property, changeHandler, selector) {
          this.selector = selector;
          this.changeHandler = changeHandler;
          this.property = property;
        };

        _prototypeProperties(Children, null, {
          createBinding: {
            value: function (target, behavior) {
              return new ChildBinder(this.selector, target, this.property, behavior, this.changeHandler);
            },
            writable: true,
            enumerable: true,
            configurable: true
          }
        });

        return Children;
      })();
      _export("Children", Children);

      ChildBinder = (function () {
        var ChildBinder = function ChildBinder(selector, target, property, behavior, changeHandler) {
          this.selector = selector;
          this.target = target;
          this.property = property;
          this.target = target;
          this.behavior = behavior;
          this.changeHandler = changeHandler;
          this.observer = new MutationObserver(this.onChange.bind(this));
        };

        _prototypeProperties(ChildBinder, null, {
          bind: {
            value: function (source) {
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
            },
            writable: true,
            enumerable: true,
            configurable: true
          },
          unbind: {
            value: function () {
              this.observer.disconnect();
            },
            writable: true,
            enumerable: true,
            configurable: true
          },
          onChange: {
            value: function (mutations) {
              var items = this.behavior[this.property],
                  selector = this.selector;

              mutations.forEach(function (record) {
                var added = record.addedNodes, removed = record.removedNodes, prev = record.previousSibling, i, ii, primary, index, node;

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
            },
            writable: true,
            enumerable: true,
            configurable: true
          }
        });

        return ChildBinder;
      })();
      _export("ChildBinder", ChildBinder);
    }
  };
});