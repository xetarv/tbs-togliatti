'use strict';

/** @typedef {{x: number, z: number}} PointXZ */
/**
 * @typedef {object} GameMath
 * @property {(value: number, min: number, max: number) => number} clamp
 * @property {(a: PointXZ, b: PointXZ) => number} distance
 */
/** @type {Readonly<GameMath>} */
globalThis.TBS.domain.math = Object.freeze({
  clamp: (value, min, max) => Math.max(min, Math.min(max, value)),
  distance: (a, b) => Math.hypot(a.x - b.x, a.z - b.z),
});
