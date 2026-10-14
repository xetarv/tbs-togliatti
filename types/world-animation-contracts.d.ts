// Actual r149 operations and world resources consumed by createWorldAnimation.
interface CameraVector3 {
  distanceTo: (vector: DisplacementXYZ) => number;
}

interface ThreeTextureHandle {
  readonly offset: { x: number; y: number };
}

interface ThreeSceneHandle {
  userData: ThreeSceneUserData;
}

interface ThreeSpriteHandle {
  visible: boolean;
}

interface WorldFlagPositionAttribute extends ThreeBufferAttributeHandle {
  readonly count: number;
  getX: (index: number) => number;
  setZ: (index: number, z: number) => this;
  set needsUpdate(value: boolean);
}

/** PlaneGeometry creates the position attribute before addFlag publishes the Mesh. */
interface WorldFlagGeometry extends ThreeGeometryHandle {
  readonly attributes: { position: WorldFlagPositionAttribute };
  computeVertexNormals: () => void;
}

interface WorldFlagMesh extends ThreeMeshHandle, ThreePositionedObjectHandle {
  readonly geometry: WorldFlagGeometry;
}

/** terrain.onBeforeCompile installs waveTime before publishing this shader reference. */
interface WorldWaterShader extends ThreeCompiledShader {
  uniforms: Record<string, { value: unknown }> & { waveTime: { value: number } };
}

interface WorldWaterMaterial extends ThreeMaterialHandle {
  userData: Record<string, unknown> & { shader?: WorldWaterShader };
}
