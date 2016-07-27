import {View} from './view';
import {ViewStrategy} from './view-strategy';

/**
* An optional interface describing the created convention.
*/
interface ComponentCreated {
    /**
    * Implement this hook if you want to perform custom logic after the constructor has been called.
    * At this point in time, the view has also been created and both the view-model and the view
    * are connected to their controller. The hook will recieve the instance of the "owningView".
    * This is the view that the component is declared inside of. If the component itself has a view,
    * this will be passed second.
    */
    created(owningView: View, myView: View): void;
}

/**
* An optional interface describing the bind convention.
*/
interface ComponentBind {
    /**
    * Implement this hook if you want to perform custom logic when databinding is activated on the view and view-model.
    * The "binding context" to which the component is being bound will be passed first.
    * An "override context" will be passed second. The override context contains information used to traverse
    * the parent hierarchy and can also be used to add any contextual properties that the component wants to add.
    */
    bind(bindingContext: any, overrideContext: any): void;
}

/**
* An optional interface describing the attached convention.
*/
interface ComponentAttached {
    /**
    * Implement this hook if you want to perform custom logic when the component is attached to the DOM (in document).
    */
    attached(): void;
}

/**
* An optional interface describing the detached convention.
*/
interface ComponentDetached {
    /**
    * Implement this hook if you want to perform custom logic if/when the component is removed from the the DOM.
    */
    detached(): void;
}

/**
* An optional interface describing the unbind convention.
*/
interface ComponentUnbind {
    /**
    * Implement this hook if you want to perform custom logic after the component is detached and unbound.
    */
    unbind(): void;
}

/**
* An optional interface describing the getViewStrategy convention for dynamic components (used with the compose element or the router).
*/
interface DynamicComponentGetViewStrategy {
    /**
    * Implement this hook if you want to provide custom view strategy when this component is used with the compose element or the router.
    */
    getViewStrategy(): string|ViewStrategy;
}
