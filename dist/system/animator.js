System.register([], function (_export) {
  var _classCallCheck, _createClass, Animator;

  return {
    setters: [],
    execute: function () {
      "use strict";

      _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } };

      _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

      Animator = (function () {
        function Animator() {
          _classCallCheck(this, Animator);
        }

        _createClass(Animator, [{
          key: "move",
          value: function move() {
            return Promise.resolve(false);
          }
        }, {
          key: "enter",
          value: function enter(element) {
            return Promise.resolve(false);
          }
        }, {
          key: "leave",
          value: function leave(element) {
            return Promise.resolve(false);
          }
        }, {
          key: "removeClass",
          value: function removeClass(element, className) {
            return Promise.resolve(false);
          }
        }, {
          key: "addClass",
          value: function addClass(element, className) {
            return Promise.resolve(false);
          }
        }], [{
          key: "configureDefault",
          value: function configureDefault(container, animatorInstance) {
            container.registerInstance(Animator, Animator.instance = animatorInstance || new Animator());
          }
        }]);

        return Animator;
      })();

      _export("Animator", Animator);
    }
  };
});