System.register(["./content-selector"], function (_export) {
  "use strict";

  var ContentSelector, _prototypeProperties, ViewSlot;
  return {
    setters: [function (_contentSelector) {
      ContentSelector = _contentSelector.ContentSelector;
    }],
    execute: function () {
      _prototypeProperties = function (child, staticProps, instanceProps) {
        if (staticProps) Object.defineProperties(child, staticProps);
        if (instanceProps) Object.defineProperties(child.prototype, instanceProps);
      };

      ViewSlot = (function () {
        var ViewSlot = function ViewSlot(anchor, anchorIsContainer, executionContext) {
          this.anchor = anchor;
          this.viewAddMethod = anchorIsContainer ? "appendNodesTo" : "insertNodesBefore";
          this.executionContext = executionContext;
          this.children = [];
          this.isBound = false;
          this.isAttached = false;

          anchor.viewSlot = this;
        };

        _prototypeProperties(ViewSlot, null, {
          bind: {
            value: function (executionContext) {
              var i, ii, children;

              if (this.isBound) {
                if (this.executionContext === executionContext) {
                  return;
                }

                this.unbind();
              }

              this.isBound = true;
              this.executionContext = executionContext = executionContext || this.executionContext;

              children = this.children;
              for (i = 0, ii = children.length; i < ii; ++i) {
                children[i].bind(executionContext, true);
              }
            },
            writable: true,
            enumerable: true,
            configurable: true
          },
          unbind: {
            value: function () {
              var i, ii, children = this.children;
              this.isBound = false;

              for (i = 0, ii = children.length; i < ii; ++i) {
                children[i].unbind();
              }
            },
            writable: true,
            enumerable: true,
            configurable: true
          },
          add: {
            value: function (view) {
              view[this.viewAddMethod](this.anchor);
              this.children.push(view);

              if (this.isAttached) {
                view.attached();
              }
            },
            writable: true,
            enumerable: true,
            configurable: true
          },
          insert: {
            value: function (index, view) {
              if (index === 0 && !this.children.length || index >= this.children.length) {
                this.add(view);
              } else {
                view.insertNodesBefore(this.children[index].firstChild);
                this.children.splice(index, 0, view);

                if (this.isAttached) {
                  view.attached();
                }
              }
            },
            writable: true,
            enumerable: true,
            configurable: true
          },
          remove: {
            value: function (view) {
              view.removeNodes();
              this.children.splice(this.children.indexOf(view), 1);

              if (this.isAttached) {
                view.detached();
              }
            },
            writable: true,
            enumerable: true,
            configurable: true
          },
          removeAt: {
            value: function (index) {
              var view = this.children[index];

              view.removeNodes();
              this.children.splice(index, 1);

              if (this.isAttached) {
                view.detached();
              }

              return view;
            },
            writable: true,
            enumerable: true,
            configurable: true
          },
          removeAll: {
            value: function () {
              var children = this.children,
                  ii = children.length,
                  i;

              for (i = 0; i < ii; ++i) {
                children[i].removeNodes();
              }

              if (this.isAttached) {
                for (i = 0; i < ii; ++i) {
                  children[i].detached();
                }
              }

              this.children = [];
            },
            writable: true,
            enumerable: true,
            configurable: true
          },
          swap: {
            value: function (view) {
              this.removeAll();
              this.add(view);
            },
            writable: true,
            enumerable: true,
            configurable: true
          },
          attached: {
            value: function () {
              var i, ii, children;

              if (this.isAttached) {
                return;
              }

              this.isAttached = true;

              children = this.children;
              for (i = 0, ii = children.length; i < ii; ++i) {
                children[i].attached();
              }
            },
            writable: true,
            enumerable: true,
            configurable: true
          },
          detached: {
            value: function () {
              var i, ii, children;

              if (this.isAttached) {
                this.isAttached = false;
                children = this.children;
                for (i = 0, ii = children.length; i < ii; ++i) {
                  children[i].detached();
                }
              }
            },
            writable: true,
            enumerable: true,
            configurable: true
          },
          installContentSelectors: {
            value: function (contentSelectors) {
              this.contentSelectors = contentSelectors;
              this.add = this.contentSelectorAdd;
              this.insert = this.contentSelectorInsert;
              this.remove = this.contentSelectorRemove;
              this.removeAt = this.contentSelectorRemoveAt;
              this.removeAll = this.contentSelectorRemoveAll;
            },
            writable: true,
            enumerable: true,
            configurable: true
          },
          contentSelectorAdd: {
            value: function (view) {
              ContentSelector.applySelectors(view, this.contentSelectors, function (contentSelector, group) {
                return contentSelector.add(group);
              });

              this.children.push(view);

              if (this.isAttached) {
                view.attached();
              }
            },
            writable: true,
            enumerable: true,
            configurable: true
          },
          contentSelectorInsert: {
            value: function (index, view) {
              if (index === 0 && !this.children.length || index >= this.children.length) {
                this.add(view);
              } else {
                ContentSelector.applySelectors(view, this.contentSelectors, function (contentSelector, group) {
                  return contentSelector.insert(index, group);
                });

                this.children.splice(index, 0, view);

                if (this.isAttached) {
                  view.attached();
                }
              }
            },
            writable: true,
            enumerable: true,
            configurable: true
          },
          contentSelectorRemove: {
            value: function (view) {
              var index = this.children.indexOf(view), contentSelectors = this.contentSelectors, i, ii;

              for (i = 0, ii = contentSelectors.length; i < ii; ++i) {
                contentSelectors[i].removeAt(index, view.fragment);
              }

              this.children.splice(index, 1);

              if (this.isAttached) {
                view.detached();
              }
            },
            writable: true,
            enumerable: true,
            configurable: true
          },
          contentSelectorRemoveAt: {
            value: function (index) {
              var view = this.children[index], contentSelectors = this.contentSelectors, i, ii;

              for (i = 0, ii = contentSelectors.length; i < ii; ++i) {
                contentSelectors[i].removeAt(index, view.fragment);
              }

              this.children.splice(index, 1);

              if (this.isAttached) {
                view.detached();
              }

              return view;
            },
            writable: true,
            enumerable: true,
            configurable: true
          },
          contentSelectorRemoveAll: {
            value: function () {
              var children = this.children,
                  contentSelectors = this.contentSelectors,
                  ii = children.length,
                  jj = contentSelectors.length,
                  i,
                  j,
                  view;

              for (i = 0; i < ii; ++i) {
                view = children[i];

                for (j = 0; j < jj; ++j) {
                  contentSelectors[j].removeAt(i, view.fragment);
                }
              }

              if (this.isAttached) {
                for (i = 0; i < ii; ++i) {
                  children[i].detached();
                }
              }

              this.children = [];
            },
            writable: true,
            enumerable: true,
            configurable: true
          }
        });

        return ViewSlot;
      })();
      _export("ViewSlot", ViewSlot);
    }
  };
});