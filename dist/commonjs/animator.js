"use strict";

var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } };

exports.__esModule = true;

var Animator = (function () {
  function Animator() {
    _classCallCheck(this, Animator);
  }

  Animator.configureDefault = function configureDefault(container, animatorInstance) {
    container.registerInstance(Animator, Animator.instance = animatorInstance || new Animator());
  };

  Animator.prototype.move = function move() {
    return Promise.resolve(false);
  };

  Animator.prototype.enter = function enter(element) {
    return Promise.resolve(false);
  };

  Animator.prototype.leave = function leave(element) {
    return Promise.resolve(false);
  };

  Animator.prototype.removeClass = function removeClass(element, className) {
    return Promise.resolve(false);
  };

  Animator.prototype.addClass = function addClass(element, className) {
    return Promise.resolve(false);
  };

  return Animator;
})();

exports.Animator = Animator;