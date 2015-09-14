import {subscriberCollection} from 'aurelia-binding';

@subscriberCollection()
export class BehaviorPropertyObserver {
  constructor(taskQueue, obj, propertyName, selfSubscriber, initialValue) {
    this.taskQueue = taskQueue;
    this.obj = obj;
    this.propertyName = propertyName;
    this.notqueued = true;
    this.publishing = false;
    this.selfSubscriber = selfSubscriber;
    this.currentValue = this.oldValue = initialValue;
  }

  getValue() {
    return this.currentValue;
  }

  setValue(newValue) {
    let oldValue = this.currentValue;

    if (oldValue !== newValue) {
      if (this.publishing && this.notqueued) {
        this.notqueued = false;
        this.taskQueue.queueMicroTask(this);
      }

      this.oldValue = oldValue;
      this.currentValue = newValue;
    }
  }

  call() {
    let oldValue = this.oldValue;
    let newValue = this.currentValue;

    this.notqueued = true;

    if(newValue === oldValue) {
      return;
    }

    if (this.selfSubscriber) {
      this.selfSubscriber(newValue, oldValue);
    }
    this.callSubscribers(newValue, oldValue);

    this.oldValue = newValue;
  }

  subscribe(context, callable) {
    this.addSubscriber(context, callable);
  }

  unsubscribe(context, callable) {
    this.removeSubscriber(context, callable);
  }
}
