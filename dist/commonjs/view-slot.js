'use strict';

var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } };

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _ContentSelector = require('./content-selector');

var _Animator = require('./animator');

var ViewSlot = (function () {
  function ViewSlot(anchor, anchorIsContainer, executionContext) {
    var animator = arguments[3] === undefined ? _Animator.Animator.instance : arguments[3];

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

  _createClass(ViewSlot, [{
    key: 'transformChildNodesIntoView',
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
    }
  }, {
    key: 'bind',
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
    }
  }, {
    key: 'unbind',
    value: function unbind() {
      var i,
          ii,
          children = this.children;
      this.isBound = false;

      for (i = 0, ii = children.length; i < ii; ++i) {
        children[i].unbind();
      }
    }
  }, {
    key: 'add',
    value: function add(view) {
      view[this.viewAddMethod](this.anchor);
      this.children.push(view);

      if (this.isAttached) {
        view.attached();

        var element = view.firstChild ? view.firstChild.nextElementSibling : null;
        if (view.firstChild && view.firstChild.nodeType === 8 && element && element.nodeType === 1 && element.classList.contains('au-animate')) {
          this.animator.enter(element);
        }
      }
    }
  }, {
    key: 'insert',
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
    }
  }, {
    key: 'remove',
    value: function remove(view) {
      view.removeNodes();

      this.children.splice(this.children.indexOf(view), 1);

      if (this.isAttached) {
        view.detached();
      }
    }
  }, {
    key: 'removeAt',
    value: function removeAt(index) {
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
    }
  }, {
    key: 'removeAll',
    value: function removeAll() {
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
    }
  }, {
    key: 'swap',
    value: function swap(view) {
      var _this3 = this;

      var removeResponse = this.removeAll();
      if (removeResponse !== undefined) {
        removeResponse.then(function () {
          _this3.add(view);
        });
      } else {
        this.add(view);
      }
    }
  }, {
    key: 'attached',
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
        if (child.firstChild && child.firstChild.nodeType === 8 && element && element.nodeType === 1 && element.classList.contains('au-animate')) {
          this.animator.enter(element);
        }
      }
    }
  }, {
    key: 'detached',
    value: function detached() {
      var i, ii, children;

      if (this.isAttached) {
        this.isAttached = false;
        children = this.children;
        for (i = 0, ii = children.length; i < ii; ++i) {
          children[i].detached();
        }
      }
    }
  }, {
    key: 'installContentSelectors',
    value: function installContentSelectors(contentSelectors) {
      this.contentSelectors = contentSelectors;
      this.add = this.contentSelectorAdd;
      this.insert = this.contentSelectorInsert;
      this.remove = this.contentSelectorRemove;
      this.removeAt = this.contentSelectorRemoveAt;
      this.removeAll = this.contentSelectorRemoveAll;
    }
  }, {
    key: 'contentSelectorAdd',
    value: function contentSelectorAdd(view) {
      _ContentSelector.ContentSelector.applySelectors(view, this.contentSelectors, function (contentSelector, group) {
        return contentSelector.add(group);
      });

      this.children.push(view);

      if (this.isAttached) {
        view.attached();
      }
    }
  }, {
    key: 'contentSelectorInsert',
    value: function contentSelectorInsert(index, view) {
      if (index === 0 && !this.children.length || index >= this.children.length) {
        this.add(view);
      } else {
        _ContentSelector.ContentSelector.applySelectors(view, this.contentSelectors, function (contentSelector, group) {
          return contentSelector.insert(index, group);
        });

        this.children.splice(index, 0, view);

        if (this.isAttached) {
          view.attached();
        }
      }
    }
  }, {
    key: 'contentSelectorRemove',
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
    }
  }, {
    key: 'contentSelectorRemoveAt',
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
    }
  }, {
    key: 'contentSelectorRemoveAll',
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
    }
  }]);

  return ViewSlot;
})();

exports.ViewSlot = ViewSlot;