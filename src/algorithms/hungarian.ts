import type { MatchingResult } from './types'

export type AdjacencyMatrix = number[][]

export function hungarian(adj: AdjacencyMatrix): MatchingResult {
  const rows = adj.length
  const cols = rows > 0 ? adj[0].length : 0
  if (rows === 0 || cols === 0) {
    return {
      algorithm: 'hungarian',
      assignment: Array.from({ length: rows }, () => -1),
      totalWeight: 0,
      matchCount: 0,
    }
  }

  const matchY: number[] = Array.from({ length: cols }, () => -1)

  function tryAugment(i: number, visited: boolean[]): boolean {
    for (let j = 0; j < cols; j++) {
      if (adj[i][j] && !visited[j]) {
        visited[j] = true
        if (matchY[j] === -1 || tryAugment(matchY[j], visited)) {
          matchY[j] = i
          return true
        }
      }
    }
    return false
  }

  for (let i = 0; i < rows; i++) {
    const visited = Array.from({ length: cols }, () => false)
    tryAugment(i, visited)
  }

  const assignment = Array.from({ length: rows }, () => -1)
  let totalWeight = 0
  let matchCount = 0
  for (let j = 0; j < cols; j++) {
    const i = matchY[j]
    if (i !== -1) {
      assignment[i] = j
      totalWeight += adj[i][j]
      matchCount++
    }
  }

  return { algorithm: 'hungarian', assignment, totalWeight, matchCount }
}
