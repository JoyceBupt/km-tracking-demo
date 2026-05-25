import { DEFAULT_CONFIG, type GroundTruthTarget, type SimulationConfig } from './types'

export interface Scenario {
  id: string
  name: string
  description: string
  config: SimulationConfig
  buildTargets?: () => GroundTruthTarget[]
}

function makeTarget(
  truthId: number,
  cx: number,
  cy: number,
  size: number,
  vx: number,
  vy: number,
): GroundTruthTarget {
  return {
    truthId,
    bbox: { cx, cy, w: size, h: size },
    velocity: { x: vx, y: vy },
    alive: true,
    bornAt: 0,
  }
}

export const SCENARIOS: Scenario[] = [
  {
    id: 'random',
    name: '随机游走',
    description: '默认场景，按概率生成与消失',
    config: { ...DEFAULT_CONFIG },
  },
  {
    id: 'crossing',
    name: '对穿交叉',
    description: '4 个目标两两相向运动，在画面中央交叉',
    config: {
      ...DEFAULT_CONFIG,
      targetCount: 4,
      positionNoise: 3,
      missProbability: 0,
      falsePositiveRate: 0,
      birthProbability: 0,
      deathProbability: 0,
      iouThreshold: 0.15,
      seed: 0x10cc01,
    },
    buildTargets: () => {
      const w = DEFAULT_CONFIG.width
      const h = DEFAULT_CONFIG.height
      const size = 44
      const cy = h / 2
      return [
        makeTarget(0, 70, cy - 70, size, 1.8, 0),
        makeTarget(1, w - 70, cy - 70, size, -1.8, 0),
        makeTarget(2, 70, cy + 70, size, 1.6, 0.2),
        makeTarget(3, w - 70, cy + 70, size, -1.6, -0.2),
      ]
    },
  },
  {
    id: 'crowd',
    name: '密集拥挤',
    description: '10 个目标在中央小区域内反复穿越',
    config: {
      ...DEFAULT_CONFIG,
      targetCount: 10,
      positionNoise: 5,
      missProbability: 0.05,
      falsePositiveRate: 0.2,
      birthProbability: 0,
      deathProbability: 0,
      iouThreshold: 0.2,
      seed: 0xc0010,
    },
    buildTargets: () => {
      const cx = DEFAULT_CONFIG.width / 2
      const cy = DEFAULT_CONFIG.height / 2
      const targets: GroundTruthTarget[] = []
      for (let k = 0; k < 10; k++) {
        const angle = (k / 10) * Math.PI * 2
        const r = 90
        targets.push(
          makeTarget(
            k,
            cx + Math.cos(angle) * r,
            cy + Math.sin(angle) * r,
            32,
            -Math.cos(angle) * 1.2,
            -Math.sin(angle) * 1.2,
          ),
        )
      }
      return targets
    },
  },
  {
    id: 'noisy',
    name: '强噪声 / 高误检',
    description: '位置抖动大、漏检 25%、误检密集',
    config: {
      ...DEFAULT_CONFIG,
      targetCount: 6,
      positionNoise: 18,
      missProbability: 0.25,
      falsePositiveRate: 2,
      birthProbability: 0.005,
      deathProbability: 0.002,
      iouThreshold: 0.15,
      seed: 0xa0153,
    },
  },
]

export const DEFAULT_SCENARIO_ID = 'random'
