import { describe, it, expect } from 'vitest'
import { km } from '../km'
import type { CostMatrix } from '../types'

function isPermutation(assignment: number[], n: number, expectedCount = n): boolean {
  const real = assignment.filter((j) => j >= 0)
  if (real.length !== expectedCount) return false
  return new Set(real).size === real.length && real.every((j) => j >= 0 && j < n)
}

function bruteforceBestSquare(costs: CostMatrix, maximize = true): number {
  const n = costs.length
  const used = Array.from({ length: n }, () => false)
  let best = maximize ? -Infinity : Infinity
  function dfs(i: number, acc: number) {
    if (i === n) {
      if (maximize ? acc > best : acc < best) best = acc
      return
    }
    for (let j = 0; j < n; j++) {
      if (!used[j]) {
        used[j] = true
        dfs(i + 1, acc + costs[i][j])
        used[j] = false
      }
    }
  }
  dfs(0, 0)
  return best
}

describe('km', () => {
  it('maximizes a 3x3 textbook matrix', () => {
    const costs: CostMatrix = [
      [3, 5, 5],
      [4, 6, 2],
      [1, 2, 1],
    ]
    const result = km(costs)
    expect(result.algorithm).toBe('km')
    expect(result.totalWeight).toBe(12)
    expect(result.matchCount).toBe(3)
    expect(isPermutation(result.assignment, 3)).toBe(true)
  })

  it('minimizes when maximize=false on a diagonal-friendly matrix', () => {
    const costs: CostMatrix = [
      [1, 9, 9],
      [9, 1, 9],
      [9, 9, 1],
    ]
    const result = km(costs, { maximize: false })
    expect(result.totalWeight).toBe(3)
    expect(result.assignment).toEqual([0, 1, 2])
  })

  it('handles rectangular matrix with rows < cols', () => {
    const costs: CostMatrix = [
      [3, 5, 5, 9],
      [4, 6, 2, 1],
    ]
    const result = km(costs)
    expect(result.matchCount).toBe(2)
    expect(result.totalWeight).toBe(15)
    expect(new Set(result.assignment.filter((j) => j >= 0)).size).toBe(2)
  })

  it('handles rectangular matrix with rows > cols', () => {
    const costs: CostMatrix = [
      [3, 5],
      [4, 6],
      [1, 2],
    ]
    const result = km(costs)
    expect(result.matchCount).toBe(2)
    expect(result.totalWeight).toBe(9)
  })

  it('returns zero for empty inputs', () => {
    expect(km([]).totalWeight).toBe(0)
    expect(km([[]]).totalWeight).toBe(0)
    expect(km([]).matchCount).toBe(0)
  })

  it('matches brute-force on random 5x5 integer matrices', () => {
    let seed = 0xc0ffee
    const rand = () => {
      seed = (seed * 1664525 + 1013904223) >>> 0
      return seed / 0x1_0000_0000
    }
    for (let trial = 0; trial < 20; trial++) {
      const costs: CostMatrix = Array.from({ length: 5 }, () =>
        Array.from({ length: 5 }, () => Math.floor(rand() * 30)),
      )
      const result = km(costs)
      const expected = bruteforceBestSquare(costs, true)
      expect(result.totalWeight, JSON.stringify(costs)).toBe(expected)
    }
  })

  it('handles negative weights correctly', () => {
    const costs: CostMatrix = [
      [-1, -3, -5],
      [-2, -4, -6],
      [-3, -5, -7],
    ]
    const max = km(costs, { maximize: true })
    const min = km(costs, { maximize: false })
    expect(max.totalWeight).toBe(bruteforceBestSquare(costs, true))
    expect(min.totalWeight).toBe(bruteforceBestSquare(costs, false))
  })
})
