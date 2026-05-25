import { greedy, km } from '../algorithms'
import type { CostMatrix } from '../algorithms/types'
import { colorForTrackId } from './colors'
import { distance, iou } from './geometry'
import { createRng, type Rng } from './random'
import type {
  Detection,
  FrameSnapshot,
  GroundTruthTarget,
  SimulationConfig,
  Tracklet,
} from './types'

const TARGET_SIZE_MIN = 28
const TARGET_SIZE_MAX = 56
const SPEED_MIN = 0.6
const SPEED_MAX = 2.2

export class TrackingSimulation {
  config: SimulationConfig
  frame = 0
  private rng: Rng
  private targets: GroundTruthTarget[] = []
  private tracklets: Tracklet[] = []
  private nextTruthId = 0
  private nextTrackId = 0
  private idSwitches = 0
  private lastFrame: FrameSnapshot | null = null

  constructor(config: SimulationConfig) {
    this.config = config
    this.rng = createRng(config.seed)
    this.bootstrap()
  }

  reset(config?: SimulationConfig): void {
    if (config) this.config = config
    this.frame = 0
    this.rng = createRng(this.config.seed)
    this.targets = []
    this.tracklets = []
    this.nextTruthId = 0
    this.nextTrackId = 0
    this.idSwitches = 0
    this.lastFrame = null
    this.bootstrap()
  }

  updateConfig(patch: Partial<SimulationConfig>): void {
    const reseed = patch.seed !== undefined && patch.seed !== this.config.seed
    this.config = { ...this.config, ...patch }
    if (reseed) this.reset()
  }

  get snapshot(): FrameSnapshot | null {
    return this.lastFrame
  }

  step(): FrameSnapshot {
    this.frame += 1
    this.advanceTargets()
    const detections = this.runDetector()
    const snapshot = this.associate(detections)
    this.lastFrame = snapshot
    return snapshot
  }

  private bootstrap(): void {
    for (let i = 0; i < this.config.targetCount; i++) {
      this.spawnTarget()
    }
  }

  private spawnTarget(): GroundTruthTarget {
    const { width, height } = this.config
    const size = this.rng.next() * (TARGET_SIZE_MAX - TARGET_SIZE_MIN) + TARGET_SIZE_MIN
    const speed = this.rng.next() * (SPEED_MAX - SPEED_MIN) + SPEED_MIN
    const angle = this.rng.next() * Math.PI * 2
    const target: GroundTruthTarget = {
      truthId: this.nextTruthId++,
      bbox: {
        cx: this.rng.next() * (width - size) + size / 2,
        cy: this.rng.next() * (height - size) + size / 2,
        w: size,
        h: size,
      },
      velocity: {
        x: Math.cos(angle) * speed,
        y: Math.sin(angle) * speed,
      },
      alive: true,
      bornAt: this.frame,
    }
    this.targets.push(target)
    return target
  }

  private advanceTargets(): void {
    const { width, height, deathProbability, birthProbability } = this.config
    for (const target of this.targets) {
      if (!target.alive) continue
      target.velocity.x += this.rng.gaussian(0, 0.15)
      target.velocity.y += this.rng.gaussian(0, 0.15)
      const sp = Math.hypot(target.velocity.x, target.velocity.y)
      if (sp > SPEED_MAX) {
        target.velocity.x = (target.velocity.x / sp) * SPEED_MAX
        target.velocity.y = (target.velocity.y / sp) * SPEED_MAX
      }
      target.bbox.cx += target.velocity.x
      target.bbox.cy += target.velocity.y
      if (target.bbox.cx < target.bbox.w / 2) {
        target.bbox.cx = target.bbox.w / 2
        target.velocity.x *= -1
      }
      if (target.bbox.cx > width - target.bbox.w / 2) {
        target.bbox.cx = width - target.bbox.w / 2
        target.velocity.x *= -1
      }
      if (target.bbox.cy < target.bbox.h / 2) {
        target.bbox.cy = target.bbox.h / 2
        target.velocity.y *= -1
      }
      if (target.bbox.cy > height - target.bbox.h / 2) {
        target.bbox.cy = height - target.bbox.h / 2
        target.velocity.y *= -1
      }
      if (this.rng.next() < deathProbability) {
        target.alive = false
      }
    }
    if (this.rng.next() < birthProbability) {
      this.spawnTarget()
    }
  }

