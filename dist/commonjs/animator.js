"use strict";

var _prototypeProperties = function (child, staticProps, instanceProps) { if (staticProps) Object.defineProperties(child, staticProps); if (instanceProps) Object.defineProperties(child.prototype, instanceProps); };

var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } };

var Animator = exports.Animator = (function () {
  function Animator() {
    _classCallCheck(this, Animator);
  }

  _prototypeProperties(Animator, {
    configureDefault: {
      value: function configureDefault(container, animatorInstance) {
        container.registerInstance(Animator, Animator.instance = animatorInstance || new Animator());
      },
      writable: true,
      configurable: true
    }
  }, {
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