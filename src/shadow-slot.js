export class SlotCustomAttribute {
  valueChanged(newValue, oldValue) {
    console.log('au-slot', newValue, oldValue);
  }
}

export class ShadowSlot {
  constructor(anchor, name) {
    this.anchor = anchor;
    this.name = name;
    this.isDefault = !name;
  }
}
