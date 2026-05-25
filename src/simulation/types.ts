export interface Vec2 {
  x: number
  y: number
}

export interface BBox {
  cx: number
  cy: number
  w: number
  h: number
}

export interface GroundTruthTarget {
  truthId: number
  bbox: BBox
  velocity: Vec2
  alive: boolean
  bornAt: number
}

export interface Detection {
  detectionId: number
  bbox: BBox
  isFalsePositive: boolean
  truthId: number | null
}

export interface Tracklet {
  trackId: number
  bbox: BBox
  history: Vec2[]
  age: number
  missCount: number
  lastSeenFrame: number
  color: string
}

export type AssociationAlgorithm = 'km' | 'greedy'
export type AssociationMetric = 'iou' | 'distance'

export interface SimulationConfig {
  width: number
  height: number
  targetCount: number
  positionNoise: number
  missProbability: number
  falsePositiveRate: number
  birthProbability: number
  deathProbability: number
  algorithm: AssociationAlgorithm
  metric: AssociationMetric
  iouThreshold: number
  distanceThreshold: number
  maxMissBeforeKill: number
  seed: number
}

export interface FrameSnapshot {
  frame: number
  groundTruth: GroundTruthTarget[]
  detections: Detection[]
  tracklets: Tracklet[]
  matches: Array<{ trackIdx: number; detectionIdx: number; cost: number }>
  unmatchedTracks: number[]
  unmatchedDetections: number[]
  costMatrix: number[][]
  preMatchTrackIds: number[]
  preMatchDetectionIds: number[]
  metrics: {
    idSwitches: number
    activeTracks: number
    activeTruth: number
  }
}

export const DEFAULT_CONFIG: SimulationConfig = {
  width: 720,
  height: 480,
  targetCount: 6,
  positionNoise: 6,
  missProbability: 0.08,
  falsePositiveRate: 0.5,
  birthProbability: 0.02,
  deathProbability: 0.005,
  algorithm: 'km',
  metric: 'iou',
  iouThreshold: 0.2,
  distanceThreshold: 80,
  maxMissBeforeKill: 8,
  seed: 0xa1b2c3,
}
