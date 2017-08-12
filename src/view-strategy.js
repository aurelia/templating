import {Origin, protocol} from 'aurelia-metadata';
import {relativeToFile} from 'aurelia-path';
import {TemplateRegistryEntry} from 'aurelia-loader';
import {ViewEngine} from './view-engine';
import {ResourceLoadContext, ViewCompileInstruction} from './instructions';
import {DOM, PLATFORM} from 'aurelia-pal';

/**
* Implemented by classes that describe how a view factory should be loaded.
*/
interface ViewStrategy {
  /**
  * Loads a view factory.
  * @param viewEngine The view engine to use during the load process.
  * @param compileInstruction Additional instructions to use during compilation of the view.
  * @param loadContext The loading context used for loading all resources and dependencies.
  * @param target A class from which to extract metadata of additional resources to load.
  * @return A promise for the view factory that is produced by this strategy.
  */
  loadViewFactory(viewEngine: ViewEngine, compileInstruction: ViewCompileInstruction, loadContext?: ResourceLoadContext, target?: any): Promise<ViewFactory>;
}

/**
* Decorator: Indicates that the decorated class/object is a view strategy.
*/
export const viewStrategy: Function = protocol.create('aurelia:view-strategy', {
  validate(target) {
    if (!(typeof target.loadViewFactory === 'function')) {
      return 'View strategies must implement: loadViewFactory(viewEngine: ViewEngine, compileInstruction: ViewCompileInstruction, loadContext?: ResourceLoadContext): Promise<ViewFactory>';
    }

    return true;
  },
  compose(target) {
    if (!(typeof target.makeRelativeTo === 'function')) {
      target.makeRelativeTo = PLATFORM.noop;
    }
  }
});

/**
* A view strategy that loads a view relative to its associated view-model.
*/
@viewStrategy()
export class RelativeViewStrategy {
  /**
  * Creates an instance of RelativeViewStrategy.
  * @param path The relative path to the view.
  */
  constructor(path: string) {
    this.path = path;
    this.absolutePath = null;
  }

  /**
  * Loads a view factory.
  * @param viewEngine The view engine to use during the load process.
  * @param compileInstruction Additional instructions to use during compilation of the view.
  * @param loadContext The loading context used for loading all resources and dependencies.
  * @param target A class from which to extract metadata of additional resources to load.
  * @return A promise for the view factory that is produced by this strategy.
  */
  loadViewFactory(viewEngine: ViewEngine, compileInstruction: ViewCompileInstruction, loadContext?: ResourceLoadContext, target?: any): Promise<ViewFactory> {
    if (this.absolutePath === null && this.moduleId) {
      this.absolutePath = relativeToFile(this.path, this.moduleId);
    }

    compileInstruction.associatedModuleId = this.moduleId;
    return viewEngine.loadViewFactory(this.absolutePath || this.path, compileInstruction, loadContext, target);
  }

  /**
  * Makes the view loaded by this strategy relative to the provided file path.
  * @param file The path to load the view relative to.
  */
  makeRelativeTo(file: string): void {
    if (this.absolutePath === null) {
      this.absolutePath = relativeToFile(this.path, file);
    }
  }
}

/**
* A view strategy based on naming conventions.
*/
@viewStrategy()
export class ConventionalViewStrategy {
  /**
  * Creates an instance of ConventionalViewStrategy.
  * @param viewLocator The view locator service for conventionally locating the view.
  * @param origin The origin of the view model to conventionally load the view for.
  */
  constructor(viewLocator: ViewLocator, origin: Origin) {
    this.moduleId = origin.moduleId;
    this.viewUrl = viewLocator.convertOriginToViewUrl(origin);
  }

  /**
  * Loads a view factory.
  * @param viewEngine The view engine to use during the load process.
  * @param compileInstruction Additional instructions to use during compilation of the view.
  * @param loadContext The loading context used for loading all resources and dependencies.
  * @param target A class from which to extract metadata of additional resources to load.
  * @return A promise for the view factory that is produced by this strategy.
  */
  loadViewFactory(viewEngine: ViewEngine, compileInstruction: ViewCompileInstruction, loadContext?: ResourceLoadContext, target?: any): Promise<ViewFactory> {
    compileInstruction.associatedModuleId = this.moduleId;
    return viewEngine.loadViewFactory(this.viewUrl, compileInstruction, loadContext, target);
  }
}

/**
* A view strategy that indicates that the component has no view that the templating engine needs to manage.
* Typically used when the component author wishes to take over fine-grained rendering control.
*/
@viewStrategy()
export class NoViewStrategy {
  /**
  * Creates an instance of NoViewStrategy.
  * @param dependencies A list of view resource dependencies of this view.
  * @param dependencyBaseUrl The base url for the view dependencies.
  */
  constructor(dependencies?: Array<string|Function|Object>, dependencyBaseUrl?: string) {
    this.dependencies = dependencies || null;
    this.dependencyBaseUrl = dependencyBaseUrl || '';
  }

