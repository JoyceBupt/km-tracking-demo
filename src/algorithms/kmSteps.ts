import type { CostMatrix, MatchingOptions, MatchingResult } from './types'

const INF = Number.POSITIVE_INFINITY

export type KMPhase =
  | 'init'
  | 'augment-init'
  | 'select-y'
  | 'update-labels'
  | 'extend-tree'
  | 'augment-found'
  | 'final'

export interface KMStep {
  phase: KMPhase
  message: string
  lx: number[]
  ly: number[]
  matchY: number[]
  root: number
  visitedX: boolean[]
  visitedY: boolean[]
  slack: number[]
  slackFrom: number[]
  selectedY?: number
  delta?: number
  extendedX?: number
  augmentPath?: Array<{ x: number; y: number }>
}

export interface KMStepResult extends MatchingResult {
  steps: KMStep[]
  paddedSize: number
}

/**
 * Kuhn-Munkres with full execution trace.
 * Behavior is identical to {@link km}; the difference is that every
 * label initialization, slack update, tree extension and augmentation
 * is recorded so the caller can replay the process step by step.
 */
export function kmWithSteps(
  costs: CostMatrix,
  options: MatchingOptions = {},
): KMStepResult {
  const maximize = options.maximize !== false
  const rows = costs.length
  const cols = rows > 0 ? costs[0].length : 0

  if (rows === 0 || cols === 0) {
    return {
      algorithm: 'km',
      assignment: Array.from({ length: rows }, () => -1),
      totalWeight: 0,
      matchCount: 0,
      steps: [],
      paddedSize: 0,
    }
  }

  const n = Math.max(rows, cols)
  const w: number[][] = Array.from({ length: n }, () =>
    Array.from({ length: n }, () => 0),
  )
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      w[i][j] = maximize ? costs[i][j] : -costs[i][j]
    }
  }

  const lx = Array.from({ length: n }, () => -INF)
  const ly = Array.from({ length: n }, () => 0)
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      if (w[i][j] > lx[i]) lx[i] = w[i][j]
    }
  }

  const matchY = Array.from({ length: n }, () => -1)
  const matchX = Array.from({ length: n }, () => -1)
  const steps: KMStep[] = []

  const record = (
    phase: KMPhase,
    message: string,
    root: number,
    visitedX: boolean[],
    visitedY: boolean[],
    slack: number[],
    slackFrom: number[],
    extra: Partial<KMStep> = {},
  ): void => {
    steps.push({
      phase,
      message,
      lx: lx.slice(),
      ly: ly.slice(),
      matchY: matchY.slice(),
      root,
      visitedX: visitedX.slice(),
      visitedY: visitedY.slice(),
      slack: slack.slice(),
      slackFrom: slackFrom.slice(),
      ...extra,
    })
  }

  const emptyVx = Array.from({ length: n }, () => false)
  const emptyVy = Array.from({ length: n }, () => false)
  const emptySlack = Array.from({ length: n }, () => INF)
  const emptyFrom = Array.from({ length: n }, () => -1)

  record(
    'init',
    `初始化顶标：lx[i] 取第 i 行最大值，ly[j] 全部为 0。可行性约束 lx[i] + ly[j] ≥ w[i][j] 成立。`,
    -1,
    emptyVx,
    emptyVy,
    emptySlack,
    emptyFrom,
  )

  for (let root = 0; root < n; root++) {
    const visitedX = Array.from({ length: n }, () => false)
    const visitedY = Array.from({ length: n }, () => false)
    const slack = Array.from({ length: n }, () => INF)
    const slackFrom = Array.from({ length: n }, () => -1)

    visitedX[root] = true
    for (let j = 0; j < n; j++) {
      slack[j] = lx[root] + ly[j] - w[root][j]
      slackFrom[j] = root
    }

    record(
      'augment-init',
      `为左部节点 L${root} 启动增广路搜索。slack[j] 度量"再放宽多少顶标，边 (L${root}, R j) 才能进入相等子图"。`,
      root,
      visitedX,
      visitedY,
      slack,
      slackFrom,
    )

    while (true) {
      let delta = INF
      let yMin = -1
      for (let j = 0; j < n; j++) {
        if (!visitedY[j] && slack[j] < delta) {
          delta = slack[j]
          yMin = j
        }
      }

      if (delta > 0) {
        for (let i = 0; i < n; i++) {
          if (visitedX[i]) lx[i] -= delta
        }
        for (let j = 0; j < n; j++) {
          if (visitedY[j]) ly[j] += delta
          else slack[j] -= delta
        }
        record(
          'update-labels',
          `相等子图中暂无增广路。按 δ=${formatNum(delta)} 调整顶标：交错树内 lx -= δ、ly += δ，至少一条新的紧边进入相等子图。`,
          root,
          visitedX,
          visitedY,
          slack,
          slackFrom,
          { delta, selectedY: yMin },
        )
      }

      visitedY[yMin] = true
      record(
        'select-y',
        `slack[R${yMin}] = 0，把 R${yMin} 加入交错树（通过紧边 L${slackFrom[yMin]}–R${yMin}）。`,
        root,
        visitedX,
        visitedY,
        slack,
        slackFrom,
        { selectedY: yMin },
      )

      if (matchY[yMin] === -1) {
        const path: Array<{ x: number; y: number }> = []
        let y = yMin
        while (y !== -1) {
          const x = slackFrom[y]
          const next = matchX[x]
          path.push({ x, y })
          matchY[y] = x
          matchX[x] = y
          y = next
        }
        path.reverse()
        record(
          'augment-found',
          `R${yMin} 之前未匹配，构成增广路。沿路反转匹配，本轮增加 1 条匹配边。`,
          root,
          visitedX,
          visitedY,
          slack,
          slackFrom,
          { augmentPath: path, selectedY: yMin },
        )
        break
      } else {
        const x = matchY[yMin]
        visitedX[x] = true
        for (let j = 0; j < n; j++) {
          if (!visitedY[j]) {
            const newSlack = lx[x] + ly[j] - w[x][j]
            if (newSlack < slack[j]) {
              slack[j] = newSlack
              slackFrom[j] = x
            }
          }
        }
        record(
          'extend-tree',
          `R${yMin} 已被 L${x} 占用，沿匹配边把 L${x} 也拉入交错树，并以 L${x} 刷新 slack。`,
          root,
          visitedX,
          visitedY,
          slack,
          slackFrom,
          { extendedX: x, selectedY: yMin },
        )
      }
    }
  }

  const assignment = Array.from({ length: rows }, () => -1)
  let totalWeight = 0
  let matchCount = 0
  for (let i = 0; i < rows; i++) {
    const j = matchX[i]
    if (j >= 0 && j < cols) {
      assignment[i] = j
      totalWeight += costs[i][j]
      matchCount++
    }
  }

  record(
    'final',
    `全部 ${n} 个左部节点完成增广。最终匹配总权重 = ${formatNum(totalWeight)}。`,
    -1,
    Array.from({ length: n }, () => false),
    Array.from({ length: n }, () => false),
    Array.from({ length: n }, () => INF),
    Array.from({ length: n }, () => -1),
  )

  return {
    algorithm: 'km',
    assignment,
    totalWeight,
    matchCount,
    steps,
    paddedSize: n,
  }
}

function formatNum(v: number): string {
  if (!Number.isFinite(v)) return '∞'
  if (Number.isInteger(v)) return String(v)
  return v.toFixed(2)
}
