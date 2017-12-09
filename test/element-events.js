import './setup';
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

  it('should dispose', () => {
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

