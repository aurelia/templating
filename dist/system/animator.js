System.register([], function (_export) {
  "use strict";

  var Animator;

  function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

  return {
    setters: [],
    execute: function () {
      Animator = (function () {
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

        Animator.prototype.animate = function animate(element, className, options) {
          return Promise.resolve(false);
        };

        Animator.prototype.runSequence = function runSequence(sequence) {};

        Animator.prototype.registerEffect = function registerEffect(effectName, properties) {};

        Animator.prototype.unregisterEffect = function unregisterEffect(effectName) {};

        return Animator;
      })();

      _export("Animator", Animator);
    }
  };
});