  /**
  * Loads a view factory.
  * @param viewEngine The view engine to use during the load process.
  * @param compileInstruction Additional instructions to use during compilation of the view.
  * @param loadContext The loading context used for loading all resources and dependencies.
  * @param target A class from which to extract metadata of additional resources to load.
  * @return A promise for the view factory that is produced by this strategy.
  */
  loadViewFactory(viewEngine: ViewEngine, compileInstruction: ViewCompileInstruction, loadContext?: ResourceLoadContext, target?: any): Promise<ViewFactory> {
    let entry = this.entry;
    let dependencies = this.dependencies;

    if (entry && entry.factoryIsReady) {
      return Promise.resolve(null);
    }

    this.entry = entry = new TemplateRegistryEntry(this.moduleId || this.dependencyBaseUrl);
    // since we're not invoking the TemplateRegistryEntry template setter
    // we need to create the dependencies Array manually and set it as loaded:
    entry.dependencies = [];
    entry.templateIsLoaded = true;

    if (dependencies !== null) {
      for (let i = 0, ii = dependencies.length; i < ii; ++i) {
        let current = dependencies[i];

        if (typeof current === 'string' || typeof current === 'function') {
          entry.addDependency(current);
        } else {
          entry.addDependency(current.from, current.as);
        }
      }
    }

    compileInstruction.associatedModuleId = this.moduleId;

    // loadViewFactory will resolve as 'null' because entry template is not set:
    return viewEngine.loadViewFactory(entry, compileInstruction, loadContext, target);
  }
}

/**
* A view strategy created directly from the template registry entry.
*/
@viewStrategy()
export class TemplateRegistryViewStrategy {
  /**
  * Creates an instance of TemplateRegistryViewStrategy.
  * @param moduleId The associated moduleId of the view to be loaded.
  * @param entry The template registry entry used in loading the view factory.
  */
  constructor(moduleId: string, entry: TemplateRegistryEntry) {
    this.moduleId = moduleId;
    this.entry = entry;
  }

  /**
  * Loads a view factory.
  * @param viewEngine The view engine to use during the load process.
  * @param compileInstruction Additional instructions to use during compilation of the view.
  * @param loadContext The loading context used for loading all resources and dependencies.
  * @param target A class from which to extract metadata of additional resources to load.
  * @return A promise for the view factory that is produced by this strategy.
  */
  loadViewFactory(viewEngine: ViewEngine, compileInstruction: ViewCompileInstruction, loadContext?: ResourceLoadContext, target?: any): Promise<ViewFactory> {
    let entry = this.entry;

    if (entry.factoryIsReady) {
      return Promise.resolve(entry.factory);
    }

    compileInstruction.associatedModuleId = this.moduleId;
    return viewEngine.loadViewFactory(entry, compileInstruction, loadContext, target);
  }
}

/**
* A view strategy that allows the component author to inline the html for the view.
*/
@viewStrategy()
export class InlineViewStrategy {
  /**
  * Creates an instance of InlineViewStrategy.
  * @param markup The markup for the view. Be sure to include the wrapping template tag.
  * @param dependencies A list of view resource dependencies of this view.
  * @param dependencyBaseUrl The base url for the view dependencies.
  */
  constructor(markup: string, dependencies?: Array<string|Function|Object>, dependencyBaseUrl?: string) {
    this.markup = markup;
    this.dependencies = dependencies || null;
    this.dependencyBaseUrl = dependencyBaseUrl || '';
  }

  /**
  * Loads a view factory.
  * @param viewEngine The view engine to use during the load process.
  * @param compileInstruction Additional instructions to use during compilation of the view.
  * @param loadContext The loading context used for loading all resources and dependencies.
  * @param target A class from which to extract metadata of additional resources to load.
  * @return A promise for the view factory that is produced by this strategy.
  */
  loadViewFactory(viewEngine: ViewEngine, compileInstruction: ViewCompileInstruction, loadContext?: ResourceLoadContext, target?: any): Promise<ViewFactory> {
    let entry = this.entry;
    let dependencies = this.dependencies;

    if (entry && entry.factoryIsReady) {
      return Promise.resolve(entry.factory);
    }

    this.entry = entry = new TemplateRegistryEntry(this.moduleId || this.dependencyBaseUrl);
    entry.template = DOM.createTemplateFromMarkup(this.markup);

    if (dependencies !== null) {
      for (let i = 0, ii = dependencies.length; i < ii; ++i) {
        let current = dependencies[i];

        if (typeof current === 'string' || typeof current === 'function') {
          entry.addDependency(current);
        } else {
          entry.addDependency(current.from, current.as);
        }
      }
    }

    compileInstruction.associatedModuleId = this.moduleId;
    return viewEngine.loadViewFactory(entry, compileInstruction, loadContext, target);
  }
}
