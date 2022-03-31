import {EventManager} from 'aurelia-binding';
import { Container } from 'aurelia-dependency-injection';
import { ViewResources } from './view-resources';

/**
* Identifies a class as a resource that configures the EventManager with information
* about how events relate to properties for the purpose of two-way data-binding
* to Web Components.
*/
export class ElementConfigResource {
  /**
  * Provides an opportunity for the resource to initialize iteself.
  * @param container The dependency injection container from which the resource
  * can aquire needed services.
  * @param target The class to which this resource metadata is attached.
  */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  initialize(container: Container, target: Function): void {}

  /**
  * Allows the resource to be registered in the view resources for the particular
  * view into which it was required.
  * @param registry The view resource registry for the view that required this resource.
  * @param name The name provided by the end user for this resource, within the
  * particular view it's being used.
  */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  register(registry: ViewResources, name?: string): void {}

  /**
  * Enables the resource to asynchronously load additional resources.
  * @param container The dependency injection container from which the resource
  * can aquire needed services.
  * @param target The class to which this resource metadata is attached.
  */
  load(container: Container, target: Function): void {
    let config = new (target as any)();
    let eventManager = container.get(EventManager);
    eventManager.registerElementConfig(config);
  }
}
