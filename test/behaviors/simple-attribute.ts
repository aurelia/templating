import {customAttribute} from '../../src/decorators';

@customAttribute('simple-attribute')
export class SimpleAttribute {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  valueChanged(newValue, oldValue){ }
}
