'use strict';

globalThis.TBS.domain.math = Object.freeze<GameMath>({
  clamp: (value: number, min: number, max: number): number => Math.max(min, Math.min(max, value)),
  distance: (a: PointXZ, b: PointXZ): number => Math.hypot(a.x - b.x, a.z - b.z),
});
