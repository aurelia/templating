"use strict";

var ContentSelector = require('./content-selector').ContentSelector;
var ViewSlot = (function () {
  var ViewSlot = function ViewSlot(anchor, anchorIsContainer, executionContext) {
    this.anchor = anchor;
    this.viewAddMethod = anchorIsContainer ? "appendNodesTo" : "insertNodesBefore";
    this.executionContext = executionContext;
    this.children = [];
    this.isBound = false;
    this.isAttached = false;

    anchor.viewSlot = this;
  };

  ViewSlot.prototype.bind = function (executionContext) {
    if (this.isBound) {
      if (this.executionContext === executionContext) {
        return;
      }

      this.unbind();
    }

    this.isBound = true;
    this.executionContext = executionContext = executionContext || this.executionContext;
    this.children.forEach(function (x) {
      return x.bind(executionContext, true);
    });
  };

  ViewSlot.prototype.unbind = function () {
    this.isBound = false;
    this.children.forEach(function (x) {
      return x.unbind();
    });
  };

  ViewSlot.prototype.add = function (view) {
    view[this.viewAddMethod](this.anchor);
    this.children.push(view);

    if (this.isAttached) {
      view.attached();
    }
  };

  ViewSlot.prototype.insert = function (index, view) {
    if ((index === 0 && !this.children.length) || index >= this.children.length) {
      this.add(view);
    } else {
      view.insertNodesBefore(this.children[index].firstChild);
      this.children.splice(index, 0, view);

      if (this.isAttached) {
        view.attached();
      }
    }
  };

  ViewSlot.prototype.remove = function (view) {
    view.removeNodes();
    this.children.splice(this.children.indexOf(view), 1);

    if (this.isAttached) {
      view.detached();
    }
  };

  ViewSlot.prototype.removeAt = function (index) {
    var view = this.children[index];

    view.removeNodes();
    this.children.splice(index, 1);

    if (this.isAttached) {
      view.detached();
    }

    return view;
  };

  ViewSlot.prototype.removeAll = function () {
    var children = this.children, ii = children.length, i;

    for (i = 0; i < ii; i++) {
      children[i].removeNodes();
    }

    if (this.isAttached) {
      for (i = 0; i < ii; i++) {
        children[i].detached();
      }
    }

    this.children = [];
  };

  ViewSlot.prototype.swap = function (view) {
    this.removeAll();
    this.add(view);
  };

  ViewSlot.prototype.attached = function () {
    if (this.isAttached) {
      return;
    }

    this.isAttached = true;
    this.children.forEach(function (x) {
      return x.attached();
    });
  };

  ViewSlot.prototype.detached = function () {
    if (this.isAttached) {
      this.isAttached = false;
      this.children.forEach(function (x) {
        return x.detached();
      });
    }
  };

  ViewSlot.prototype.installContentSelectors = function (contentSelectors) {
    this.contentSelectors = contentSelectors;
    this.add = this.contentSelectorAdd;
    this.insert = this.contentSelectorInsert;
    this.remove = this.contentSelectorRemove;
    this.removeAt = this.contentSelectorRemoveAt;
    this.removeAll = this.contentSelectorRemoveAll;
  };

  ViewSlot.prototype.contentSelectorAdd = function (view) {
    ContentSelector.applySelectors(view, this.contentSelectors, function (contentSelector, group) {
      return contentSelector.add(group);
    });

    this.children.push(view);

    if (this.isAttached) {
      view.attached();
    }
  };

  ViewSlot.prototype.contentSelectorInsert = function (index, view) {
    if ((index === 0 && !this.children.length) || index >= this.children.length) {
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
  };

  ViewSlot.prototype.contentSelectorRemove = function (view) {
    var index = this.children.indexOf(view), contentSelectors = this.contentSelectors;

    for (var i = 0, ii = contentSelectors.length; i < ii; i++) {
      contentSelectors[i].removeAt(index, view.fragment);
    }

    this.children.splice(index, 1);

    if (this.isAttached) {
      view.detached();
    }
  };

  ViewSlot.prototype.contentSelectorRemoveAt = function (index) {
    var view = this.children[index], contentSelectors = this.contentSelectors;

    for (var i = 0, ii = contentSelectors.length; i < ii; i++) {
      contentSelectors[i].removeAt(index, view.fragment);
    }

    this.children.splice(index, 1);

    if (this.isAttached) {
      view.detached();
    }

    return view;
  };

  ViewSlot.prototype.contentSelectorRemoveAll = function () {
    var children = this.children, contentSelectors = this.contentSelectors, ii = children.length, jj = contentSelectors.length, i, j, view;

    for (i = 0; i < ii; i++) {
      view = children[i];

      for (j = 0; j < jj; j++) {
        contentSelectors[j].removeAt(i, view.fragment);
      }
    }

    if (this.isAttached) {
      for (i = 0; i < ii; i++) {
        children[i].detached();
      }
    }

    this.children = [];
  };

  return ViewSlot;
})();

exports.ViewSlot = ViewSlot;