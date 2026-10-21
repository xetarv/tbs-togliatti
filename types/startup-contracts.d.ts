/** Consumed operations of the separately shipped, exact r149 Safe adaptation. */
interface SessionListen {
  <K extends keyof WindowEventMap>(
    target: Window,
    type: K,
    callback: (event: WindowEventMap[K]) => void,
    options?: boolean | AddEventListenerOptions,
  ): void;
  <K extends keyof DocumentEventMap>(
    target: Document,
    type: K,
    callback: (event: DocumentEventMap[K]) => void,
    options?: boolean | AddEventListenerOptions,
  ): void;
  <K extends keyof HTMLElementEventMap>(
    target: HTMLElement,
    type: K,
    callback: (event: HTMLElementEventMap[K]) => void,
    options?: boolean | AddEventListenerOptions,
  ): void;
  (
    target: EventTarget,
    type: string,
    callback: EventListenerOrEventListenerObject,
    options?: boolean | AddEventListenerOptions,
  ): void;
}
interface SessionListenerScope {
  listen: SessionListen;
  close: () => void;
  snapshot: () => { registered: number; closed: boolean; active: number };
}
interface StartupRenderPass {
  name: 'main-linear' | 'reflection-cube-linear' | 'water-reflection-linear' | 'post-output';
  scene: ThreeSceneHandle;
  camera: ThreeRenderCameraHandle;
  target: ThreePipelineRenderTarget | null;
  toneMapping: number;
}
interface StartupDrainOutcome {
  kind: 'ready' | 'context-lost' | 'error';
  generation?: number;
  error?: unknown;
}
interface StartupCleanupResult {
  done: boolean;
  invalidated?: boolean;
  blocked?: boolean;
  error?: string;
}
interface ThreeRendererHandle {
  getContext: () => WebGLRenderingContext | WebGL2RenderingContext;
  dispose: () => void;
  compileAsyncPasses: (
    passes: StartupRenderPass[],
    options: { signal: AbortSignal },
  ) => Promise<unknown>;
  __startupDrain?: { promise: Promise<StartupDrainOutcome> | null };
  __startupPasses?: () => StartupRenderPass[];
  __startupDispose?: () => void;
  __startupClose?: () => void | Promise<StartupCleanupResult | undefined>;
  __startupCleanup?: Promise<StartupCleanupResult | undefined>;
  __cleanupResult?: StartupCleanupResult;
  __sessionListeners?: SessionListenerScope['snapshot'];
  __pmremSources?: () => {
    fastback: ThreePipelineRenderTarget;
    quarter: ThreePipelineRenderTarget | null;
  };
  __startupInvalidateContext: () => void;
  __startupClaimTeardown: (
    outcome: StartupDrainOutcome,
  ) => 'context-lost' | 'live' | 'already-closed';
  __discardLostGeneration: () => void;
}
interface ThreeCubeCameraHandle {
  readonly children: ThreeCameraHandle[];
}
interface ThreeTextureHandle {
  readonly isRenderTargetTexture: boolean;
}
interface ThreeMaterialHandle {
  uniforms?: Record<string, { value: unknown }>;
  onBeforeRender: (
    this: ThreeMaterialHandle,
    renderer: ThreeRendererHandle,
    scene: ThreeSceneHandle,
    camera: ThreeRenderCameraHandle,
    geometry: ThreeGeometryHandle,
    object: ThreeObjectHandle,
    group: ThreeGeometryGroup | null,
  ) => void;
}
interface ThreeObjectHandle {
  readonly isInstancedMesh?: boolean;
  shadow?: { dispose: () => void };
}
interface ThreeNonMeshChild {
  geometry?: ThreeGeometryHandle;
  material?: ThreeMaterialHandle | ThreeMaterialHandle[];
}
interface ThreeDirectionalShadowHandle {
  dispose: () => void;
}
interface InstancedMeshHandle {
  dispose: () => void;
}
interface PresentationWorldResources {
  startupEnvironmentTarget: ThreePipelineRenderTarget;
}
interface TbsRegistry {
  createSessionListeners: () => SessionListenerScope;
  installStartupEnvironmentCleanup: (
    world: BootstrapWorld,
    runtime: Readonly<GameRuntime>,
  ) => () => void;
}
