import { useMemo } from 'react'
import type { CostMatrix } from '../algorithms/types'

export interface BipartiteGraphProps {
  costs: CostMatrix
  assignment?: number[]
  leftLabels?: string[]
  rightLabels?: string[]
  leftTitle?: string
  rightTitle?: string
  maximize?: boolean
  showAllEdges?: boolean
  showWeightOnMatched?: boolean
  width?: number
  height?: number
  className?: string
}

interface NodeLayout {
  x: number
  y: number
}

const NODE_RADIUS = 18
const MATCHED_COLOR = '#7c3aed'
const NODE_STROKE = '#0f172a'

export function BipartiteGraph({
  costs,
  assignment,
  leftLabels,
  rightLabels,
  leftTitle = 'Left',
  rightTitle = 'Right',
  maximize = true,
  showAllEdges = true,
  showWeightOnMatched = true,
  width = 540,
  height = 360,
  className,
}: BipartiteGraphProps) {
  const rows = costs.length
  const cols = rows > 0 ? costs[0].length : 0

  const layout = useMemo(() => {
    const paddingY = 48
    const innerHeight = height - paddingY * 2
    const leftStep = innerHeight / Math.max(rows, 1)
    const rightStep = innerHeight / Math.max(cols, 1)
    const leftX = 90
    const rightX = width - 90
    const left: NodeLayout[] = Array.from({ length: rows }, (_, i) => ({
      x: leftX,
      y: paddingY + (i + 0.5) * leftStep,
    }))
    const right: NodeLayout[] = Array.from({ length: cols }, (_, j) => ({
      x: rightX,
      y: paddingY + (j + 0.5) * rightStep,
    }))
    return { left, right, leftX, rightX, paddingY }
  }, [rows, cols, width, height])

  const { minW, maxW } = useMemo(() => {
    let lo = Number.POSITIVE_INFINITY
    let hi = Number.NEGATIVE_INFINITY
    for (const row of costs) {
      for (const v of row) {
        if (v < lo) lo = v
        if (v > hi) hi = v
      }
    }
    return { minW: lo, maxW: hi }
  }, [costs])

  if (rows === 0 || cols === 0) {
    return (
      <div className="text-sm text-slate-400">
        矩阵为空，无可视化内容。
      </div>
    )
  }

  const range = maxW - minW || 1
  const matchedSet = new Set<string>()
  if (assignment) {
    for (let i = 0; i < assignment.length; i++) {
      const j = assignment[i]
      if (j >= 0) matchedSet.add(`${i}-${j}`)
    }
  }

  function intensity(w: number): number {
    const t = (w - minW) / range
    return maximize ? t : 1 - t
  }

  return (
    <svg
      className={className}
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label="二部图匹配可视化"
    >
      <text
        x={layout.leftX}
        y={24}
        textAnchor="middle"
        fontSize="13"
        fontWeight="600"
        fill="#475569"
      >
        {leftTitle}
      </text>
      <text
        x={layout.rightX}
        y={24}
        textAnchor="middle"
        fontSize="13"
        fontWeight="600"
        fill="#475569"
      >
        {rightTitle}
      </text>

      {showAllEdges &&
        costs.flatMap((row, i) =>
          row.map((w, j) => {
            const key = `${i}-${j}`
            if (matchedSet.has(key)) return null
            const a = layout.left[i]
            const b = layout.right[j]
            const t = intensity(w)
            return (
              <line
                key={`edge-${key}`}
                x1={a.x}
                y1={a.y}
                x2={b.x}
                y2={b.y}
                stroke="#94a3b8"
                strokeOpacity={0.1 + 0.55 * t}
                strokeWidth={0.8 + 1.6 * t}
              />
            )
          }),
        )}

      {assignment &&
        assignment.map((j, i) => {
          if (j < 0) return null
          const a = layout.left[i]
          const b = layout.right[j]
          const mx = (a.x + b.x) / 2
          const my = (a.y + b.y) / 2
          const w = costs[i][j]
          return (
            <g key={`matched-${i}-${j}`}>
              <line
                x1={a.x}
                y1={a.y}
                x2={b.x}
                y2={b.y}
                stroke={MATCHED_COLOR}
                strokeWidth={2.6}
                strokeLinecap="round"
              />
              {showWeightOnMatched && (
                <g>
                  <rect
                    x={mx - 22}
                    y={my - 11}
                    width={44}
                    height={22}
                    rx={4}
                    fill={MATCHED_COLOR}
                  />
                  <text
                    x={mx}
                    y={my + 5}
                    textAnchor="middle"
                    fontSize="12"
                    fontWeight="600"
                    fill="white"
                  >
                    {formatWeight(w)}
                  </text>
                </g>
              )}
            </g>
          )
        })}

      {layout.left.map((pos, i) => (
        <g key={`l-${i}`}>
          <circle
            cx={pos.x}
            cy={pos.y}
            r={NODE_RADIUS}
            fill="#ffffff"
            stroke={NODE_STROKE}
            strokeWidth={2}
          />
          <text
            x={pos.x}
            y={pos.y + 5}
            textAnchor="middle"
            fontSize="13"
            fontWeight="500"
            fill={NODE_STROKE}
          >
            {leftLabels?.[i] ?? `L${i}`}
          </text>
        </g>
      ))}

      {layout.right.map((pos, j) => (
        <g key={`r-${j}`}>
          <circle
            cx={pos.x}
            cy={pos.y}
            r={NODE_RADIUS}
            fill="#ffffff"
            stroke={NODE_STROKE}
            strokeWidth={2}
          />
          <text
            x={pos.x}
            y={pos.y + 5}
            textAnchor="middle"
            fontSize="13"
            fontWeight="500"
            fill={NODE_STROKE}
          >
            {rightLabels?.[j] ?? `R${j}`}
          </text>
        </g>
      ))}
    </svg>
  )
}

function formatWeight(w: number): string {
  if (Number.isInteger(w)) return String(w)
  const abs = Math.abs(w)
  if (abs >= 100) return w.toFixed(0)
  if (abs >= 10) return w.toFixed(1)
  return w.toFixed(2)
}
