import {customAttribute} from '../../src/decorators';

@customAttribute('simple-attribute')
export class SimpleAttribute {
  valueChanged(newValue, oldValue){ }
}
