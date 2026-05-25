import { describe, it, expect } from 'vitest'
import { hungarian } from '../hungarian'

describe('hungarian', () => {
  it('finds the maximum matching on a simple bipartite graph', () => {
    const adj = [
      [1, 1, 0],
      [1, 0, 0],
      [0, 1, 1],
    ]
    const result = hungarian(adj)
    expect(result.algorithm).toBe('hungarian')
    expect(result.matchCount).toBe(3)
  })

  it('returns matchCount equal to min(rows, cols) when graph is complete', () => {
    const adj = [
      [1, 1, 1, 1],
      [1, 1, 1, 1],
    ]
    expect(hungarian(adj).matchCount).toBe(2)
  })

  it('produces a partial matching when there is no perfect matching', () => {
    const adj = [
      [1, 0, 0],
      [1, 0, 0],
      [1, 0, 0],
    ]
    expect(hungarian(adj).matchCount).toBe(1)
  })

  it('handles isolated vertices', () => {
    const adj = [
      [0, 0, 0],
      [0, 1, 0],
      [0, 0, 0],
    ]
    const result = hungarian(adj)
    expect(result.matchCount).toBe(1)
    expect(result.assignment[1]).toBe(1)
  })

  it('returns zero for empty inputs', () => {
    expect(hungarian([]).matchCount).toBe(0)
    expect(hungarian([[]]).matchCount).toBe(0)
  })
})
