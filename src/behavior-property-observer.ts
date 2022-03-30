import {subscriberCollection} from 'aurelia-binding';
import {TaskQueue} from 'aurelia-task-queue';

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
  */
  constructor(taskQueue: TaskQueue, obj: Object, propertyName: string, selfSubscriber: Function, initialValue: any) {
    this.taskQueue = taskQueue;
    this.obj = obj;
    this.propertyName = propertyName;
    this.notqueued = true;
    this.publishing = false;
    this.selfSubscriber = selfSubscriber;
    this.currentValue = this.oldValue = initialValue;
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
    let oldValue = this.currentValue;

    if (!Object.is(newValue, oldValue)) {
      this.oldValue = oldValue;
      this.currentValue = newValue;

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

    if (Object.is(newValue, oldValue)) {
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
