import { describe, expect, it } from 'vitest'
import { km } from '../km'
import { kmWithSteps } from '../kmSteps'
import type { CostMatrix } from '../types'

describe('kmWithSteps', () => {
  const fixtures: CostMatrix[] = [
    [
      [3, 5, 5],
      [4, 6, 2],
      [1, 2, 1],
    ],
    [
      [10, 9],
      [9, 1],
    ],
    [
      [80, 12, 3, 0, 5],
      [15, 78, 8, 2, 1],
      [4, 9, 82, 11, 6],
      [0, 1, 12, 75, 18],
      [6, 2, 4, 16, 79],
    ],
    [
      [3, 5, 5, 9],
      [4, 6, 2, 1],
    ],
  ]

  it('produces the same total weight as the production km()', () => {
    for (const matrix of fixtures) {
      const a = kmWithSteps(matrix).totalWeight
      const b = km(matrix).totalWeight
      expect(a, JSON.stringify(matrix)).toBe(b)
    }
  })

  it('begins with init and ends with final', () => {
    const result = kmWithSteps(fixtures[0])
    expect(result.steps[0].phase).toBe('init')
    expect(result.steps.at(-1)?.phase).toBe('final')
  })

  it('contains an augment-init for every row of the padded square', () => {
    for (const matrix of fixtures) {
      const result = kmWithSteps(matrix)
      const augmentInits = result.steps.filter((s) => s.phase === 'augment-init').length
      expect(augmentInits).toBe(result.paddedSize)
    }
  })

  it('records augment-found steps whose augmentPath reverses matchings consistently', () => {
    const result = kmWithSteps(fixtures[0])
    const augments = result.steps.filter((s) => s.phase === 'augment-found')
    expect(augments.length).toBeGreaterThan(0)
    for (const step of augments) {
      expect(step.augmentPath).toBeDefined()
      const path = step.augmentPath!
      const xs = path.map((p) => p.x)
      const ys = path.map((p) => p.y)
      expect(new Set(xs).size).toBe(xs.length)
      expect(new Set(ys).size).toBe(ys.length)
    }
  })

  it('matches km() on random matrices', () => {
    let seed = 0xb1ad
    const rand = () => {
      seed = (seed * 1664525 + 1013904223) >>> 0
      return seed / 0x1_0000_0000
    }
    for (let trial = 0; trial < 10; trial++) {
      const n = 4 + Math.floor(rand() * 3)
      const matrix: CostMatrix = Array.from({ length: n }, () =>
        Array.from({ length: n }, () => Math.floor(rand() * 30)),
      )
      expect(kmWithSteps(matrix).totalWeight).toBe(km(matrix).totalWeight)
    }
  })

  it('handles minimize option', () => {
    const matrix: CostMatrix = [
      [1, 9, 9],
      [9, 1, 9],
      [9, 9, 1],
    ]
    expect(kmWithSteps(matrix, { maximize: false }).totalWeight).toBe(3)
  })

  it('returns empty step list for empty inputs', () => {
    expect(kmWithSteps([]).steps).toEqual([])
    expect(kmWithSteps([[]]).steps).toEqual([])
  })
})
