'use strict';
window.TBS.createSessionListeners = function () {
    const controller = new AbortController();
    let registered = 0, closed = false;
    // The overloads retain native target/event inference and the original callback identity.
    const listen = (target, type, callback, options) => {
        if (closed)
            throw new Error('Cannot subscribe a closed game session');
        const settings = typeof options === 'boolean' ? { capture: options } : { ...options };
        if (settings.signal)
            throw new Error('Session subscription already has another signal');
        // EventTarget erases the target/event map validated by SessionListen's overloads.
        target.addEventListener(type, callback, {
            ...settings,
            signal: controller.signal,
        });
        registered++;
    };
    return Object.freeze({
        listen,
        close() {
            if (closed)
                return;
            closed = true;
            controller.abort();
        },
        snapshot() {
            return { registered, closed, active: closed ? 0 : registered };
        },
    });
};
