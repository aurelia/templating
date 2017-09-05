import * as LogManager from 'aurelia-logging';
import {subscriberCollection} from 'aurelia-binding';
import {TaskQueue} from 'aurelia-task-queue';

type CoerceInstruction = string | { (value: any): any }

/**
* An implementation of Aurelia's Observer interface that is used to back bindable properties defined on a behavior.
*/
@subscriberCollection()
export class BehaviorPropertyObserver {
  /**
  * Creates an instance of BehaviorPropertyObserver.
  * @param taskQueue The task queue used to schedule change notifications.
  * @param obj The object that the property is defined on.
  * @param propertyName The name of the property.
  * @param selfSubscriber The callback function that notifies the object which defines the properties, if present.
  * @param initialValue The initial value of the property.
  * @param coerce Instruction on how to convert value in setter
  */
  constructor(taskQueue: TaskQueue, obj: Object, propertyName: string, selfSubscriber: Function, initialValue: any, coerce?: CoerceInstruction) {
    this.taskQueue = taskQueue;
    this.obj = obj;
    this.propertyName = propertyName;
    this.notqueued = true;
    this.publishing = false;
    this.selfSubscriber = selfSubscriber;
    this.currentValue = this.oldValue = initialValue;
    if (coerce !== undefined) {
      this.setCoerce(coerce);
    }
  }
  setCoerce(coerce) {
    let c;
    switch (typeof coerce) {
    case 'function':
      c = coerce; break;
    case 'string':
      c = coerceFunctions[coerce]; break;
    default: break;
    }
    if (c === undefined) {
      LogManager
        .getLogger('behavior-property-observer')
        .warn(`Invalid coerce instruction. Should be either one of ${Object.keys(coerceFunctions)} or a function.`);
      return;
    }
    this.coerce = c;
  }

  /**
  * Gets the property's value.
  */
  getValue(): any {
    return this.currentValue;
  }

  /**
  * Sets the property's value.
  * @param newValue The new value to set.
  */
  setValue(newValue: any): void {
    const oldValue = this.currentValue;
    const coercedValue = this.coerce !== undefined ? this.coerce(newValue) : newValue;

    if (oldValue !== coercedValue) {
      this.oldValue = oldValue;
      this.currentValue = coercedValue;

      if (this.publishing && this.notqueued) {
        if (this.taskQueue.flushing) {
          this.call();
        } else {
          this.notqueued = false;
          this.taskQueue.queueMicroTask(this);
        }
      }
    }
  }

  /**
  * Invoked by the TaskQueue to publish changes to subscribers.
  */
  call(): void {
    let oldValue = this.oldValue;
    let newValue = this.currentValue;

    this.notqueued = true;

    if (newValue === oldValue) {
      return;
    }

    if (this.selfSubscriber) {
      this.selfSubscriber(newValue, oldValue);
    }

    this.callSubscribers(newValue, oldValue);
    this.oldValue = newValue;
  }

  /**
  * Subscribes to the observerable.
  * @param context A context object to pass along to the subscriber when it's called.
  * @param callable A function or object with a "call" method to be invoked for delivery of changes.
  */
  subscribe(context: any, callable: Function): void {
    this.addSubscriber(context, callable);
  }

  /**
  * Unsubscribes from the observerable.
  * @param context The context object originally subscribed with.
  * @param callable The callable that was originally subscribed with.
  */
  unsubscribe(context: any, callable: Function): void {
    this.removeSubscriber(context, callable);
  }
}

export const coerceFunctions = {
  none(a) {
    return a;
  },
  number(a) {
    const val = Number(a);
    return !isNaN(val) && isFinite(val) ? val : 0;
  },
  string(a) {
    return '' + a;
  },
  boolean(a) {
    return !!a;
  },
  date(a) {
    return new Date(a);
  }
};

export const coerceFunctionMap: Map<{ new(): any }, string> = new Map([
  [Number, 'number'],
  [String, 'string'],
  [Boolean, 'boolean'],
  [Date, 'date']
]);

/**
 * Map a class to a string for typescript property coerce
 * @param Class the property class to register
 * @param strType the string that represents class in the lookup
 * @param converter coerce function to register with @param strType
 */
export function mapCoerceFunction(type: { new(): any; }, strType: string, coerceFunction: (val: string) => any) {
  if (typeof strType !== 'string' || typeof coerceFunction !== 'function') {
    LogManager
      .getLogger('behavior-property-observer')
      .warn(`Bad attempt at mapping coerce function for type: ${type.name} to: ${strType}`);
  }
  coerceFunctions[strType] = coerceFunction;
  coerceFunctionMap.set(type, strType);
}
