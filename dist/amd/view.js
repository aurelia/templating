define(["exports"], function (exports) {
  "use strict";

  var View = (function () {
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

    View.prototype.created = function (executionContext) {
      this.behaviors.forEach(function (x) {
        return x.created(executionContext);
      });
    };

    View.prototype.bind = function (executionContext, systemUpdate) {
      var context;

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

      this.behaviors.forEach(function (x) {
        return x.bind(context);
      });
      this.bindings.forEach(function (x) {
        return x.bind(context);
      });
      this.children.forEach(function (x) {
        return x.bind(context, true);
      });
    };

    View.prototype.addBinding = function (binding) {
      this.bindings.push(binding);

      if (this.isBound) {
        binding.bind(this.executionContext);
      }
    };

    View.prototype.unbind = function () {
      if (this.isBound) {
        this.isBound = false;

        if (this.owner) {
          this.owner.unbind();
        }

        this.behaviors.forEach(function (x) {
          return x.unbind();
        });
        this.bindings.forEach(function (x) {
          return x.unbind();
        });
        this.children.forEach(function (x) {
          return x.unbind();
        });
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
      if (this.isAttached) {
        return;
      }

      this.isAttached = true;

      if (this.owner) {
        this.owner.attached();
      }

      this.behaviors.forEach(function (x) {
        return x.attached();
      });
      this.children.forEach(function (x) {
        return x.attached();
      });
    };

    View.prototype.detached = function () {
      if (this.isAttached) {
        this.isAttached = false;

        if (this.owner) {
          this.owner.detached();
        }

        this.behaviors.forEach(function (x) {
          return x.detached();
        });
        this.children.forEach(function (x) {
          return x.detached();
        });
      }
    };

    return View;
  })();

  exports.View = View;
});