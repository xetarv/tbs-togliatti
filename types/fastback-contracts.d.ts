// Consumed r149 members and actual outputs of the unchanged Fastback JS factories.
interface ThreeMatrix4Handle {
  readonly isMatrix4: true;
  readonly elements: number[];
}
interface ThreeFastbackMesh extends ThreeMarkerMeshHandle<
  ThreeMaterialHandle | ThreeMaterialHandle[]
> {
  geometry: ThreeGeometryHandle;
  readonly matrix: ThreeMatrix4Handle;
  updateMatrix: () => void;
  castShadow: boolean;
  receiveShadow: boolean;
}
interface ThreeNonMeshChild extends ThreeObjectHandle {
  readonly isMesh?: false;
}
type ThreeFastbackChild = ThreeNonMeshChild | ThreeFastbackMesh;
interface ThreeFastbackInstancedMesh extends ThreeFastbackMesh, InstancedMeshHandle {
  name: string;
  setMatrixAt: (index: number, matrix: ThreeMatrix4Handle) => void;
  setColorAt: (index: number, color: ThreeColorHandle) => void;
  count: number;
  frustumCulled: boolean;
  readonly instanceMatrix: ThreeInstanceMatrixHandle;
}
interface ThreeStandardMaterialHandle extends ThreeMaterialHandle {
  readonly isMeshStandardMaterial: true;
  readonly emissive: ThreeColorHandle;
  emissiveIntensity: number;
  clone: () => this;
  readonly color: ThreeColorHandle;
  bumpMap: ThreeTextureHandle | null;
  roughnessMap: ThreeTextureHandle | null;
  bumpScale: number;
  roughness: number;
  metalness: number;
}
interface ThreePhysicalMaterialHandle extends ThreeStandardMaterialHandle {
  readonly isMeshPhysicalMaterial: true;
}
interface ThreeSpotLightHandle extends ThreePositionedObjectHandle {
  readonly isSpotLight: true;
  readonly target: ThreePositionedObjectHandle;
}
interface FastbackMaterials {
  paint: ThreePhysicalMaterialHandle;
  roof: ThreePhysicalMaterialHandle;
  glass: ThreePhysicalMaterialHandle;
  rubber: ThreeStandardMaterialHandle;
  leather: ThreeStandardMaterialHandle;
  fabric: ThreeStandardMaterialHandle;
  alloy: ThreeStandardMaterialHandle;
  graphite: ThreeStandardMaterialHandle;
  rotorSteel: ThreeStandardMaterialHandle;
  orange: ThreeStandardMaterialHandle;
  led: ThreeBasicMaterialHandle;
  brake: ThreeBasicMaterialHandle;
  reverse: ThreeBasicMaterialHandle;
  stitch: ThreeStandardMaterialHandle;
  optics: ThreePhysicalMaterialHandle;
  materials: Pick<FastbackMaterials, 'paint' | 'roof' | 'glass'>;
}
interface FastbackBaseParts {
  car: ThreeGroupHandle;
  body: ThreeGroupHandle;
}
interface FastbackGeometry {
  boxGeometry: ThreeGeometryHandle;
  box: BoxHelper;
  rounded: (
    parent: ThreeObjectHandle,
    x: number,
    y: number,
    z: number,
    w: number,
    h: number,
    d: number,
    radius: number,
    material: ThreeMaterialHandle,
  ) => ThreeMarkerMeshHandle<ThreeMaterialHandle>;
  line: (
    parent: ThreeObjectHandle,
    points: readonly (readonly [number, number, number])[],
    radius: number,
    material: ThreeMaterialHandle,
  ) => ThreeMarkerMeshHandle<ThreeMaterialHandle>;
  lens: BoxHelper;
  skinX: (y: number, z: number) => number;
  bodyWidth: (z: number, column?: number) => number;
}
interface FastbackInterior {
  steering: ThreeGroupHandle;
}
interface FastbackWheel {
  steering: ThreeGroupHandle;
  rolling: ThreeGroupHandle;
  front: boolean;
}
interface FastbackWheels {
  wheels: FastbackWheel[];
}
interface FastbackLighting {
  headlights: ThreeSpotLightHandle[];
}
type FastbackMaterialParts = FastbackBaseParts & FastbackMaterials;
type FastbackGeometryParts = FastbackMaterialParts & FastbackGeometry;
type FastbackInteriorParts = FastbackGeometryParts & FastbackInterior;
type FastbackWheelParts = FastbackInteriorParts & FastbackWheels;
type FastbackCompleteParts = FastbackWheelParts & FastbackLighting;
interface FastbackCarUserData {
  paint: FastbackMaterials['paint'];
  body: ThreeGroupHandle;
  wheels: FastbackWheel[];
  wheelRadius: number;
  headlights: ThreeSpotLightHandle[];
  brakeMaterial: FastbackMaterials['brake'];
  reverseMaterial: FastbackMaterials['reverse'];
  steeringWheel: ThreeGroupHandle;
  variant: 'fastback';
  detailedBody: true;
}
interface FastbackCar extends ThreeGroupHandle {
  userData: Record<string, unknown> & FastbackCarUserData;
}
interface TbsRegistry {
  createFastbackMaterials: (options: Pick<FastbackOptions, 'T'>) => FastbackMaterials;
  createFastbackGeometry: (options: Pick<FastbackOptions, 'T' | 'meshData'>) => FastbackGeometry;
  buildFastbackExterior: (
    options: Pick<FastbackOptions, 'T' | 'meshData'> &
      Pick<
        FastbackGeometryParts,
        | 'materials'
        | 'body'
        | 'rounded'
        | 'paint'
        | 'rubber'
        | 'graphite'
        | 'box'
        | 'line'
        | 'orange'
        | 'skinX'
        | 'alloy'
        | 'roof'
        | 'led'
        | 'lens'
        | 'optics'
        | 'brake'
        | 'reverse'
        | 'bodyWidth'
      >,
  ) => void;
  buildFastbackInterior: (
    options: Pick<FastbackOptions, 'T' | 'makeTexture'> &
      Pick<
        FastbackGeometryParts,
        | 'rounded'
        | 'body'
        | 'leather'
        | 'fabric'
        | 'line'
        | 'alloy'
        | 'stitch'
        | 'box'
        | 'graphite'
        | 'rubber'
      >,
  ) => FastbackInterior;
  buildFastbackBranding: (
    options: Pick<FastbackOptions, 'T' | 'makeTexture' | 'logo'> &
      Pick<FastbackGeometryParts, 'skinX' | 'body' | 'rounded' | 'graphite'>,
  ) => void;
  buildFastbackWheels: (
    options: Pick<FastbackOptions, 'T'> &
      Pick<
        FastbackGeometryParts,
        'car' | 'rubber' | 'graphite' | 'rotorSteel' | 'rounded' | 'orange' | 'alloy' | 'lens'
      >,
  ) => FastbackWheels;
  buildFastbackLighting: (
    options: Pick<FastbackOptions, 'T' | 'shadowTexture'> & FastbackBaseParts,
  ) => FastbackLighting;
}
