import { describe, expect, it } from 'vitest'
import { TrackingSimulation } from '../engine'
import { iou } from '../geometry'
import { DEFAULT_CONFIG } from '../types'

describe('iou', () => {
  it('returns 1 for identical boxes', () => {
    const a = { cx: 10, cy: 10, w: 4, h: 6 }
    expect(iou(a, { ...a })).toBeCloseTo(1)
  })

  it('returns 0 for disjoint boxes', () => {
    const a = { cx: 0, cy: 0, w: 4, h: 4 }
    const b = { cx: 100, cy: 100, w: 4, h: 4 }
    expect(iou(a, b)).toBe(0)
  })

  it('returns expected overlap for a known case', () => {
    const a = { cx: 0, cy: 0, w: 10, h: 10 }
    const b = { cx: 5, cy: 0, w: 10, h: 10 }
    expect(iou(a, b)).toBeCloseTo(50 / 150)
  })
})

describe('TrackingSimulation', () => {
  it('initializes target population from config', () => {
    const sim = new TrackingSimulation({ ...DEFAULT_CONFIG, targetCount: 4 })
    const snap = sim.step()
    expect(snap.groundTruth.length).toBeGreaterThanOrEqual(4)
  })

  it('produces deterministic output for the same seed', () => {
    const sim1 = new TrackingSimulation({ ...DEFAULT_CONFIG, seed: 42 })
    const sim2 = new TrackingSimulation({ ...DEFAULT_CONFIG, seed: 42 })
    for (let i = 0; i < 10; i++) {
      const a = sim1.step()
      const b = sim2.step()
      expect(a.tracklets.length).toBe(b.tracklets.length)
      expect(a.detections.length).toBe(b.detections.length)
    }
  })

  it('keeps IDs stable on a noise-free scenario', () => {
    const sim = new TrackingSimulation({
      ...DEFAULT_CONFIG,
      targetCount: 5,
      positionNoise: 0,
      missProbability: 0,
      falsePositiveRate: 0,
      birthProbability: 0,
      deathProbability: 0,
      algorithm: 'km',
      seed: 7,
    })
    for (let i = 0; i < 30; i++) sim.step()
    const final = sim.snapshot!
    expect(final.metrics.idSwitches).toBe(0)
    expect(final.tracklets.length).toBe(5)
  })

  it('updates config and reseeds when seed changes', () => {
    const sim = new TrackingSimulation({ ...DEFAULT_CONFIG, seed: 1 })
    sim.step()
    sim.step()
    sim.updateConfig({ seed: 999 })
    expect(sim.frame).toBe(0)
  })

  it('greedy is allowed even when km is the default', () => {
    const sim = new TrackingSimulation({
      ...DEFAULT_CONFIG,
      algorithm: 'greedy',
      seed: 2,
    })
    const snap = sim.step()
    expect(snap.tracklets.length).toBeGreaterThan(0)
  })
})
