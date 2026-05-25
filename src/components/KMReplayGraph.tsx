import { useMemo } from 'react'
import type { KMStep } from '../algorithms/kmSteps'
import type { CostMatrix } from '../algorithms/types'

interface KMReplayGraphProps {
  step: KMStep
  costs: CostMatrix
  maximize: boolean
  width?: number
  height?: number
  className?: string
}

const NODE_R = 16
const COLORS = {
  nodeStroke: '#0f172a',
  visited: '#fde68a',
  visitedStroke: '#d97706',
  root: '#facc15',
  selected: '#f97316',
  candidate: '#cbd5e1',
  tight: '#10b981',
  match: '#7c3aed',
  augment: '#ea580c',
  potential: '#475569',
  pad: '#e2e8f0',
}

export function KMReplayGraph({
  step,
  costs,
  maximize,
  width = 660,
  height = 440,
  className,
}: KMReplayGraphProps) {
  const rows = costs.length
  const cols = rows > 0 ? costs[0].length : 0
  const n = step.lx.length

  const layout = useMemo(() => {
    const paddingY = 56
    const innerH = height - paddingY * 2
    const dy = innerH / Math.max(n, 1)
    const leftX = 130
    const rightX = width - 130
    return {
      leftX,
      rightX,
      paddingY,
      dy,
      leftPos: (i: number) => ({ x: leftX, y: paddingY + (i + 0.5) * dy }),
      rightPos: (j: number) => ({ x: rightX, y: paddingY + (j + 0.5) * dy }),
    }
  }, [n, width, height])

  if (n === 0) {
    return <div className="text-sm text-slate-400">无可视化内容</div>
  }

  const w = (i: number, j: number): number => {
    if (i >= rows || j >= cols) return 0
    return maximize ? costs[i][j] : -costs[i][j]
  }

  // 相等子图：slack = lx + ly - w 为 0 的边
  const tightSet = new Set<string>()
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      const slack = step.lx[i] + step.ly[j] - w(i, j)
      if (Math.abs(slack) < 1e-9) tightSet.add(`${i}-${j}`)
    }
  }

  const matchedSet = new Set<string>()
  for (let j = 0; j < cols; j++) {
    const i = step.matchY[j]
    if (i >= 0 && i < rows) matchedSet.add(`${i}-${j}`)
  }

  const augmentSet = new Set<string>()
  if (step.augmentPath) {
    for (const { x, y } of step.augmentPath) {
      augmentSet.add(`${x}-${y}`)
    }
  }

  const isPadX = (i: number): boolean => i >= rows
  const isPadY = (j: number): boolean => j >= cols
  const isRoot = step.root >= 0 && step.root < n
  const isSelectedY = step.selectedY !== undefined && step.selectedY >= 0

  return (
    <svg
      className={className}
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label="KM 算法步骤可视化"
    >
      <text x={layout.leftX} y={26} textAnchor="middle" fontSize="13" fontWeight="600" fill="#475569">
        左部
      </text>
      <text x={layout.rightX} y={26} textAnchor="middle" fontSize="13" fontWeight="600" fill="#475569">
        右部
      </text>

      {Array.from({ length: rows }).flatMap((_, i) =>
        Array.from({ length: cols }).map((_, j) => {
          const a = layout.leftPos(i)
          const b = layout.rightPos(j)
          const isMatched = matchedSet.has(`${i}-${j}`)
          const isTight = tightSet.has(`${i}-${j}`)
          const isAugment = augmentSet.has(`${i}-${j}`)
          let stroke = COLORS.candidate
          let strokeWidth = 0.8
          let dashArray: string | undefined
          let opacity = 0.5
          if (isTight && !isMatched && !isAugment) {
            stroke = COLORS.tight
            strokeWidth = 1.4
            dashArray = '4 3'
            opacity = 0.85
          }
          if (isMatched) {
            stroke = COLORS.match
            strokeWidth = 2.4
            dashArray = undefined
            opacity = 1
          }
          if (isAugment) {
            stroke = COLORS.augment
            strokeWidth = 3
            dashArray = undefined
            opacity = 1
          }
          return (
            <line
              key={`edge-${i}-${j}`}
              x1={a.x}
              y1={a.y}
              x2={b.x}
              y2={b.y}
              stroke={stroke}
              strokeWidth={strokeWidth}
              strokeOpacity={opacity}
              strokeDasharray={dashArray}
              strokeLinecap="round"
            />
          )
        }),
      )}

      {Array.from({ length: n }, (_, i) => {
        const pos = layout.leftPos(i)
        const isPad = isPadX(i)
        const visited = !isPad && step.visitedX[i]
        const isThisRoot = isRoot && step.root === i
        const fill = isPad ? COLORS.pad : visited ? COLORS.visited : '#ffffff'
        const stroke = isThisRoot
          ? COLORS.root
          : visited
            ? COLORS.visitedStroke
            : COLORS.nodeStroke
        const strokeWidth = isThisRoot ? 3 : visited ? 2.2 : 2
        const label = isPad ? `L${i}*` : `L${i}`
        const potential = isPad
          ? null
          : maximize
            ? formatNum(step.lx[i])
            : formatNum(-step.lx[i])
        return (
          <g key={`L-${i}`}>
            <circle cx={pos.x} cy={pos.y} r={NODE_R} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />
            <text
              x={pos.x}
              y={pos.y + 4}
              textAnchor="middle"
              fontSize="12"
              fontWeight="600"
              fill={isPad ? '#94a3b8' : COLORS.nodeStroke}
            >
              {label}
            </text>
            {potential !== null && (
              <text
                x={pos.x - NODE_R - 8}
                y={pos.y + 4}
                textAnchor="end"
                fontSize="11"
                fontWeight="500"
                fill={COLORS.potential}
              >
                lx={potential}
              </text>
            )}
          </g>
        )
      })}

      {Array.from({ length: n }, (_, j) => {
        const pos = layout.rightPos(j)
        const isPad = isPadY(j)
        const visited = !isPad && step.visitedY[j]
        const isSelected = isSelectedY && step.selectedY === j
        const fill = isPad ? COLORS.pad : visited ? COLORS.visited : '#ffffff'
        const stroke = isSelected
          ? COLORS.selected
          : visited
            ? COLORS.visitedStroke
            : COLORS.nodeStroke
        const strokeWidth = isSelected ? 3 : visited ? 2.2 : 2
        const label = isPad ? `R${j}*` : `R${j}`
        const potential = isPad
          ? null
          : maximize
            ? formatNum(step.ly[j])
            : formatNum(-step.ly[j])
        const slackVal = !isPad && !visited && step.slack[j] !== Number.POSITIVE_INFINITY
          ? formatNum(step.slack[j])
          : null
        return (
          <g key={`R-${j}`}>
            <circle cx={pos.x} cy={pos.y} r={NODE_R} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />
            <text
              x={pos.x}
              y={pos.y + 4}
              textAnchor="middle"
              fontSize="12"
              fontWeight="600"
              fill={isPad ? '#94a3b8' : COLORS.nodeStroke}
            >
              {label}
            </text>
            {potential !== null && (
              <text
                x={pos.x + NODE_R + 8}
                y={pos.y - 2}
                textAnchor="start"
                fontSize="11"
                fontWeight="500"
                fill={COLORS.potential}
              >
                ly={potential}
              </text>
            )}
            {slackVal !== null && (
              <text
                x={pos.x + NODE_R + 8}
                y={pos.y + 12}
                textAnchor="start"
                fontSize="10"
                fill="#94a3b8"
              >
                slack={slackVal}
              </text>
            )}
          </g>
        )
      })}
    </svg>
  )
}

function formatNum(v: number): string {
  if (!Number.isFinite(v)) return '∞'
  if (Number.isInteger(v)) return String(v)
  return v.toFixed(1)
}
