export class Animator {
  constructor() {
    Animator.instance = this;
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
