System.register([], function (_export) {
  var _classCallCheck, View;

  return {
    setters: [],
    execute: function () {
      "use strict";

      _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } };

      View = (function () {
        function View(fragment, behaviors, bindings, children, systemControlled, contentSelectors) {
          _classCallCheck(this, View);

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
        }

        View.prototype.created = function created(executionContext) {
          var i,
              ii,
              behaviors = this.behaviors;
          for (i = 0, ii = behaviors.length; i < ii; ++i) {
            behaviors[i].created(executionContext);
          }
        };

        View.prototype.bind = function bind(executionContext, systemUpdate) {
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
        };

        View.prototype.addBinding = function addBinding(binding) {
          this.bindings.push(binding);

          if (this.isBound) {
            binding.bind(this.executionContext);
          }
        };

        View.prototype.unbind = function unbind() {
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
        };

        View.prototype.insertNodesBefore = function insertNodesBefore(refNode) {
          var parent = refNode.parentNode;
          parent.insertBefore(this.fragment, refNode);
        };

        View.prototype.appendNodesTo = function appendNodesTo(parent) {
          parent.appendChild(this.fragment);
        };

        View.prototype.removeNodes = function removeNodes() {
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
        };

        View.prototype.attached = function attached() {
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
        };

        View.prototype.detached = function detached() {
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
        };

        return View;
      })();

      _export("View", View);
    }
  };
});