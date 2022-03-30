import { BindingBehaviorResource, ValueConverterResource } from "aurelia-binding";
import { HtmlBehaviorResource } from "./html-behavior";
import { ViewEngineHooksResource } from "./view-engine-hooks-resource";

export type ViewResourceType = HtmlBehaviorResource | ValueConverterResource | BindingBehaviorResource | ViewEngineHooksResource;

export type ConstructableResourceTarget = Function & { __providerId__: number; };
