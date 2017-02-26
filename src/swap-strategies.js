function remove(viewSlot, previous) {
  return Array.isArray(previous)
    ? viewSlot.removeMany(previous, true)
    : viewSlot.remove(previous, true);
}

export const SwapStrategies = {
  // animate the next view in before removing the current view;
  before(viewSlot, previous, callback) {
    return (previous === undefined)
      ? callback()
      : callback().then(() => remove(viewSlot, previous));
  },

  // animate the next view at the same time the current view is removed
  with(viewSlot, previous, callback) {
    return (previous === undefined)
      ? callback()
      : Promise.all([remove(viewSlot, previous), callback()]);
  },

  // animate the next view in after the current view has been removed
  after(viewSlot, previous, callback) {
    return Promise.resolve(viewSlot.removeAll(true)).then(callback);
  }
};
