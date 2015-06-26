import {bindable} from '../../src/index';

export class SimpleElement {
  @bindable foo = 'foo';
  @bindable bar = 'bar';

  fooChanged(newValue, oldValue){ }
  barChanged(newValue, oldValue){ }
}
