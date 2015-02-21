export class Animator {
  constructor() {
    Animator.instance = this;
    this.animationStack = [];
  }

  addMultipleEventListener(el, s, fn) {
    var evts = s.split(' ');
    for (var i=0, iLen=evts.length; i<iLen; i++) {
      el.addEventListener(evts[i], fn, false);
    }
  }

  addAnimationToStack(animId) {
    if(this.animationStack.indexOf(animId) < 0) {
      this.animationStack.push(animId);
    }
  }

  removeAnimationFromStack(animId) {
    var idx = this.animationStack.indexOf(animId);
    if(idx > -1) {
      this.animationStack.splice(idx, 1);
    }
  }

  move() {
    return new Promise( (resolve, reject) => {
      resolve(false);
    });
  }

  enter(element) {
    return new Promise( (resolve, reject) => {
      resolve(false);
    });
  }

  leave(element) {
    return new Promise( (resolve, reject) => {
      resolve(false);
    });
  }

  removeClass(element, className) {
    return new Promise( (resolve, reject) => {
      resolve(false);
    });
  }

  addClass(element, className) {
    return new Promise( (resolve, reject) => {
      resolve(false);
    });
  }
}
