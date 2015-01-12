import {getAllAnnotations, getAnnotation, ResourceType} from 'aurelia-metadata';
import {TaskQueue} from 'aurelia-task-queue';
import {ObserverLocator} from 'aurelia-binding';
import {Children} from './children';
import {Property} from './property';
import {hyphenate} from './util';

export function configureBehavior(behavior, container, target) {
  var proto = target.prototype,
      i, ii, properties;

  if(!behavior.name){
    behavior.name = hyphenate(target.name);
  }

  behavior.target = target;
  behavior.taskQueue = container.get(TaskQueue);
  behavior.observerLocator = container.get(ObserverLocator);
  
  behavior.handlesCreated = ('created' in proto);
  behavior.handlesBind = ('bind' in proto);
  behavior.handlesUnbind = ('unbind' in proto);
  behavior.handlesAttached = ('attached' in proto);
  behavior.handlesDetached = ('detached' in proto);

  properties = getAllAnnotations(target, Property);

  for(i = 0, ii = properties.length; i < ii; ++i){
    properties[i].configureBehavior(behavior);
  }

  behavior.childExpression = getAnnotation(target, Children);
}