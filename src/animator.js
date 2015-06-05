export class Animator {
  static configureDefault(container, animatorInstance){
    container.registerInstance(Animator, Animator.instance = (animatorInstance || new Animator()));
  }

  move() {
    return Promise.resolve(false);
  }

  /**
   * Execute an 'enter' animation on an element
   * 
   * @param element {HTMLElement}         Element to animate
   * 
   * @returns {Promise}                   Resolved when the animation is done
   */
  enter(element) {
    return Promise.resolve(false);
  }

  /**
   * Execute a 'leave' animation on an element
   * 
   * @param element {HTMLElement}         Element to animate
   * 
   * @returns {Promise}                   Resolved when the animation is done
   */
  leave(element) {
    return Promise.resolve(false);
  }

  /**
   * Add a class to an element to trigger an animation.
   * 
   * @param element {HTMLElement}         Element to animate
   * @param className {String}            Properties to animate or name of the effect to use
   * 
   * @returns {Promise}                   Resolved when the animation is done
   */
  removeClass(element, className) {
    return Promise.resolve(false);
  }

  /**
   * Add a class to an element to trigger an animation.
   * 
   * @param element {HTMLElement}         Element to animate
   * @param className {String}            Properties to animate or name of the effect to use
   * 
   * @returns {Promise}                   Resolved when the animation is done
   */
  addClass(element, className) {
    return Promise.resolve(false);
  }
  
  /**
   * Execute a single animation.
   * 
   * @param element {HTMLElement}         Element to animate
   * @param className {Object|String}    Properties to animate or name of the effect to use
   *                                      For css animators this represents the className to 
   *                                      be added and removed right after the animation is done
   * @param options {Object}              options for the animation (duration, easing, ...)
   * 
   * @returns {Promise}                   Resolved when the animation is done
   */
  animate(element,className,options) {
    return Promise.resolve(false);
  }

  /**
   * Run a sequence of animations one after the other.
   * for example : animator.runSequence("fadeIn","callout")
   * 
   * @param sequence {Array}          An array of effectNames or classNames
   * 
   * @returns {Promise}               Resolved when all animations are done
   */
  runSequence(sequence){}

  /**
   * Register an effect (for JS based animators)
   * 
   * @param effectName {String}          name identifier of the effect
   * @param properties {Object}          Object with properties for the effect
   * 
   */
  registerEffect(effectName, properties){}

  /**
   * Unregister an effect (for JS based animators)
   * 
   * @param effectName {String}          name identifier of the effect
   */
  unregisterEffect(effectName){} 

}