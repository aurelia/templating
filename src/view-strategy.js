import {Metadata, Origin} from 'aurelia-metadata';
import {relativeToFile} from 'aurelia-path';
import {TemplateRegistryEntry} from 'aurelia-loader';
import {ViewEngine} from './view-engine';

export class ViewStrategy {
  static metadataKey:string = 'aurelia:view-strategy';

  makeRelativeTo(baseUrl:string){}

  static normalize(value:string|ViewStrategy){
    if(typeof value === 'string'){
      value = new UseViewStrategy(value);
    }

    if(value && !(value instanceof ViewStrategy)){
      throw new Error('The view must be a string or an instance of ViewStrategy.');
    }

    return value;
  }

  static getDefault(target:any):ViewStrategy{
    var strategy, annotation;

    if(typeof target !== 'function'){
      target = target.constructor;
    }

    annotation = Origin.get(target);
    strategy = Metadata.get(ViewStrategy.metadataKey, target);

    if(!strategy){
      if(!annotation){
        throw new Error('Cannot determinte default view strategy for object.', target);
      }

      strategy = new ConventionalViewStrategy(annotation.moduleId);
    }else if(annotation){
      strategy.moduleId = annotation.moduleId;
    }

    return strategy;
  }
}

export class UseViewStrategy extends ViewStrategy {
  constructor(path:string){
    super();
    this.path = path;
  }

  loadViewFactory(viewEngine:ViewEngine, options:Object, loadContext?:string[]):Promise<ViewFactory>{
    if(!this.absolutePath && this.moduleId){
      this.absolutePath = relativeToFile(this.path, this.moduleId);
    }

    return viewEngine.loadViewFactory(this.absolutePath || this.path, options, this.moduleId, loadContext);
  }

  makeRelativeTo(file:string){
    this.absolutePath = relativeToFile(this.path, file);
  }
}

export class ConventionalViewStrategy extends ViewStrategy {
  constructor(moduleId:string){
    super();
    this.moduleId = moduleId;
    this.viewUrl = ConventionalViewStrategy.convertModuleIdToViewUrl(moduleId);
  }

  loadViewFactory(viewEngine:ViewEngine, options:Object, loadContext?:string[]):Promise<ViewFactory>{
    return viewEngine.loadViewFactory(this.viewUrl, options, this.moduleId, loadContext);
  }

  static convertModuleIdToViewUrl(moduleId:string):string{
    var id = (moduleId.endsWith('.js') || moduleId.endsWith('.ts')) ? moduleId.substring(0, moduleId.length - 3) : moduleId;
    return id + '.html';
  }
}

export class NoViewStrategy extends ViewStrategy {
  loadViewFactory(viewEngine:ViewEngine, options:Object, loadContext?:string[]):Promise<ViewFactory>{
    return Promise.resolve(null);
  }
}

export class TemplateRegistryViewStrategy extends ViewStrategy {
  constructor(moduleId:string, registryEntry:TemplateRegistryEntry){
    super();
    this.moduleId = moduleId;
    this.registryEntry = registryEntry;
  }

  loadViewFactory(viewEngine:ViewEngine, options:Object, loadContext?:string[]):Promise<ViewFactory>{
    if(this.registryEntry.isReady){
      return Promise.resolve(this.registryEntry.factory);
    }

    return viewEngine.loadViewFactory(this.registryEntry, options, this.moduleId, loadContext);
  }
}
