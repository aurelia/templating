import { ElementEvents } from '../src/element-events';

describe('ElementEvents', () => {
  /**@type {HTMLInputElement} */
  let input;
  /**@type {ElementEvents} */
  let elementEvents;

  beforeEach(() => {
    input = document.createElement('input');
    elementEvents = new ElementEvents(input);
  })


  it('should subscribe', () => {
    let value;
    let callCount = 0;
    const eventHandler = elementEvents.subscribe('input', () => {
      callCount++;
      value = input.value;
    });

    const newValue = 1234;
    input.value = newValue;
    input.dispatchEvent(new CustomEvent('input'));

    expect(value === newValue.toString()).toBe(true);
    expect(callCount).toBe(1);

    eventHandler.dispose();

    input.dispatchEvent(new CustomEvent('input'));
    expect(callCount).toBe(1);
  });

  it('should subscribe once', () => {
    let value;
    let callCount = 0;
    const eventHandler = elementEvents.subscribeOnce('input', () => {
      callCount++;
      value = input.value;
    });

    const newValue = 1234;
    input.value = newValue;
    input.dispatchEvent(new CustomEvent('input'));

    expect(value === newValue.toString()).toBe(true);
    expect(callCount).toBe(1);

    input.dispatchEvent(new CustomEvent('input'));
    expect(callCount).toBe(1);
  });

  it("should subscribe and take ElementEvent default listener options into account", () => {
    let isCapture;

    // we need to track event on a parent of the input, let's take body
    const bodyElementEvents = new ElementEvents(document.body);
    ElementEvents.defaultListenerOptions = { capture: false };
    let eventHandler = bodyElementEvents.subscribe('input', event => {
      isCapture = event.eventPhase === Event.CAPTURING_PHASE;
    });

    // input has to be attached for the event to bubble up
    document.body.appendChild(input);
    input.dispatchEvent(new CustomEvent('input', {bubbles: true}));
    expect(isCapture).toBe(false);
    eventHandler.dispose();

    
    // set capture back to true and check if it's being used
    ElementEvents.defaultListenerOptions = { capture: true };
    eventHandler = bodyElementEvents.subscribe('input', event => {
      isCapture = event.eventPhase === Event.CAPTURING_PHASE;
    });

    input.dispatchEvent(new CustomEvent('input', {bubbles: true}));
    expect(isCapture).toBe(true);
    eventHandler.dispose();
  });

  it("should subscribe and ignore ElementEvent default listener options when argument captureOrOptions is passed", () => {
    let isCapture;

    const bodyElementEvents = new ElementEvents(document.body);
    ElementEvents.defaultListenerOptions = { capture: false };
    bodyElementEvents.subscribe('input', event => {
      isCapture = event.eventPhase === Event.CAPTURING_PHASE;
    }, true);

    document.body.appendChild(input);
    input.dispatchEvent(new CustomEvent('input', {bubbles: true}));
    expect(isCapture).toBe(true);
  });

  it('should dispose single event', () => {
    let value;
    let callCount = 0;
    const eventHandler = elementEvents.subscribe('input', () => {
      callCount++;
      value = input.value;
    });

    const newValue = 1234;
    input.value = newValue;
    input.dispatchEvent(new CustomEvent('input'));

    expect(value === newValue.toString()).toBe(true);
    expect(callCount).toBe(1);

    elementEvents.dispose('input');

    input.dispatchEvent(new CustomEvent('input'));
    expect(callCount).toBe(1);
  });

  it('should dispose all events', () => {
    let value;
    let callCount = 0;
    const eventHandler = elementEvents.subscribe('input', () => {
      callCount++;
      value = input.value;
    });

    const newValue = 1234;
    input.value = newValue;
    input.dispatchEvent(new CustomEvent('input'));

    expect(value === newValue.toString()).toBe(true);
    expect(callCount).toBe(1);

    elementEvents.disposeAll();

    input.dispatchEvent(new CustomEvent('input'));
    expect(callCount).toBe(1);
  });
});

