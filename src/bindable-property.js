import {_hyphenate} from './util';
import {BehaviorPropertyObserver} from './behavior-property-observer';
import {bindingMode} from 'aurelia-binding';
import {Container} from 'aurelia-dependency-injection';
import {metadata} from 'aurelia-metadata';

const reflectionConfigured = Symbol('reflection');

function getObserver(instance, name) {
  let lookup = instance.__observers__;

  if (lookup === undefined) {
    // We need to lookup the actual behavior for this instance,
    // as it might be a derived class (and behavior) rather than
    // the class (and behavior) that declared the property calling getObserver().
    // This means we can't capture the behavior in property get/set/getObserver and pass it here.
    // Note that it's probably for the best, as passing the behavior is an overhead
    // that is only useful in the very first call of the first property of the instance.
    let ctor = Object.getPrototypeOf(instance).constructor; // Playing safe here, user could have written to instance.constructor.
    let behavior = metadata.get(metadata.resource, ctor);
    if (!behavior.isInitialized) {
      behavior.initialize(Container.instance || new Container(), instance.constructor);
    }

    lookup = behavior.observerLocator.getOrCreateObserversLookup(instance);
    behavior._ensurePropertiesDefined(instance, lookup);
  }

  return lookup[name];
}

export type BindablePropertyConfig = {
  defaultBindingMode?: bindingMode,
  reflectToAttribute?: boolean | {(el: Element, name: string, newVal, oldVal): any},
  name?: string,
  attribute?: any,
  changeHandler?: string
}

/**
* Represents a bindable property on a behavior.
*/
export class BindableProperty {
  /**
  * Creates an instance of BindableProperty.
  * @param nameOrConfig The name of the property or a cofiguration object.
  */
  constructor(nameOrConfig: string | BindablePropertyConfig) {
    if (typeof nameOrConfig === 'string') {
      this.name = nameOrConfig;
    } else {
      Object.assign(this, nameOrConfig);
    }

    this.attribute = this.attribute || _hyphenate(this.name);
    if (this.defaultBindingMode === null || this.defaultBindingMode === undefined) {
      this.defaultBindingMode = bindingMode.oneWay;
    }
    this.changeHandler = this.changeHandler || null;
    this.owner = null;
    this.descriptor = null;
  }

  /**
  * Registers this bindable property with particular Class and Behavior instance.
  * @param target The class to register this behavior with.
  * @param behavior The behavior instance to register this property with.
  * @param descriptor The property descriptor for this property.
  */
  registerWith(target: Function, behavior: HtmlBehaviorResource, descriptor?: Object): void {
    let { reflectToAttribute } = this;

    behavior.properties.push(this);
    behavior.attributes[this.attribute] = this;
    this.owner = behavior;

    if (reflectToAttribute) {
      behavior.hasReflections = true;
    }

    if (descriptor) {
      this.descriptor = descriptor;
      return this._configureDescriptor(descriptor);
    }

    return undefined;
  }

  _configureDescriptor(descriptor: Object): Object {
    let name = this.name;

    descriptor.configurable = true;
    descriptor.enumerable = true;

    if ('initializer' in descriptor) {
      this.defaultValue = descriptor.initializer;
      delete descriptor.initializer;
      delete descriptor.writable;
    }

    if ('value' in descriptor) {
      this.defaultValue = descriptor.value;
      delete descriptor.value;
      delete descriptor.writable;
    }

    descriptor.get = function() {
      return getObserver(this, name).getValue();
    };

    descriptor.set = function(value) {
      getObserver(this, name).setValue(value);
    };

    descriptor.get.getObserver = function(obj) {
      return getObserver(obj, name);
    };

    return descriptor;
  }

  /**
  * Defines this property on the specified class and behavior.
  * @param target The class to define the property on.
  * @param behavior The behavior to define the property on.
  */
  defineOn(target: Function, behavior: HtmlBehaviorResource): void {
    let name = this.name;
    let handlerName;

    if (this.changeHandler === null) {
      handlerName = name + 'Changed';
      if (handlerName in target.prototype) {
        this.changeHandler = handlerName;
      }
    }

    if (this.descriptor === null) {
      Object.defineProperty(target.prototype, name, this._configureDescriptor(behavior, {}));
    }
  }

