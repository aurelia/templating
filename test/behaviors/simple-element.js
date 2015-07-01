import {bindable} from '../../src/decorators';

export class SimpleElement {
  @bindable foo = 'foo';
  @bindable bar = 'bar';

  fooChanged(newValue, oldValue){ }
  barChanged(newValue, oldValue){ }
}
