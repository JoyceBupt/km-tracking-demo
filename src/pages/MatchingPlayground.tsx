import { useMemo, useState } from 'react'
import { greedy, hungarian, km } from '../algorithms'
import type { CostMatrix } from '../algorithms/types'
import { BipartiteGraph } from '../components/BipartiteGraph'
import { MatrixEditor } from '../components/MatrixEditor'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { NumberStepper } from '../components/ui/NumberStepper'

interface Preset {
  id: string
  name: string
  description: string
  matrix: CostMatrix
  maximize: boolean
}

const PRESETS: Preset[] = [
  {
    id: 'textbook',
    name: '课本 3×3',
    description: '经典最大权完美匹配示例',
    matrix: [
      [3, 5, 5],
      [4, 6, 2],
      [1, 2, 1],
    ],
    maximize: true,
  },
  {
    id: 'greedy-counter',
    name: '贪心反例 2×2',
    description: '贪心算法严格次于 KM',
    matrix: [
      [10, 9],
      [9, 1],
    ],
    maximize: true,
  },
  {
    id: 'tracking-iou',
    name: '跟踪 IoU 5×5',
    description: '模拟一帧轨迹-检测的 IoU × 100',
    matrix: [
      [80, 12, 3, 0, 5],
      [15, 78, 8, 2, 1],
      [4, 9, 82, 11, 6],
      [0, 1, 12, 75, 18],
      [6, 2, 4, 16, 79],
    ],
    maximize: true,
  },
  {
    id: 'cost-min',
    name: '成本最小化 4×4',
    description: '取最小成本匹配（如调度耗时）',
    matrix: [
      [9, 2, 7, 8],
      [6, 4, 3, 7],
      [5, 8, 1, 8],
      [7, 6, 9, 4],
    ],
    maximize: false,
  },
  {
    id: 'non-square',
    name: '非方阵 3×5',
    description: '检测多于轨迹（含新生目标）',
    matrix: [
      [82, 4, 7, 1, 0],
      [3, 76, 9, 8, 2],
      [5, 12, 4, 80, 6],
    ],
    maximize: true,
  },
]

function emptyMatrix(rows: number, cols: number): CostMatrix {
  return Array.from({ length: rows }, () => Array.from({ length: cols }, () => 0))
}

function resizeMatrix(prev: CostMatrix, rows: number, cols: number): CostMatrix {
  const next = emptyMatrix(rows, cols)
  const oldRows = prev.length
  const oldCols = oldRows > 0 ? prev[0].length : 0
  for (let i = 0; i < Math.min(oldRows, rows); i++) {
    for (let j = 0; j < Math.min(oldCols, cols); j++) {
      next[i][j] = prev[i][j]
    }
  }
  return next
}

function randomMatrix(rows: number, cols: number, hi = 100): CostMatrix {
  return Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => Math.floor(Math.random() * hi)),
  )
}

function cloneMatrix(m: CostMatrix): CostMatrix {
  return m.map((row) => row.slice())
}

const ALGORITHM_LABEL: Record<'km' | 'hungarian' | 'greedy', string> = {
  km: 'KM (Kuhn-Munkres)',
  hungarian: '匈牙利 (无权)',
  greedy: '贪心',
}

const ALGORITHM_DESC: Record<'km' | 'hungarian' | 'greedy', string> = {
  km: '带权二部图最大权完美匹配，O(n³)',
  hungarian: '把成本 > 0 视为有边，求最大匹配数',
  greedy: '按权重排序枚举边，作为基线对照',
}

