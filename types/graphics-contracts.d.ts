// Native r149 operations exercised by the existing render/reflection pipeline.
interface ThreeQuaternionHandle {
  setFromUnitVectors: (from: CameraVector3, to: CameraVector3) => void;
  copy: (quaternion: ThreeQuaternionHandle) => this;
}
interface ThreeObjectHandle {
  clone: (recursive?: boolean) => this;
  visible: boolean;
  readonly quaternion: ThreeQuaternionHandle;
}
interface ThreeNonMeshChild {
  readonly isDirectionalLight?: boolean;
  castShadow?: boolean;
  shadow?: ThreeDirectionalShadowHandle;
}
interface ThreeMeshHandle {
  readonly isDirectionalLight?: false;
}
interface ThreeDirectionalShadowHandle {
  mapSize: ThreeTextureRepeatHandle;
  normalBias: number;
  bias: number;
  camera: { left: number; right: number; top: number; bottom: number; near: number; far: number };
  map: ThreePipelineRenderTarget | null;
  needsUpdate: boolean;
}
interface ThreeCameraHandle {
  readonly projectionMatrixInverse: ThreeMatrix4Handle;
  readonly up: CameraVector3;
  copy: (camera: ThreeCameraHandle, recursive?: boolean) => this;
  getWorldDirection: (target: CameraVector3) => CameraVector3;
  updateMatrixWorld: (force?: boolean) => void;
  lookAt: {
    (x: number, y: number, z: number): void;
    (vector: DisplacementXYZ): void;
  };
}
interface ThreePipelineRenderTarget extends ThreeRenderTargetHandle {
  texture: ThreeTextureHandle;
  depthTexture: ThreeTextureHandle | null;
  setSize: (width: number, height: number) => void;
  dispose: () => void;
}
interface ThreeRenderTargetParameters {
  minFilter?: number;
  magFilter?: number;
  generateMipmaps?: boolean;
}
interface ThreeRendererHandle {
  info: { autoReset: boolean; reset: () => void };
  extensions: { has: (name: string) => boolean };
  getDrawingBufferSize: (target: ThreeTextureRepeatHandle) => ThreeTextureRepeatHandle;
  setRenderTarget: (target: ThreePipelineRenderTarget | null) => void;
  render: (scene: ThreeSceneHandle, camera: ThreeRenderCameraHandle) => void;
}
interface ThreeTextureHandle {
  needsPMREMUpdate: boolean;
}
interface ThreeStandardMaterialHandle {
  envMap: ThreeTextureHandle | null;
}
interface ThreeShaderMaterialParameters {
  extensions?: { derivatives?: boolean };
}
interface WorldWaterShader {
  uniforms: Record<string, { value: unknown }> & {
    waveTime: { value: number };
    reflectionStrength?: { value: number };
  };
}
interface WorldWaterMaterial extends ThreeStandardMaterialHandle {}
interface ThreeCubeCameraHandle extends ThreePositionedObjectHandle {
  update: (renderer: ThreeRendererHandle, scene: ThreeSceneHandle) => void;
}
interface ThreeLibraryHandle {
  WebGLRenderTarget: new (
    width: number,
    height: number,
    options?: ThreeRenderTargetParameters,
  ) => ThreePipelineRenderTarget;
  WebGLCubeRenderTarget: new (
    size: number,
    options?: ThreeRenderTargetParameters,
  ) => ThreePipelineRenderTarget;
  DepthTexture: new (width: number, height: number, type?: number) => ThreeTextureHandle;
  OrthographicCamera: new (
    left: number,
    right: number,
    top: number,
    bottom: number,
    near: number,
    far: number,
  ) => ThreeRenderCameraHandle;
  CubeCamera: new (
    near: number,
    far: number,
    target: ThreePipelineRenderTarget,
  ) => ThreeCubeCameraHandle;
  readonly LinearFilter: 1006;
  readonly LinearMipmapLinearFilter: 1008;
  readonly UnsignedIntType: 1014;
  readonly NoToneMapping: 0;
}
