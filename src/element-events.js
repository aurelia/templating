import {DOM} from 'aurelia-pal';

interface EventHandler {
  eventName: string;
  bubbles: boolean;
  dispose: Function;
  handler: Function;
}

/**
 * Dispatches subscribets to and publishes events in the DOM.
 * @param element
 */
export class ElementEvents {
  constructor(element: Element) {
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
   * @param eventName
   * @param handler
   * @param bubbles
   * @return Returns the eventHandler containing a dispose method
   */
  subscribe(eventName: string, handler: Function, bubbles?: boolean = true): EventHandler {
    if (handler && typeof handler === 'function') {
      handler.eventName = eventName;
      handler.handler = handler;
      handler.bubbles = bubbles;
      handler.dispose = () => {
        this.element.removeEventListener(eventName, handler, bubbles);
        this._dequeueHandler(handler);
      };
      this.element.addEventListener(eventName, handler, bubbles);
      this._enqueueHandler(handler);
      return handler;
    }

    return undefined;
  }

  /**
   * Adds an Event Listener on the context element, that will be disposed on the first trigger.
   * @param eventName
   * @param handler
   * @param bubbles
   * @return Returns the eventHandler containing a dispose method
   */
  subscribeOnce(eventName: String, handler: Function, bubbles?: Boolean = true): EventHandler {
    if (handler && typeof handler === 'function') {
      let _handler = (event) => {
        handler(event);
        _handler.dispose();
      };
      return this.subscribe(eventName, _handler, bubbles);
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
