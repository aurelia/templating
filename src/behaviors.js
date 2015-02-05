import {Metadata} from 'aurelia-metadata';
import {TaskQueue} from 'aurelia-task-queue';
import {ObserverLocator} from 'aurelia-binding';
import {ChildObserver} from './children';
import {BehaviorProperty} from './property';
import {hyphenate} from './util';

export function configureBehavior(container, behavior, target, valuePropertyName) {
  var proto = target.prototype,
      taskQueue = container.get(TaskQueue),
      meta = Metadata.on(target),
      observerLocator = container.get(ObserverLocator),
      i, ii, properties;

  if(!behavior.name){
    behavior.name = hyphenate(target.name);
  }

  behavior.target = target;
  behavior.observerLocator = observerLocator;
  behavior.handlesCreated = ('created' in proto);
  behavior.handlesBind = ('bind' in proto);
  behavior.handlesUnbind = ('unbind' in proto);
  behavior.handlesAttached = ('attached' in proto);
  behavior.handlesDetached = ('detached' in proto);
  behavior.apiName = behavior.name.replace(/-([a-z])/g, (m, w) => {
    return w.toUpperCase();
  });

  properties = meta.all(BehaviorProperty);

  for(i = 0, ii = properties.length; i < ii; ++i){
    properties[i].define(taskQueue, behavior);
  }

  properties = behavior.properties;

  if(properties.length === 0 && 'valueChanged' in target.prototype){
    new BehaviorProperty('value', 'valueChanged', valuePropertyName || behavior.name).define(taskQueue, behavior);
  }

  if(properties.length !== 0){
    target.initialize = function(executionContext){
      var observerLookup = observerLocator.getObserversLookup(executionContext),
          i, ii, observer;

      for(i = 0, ii = properties.length; i < ii; ++i){
        observer = properties[i].createObserver(executionContext);

        if(observer !== undefined){
          observerLookup[observer.propertyName] = observer;
        }
      }
    };
  }

  behavior.childExpression = meta.first(ChildObserver);
}
