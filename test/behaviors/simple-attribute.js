import {customAttribute} from '../../src/index';

@customAttribute('simple-attribute')
export class SimpleAttribute {
  valueChanged(newValue, oldValue){ }
}