export function MatchingPlayground() {
  const [matrix, setMatrix] = useState<CostMatrix>(cloneMatrix(PRESETS[0].matrix))
  const [maximize, setMaximize] = useState(true)

  const rows = matrix.length
  const cols = rows > 0 ? matrix[0].length : 0

  const results = useMemo(() => {
    const kmRes = km(matrix, { maximize })
    const greedyRes = greedy(matrix, { maximize })
    const adjacency = matrix.map((row) => row.map((v) => (v > 0 ? 1 : 0)))
    const hungarianRes = hungarian(adjacency)
    return { km: kmRes, hungarian: hungarianRes, greedy: greedyRes }
  }, [matrix, maximize])

  const optimumWeight = results.km.totalWeight

  function updateCell(i: number, j: number, value: number) {
    setMatrix((prev) => {
      const next = cloneMatrix(prev)
      next[i][j] = value
      return next
    })
  }

  function applyPreset(p: Preset) {
    setMatrix(cloneMatrix(p.matrix))
    setMaximize(p.maximize)
  }

  return (
    <div className="grid lg:grid-cols-12 gap-6 p-6 max-w-[1400px] mx-auto">
      <div className="lg:col-span-5 space-y-6">
        <Card
          title="成本矩阵"
          subtitle={`${rows} × ${cols}，${maximize ? '最大化权重' : '最小化成本'}`}
          actions={
            <label className="inline-flex items-center gap-1.5 text-xs text-slate-500 cursor-pointer">
              <input
                type="checkbox"
                checked={maximize}
                onChange={(e) => setMaximize(e.target.checked)}
                className="accent-brand-600"
              />
              最大化
            </label>
          }
        >
          <div className="flex flex-wrap items-center gap-3 mb-3">
            <NumberStepper
              label="行"
              value={rows}
              min={1}
              max={12}
              onChange={(v) => setMatrix((prev) => resizeMatrix(prev, v, cols))}
            />
            <NumberStepper
              label="列"
              value={cols}
              min={1}
              max={12}
              onChange={(v) => setMatrix((prev) => resizeMatrix(prev, rows, v))}
            />
            <div className="ml-auto flex gap-2">
              <Button onClick={() => setMatrix(randomMatrix(rows, cols))}>
                随机
              </Button>
              <Button
                variant="ghost"
                onClick={() => setMatrix(emptyMatrix(rows, cols))}
              >
                清零
              </Button>
            </div>
          </div>
          <MatrixEditor
            matrix={matrix}
            onCellChange={updateCell}
            highlight={
              results.km.assignment
                .map<[number, number] | null>((j, i) =>
                  j >= 0 ? [i, j] : null,
                )
                .filter((x): x is [number, number] => x !== null)
            }
          />
          <div className="mt-4">
            <div className="text-xs text-slate-500 mb-2">预设场景</div>
            <div className="flex flex-wrap gap-2">
              {PRESETS.map((p) => (
                <Button
                  key={p.id}
                  variant="secondary"
                  size="sm"
                  onClick={() => applyPreset(p)}
                  title={p.description}
                >
                  {p.name}
                </Button>
              ))}
            </div>
          </div>
        </Card>

        <Card
          title="算法对比"
          subtitle="同一矩阵下三种方法的结果与最优解差距"
        >
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500 border-b border-slate-200">
                <th className="py-2 font-medium">算法</th>
                <th className="font-medium">匹配数</th>
                <th className="font-medium text-right">
                  总{maximize ? '权重' : '成本'}
                </th>
                <th className="font-medium text-right">相对 KM</th>
              </tr>
            </thead>
            <tbody>
              {(['km', 'hungarian', 'greedy'] as const).map((k) => {
                const r = results[k]
                let diffText = '—'
                if (k !== 'km') {
                  if (optimumWeight === 0) {
                    diffText = r.totalWeight === 0 ? '0%' : '∞'
                  } else {
                    const diff =
                      ((r.totalWeight - optimumWeight) /
                        Math.abs(optimumWeight)) *
                      100
                    diffText = `${diff > 0 ? '+' : ''}${diff.toFixed(1)}%`
                  }
                }
                const diffColor =
                  k === 'km'
                    ? 'text-slate-400'
                    : (maximize ? r.totalWeight < optimumWeight : r.totalWeight > optimumWeight)
                      ? 'text-rose-500'
                      : 'text-emerald-500'
                return (
                  <tr key={k} className="border-b border-slate-100 last:border-0">
                    <td className="py-2.5">
                      <div className="font-medium text-slate-800">
                        {ALGORITHM_LABEL[k]}
                      </div>
                      <div className="text-xs text-slate-500">
                        {ALGORITHM_DESC[k]}
                      </div>
                    </td>
                    <td className="tabular-nums">{r.matchCount}</td>
                    <td className="text-right tabular-nums font-semibold">
                      {r.totalWeight.toFixed(0)}
                    </td>
                    <td className={`text-right tabular-nums ${diffColor}`}>
                      {diffText}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </Card>
      </div>

      <div className="lg:col-span-7 space-y-6">
        <Card
          title="KM 最优匹配可视化"
          subtitle="灰色边为候选，紫色边为匹配，边上数字为权重"
        >
          <div className="flex justify-center">
            <BipartiteGraph
              costs={matrix}
              assignment={results.km.assignment}
              leftTitle="左部 (轨迹 / 任务)"
              rightTitle="右部 (检测 / 资源)"
              maximize={maximize}
              width={560}
              height={Math.max(320, 60 * Math.max(rows, cols))}
            />
          </div>
        </Card>

        <Card title="匹配明细">
          <ul className="grid sm:grid-cols-2 gap-x-6 gap-y-1 text-sm">
            {results.km.assignment.map((j, i) => (
              <li
                key={i}
                className={`flex items-center justify-between border-b border-dashed border-slate-100 py-1 ${j < 0 ? 'text-slate-400' : 'text-slate-700'}`}
              >
                <span className="font-medium">L{i}</span>
                <span className="text-slate-400">→</span>
                <span className="font-medium">
                  {j < 0 ? '未匹配' : `R${j}`}
                </span>
                <span className="tabular-nums text-slate-500 w-12 text-right">
                  {j < 0 ? '' : matrix[i][j]}
                </span>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  )
}
