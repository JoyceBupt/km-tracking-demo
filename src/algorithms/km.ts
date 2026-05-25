import type { CostMatrix, MatchingOptions, MatchingResult } from './types'

const INF = Number.POSITIVE_INFINITY

function emptyResult(rows: number): MatchingResult {
  return {
    algorithm: 'km',
    assignment: Array.from({ length: rows }, () => -1),
    totalWeight: 0,
    matchCount: 0,
  }
}

export function km(costs: CostMatrix, options: MatchingOptions = {}): MatchingResult {
  const maximize = options.maximize !== false
  const rows = costs.length
  const cols = rows > 0 ? costs[0].length : 0
  if (rows === 0 || cols === 0) return emptyResult(rows)

  let a: number[][]
  const transposed = rows > cols
  if (transposed) {
    a = Array.from({ length: cols }, (_, j) =>
      Array.from({ length: rows }, (_, i) => costs[i][j]),
    )
  } else {
    a = costs.map((row) => row.slice())
  }
  if (maximize) {
    a = a.map((row) => row.map((v) => -v))
  }

  const n = a.length
  const m = a[0].length

  const u = Array.from({ length: n + 1 }, () => 0)
  const v = Array.from({ length: m + 1 }, () => 0)
  const p = Array.from({ length: m + 1 }, () => 0)
  const way = Array.from({ length: m + 1 }, () => 0)

  for (let i = 1; i <= n; i++) {
    p[0] = i
    let j0 = 0
    const minv = Array.from({ length: m + 1 }, () => INF)
    const used = Array.from({ length: m + 1 }, () => false)

    do {
      used[j0] = true
      const i0 = p[j0]
      let delta = INF
      let j1 = 0
      for (let j = 1; j <= m; j++) {
        if (!used[j]) {
          const cur = a[i0 - 1][j - 1] - u[i0] - v[j]
          if (cur < minv[j]) {
            minv[j] = cur
            way[j] = j0
          }
          if (minv[j] < delta) {
            delta = minv[j]
            j1 = j
          }
        }
      }
      for (let j = 0; j <= m; j++) {
        if (used[j]) {
          u[p[j]] += delta
          v[j] -= delta
        } else {
          minv[j] -= delta
        }
      }
      j0 = j1
    } while (p[j0] !== 0)

    do {
      const j1 = way[j0]
      p[j0] = p[j1]
      j0 = j1
    } while (j0 !== 0)
  }

  const innerAssignment = Array.from({ length: n }, () => -1)
  for (let j = 1; j <= m; j++) {
    if (p[j] > 0) innerAssignment[p[j] - 1] = j - 1
  }

  const assignment = Array.from({ length: rows }, () => -1)
  if (transposed) {
    for (let i = 0; i < n; i++) {
      const j = innerAssignment[i]
      if (j >= 0) assignment[j] = i
    }
  } else {
    for (let i = 0; i < rows; i++) assignment[i] = innerAssignment[i] ?? -1
  }

  let totalWeight = 0
  let matchCount = 0
  for (let i = 0; i < rows; i++) {
    const j = assignment[i]
    if (j >= 0) {
      totalWeight += costs[i][j]
      matchCount++
    }
  }

  return { algorithm: 'km', assignment, totalWeight, matchCount }
}
