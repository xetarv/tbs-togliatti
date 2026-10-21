// Consumed members of bundled Three.js r149; no runtime replacements.
interface ThreeColorHandle {
  copy: (color: ThreeColorHandle) => this;
  lerp: (color: ThreeColorHandle, alpha: number) => this;
}
interface ThreeMaterialHandle {
  envMapIntensity?: number;
}
interface ThreeFogHandle {
  color: ThreeColorHandle;
  density: number;
}
interface ThreeSceneHandle {
  background: ThreeColorHandle | null;
  fog: ThreeFogHandle | null;
  environment: ThreeTextureHandle | null;
  traverse: (callback: (object: ThreeFastbackChild) => void) => void;
}
interface ThreeHemisphereLightHandle extends ThreePositionedObjectHandle {
  intensity: number;
}
interface ThreeDirectionalLightHandle extends ThreePositionedObjectHandle {
  intensity: number;
  color: ThreeColorHandle;
  castShadow: boolean;
  target: ThreePositionedObjectHandle & { updateMatrixWorld: () => void };
  shadow: ThreeDirectionalShadowHandle;
}
interface ThreeCameraHandle {
  aspect: number;
  updateProjectionMatrix: () => void;
}
interface ThreeRendererHandle {
  setPixelRatio: (ratio: number) => void;
  setSize: (width: number, height: number, updateStyle?: boolean) => void;
  outputEncoding: number;
  physicallyCorrectLights: boolean;
  toneMapping: number;
  toneMappingExposure: number;
  shadowMap: { enabled: boolean; type: number; dispose?: () => void };
}
interface ThreeShaderMaterialHandle extends ThreeMaterialHandle {
  uniforms: Record<string, { value: unknown }>;
}
interface ThreeShaderMaterialParameters {
  side?: number;
  depthWrite?: boolean;
  depthTest?: boolean;
  fog?: boolean;
  toneMapped?: boolean;
  uniforms: Record<string, { value: unknown }>;
  vertexShader: string;
  fragmentShader: string;
}
interface ThreeLibraryHandle {
  readonly BackSide: 1;
  WebGLRenderer: new (parameters: {
    canvas: HTMLCanvasElement;
    antialias: boolean;
    powerPreference: WebGLPowerPreference;
  }) => ThreeRendererHandle;
  Scene: new () => ThreeSceneHandle;
  FogExp2: new (color: number, density: number) => ThreeFogHandle;
  PerspectiveCamera: new (
    fov?: number,
    aspect?: number,
    near?: number,
    far?: number,
  ) => ThreeCameraHandle;
  HemisphereLight: new (
    sky: number,
    ground: number,
    intensity: number,
  ) => ThreeHemisphereLightHandle;
  DirectionalLight: new (color: number, intensity: number) => ThreeDirectionalLightHandle;
  ShaderMaterial: new <U extends Record<string, { value: unknown }>>(
    parameters: ThreeShaderMaterialParameters & { uniforms: U },
  ) => ThreeShaderMaterialHandle & { uniforms: U };
  PMREMGenerator: new (renderer: ThreeRendererHandle) => {
    fromScene: (
      scene: ThreeSceneHandle,
      sigma: number,
      near: number,
      far: number,
    ) => ThreePipelineRenderTarget;
    dispose: () => void;
  };
  readonly ACESFilmicToneMapping: 4;
  readonly PCFSoftShadowMap: 2;
}
interface ThreeSpotLightHandle {
  intensity: number;
}

interface ThreeSpriteMaterialHandle {
  opacity: number;
}
interface ThreeSceneUserData {
  waterMaterial?: ThreeStandardMaterialHandle;
}
