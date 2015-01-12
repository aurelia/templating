System.register([], function (_export) {
  "use strict";

  var _prototypeProperties, View;
  return {
    setters: [],
    execute: function () {
      _prototypeProperties = function (child, staticProps, instanceProps) {
        if (staticProps) Object.defineProperties(child, staticProps);
        if (instanceProps) Object.defineProperties(child.prototype, instanceProps);
      };

      View = (function () {
        var View = function View(fragment, behaviors, bindings, children, systemControlled, contentSelectors) {
          this.fragment = fragment;
          this.behaviors = behaviors;
          this.bindings = bindings;
          this.children = children;
          this.systemControlled = systemControlled;
          this.contentSelectors = contentSelectors;
          this.firstChild = fragment.firstChild;
          this.lastChild = fragment.lastChild;
          this.isBound = false;
          this.isAttached = false;
        };

        _prototypeProperties(View, null, {
          created: {
            value: function (executionContext) {
              var i, ii, behaviors = this.behaviors;
              for (i = 0, ii = behaviors.length; i < ii; ++i) {
                behaviors[i].created(executionContext);
              }
            },
            writable: true,
            enumerable: true,
            configurable: true
          },
          bind: {
            value: function (executionContext, systemUpdate) {
              var context, behaviors, bindings, children, i, ii;

              if (systemUpdate && !this.systemControlled) {
                context = this.executionContext || executionContext;
              } else {
                context = executionContext || this.executionContext;
              }

              if (this.isBound) {
                if (this.executionContext === context) {
                  return;
                }

                this.unbind();
              }

              this.isBound = true;
              this.executionContext = context;

              if (this.owner) {
                this.owner.bind(context);
              }

              bindings = this.bindings;
              for (i = 0, ii = bindings.length; i < ii; ++i) {
                bindings[i].bind(context);
              }

              behaviors = this.behaviors;
              for (i = 0, ii = behaviors.length; i < ii; ++i) {
                behaviors[i].bind(context);
              }

              children = this.children;
              for (i = 0, ii = children.length; i < ii; ++i) {
                children[i].bind(context, true);
              }
            },
            writable: true,
            enumerable: true,
            configurable: true
          },
          addBinding: {
            value: function (binding) {
              this.bindings.push(binding);

              if (this.isBound) {
                binding.bind(this.executionContext);
              }
            },
            writable: true,
            enumerable: true,
            configurable: true
          },
          unbind: {
            value: function () {
              var behaviors, bindings, children, i, ii;

              if (this.isBound) {
                this.isBound = false;

                if (this.owner) {
                  this.owner.unbind();
                }

                bindings = this.bindings;
                for (i = 0, ii = bindings.length; i < ii; ++i) {
                  bindings[i].unbind();
                }

                behaviors = this.behaviors;
                for (i = 0, ii = behaviors.length; i < ii; ++i) {
                  behaviors[i].unbind();
                }

                children = this.children;
                for (i = 0, ii = children.length; i < ii; ++i) {
                  children[i].unbind();
                }
              }
            },
            writable: true,
            enumerable: true,
            configurable: true
          },
          insertNodesBefore: {
            value: function (refNode) {
              var parent = refNode.parentNode;
              parent.insertBefore(this.fragment, refNode);
            },
            writable: true,
            enumerable: true,
            configurable: true
          },
          appendNodesTo: {
            value: function (parent) {
              parent.appendChild(this.fragment);
            },
            writable: true,
            enumerable: true,
            configurable: true
          },
          removeNodes: {
            value: function () {
              var start = this.firstChild,
                  end = this.lastChild,
                  fragment = this.fragment,
                  next;

              var current = start,
                  loop = true,
                  nodes = [];

              while (loop) {
                if (current === end) {
                  loop = false;
                }

                next = current.nextSibling;
                this.fragment.appendChild(current);
                current = next;
              }
            },
            writable: true,
            enumerable: true,
            configurable: true
          },
          attached: {
            value: function () {
              var behaviors, children, i, ii;

              if (this.isAttached) {
                return;
              }

              this.isAttached = true;

              if (this.owner) {
                this.owner.attached();
              }

              behaviors = this.behaviors;
              for (i = 0, ii = behaviors.length; i < ii; ++i) {
                behaviors[i].attached();
              }

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
              var behaviors, children, i, ii;

              if (this.isAttached) {
                this.isAttached = false;

                if (this.owner) {
                  this.owner.detached();
                }

                behaviors = this.behaviors;
                for (i = 0, ii = behaviors.length; i < ii; ++i) {
                  behaviors[i].detached();
                }

                children = this.children;
                for (i = 0, ii = children.length; i < ii; ++i) {
                  children[i].detached();
                }
              }
            },
            writable: true,
            enumerable: true,
            configurable: true
          }
        });

        return View;
      })();
      _export("View", View);
    }
  };
});