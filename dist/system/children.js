System.register([], function (_export) {
  var _prototypeProperties, _classCallCheck, noMutations, ChildObserver, ChildObserverBinder;

  return {
    setters: [],
    execute: function () {
      "use strict";

      _prototypeProperties = function (child, staticProps, instanceProps) { if (staticProps) Object.defineProperties(child, staticProps); if (instanceProps) Object.defineProperties(child.prototype, instanceProps); };

      _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } };

      noMutations = [];
      ChildObserver = _export("ChildObserver", (function () {
        function ChildObserver(property, changeHandler, selector) {
          _classCallCheck(this, ChildObserver);

          this.selector = selector;
          this.changeHandler = changeHandler;
          this.property = property;
        }

        _prototypeProperties(ChildObserver, null, {
          createBinding: {
            value: function createBinding(target, behavior) {
              return new ChildObserverBinder(this.selector, target, this.property, behavior, this.changeHandler);
            },
            writable: true,
            configurable: true
          }
        });

        return ChildObserver;
      })());
      ChildObserverBinder = _export("ChildObserverBinder", (function () {
        function ChildObserverBinder(selector, target, property, behavior, changeHandler) {
          _classCallCheck(this, ChildObserverBinder);

          this.selector = selector;
          this.target = target;
          this.property = property;
          this.target = target;
          this.behavior = behavior;
          this.changeHandler = changeHandler;
          this.observer = new MutationObserver(this.onChange.bind(this));
        }

        _prototypeProperties(ChildObserverBinder, null, {
          bind: {
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
            },
            writable: true,
            configurable: true
          },
          unbind: {
            value: function unbind() {
              this.observer.disconnect();
            },
            writable: true,
            configurable: true
          },
          onChange: {
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
            },
            writable: true,
            configurable: true
          }
        });

        return ChildObserverBinder;
      })());
    }
  };
});