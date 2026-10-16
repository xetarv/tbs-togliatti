// Real factory boundaries and implementations are checked together after R3.
interface ThreeObjectHandle {
  removeFromParent: () => this;
}
interface ThreeFastbackInstancedMesh {
  dispose: () => void;
}
interface ThreeColorHandle {
  readonly isColor: true;
  setHex: (hex: number) => this;
  setScalar: (scalar: number) => this;
}
interface ThreePhysicalMaterialParameters extends ThreeBasicMaterialParameters {
  metalness?: number;
  roughness?: number;
  clearcoat?: number;
  clearcoatRoughness?: number;
  envMapIntensity?: number;
}
interface TrafficCarCommonData {
  wheels: FastbackWheel[];
  brakeMaterial: ThreeBasicMaterialHandle;
  reverseMaterial: ThreeBasicMaterialHandle;
  body: ThreeGroupHandle;
  paint: ThreePhysicalMaterialHandle;
  wheelRadius: number;
  detailedBody: true;
}
/** No complete userData is claimed before the existing helper mutations/assignments. */
interface TrafficCarAssemblyGroup extends ThreeGroupHandle {
  userData: Record<string, unknown> &
    Partial<TrafficCarCommonData> & {
      variant?: TrafficVariant;
      steeringWheel?: ThreeMarkerMeshHandle<ThreeMaterialHandle>;
    };
}
interface TrafficPassengerCar extends ThreeGroupHandle {
  userData: Record<string, unknown> &
    TrafficCarCommonData & {
      variant: 'sedan' | 'compact';
      steeringWheel: ThreeMarkerMeshHandle<ThreeMaterialHandle>;
    };
}
interface TrafficCommercialCar extends ThreeGroupHandle {
  userData: Record<string, unknown> &
    TrafficCarCommonData & {
      variant: 'van' | 'shuttle';
      steeringWheel?: never;
    };
}
type TrafficCar = TrafficPassengerCar | TrafficCommercialCar;
/** Static adapter-only selection; domain variants contain no rendering dependencies. */
interface TrafficModelDefinition {
  buildBody: (group: TrafficCarAssemblyGroup, paint: ThreePhysicalMaterialHandle) => void;
  passenger: boolean;
  scale: number;
  proportions?: { z: number; y: number };
}
interface TrafficCarGeometry {
  coachwork: (
    parent: ThreeObjectHandle,
    width: number,
    length: number,
    height: number,
    y: number,
    material: ThreeMaterialHandle,
  ) => ThreeMarkerMeshHandle<ThreeMaterialHandle>;
  glazedQuad: (
    parent: ThreeObjectHandle,
    points: readonly (readonly [number, number, number])[],
    material: ThreeMaterialHandle,
  ) => ThreeMarkerMeshHandle<ThreeMaterialHandle>;
}
type PassengerBuilderOptions = Pick<
  CarModelsOptions,
  | 'T'
  | 'box'
  | 'dark'
  | 'mat'
  | 'cyanMat'
  | 'detailBar'
  | 'orangeMat'
  | 'whiteMat'
  | 'markTexture'
  | 'makeTexture'
> &
  TrafficCarGeometry;
type CommercialBuilderOptions = Pick<
  CarModelsOptions,
  | 'T'
  | 'mat'
  | 'box'
  | 'dark'
  | 'detailBar'
  | 'orangeMat'
  | 'trimMat'
  | 'markTexture'
  | 'signTexture'
> &
  TrafficCarGeometry;
interface TbsRegistry {
  createTrafficCarGeometry: (options: Pick<CarModelsOptions, 'T'>) => TrafficCarGeometry;
  createPassengerBodyBuilder: (options: PassengerBuilderOptions) => {
    createPassengerShell: (
      group: TrafficCarAssemblyGroup,
      paint: ThreePhysicalMaterialHandle,
      variant?: 'sedan' | 'compact',
    ) => void;
  };
  createCommercialBodyBuilder: (options: CommercialBuilderOptions) => {
    createCommercialBody: (
      group: TrafficCarAssemblyGroup,
      paint: ThreePhysicalMaterialHandle,
      variant: 'van' | 'shuttle',
    ) => void;
  };
  buildTrafficCarWheels: (
    options: Pick<CarModelsOptions, 'T' | 'tireMat' | 'trimMat' | 'box' | 'whiteMat'> & {
      group: TrafficCarAssemblyGroup;
      body: ThreePhysicalMaterialHandle;
    },
  ) => {
    wheels: FastbackWheel[];
  };
  buildTrafficCarLights: (
    options: Pick<CarModelsOptions, 'T' | 'box' | 'cyanMat' | 'orangeMat'> & {
      group: TrafficCarAssemblyGroup;
      passenger: boolean;
    },
  ) => Pick<TrafficCarCommonData, 'brakeMaterial' | 'reverseMaterial'>;
  buildTrafficCarShadow: (
    options: Pick<CarModelsOptions, 'T'> & {
      vehicleShadowTexture: ThreeTextureHandle;
      group: TrafficCarAssemblyGroup;
    },
  ) => { shadow: ThreeMarkerMeshHandle<ThreeBasicMaterialHandle> };
  buildTrafficCarSuspension: (
    options: Pick<CarModelsOptions, 'T' | 'unitBox'> & {
      group: TrafficCarAssemblyGroup;
      shadow: ThreeMarkerMeshHandle<ThreeBasicMaterialHandle>;
      wheels: FastbackWheel[];
    },
  ) => void;
}
