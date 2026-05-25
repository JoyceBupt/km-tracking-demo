import type { CostMatrix, MatchingOptions, MatchingResult } from './types'

export function greedy(costs: CostMatrix, options: MatchingOptions = {}): MatchingResult {
  const maximize = options.maximize !== false
  const rows = costs.length
  const cols = rows > 0 ? costs[0].length : 0
  if (rows === 0 || cols === 0) {
    return {
      algorithm: 'greedy',
      assignment: Array.from({ length: rows }, () => -1),
      totalWeight: 0,
      matchCount: 0,
    }
  }

  const edges: Array<{ i: number; j: number; w: number }> = []
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      edges.push({ i, j, w: costs[i][j] })
    }
  }
  edges.sort((a, b) => (maximize ? b.w - a.w : a.w - b.w))

  const assignment = Array.from({ length: rows }, () => -1)
  const usedY = Array.from({ length: cols }, () => false)
  let totalWeight = 0
  let matchCount = 0

  for (const { i, j, w } of edges) {
    if (assignment[i] === -1 && !usedY[j]) {
      assignment[i] = j
      usedY[j] = true
      totalWeight += w
      matchCount++
    }
  }

  return { algorithm: 'greedy', assignment, totalWeight, matchCount }
}
