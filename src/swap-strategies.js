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

export const SwapStrategiesStateful = {
  // animate the next viewports in before hiding the current viewports;
  before(viewPort, previous, callback) {
    return viewPort.hide(false).then(() => callback()).then(() => Promise.all(previous.map((prevViewPort) => {
      if (!prevViewPort.stateful) {
        return prevViewPort.viewSlot.removeAll(true);
      }
      else {
        return prevViewPort.hide(true);
      }
    })));
  },

  // animate the next viewport at the same time the current viewports are removed
  with(viewPort, previous, callback) {
    return Promise.all(previous.map((prevViewPort) => {
      if (!prevViewPort.stateful) {
        return prevViewPort.viewSlot.removeAll(true);
      }
      else {
        return prevViewPort.hide(true);
      }
    }), viewPort.hide(false).then(() => callback()));
  },

  // animate the next viewport in after the current viewports have been removed
  after(viewPort, previous, callback) {
    return Promise.all(previous.map((prevViewPort) => {
      if (!prevViewPort.stateful) {
        return prevViewPort.viewSlot.removeAll(true);
      }
      else {
        return prevViewPort.hide(true);
      }
    })).then(() => viewPort.hide(false).then(() => callback()));
  }
};
