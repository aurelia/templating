export * from './element-events';
export { ViewCreateInstruction, ViewCompileInstruction, TargetInstruction, BehaviorInstruction, ResourceLoadContext } from './instructions';
export {
  ConventionalViewStrategy,
  IStaticViewConfig,
  InlineViewStrategy,
  NoViewStrategy,
  RelativeViewStrategy,
  StaticViewStrategy,
  TemplateRegistryViewStrategy,
  ViewStrategy,
  ViewStrategyDecorator,
  ViewStrategyDependencyConfig,
  viewStrategy
} from './view-strategy';
export { ViewLocator } from './view-locator';
export { BindingLanguage, LetBinding, LetExpression } from './binding-language';
export * from './view-engine-hooks-resource';
export * from './interfaces';
export { BindableProperty } from './bindable-property';
export { BehaviorPropertyObserver } from './behavior-property-observer';
export { CompositionContext, CompositionEngine } from './composition-engine';
export { Animator } from './animator';
export { animationEvent } from './animation-event';
export { CompositionTransaction, CompositionTransactionNotifier, CompositionTransactionOwnershipToken } from './composition-transaction';
export { ResourceModule, ResourceDescription, ModuleAnalyzer } from './module-analyzer';
export {
  PassThroughSlot,
  ShadowDOM,
  ShadowSlot,
  SlotCustomAttribute
} from './shadow-dom';
export {
  IBindablePropertyConfig,
  IStaticResourceConfig,
  ViewEngineHooks,
  ViewResources,
  validateBehaviorName
} from './view-resources';
export { View, ViewNode } from './view';
export { ViewSlot } from './view-slot';
export { BoundViewFactory, ViewFactory } from './view-factory';
export { ViewCompiler } from './view-compiler';
export { ViewEngine } from './view-engine';
export { SwapStrategies } from './swap-strategies';

export { Controller } from './controller';
export { HtmlBehaviorResource } from './html-behavior';
export { child, children } from './child-observation';

export { ElementConfigResource } from './element-config';
export {
  behavior,
  bindable,
  containerless,
  customAttribute,
  customElement,
  dynamicOptions,
  elementConfig,
  inlineView,
  noView,
  processAttributes,
  processContent,
  resource,
  templateController,
  useShadowDOM,
  useView,
  useViewStrategy,
  view,
  viewResources
} from './decorators';

export { TemplatingEngine } from './templating-engine';

export {
  _hyphenate,
  _isAllWhitespace
} from './util';
