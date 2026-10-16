'use strict';
window.TBS.createRuntime = function ({ game, scheduler, clock, isHidden, }) {
    let previous = clock.now();
    let frameId = 0;
    let running = false;
    function reset() {
        previous = clock.now();
    }
    function frame(now) {
        if (!running)
            return;
        const dt = Math.max(0, Math.min((now - previous) / 1000 || 0, 0.05));
        previous = now;
        try {
            if (!isHidden())
                game.step(dt);
            frameId = scheduler.request(frame);
        }
        catch (error) {
            running = false;
            frameId = 0;
            throw error;
        }
    }
    function start() {
        if (running)
            return;
        running = true;
        try {
            reset();
            game.initialize();
            frameId = scheduler.request(frame);
        }
        catch (error) {
            running = false;
            frameId = 0;
            throw error;
        }
    }
    function stop() {
        running = false;
        scheduler.cancel(frameId);
    }
    return Object.freeze({ start, stop, reset });
};