  /**
  * Creates an observer for this property.
  * @param viewModel The view model instance on which to create the observer.
  * @return The property observer.
  */
  createObserver(viewModel: Object): BehaviorPropertyObserver {
    let selfSubscriber = null;
    let defaultValue = this.defaultValue;
    let changeHandlerName = this.changeHandler;
    let name = this.name;
    let reflectToAttribute = this.reflectToAttribute;
    let initialValue;
    let attrName;
    let reflectFunction;

    if (this.hasOptions) {
      return undefined;
    }

    if (reflectToAttribute) {
      attrName = this.attribute === undefined ? _hyphenate(name) : this.attribute;
      reflectFunction = typeof reflectToAttribute === 'function' ? reflectToAttribute : reflectFunctions[reflectToAttribute];
    }

    if (changeHandlerName in viewModel) {
      if ('propertyChanged' in viewModel) {
        if (reflectFunction !== undefined) {
          selfSubscriber = (newValue, oldValue) => {
            callReflection(viewModel, reflectFunction, attrName, newValue);
            viewModel[changeHandlerName](newValue, oldValue);
            viewModel.propertyChanged(name, newValue, oldValue);
          };
        } else {
          selfSubscriber = (newValue, oldValue) => {
            viewModel[changeHandlerName](newValue, oldValue);
            viewModel.propertyChanged(name, newValue, oldValue);
          };
        }
      } else {
        if (reflectFunction !== undefined) {
          selfSubscriber = (newValue, oldValue) => {
            callReflection(viewModel, reflectFunction, attrName, newValue);
            viewModel[changeHandlerName](newValue, oldValue);
          };
        } else {
          selfSubscriber = (newValue, oldValue) => viewModel[changeHandlerName](newValue, oldValue);
        }
      }
    } else if ('propertyChanged' in viewModel) {
      if (reflectFunction !== undefined) {
        selfSubscriber = (newValue, oldValue) => {
          callReflection(viewModel, reflectFunction, attrName, newValue);
          viewModel.propertyChanged(name, newValue, oldValue);
        };
      } else {
        selfSubscriber = (newValue, oldValue) => viewModel.propertyChanged(name, newValue, oldValue);
      }
    } else if (changeHandlerName !== null) {
      throw new Error(`Change handler ${changeHandlerName} was specified but not declared on the class.`);
    }

    /**
     * When view model doesn't have change handler but this property has reflection
     */
    if (selfSubscriber === null && reflectFunction !== undefined) {
      selfSubscriber = (newValue, oldValue) => callReflection(viewModel, reflectFunction, attrName, newValue);
    }

    if (defaultValue !== undefined) {
      initialValue = typeof defaultValue === 'function' ? defaultValue.call(viewModel) : defaultValue;
    }

    return new BehaviorPropertyObserver(this.owner.taskQueue, viewModel, this.name, selfSubscriber, initialValue);
  }

  _initialize(viewModel, observerLookup, attributes, behaviorHandlesBind, boundProperties): void {
    let selfSubscriber;
    let observer;
    let attribute;
    let defaultValue = this.defaultValue;

    if (this.isDynamic) {
      for (let key in attributes) {
        this._createDynamicProperty(viewModel, observerLookup, behaviorHandlesBind, key, attributes[key], boundProperties);
      }
    } else if (!this.hasOptions) {
      observer = observerLookup[this.name];

      if (attributes !== null) {
        selfSubscriber = observer.selfSubscriber;
        attribute = attributes[this.attribute];

        if (behaviorHandlesBind) {
          observer.selfSubscriber = null;
        }

        if (typeof attribute === 'string') {
          viewModel[this.name] = attribute;
          observer.call();
        } else if (attribute) {
          boundProperties.push({observer: observer, binding: attribute.createBinding(viewModel)});
        } else if (defaultValue !== undefined) {
          observer.call();
        }

        observer.selfSubscriber = selfSubscriber;
      }

      observer.publishing = true;
    }
  }

  _createDynamicProperty(viewModel, observerLookup, behaviorHandlesBind, name, attribute, boundProperties) {
    let changeHandlerName = name + 'Changed';
    let selfSubscriber = null;
    let observer;
    let info;

    if (changeHandlerName in viewModel) {
      if ('propertyChanged' in viewModel) {
        selfSubscriber = (newValue, oldValue) => {
          viewModel[changeHandlerName](newValue, oldValue);
          viewModel.propertyChanged(name, newValue, oldValue);
        };
      } else {
        selfSubscriber = (newValue, oldValue) => viewModel[changeHandlerName](newValue, oldValue);
      }
    } else if ('propertyChanged' in viewModel) {
      selfSubscriber = (newValue, oldValue) => viewModel.propertyChanged(name, newValue, oldValue);
    }

    observer = observerLookup[name] = new BehaviorPropertyObserver(
        this.owner.taskQueue,
        viewModel,
        name,
        selfSubscriber
        );

    Object.defineProperty(viewModel, name, {
      configurable: true,
      enumerable: true,
      get: observer.getValue.bind(observer),
      set: observer.setValue.bind(observer)
    });

    if (behaviorHandlesBind) {
      observer.selfSubscriber = null;
    }

    if (typeof attribute === 'string') {
      viewModel[name] = attribute;
      observer.call();
    } else if (attribute) {
      info = {observer: observer, binding: attribute.createBinding(viewModel)};
      boundProperties.push(info);
    }

    observer.publishing = true;
    observer.selfSubscriber = selfSubscriber;
  }
}

/**
 * @param viewModel the view model instance
 * @param attrName name of attribute will be set on the element
 * @param newValue
 */
function callReflection(viewModel: Object, reflectFunction: (element: Element, attrName: string, val) => any, attrName: string, newValue) {
  let { __element__ } = viewModel.__observers__;
  reflectFunction(__element__, attrName, newValue);
}

const reflectFunctions = {
  string(element, attrName, newValue) {
    element.setAttribute(attrName, newValue);
  },
  boolean(element, attrName, newValue) {
    if (newValue) {
      element.setAttribute(attrName, '');
    } else {
      element.removeAttribute(attrName);
    }
  }
};
