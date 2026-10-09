'use strict';

globalThis.TBS.domain.math = Object.freeze({
  clamp: (value, min, max) => Math.max(min, Math.min(max, value)),
  distance: (a, b) => Math.hypot(a.x - b.x, a.z - b.z),
});
