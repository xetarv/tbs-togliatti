"use strict";
// Technical fixture only; index.html does not load this script.
(() => {
    const clamp = globalThis.TBS.domain.math.clamp;
    if (clamp(2, 0, 1) !== 1)
        throw new Error('Classic TypeScript script cannot use TBS.');
})();
