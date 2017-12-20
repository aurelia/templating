import {DOM} from 'aurelia-pal';

interface EventHandler {
  eventName: string;
  bubbles: boolean;
  capture: boolean;
  dispose: Function;
  handler: Function;
}

/**
 * Dispatches subscribets to and publishes events in the DOM.
 * @param element
 */
export class ElementEvents {
  constructor(element: EventTarget) {
    this.element = element;
    this.subscriptions = {};
  }

  _enqueueHandler(handler: EventHandler): void {
    this.subscriptions[handler.eventName] = this.subscriptions[handler.eventName] || [];
    this.subscriptions[handler.eventName].push(handler);
  }

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
   * Dispatches an Event on the context element.
   * @param eventName
   * @param detail
   * @param bubbles
   * @param cancelable
   */
  publish(eventName: string, detail?: Object = {}, bubbles?: boolean = true, cancelable?: boolean = true) {
    let event = DOM.createCustomEvent(eventName, {cancelable, bubbles, detail});
    this.element.dispatchEvent(event);
  }

  /**
   * Adds and Event Listener on the context element.
   * @return Returns the eventHandler containing a dispose method
   */
  subscribe(eventName: string, handler: Function, captureOrOptions?: boolean = true): EventHandler {
    if (typeof handler === 'function') {
      const eventHandler = new EventHandlerImpl(this, eventName, handler, captureOrOptions, false);
      return eventHandler;
    }

    return undefined;
  }

  /**
   * Adds an Event Listener on the context element, that will be disposed on the first trigger.
   * @return Returns the eventHandler containing a dispose method
   */
  subscribeOnce(eventName: string, handler: Function, captureOrOptions?: boolean = true): EventHandler {
    if (typeof handler === 'function') {
      const eventHandler = new EventHandlerImpl(this, eventName, handler, captureOrOptions, true);
      return eventHandler;
    }

    return undefined;
  }

  /**
   * Removes all events that are listening to the specified eventName.
   * @param eventName
   */
  dispose(eventName: string): void {
    if (eventName && typeof eventName === 'string') {
      let subscriptions = this.subscriptions[eventName];
      if (subscriptions) {
        while (subscriptions.length) {
          let subscription = subscriptions.pop();
          if (subscription) {
            subscription.dispose();
          }
        }
      }
    } else {
      this.disposeAll();
    }
  }

  /**
   * Removes all event handlers.
   */
  disposeAll() {
    for (let key in this.subscriptions) {
      this.dispose(key);
    }
  }
}

class EventHandlerImpl {
  constructor(owner: ElementEvents, eventName: string, handler: Function, captureOrOptions: boolean, once: boolean) {
    this.owner = owner;
    this.eventName = eventName;
    this.handler = handler;
    // For compat with interface
    this.capture = typeof captureOrOptions === 'boolean' ? captureOrOptions : captureOrOptions.capture;
    this.bubbles = !this.capture;
    this.captureOrOptions = captureOrOptions;
    this.once = once;
    owner.element.addEventListener(eventName, this, captureOrOptions);
    owner._enqueueHandler(this);
  }

  handleEvent(e) {
    // To keep `undefined` as context, same as the old way
    const fn = this.handler;
    fn(e);
    if (this.once) {
      this.dispose();
    }
  }

  dispose() {
    this.owner.element.removeEventListener(this.eventName, this, this.captureOrOptions);
    this.owner._dequeueHandler(this);
    this.owner = this.handler = null;
  }
}
