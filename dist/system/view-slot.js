System.register(["./content-selector", "./animator"], function (_export) {
  var ContentSelector, Animator, _prototypeProperties, _classCallCheck, ViewSlot;

  return {
    setters: [function (_contentSelector) {
      ContentSelector = _contentSelector.ContentSelector;
    }, function (_animator) {
      Animator = _animator.Animator;
    }],
    execute: function () {
      "use strict";

      _prototypeProperties = function (child, staticProps, instanceProps) { if (staticProps) Object.defineProperties(child, staticProps); if (instanceProps) Object.defineProperties(child.prototype, instanceProps); };

      _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } };

      ViewSlot = _export("ViewSlot", (function () {
        function ViewSlot(anchor, anchorIsContainer, executionContext) {
          var animator = arguments[3] === undefined ? Animator.instance : arguments[3];

          _classCallCheck(this, ViewSlot);

          this.anchor = anchor;
          this.viewAddMethod = anchorIsContainer ? "appendNodesTo" : "insertNodesBefore";
          this.executionContext = executionContext;
          this.animator = animator;
          this.children = [];
          this.isBound = false;
          this.isAttached = false;
          anchor.viewSlot = this;
        }

        _prototypeProperties(ViewSlot, null, {
          transformChildNodesIntoView: {
            value: function transformChildNodesIntoView() {
              var parent = this.anchor;

              this.children.push({
                fragment: parent,
                firstChild: parent.firstChild,
                lastChild: parent.lastChild,
                removeNodes: function removeNodes() {
                  var last;

                  while (last = parent.lastChild) {
                    parent.removeChild(last);
                  }
                },
                created: function created() {},
                bind: function bind() {},
                unbind: function unbind() {},
                attached: function attached() {},
                detached: function detached() {}
              });
            },
            writable: true,
            configurable: true
          },
          bind: {
            value: function bind(executionContext) {
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
            configurable: true
          },
          unbind: {
            value: function unbind() {
              var i,
                  ii,
                  children = this.children;
              this.isBound = false;

              for (i = 0, ii = children.length; i < ii; ++i) {
                children[i].unbind();
              }
            },
            writable: true,
            configurable: true
          },
          add: {
            value: function add(view) {
              view[this.viewAddMethod](this.anchor);
              this.children.push(view);

              if (this.isAttached) {
                view.attached();
                // Animate page itself
                var element = view.firstChild ? view.firstChild.nextElementSibling : null;
                if (view.firstChild && view.firstChild.nodeType === 8 && element && element.nodeType === 1 && element.classList.contains("au-animate")) {
                  this.animator.enter(element);
                }
              }
            },
            writable: true,
            configurable: true
          },
          insert: {
            value: function insert(index, view) {
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
            configurable: true
          },
          remove: {
            value: function remove(view) {
              view.removeNodes();

              this.children.splice(this.children.indexOf(view), 1);

              if (this.isAttached) {
                view.detached();
              }
            },
            writable: true,
            configurable: true
          },
          removeAt: {
            value: function removeAt(index) {
              var _this = this;

              var view = this.children[index];

              var removeAction = function () {
                view.removeNodes();
                _this.children.splice(index, 1);

                if (_this.isAttached) {
                  view.detached();
                }

                return view;
              };

              var element = view.firstChild && view.firstChild.nextElementSibling ? view.firstChild.nextElementSibling : null;
              if (view.firstChild && view.firstChild.nodeType === 8 && element && element.nodeType === 1 && element.classList.contains("au-animate")) {
                return this.animator.leave(element).then(function () {
                  return removeAction();
                });
              } else {
                return removeAction();
              }
            },
            writable: true,
            configurable: true
          },
          removeAll: {
            value: function removeAll() {
              var _this = this;

              var children = this.children,
                  ii = children.length,
                  i;

              var rmPromises = [];

              children.forEach(function (child) {
                var element = child.firstChild ? child.firstChild.nextElementSibling : null;
                if (child.firstChild && child.firstChild.nodeType === 8 && element && element.nodeType === 1 && element.classList.contains("au-animate")) {
                  rmPromises.push(_this.animator.leave(element).then(function () {
                    child.removeNodes();
                  }));
                } else {
                  child.removeNodes();
                }
              });

              var removeAction = function () {
                if (_this.isAttached) {
                  for (i = 0; i < ii; ++i) {
                    children[i].detached();
                  }
                }

                _this.children = [];
              };

              if (rmPromises.length > 0) {
                return Promise.all(rmPromises).then(function () {
                  removeAction();
                });
              } else {
                removeAction();
              }
            },
            writable: true,
            configurable: true
          },
          swap: {
            value: function swap(view) {
              var _this = this;

              var removeResponse = this.removeAll();
              if (removeResponse !== undefined) {
                removeResponse.then(function () {
                  _this.add(view);
                });
              } else {
                this.add(view);
              }
            },
            writable: true,
            configurable: true
          },
          attached: {
            value: function attached() {
              var i, ii, children, child;

              if (this.isAttached) {
                return;
              }

              this.isAttached = true;

              children = this.children;
              for (i = 0, ii = children.length; i < ii; ++i) {
                child = children[i];
                child.attached();

                var element = child.firstChild ? child.firstChild.nextElementSibling : null;
                if (child.firstChild && child.firstChild.nodeType === 8 && element && element.nodeType === 1 && element.classList.contains("au-animate")) {
                  this.animator.enter(element);
                }
              }
            },
            writable: true,
            configurable: true
          },
          detached: {
            value: function detached() {
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
            configurable: true
          },
          installContentSelectors: {
            value: function installContentSelectors(contentSelectors) {
              this.contentSelectors = contentSelectors;
              this.add = this.contentSelectorAdd;
              this.insert = this.contentSelectorInsert;
              this.remove = this.contentSelectorRemove;
              this.removeAt = this.contentSelectorRemoveAt;
              this.removeAll = this.contentSelectorRemoveAll;
            },
            writable: true,
            configurable: true
          },
          contentSelectorAdd: {
            value: function contentSelectorAdd(view) {
              ContentSelector.applySelectors(view, this.contentSelectors, function (contentSelector, group) {
                return contentSelector.add(group);
              });

              this.children.push(view);

              if (this.isAttached) {
                view.attached();
              }
            },
            writable: true,
            configurable: true
          },
          contentSelectorInsert: {
            value: function contentSelectorInsert(index, view) {
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
            configurable: true
          },
          contentSelectorRemove: {
            value: function contentSelectorRemove(view) {
              var index = this.children.indexOf(view),
                  contentSelectors = this.contentSelectors,
                  i,
                  ii;

              for (i = 0, ii = contentSelectors.length; i < ii; ++i) {
                contentSelectors[i].removeAt(index, view.fragment);
              }

              this.children.splice(index, 1);

              if (this.isAttached) {
                view.detached();
              }
            },
            writable: true,
            configurable: true
          },
          contentSelectorRemoveAt: {
            value: function contentSelectorRemoveAt(index) {
              var view = this.children[index],
                  contentSelectors = this.contentSelectors,
                  i,
                  ii;

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
            configurable: true
          },
          contentSelectorRemoveAll: {
            value: function contentSelectorRemoveAll() {
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
            configurable: true
          }
        });

        return ViewSlot;
      })());
    }
  };
});