import { describe, it, expect } from 'vitest'
import { greedy } from '../greedy'
import { km } from '../km'
import type { CostMatrix } from '../types'

describe('greedy', () => {
  it('picks highest weight edges first when maximizing', () => {
    const costs: CostMatrix = [
      [1, 9],
      [9, 1],
    ]
    const result = greedy(costs)
    expect(result.totalWeight).toBe(18)
  })

  it('produces a suboptimal result on a known adversarial matrix', () => {
    const costs: CostMatrix = [
      [10, 9],
      [9, 1],
    ]
    const g = greedy(costs)
    const k = km(costs)
    expect(g.totalWeight).toBe(11)
    expect(k.totalWeight).toBe(18)
    expect(g.totalWeight).toBeLessThan(k.totalWeight)
  })

  it('never exceeds KM on random matrices', () => {
    let seed = 0xfeed
    const rand = () => {
      seed = (seed * 1664525 + 1013904223) >>> 0
      return seed / 0x1_0000_0000
    }
    for (let trial = 0; trial < 10; trial++) {
      const n = 6
      const costs: CostMatrix = Array.from({ length: n }, () =>
        Array.from({ length: n }, () => Math.floor(rand() * 50)),
      )
      const g = greedy(costs).totalWeight
      const k = km(costs).totalWeight
      expect(g).toBeLessThanOrEqual(k)
    }
  })

  it('minimizes when maximize=false', () => {
    const costs: CostMatrix = [
      [1, 5],
      [5, 1],
    ]
    expect(greedy(costs, { maximize: false }).totalWeight).toBe(2)
  })

  it('returns zero for empty inputs', () => {
    expect(greedy([]).matchCount).toBe(0)
    expect(greedy([[]]).matchCount).toBe(0)
  })
})
