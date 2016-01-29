interface EventHandler {
  eventName:String,
  bubbles:Boolean,
  dispose:Function,
  handler:Function,
}

export class ElementEvents {
  constructor(element) {
    this.element = element;
    this.subscriptions = {};
  }

  /**
   * Enqueues a handler under this subscriptions[handler.eventName]
   * @param {EventHandler} [handler]
   */
  _enqueueHandler(handler: EventHandler): void {
    this.subscriptions[handler.eventName] = this.subscriptions[handler.eventName] || [];
    this.subscriptions[handler.eventName].push(handler);
  }

  /**
   * Dequeues a handler from it's this subscriptions[handler.eventName]
   * @param {EventHandler} [handler]
   * @return {EventHandler}
   */
  _dequeueHandler(handler: EventHandler): EventHandler {
    let index;
    let subscriptions = this.subscriptions[handler.eventName];
    if (subscriptions) {
      index = subscriptions.indexOf(handler);
      if (index > -1) {
        subscriptions.splice(index, 1);
      }
    }
    return handler;
  }

  /**
   * Dispatches an Event on the context element
   * @param {String}  [eventName]
   * @param {Object}  [detail]
   * @param {Boolean} [bubbles]
   * @param {Boolean} [cancelable]
   */
  publish(eventName: String, detail: Object = {}, bubbles: Boolean = true, cancelable: Boolean = true) {
    let event = new CustomEvent(eventName, {cancelable, bubbles, detail});
    this.element.dispatchEvent(event);
  }

  /**
   * Adds and Event Listener on the context element,
   * @param {String}   [eventName]
   * @param {Function} [handler]
   * @param {Boolean}  [bubbles]
   * @return {EventHandler} Returns the eventHandler containing a dispose method
   */
  subscribe(eventName: String, handler: Function, bubbles: Boolean = true): EventHandler {
    if (handler && typeof handler === 'function') {
      handler.eventName = eventName;
      handler.handler   = handler;
      handler.bubbles   = bubbles;
      handler.dispose   = ()=> {
        this.element.removeEventListener(eventName, handler, bubbles);
        this._dequeueHandler(handler);
      }
      this.element.addEventListener(eventName, handler, bubbles);
      this._enqueueHandler(handler);
      return handler;
    }
  }

  /**
   * Adds and Event Listener on the context element, that will be disposed on the first trigger
   * @param {String}   [eventName]
   * @param {Function} [handler]
   * @param {Boolean}  [bubbles]
   * @return {EventHandler} Returns the eventHandler containing a dispose method
   */
  subscribeOnce(eventName: String, handler: Function, bubbles: Boolean = true): EventHandler {
    if (handler && typeof handler === 'function') {
      let _handler = (event)=> {
        handler(event);
        _handler.dispose();
      }
      return this.subscribe(eventName, _handler, bubbles);
    }
  }

  /**
   * Removes all events that are listening to the specified eventName
   * @param  {String} [eventName]
   */
  dispose(eventName: String) {
    if (eventName && typeof eventName === 'string') {
      let subscriptions = this.subscriptions[eventName];
      if (subscriptions) {
        while(subscriptions.length) {
          let subscription = subscriptions.pop();
          if (subscription) subscription.dispose();
        }
      }
    }
    else {
      this.disposeAll();
    }
  }

  /**
   * Removes all event handlers
   */
  disposeAll() {
    for (let key in this.subscriptions) {
      this.dispose(key);
    }
  }
}
