/**
* List the events that an Animator should raise.
*/
export const animationEvent = {
  enterBegin: 'animation:enter:begin',
  enterActive: 'animation:enter:active',
  enterDone: 'animation:enter:done',
  enterTimeout: 'animation:enter:timeout',

  leaveBegin: 'animation:leave:begin',
  leaveActive: 'animation:leave:active',
  leaveDone: 'animation:leave:done',
  leaveTimeout: 'animation:leave:timeout',

  staggerNext: 'animation:stagger:next',

  removeClassBegin: 'animation:remove-class:begin',
  removeClassActive: 'animation:remove-class:active',
  removeClassDone: 'animation:remove-class:done',
  removeClassTimeout: 'animation:remove-class:timeout',

  addClassBegin: 'animation:add-class:begin',
  addClassActive: 'animation:add-class:active',
  addClassDone: 'animation:add-class:done',
  addClassTimeout: 'animation:add-class:timeout',

  animateBegin: 'animation:animate:begin',
  animateActive: 'animation:animate:active',
  animateDone: 'animation:animate:done',
  animateTimeout: 'animation:animate:timeout',

  sequenceBegin: 'animation:sequence:begin',
  sequenceDone: 'animation:sequence:done'
};
