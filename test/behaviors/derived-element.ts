import { bindable } from '../../src/decorators';
import { SimpleElement } from './simple-element';

export class DerivedElement extends SimpleElement {  
}

export class MoreDerivedCustomElement extends DerivedElement {
  @bindable frob;

  frobChanged() {}
}

export class OverrideCustomElement extends SimpleElement {
  @bindable({ changeHandler: 'handleFoo' }) foo;
}
