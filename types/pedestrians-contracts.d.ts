interface PedestrianLimb {
  leg: ThreeGroupHandle;
  arm: ThreeGroupHandle;
  /** The two sides constructed by the existing [-1, 1] loop. */
  side: number;
}

interface PedestrianData {
  body: ThreeGroupHandle;
  limbs: PedestrianLimb[];
}

/** Assigned before createPedestrian returns; references point into the same scene graph. */
interface PedestrianRoot extends ThreeGroupHandle {
  userData: Record<string, unknown> & PedestrianData;
}

interface PedestrianState {
  mesh: PedestrianRoot;
  route: PointXZ[];
  target: number;
  speed: number;
  wait: number;
  arrivals: number;
  phase: number;
  seed: number;
}