  private runDetector(): Detection[] {
    const detections: Detection[] = []
    let nextDetId = 0
    const { positionNoise, missProbability, falsePositiveRate, width, height } = this.config
    for (const target of this.targets) {
      if (!target.alive) continue
      if (this.rng.next() < missProbability) continue
      detections.push({
        detectionId: nextDetId++,
        truthId: target.truthId,
        isFalsePositive: false,
        bbox: {
          cx: target.bbox.cx + this.rng.gaussian(0, positionNoise),
          cy: target.bbox.cy + this.rng.gaussian(0, positionNoise),
          w: target.bbox.w * (1 + this.rng.gaussian(0, 0.05)),
          h: target.bbox.h * (1 + this.rng.gaussian(0, 0.05)),
        },
      })
    }
    let fpRemaining = falsePositiveRate
    while (fpRemaining > 0) {
      if (this.rng.next() < fpRemaining) {
        const size = this.rng.next() * (TARGET_SIZE_MAX - TARGET_SIZE_MIN) + TARGET_SIZE_MIN
        detections.push({
          detectionId: nextDetId++,
          truthId: null,
          isFalsePositive: true,
          bbox: {
            cx: this.rng.next() * (width - size) + size / 2,
            cy: this.rng.next() * (height - size) + size / 2,
            w: size,
            h: size,
          },
        })
      }
      fpRemaining -= 1
    }
    return detections
  }

  private associate(detections: Detection[]): FrameSnapshot {
    const trackIdsAtStart = this.tracklets.map((t) => t.trackId)
    const detectionIds = detections.map((d) => d.detectionId)
    const { metric, algorithm, iouThreshold, distanceThreshold, maxMissBeforeKill } = this.config
    const maximize = metric === 'iou'

    let costMatrix: CostMatrix = []
    let matches: Array<{ trackIdx: number; detectionIdx: number; cost: number }> = []
    let unmatchedTracks: number[] = this.tracklets.map((_, i) => i)
    let unmatchedDetections: number[] = detections.map((_, j) => j)

    if (this.tracklets.length > 0 && detections.length > 0) {
      costMatrix = this.tracklets.map((track) =>
        detections.map((det) =>
          metric === 'iou' ? iou(track.bbox, det.bbox) : distance(track.bbox, det.bbox),
        ),
      )
      const result =
        algorithm === 'km'
          ? km(costMatrix, { maximize })
          : greedy(costMatrix, { maximize })
      matches = []
      const matchedDetSet = new Set<number>()
      unmatchedTracks = []
      for (let i = 0; i < this.tracklets.length; i++) {
        const j = result.assignment[i]
        if (j < 0) {
          unmatchedTracks.push(i)
          continue
        }
        const cost = costMatrix[i][j]
        const valid = maximize ? cost >= iouThreshold : cost <= distanceThreshold
        if (valid) {
          matches.push({ trackIdx: i, detectionIdx: j, cost })
          matchedDetSet.add(j)
        } else {
          unmatchedTracks.push(i)
        }
      }
      unmatchedDetections = []
      for (let j = 0; j < detections.length; j++) {
        if (!matchedDetSet.has(j)) unmatchedDetections.push(j)
      }
    }

    for (const { trackIdx, detectionIdx } of matches) {
      const track = this.tracklets[trackIdx]
      const det = detections[detectionIdx]
      const previousTruthId = (track as Tracklet & { _truthId?: number | null })._truthId
      if (
        det.truthId !== null &&
        previousTruthId !== undefined &&
        previousTruthId !== null &&
        previousTruthId !== det.truthId
      ) {
        this.idSwitches += 1
      }
      ;(track as Tracklet & { _truthId?: number | null })._truthId = det.truthId
      track.bbox = { ...det.bbox }
      track.history.push({ x: det.bbox.cx, y: det.bbox.cy })
      if (track.history.length > 40) track.history.shift()
      track.age += 1
      track.missCount = 0
      track.lastSeenFrame = this.frame
    }

    for (const idx of unmatchedTracks) {
      this.tracklets[idx].missCount += 1
    }

    this.tracklets = this.tracklets.filter((t) => t.missCount <= maxMissBeforeKill)

    for (const idx of unmatchedDetections) {
      const det = detections[idx]
      const id = this.nextTrackId++
      const newTrack: Tracklet = {
        trackId: id,
        bbox: { ...det.bbox },
        history: [{ x: det.bbox.cx, y: det.bbox.cy }],
        age: 1,
        missCount: 0,
        lastSeenFrame: this.frame,
        color: colorForTrackId(id),
      }
      ;(newTrack as Tracklet & { _truthId?: number | null })._truthId = det.truthId
      this.tracklets.push(newTrack)
    }

    return {
      frame: this.frame,
      groundTruth: this.targets
        .filter((t) => t.alive)
        .map((t) => ({ ...t, bbox: { ...t.bbox }, velocity: { ...t.velocity } })),
      detections: detections.map((d) => ({ ...d, bbox: { ...d.bbox } })),
      tracklets: this.tracklets.map((t) => ({
        ...t,
        bbox: { ...t.bbox },
        history: t.history.slice(),
      })),
      matches,
      unmatchedTracks,
      unmatchedDetections,
      costMatrix,
      preMatchTrackIds: trackIdsAtStart,
      preMatchDetectionIds: detectionIds,
      metrics: {
        idSwitches: this.idSwitches,
        activeTracks: this.tracklets.length,
        activeTruth: this.targets.filter((t) => t.alive).length,
      },
    }
  }
}
