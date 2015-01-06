System.register([], function (_export) {
  "use strict";

  var View;
  return {
    setters: [],
    execute: function () {
      View = function View(fragment, behaviors, bindings, children, systemControlled, contentSelectors) {
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

      View.prototype.created = function (executionContext) {
        var i, ii, behaviors = this.behaviors;
        for (i = 0, ii = behaviors.length; i < ii; ++i) {
          behaviors[i].created(executionContext);
        }
      };

      View.prototype.bind = function (executionContext, systemUpdate) {
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

        behaviors = this.behaviors;
        for (i = 0, ii = behaviors.length; i < ii; ++i) {
          behaviors[i].bind(context);
        }

        bindings = this.bindings;
        for (i = 0, ii = bindings.length; i < ii; ++i) {
          bindings[i].bind(context);
        }

        children = this.children;
        for (i = 0, ii = children.length; i < ii; ++i) {
          children[i].bind(context, true);
        }
      };

      View.prototype.addBinding = function (binding) {
        this.bindings.push(binding);

        if (this.isBound) {
          binding.bind(this.executionContext);
        }
      };

      View.prototype.unbind = function () {
        var behaviors, bindings, children, i, ii;

        if (this.isBound) {
          this.isBound = false;

          if (this.owner) {
            this.owner.unbind();
          }

          behaviors = this.behaviors;
          for (i = 0, ii = behaviors.length; i < ii; ++i) {
            behaviors[i].unbind();
          }

          bindings = this.bindings;
          for (i = 0, ii = bindings.length; i < ii; ++i) {
            bindings[i].unbind();
          }

          children = this.children;
          for (i = 0, ii = children.length; i < ii; ++i) {
            children[i].unbind();
          }
        }
      };

      View.prototype.insertNodesBefore = function (refNode) {
        var parent = refNode.parentNode;
        parent.insertBefore(this.fragment, refNode);
      };

      View.prototype.appendNodesTo = function (parent) {
        parent.appendChild(this.fragment);
      };

      View.prototype.removeNodes = function () {
        var start = this.firstChild, end = this.lastChild, fragment = this.fragment, next;

        var current = start, loop = true, nodes = [];

        while (loop) {
          if (current === end) {
            loop = false;
          }

          next = current.nextSibling;
          this.fragment.appendChild(current);
          current = next;
        }
      };

      View.prototype.attached = function () {
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

      View.prototype.detached = function () {
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

      _export("View", View);
    }
  };
});