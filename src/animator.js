export class Animator {
  constructor() {
    Animator.instance = this;
    this.animationStack = [];
  }

  addMultipleEventListener(el, s, fn) {
    var evts = s.split(' '),
        i, ii;

    for (i = 0, ii = evts.length; i < ii; ++i) {
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
    return Promise.resolve(false);
  }

  enter(element) {
    return Promise.resolve(false);
  }

  leave(element) {
    return Promise.resolve(false);
  }

  removeClass(element, className) {
    return Promise.resolve(false);
  }

  addClass(element, className) {
    return Promise.resolve(false);
  }
}
