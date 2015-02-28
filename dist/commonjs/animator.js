"use strict";

var _prototypeProperties = function (child, staticProps, instanceProps) { if (staticProps) Object.defineProperties(child, staticProps); if (instanceProps) Object.defineProperties(child.prototype, instanceProps); };

var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } };

var Animator = exports.Animator = (function () {
  function Animator() {
    _classCallCheck(this, Animator);

    Animator.instance = this;
    this.animationStack = [];
  }

  _prototypeProperties(Animator, null, {
    addMultipleEventListener: {
      value: function addMultipleEventListener(el, s, fn) {
        var evts = s.split(" "),
            i,
            ii;

        for (i = 0, ii = evts.length; i < ii; ++i) {
          el.addEventListener(evts[i], fn, false);
        }
      },
      writable: true,
      configurable: true
    },
    addAnimationToStack: {
      value: function addAnimationToStack(animId) {
        if (this.animationStack.indexOf(animId) < 0) {
          this.animationStack.push(animId);
        }
      },
      writable: true,
      configurable: true
    },
    removeAnimationFromStack: {
      value: function removeAnimationFromStack(animId) {
        var idx = this.animationStack.indexOf(animId);
        if (idx > -1) {
          this.animationStack.splice(idx, 1);
        }
      },
      writable: true,
      configurable: true
    },
    move: {
      value: function move() {
        return Promise.resolve(false);
      },
      writable: true,
      configurable: true
    },
    enter: {
      value: function enter(element) {
        return Promise.resolve(false);
      },
      writable: true,
      configurable: true
    },
    leave: {
      value: function leave(element) {
        return Promise.resolve(false);
      },
      writable: true,
      configurable: true
    },
    removeClass: {
      value: function removeClass(element, className) {
        return Promise.resolve(false);
      },
      writable: true,
      configurable: true
    },
    addClass: {
      value: function addClass(element, className) {
        return Promise.resolve(false);
      },
      writable: true,
      configurable: true
    }
  });

  return Animator;
})();

Object.defineProperty(exports, "__esModule", {
  value: true
});