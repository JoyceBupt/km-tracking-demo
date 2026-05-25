import type { CostMatrix } from '../algorithms/types'

interface MatrixEditorProps {
  matrix: CostMatrix
  onCellChange: (i: number, j: number, value: number) => void
  leftLabels?: string[]
  rightLabels?: string[]
  highlight?: Array<[number, number]>
  className?: string
}

export function MatrixEditor({
  matrix,
  onCellChange,
  leftLabels,
  rightLabels,
  highlight = [],
  className = '',
}: MatrixEditorProps) {
  const rows = matrix.length
  const cols = rows > 0 ? matrix[0].length : 0
  const highlightSet = new Set(highlight.map(([i, j]) => `${i}-${j}`))

  if (rows === 0 || cols === 0) {
    return <p className="text-sm text-slate-400">矩阵为空</p>
  }

  return (
    <div className={`overflow-auto ${className}`}>
      <table className="border-separate border-spacing-1 text-sm">
        <thead>
          <tr>
            <th className="text-xs text-slate-400 font-normal" />
            {Array.from({ length: cols }, (_, j) => (
              <th
                key={`h-${j}`}
                className="text-xs text-slate-500 font-medium px-1 min-w-[3.5rem] text-center"
              >
                {rightLabels?.[j] ?? `R${j}`}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {matrix.map((row, i) => (
            <tr key={`r-${i}`}>
              <th className="text-xs text-slate-500 font-medium pr-2 text-right">
                {leftLabels?.[i] ?? `L${i}`}
              </th>
              {row.map((v, j) => {
                const isHi = highlightSet.has(`${i}-${j}`)
                return (
                  <td key={`c-${i}-${j}`}>
                    <input
                      type="number"
                      value={Number.isFinite(v) ? v : 0}
                      onChange={(e) => {
                        const next = Number(e.target.value)
                        if (Number.isFinite(next)) onCellChange(i, j, next)
                      }}
                      className={`w-16 px-1 py-1 text-center tabular-nums border rounded transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500/40 ${
                        isHi
                          ? 'border-brand-500 bg-brand-50 text-brand-700 font-semibold'
                          : 'border-slate-200 bg-white text-slate-700'
                      }`}
                    />
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
