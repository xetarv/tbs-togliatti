// Actual r149 operations consumed by the tyre-track transform and instanced buffer.
interface ThreeSkidEuler {
  x: number;
  y: number;
  z: number;
  set: (x: number, y: number, z: number) => this;
}
interface ThreeSkidTransform extends ThreePositionedObjectHandle {
  readonly rotation: ThreeSkidEuler;
  readonly scale: ThreeMarkerScale;
  readonly matrix: ThreeMatrix4Handle;
  updateMatrix: () => void;
}
interface ThreeInstanceMatrixHandle {
  readonly isInstancedBufferAttribute: true;
  set needsUpdate(value: boolean);
  setUsage: (usage: number) => this;
}
