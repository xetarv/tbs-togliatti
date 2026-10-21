'use strict';

window.TBS.createSessionListeners = function (): SessionListenerScope {
  const controller = new AbortController();
  let registered = 0,
    closed = false;
  // The overloads retain native target/event inference and the original callback identity.
  const listen: SessionListen = (
    target: EventTarget,
    type: string,
    callback: ((event: never) => void) | EventListenerObject,
    options?: boolean | AddEventListenerOptions,
  ) => {
    if (closed) throw new Error('Cannot subscribe a closed game session');
    const settings = typeof options === 'boolean' ? { capture: options } : { ...options };
    if (settings.signal) throw new Error('Session subscription already has another signal');
    // EventTarget erases the target/event map validated by SessionListen's overloads.
    target.addEventListener(type, callback as EventListenerOrEventListenerObject, {
      ...settings,
      signal: controller.signal,
    });
    registered++;
  };
  return Object.freeze({
    listen,
    close() {
      if (closed) return;
      closed = true;
      controller.abort();
    },
    snapshot() {
      return { registered, closed, active: closed ? 0 : registered };
    },
  });
};
