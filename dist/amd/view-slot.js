define(['exports', './content-selector', './animator'], function (exports, _contentSelector, _animator) {
  'use strict';

  var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } };

  exports.__esModule = true;

  var ViewSlot = (function () {
    function ViewSlot(anchor, anchorIsContainer, executionContext) {
      var animator = arguments[3] === undefined ? _animator.Animator.instance : arguments[3];

      _classCallCheck(this, ViewSlot);

      this.anchor = anchor;
      this.viewAddMethod = anchorIsContainer ? 'appendNodesTo' : 'insertNodesBefore';
      this.executionContext = executionContext;
      this.animator = animator;
      this.children = [];
      this.isBound = false;
      this.isAttached = false;
      anchor.viewSlot = this;
    }

    ViewSlot.prototype.transformChildNodesIntoView = function transformChildNodesIntoView() {
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
    };

    ViewSlot.prototype.bind = function bind(executionContext) {
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
    };

    ViewSlot.prototype.unbind = function unbind() {
      var i,
          ii,
          children = this.children;
      this.isBound = false;

      for (i = 0, ii = children.length; i < ii; ++i) {
        children[i].unbind();
      }
    };

    ViewSlot.prototype.add = function add(view) {
      view[this.viewAddMethod](this.anchor);
      this.children.push(view);

      if (this.isAttached) {
        view.attached();

        var element = view.firstChild ? view.firstChild.nextElementSibling : null;
        if (view.firstChild && view.firstChild.nodeType === 8 && element && element.nodeType === 1 && element.classList.contains('au-animate')) {
          this.animator.enter(element);
        }
      }
    };

    ViewSlot.prototype.insert = function insert(index, view) {
      if (index === 0 && !this.children.length || index >= this.children.length) {
        this.add(view);
      } else {
        view.insertNodesBefore(this.children[index].firstChild);
        this.children.splice(index, 0, view);

        if (this.isAttached) {
          view.attached();
        }
      }
    };

    ViewSlot.prototype.remove = function remove(view) {
      view.removeNodes();

      this.children.splice(this.children.indexOf(view), 1);

      if (this.isAttached) {
        view.detached();
      }
    };

    ViewSlot.prototype.removeAt = function removeAt(index) {
      var _this = this;

      var view = this.children[index];

      var removeAction = function removeAction() {
        view.removeNodes();
        _this.children.splice(index, 1);

        if (_this.isAttached) {
          view.detached();
        }

        return view;
      };

      var element = view.firstChild && view.firstChild.nextElementSibling ? view.firstChild.nextElementSibling : null;
      if (view.firstChild && view.firstChild.nodeType === 8 && element && element.nodeType === 1 && element.classList.contains('au-animate')) {
        return this.animator.leave(element).then(function () {
          return removeAction();
        });
      } else {
        return removeAction();
      }
    };

    ViewSlot.prototype.removeAll = function removeAll() {
      var _this2 = this;

      var children = this.children,
          ii = children.length,
          i;

      var rmPromises = [];

      children.forEach(function (child) {
        var element = child.firstChild ? child.firstChild.nextElementSibling : null;
        if (child.firstChild && child.firstChild.nodeType === 8 && element && element.nodeType === 1 && element.classList.contains('au-animate')) {
          rmPromises.push(_this2.animator.leave(element).then(function () {
            child.removeNodes();
          }));
        } else {
          child.removeNodes();
        }
      });

      var removeAction = function removeAction() {
        if (_this2.isAttached) {
          for (i = 0; i < ii; ++i) {
            children[i].detached();
          }
        }

        _this2.children = [];
      };

      if (rmPromises.length > 0) {
        return Promise.all(rmPromises).then(function () {
          removeAction();
        });
      } else {
        removeAction();
      }
    };

    ViewSlot.prototype.swap = function swap(view) {
      var _this3 = this;

      var removeResponse = this.removeAll();
      if (removeResponse !== undefined) {
        removeResponse.then(function () {
          _this3.add(view);
        });
      } else {
        this.add(view);
      }
    };

    ViewSlot.prototype.attached = function attached() {
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
        if (child.firstChild && child.firstChild.nodeType === 8 && element && element.nodeType === 1 && element.classList.contains('au-animate')) {
          this.animator.enter(element);
        }
      }
    };

    ViewSlot.prototype.detached = function detached() {
      var i, ii, children;

      if (this.isAttached) {
        this.isAttached = false;
        children = this.children;
        for (i = 0, ii = children.length; i < ii; ++i) {
          children[i].detached();
        }
      }
    };

    ViewSlot.prototype.installContentSelectors = function installContentSelectors(contentSelectors) {
      this.contentSelectors = contentSelectors;
      this.add = this.contentSelectorAdd;
      this.insert = this.contentSelectorInsert;
      this.remove = this.contentSelectorRemove;
      this.removeAt = this.contentSelectorRemoveAt;
      this.removeAll = this.contentSelectorRemoveAll;
    };

    ViewSlot.prototype.contentSelectorAdd = function contentSelectorAdd(view) {
      _contentSelector.ContentSelector.applySelectors(view, this.contentSelectors, function (contentSelector, group) {
        return contentSelector.add(group);
      });

      this.children.push(view);

      if (this.isAttached) {
        view.attached();
      }
    };

    ViewSlot.prototype.contentSelectorInsert = function contentSelectorInsert(index, view) {
      if (index === 0 && !this.children.length || index >= this.children.length) {
        this.add(view);
      } else {
        _contentSelector.ContentSelector.applySelectors(view, this.contentSelectors, function (contentSelector, group) {
          return contentSelector.insert(index, group);
        });

        this.children.splice(index, 0, view);

        if (this.isAttached) {
          view.attached();
        }
      }
    };

    ViewSlot.prototype.contentSelectorRemove = function contentSelectorRemove(view) {
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
    };

    ViewSlot.prototype.contentSelectorRemoveAt = function contentSelectorRemoveAt(index) {
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
    };

    ViewSlot.prototype.contentSelectorRemoveAll = function contentSelectorRemoveAll() {
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
    };

    return ViewSlot;
  })();

  exports.ViewSlot = ViewSlot;
});