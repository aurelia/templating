System.register([], function (_export) {
  var _prototypeProperties, _classCallCheck, Animator;

  return {
    setters: [],
    execute: function () {
      "use strict";

      _prototypeProperties = function (child, staticProps, instanceProps) { if (staticProps) Object.defineProperties(child, staticProps); if (instanceProps) Object.defineProperties(child.prototype, instanceProps); };

      _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } };

      Animator = _export("Animator", (function () {
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
      })());
    }
  };
});