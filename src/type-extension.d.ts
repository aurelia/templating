import { BindingBehaviorResource, ValueConverterResource } from "aurelia-binding";
import { HtmlBehaviorResource } from "./html-behavior";
import { BehaviorInstruction } from "./instructions";
import { PassThroughSlot, ShadowSlot } from "./shadow-dom";
import { View } from "./view";
import { ViewCompiler } from "./view-compiler";
import { ViewEngineHooksResource } from "./view-engine-hooks-resource";
import { ViewResources } from "./view-resources";
import { ViewSlot } from "./view-slot";

export type ViewResourceType = HtmlBehaviorResource | ValueConverterResource | BindingBehaviorResource | ViewEngineHooksResource;

export type ConstructableResourceTarget = Function & { __providerId__: number; };

export type SlotMarkedNode = Node & {
  viewSlot?: ShadowSlot | PassThroughSlot | ViewSlot;
  auOwnerView?: View;
  auProjectionSource?: ViewSlot;
  auAssignedSlot?: ShadowSlot | PassThroughSlot;
  auSlotProjectFrom?: ViewSlot | ShadowSlot;
  auProjectionChildren?: SlotMarkedNode[];
  isContentProjectionSource?: boolean;
};

export type ProcessContentCallback = (viewCompiler: ViewCompiler, resources: ViewResources, node: Element, instruction: BehaviorInstruction) => boolean;

export type ProcessAttributeCallback = (compiler: ViewCompiler, resources: ViewResources, node: Element, attributes: Element['attributes'], elementInstruction: BehaviorInstruction) => void;
