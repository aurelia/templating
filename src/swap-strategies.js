export const SwapStrategies = {
  // animate the next view in before removing the current view;
  before(viewSlot, previousViews, callback) {
    if (previousViews !== undefined) {
      return callback().then(() => viewSlot.removeMany(previousViews, true));
    }

    return callback();
  },

  // animate the next view at the same time the current view is removed
  with(viewSlot, previousViews, callback) {
    if (previousViews !== undefined) {
      return Promise.all([viewSlot.removeMany(previousViews, true), callback()]);
    }

    return callback();
  },

  // animate the next view in after the current view has been removed
  after(viewSlot, previousView, callback) {
    return Promise.resolve(viewSlot.removeAll(true)).then(callback);
  }
};
