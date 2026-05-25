import { useEffect, useMemo, useState } from 'react'
import { kmWithSteps, type KMPhase } from '../algorithms/kmSteps'
import type { CostMatrix } from '../algorithms/types'
import { Button } from './ui/Button'
import { KMReplayGraph } from './KMReplayGraph'

interface KMReplayProps {
  costs: CostMatrix
  maximize: boolean
  onClose?: () => void
}

const PHASE_LABEL: Record<KMPhase, { text: string; tone: string }> = {
  init: { text: '初始化', tone: 'bg-slate-200 text-slate-700' },
  'augment-init': { text: '新起点', tone: 'bg-sky-100 text-sky-700' },
  'select-y': { text: '加入树', tone: 'bg-amber-100 text-amber-700' },
  'update-labels': { text: '调整顶标', tone: 'bg-rose-100 text-rose-700' },
  'extend-tree': { text: '扩展交错树', tone: 'bg-indigo-100 text-indigo-700' },
  'augment-found': { text: '增广成功', tone: 'bg-emerald-100 text-emerald-700' },
  final: { text: '完成', tone: 'bg-slate-900 text-white' },
}

export function KMReplay({ costs, maximize, onClose }: KMReplayProps) {
  const result = useMemo(() => kmWithSteps(costs, { maximize }), [costs, maximize])
  const [index, setIndex] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [speed, setSpeed] = useState(800)

  useEffect(() => {
    setIndex(0)
    setPlaying(false)
  }, [costs, maximize])

  useEffect(() => {
    if (!playing) return
    if (index >= result.steps.length - 1) {
      setPlaying(false)
      return
    }
    const id = window.setTimeout(() => setIndex((i) => i + 1), speed)
    return () => window.clearTimeout(id)
  }, [playing, index, speed, result.steps.length])

  const step = result.steps[index]
  const atStart = index === 0
  const atEnd = index >= result.steps.length - 1

  if (!step) {
    return (
      <div className="text-sm text-slate-500">
        当前矩阵无可执行步骤。
      </div>
    )
  }

  const phaseInfo = PHASE_LABEL[step.phase]

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        <header className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <h2 className="text-base font-semibold text-slate-900">
              KM 算法分步执行
            </h2>
            <span className="text-xs text-slate-500 tabular-nums">
              第 {index + 1} / {result.steps.length} 步
            </span>
            <span className={`px-2 py-0.5 rounded text-xs font-medium ${phaseInfo.tone}`}>
              {phaseInfo.text}
            </span>
          </div>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-slate-700 text-2xl leading-none"
              aria-label="关闭"
            >
              ×
            </button>
          )}
        </header>

        <div className="flex-1 overflow-auto p-6 space-y-4">
          <p className="text-sm text-slate-700 leading-relaxed">
            {step.message}
          </p>

          <div className="flex justify-center bg-slate-50 rounded-lg p-3">
            <KMReplayGraph
              step={step}
              costs={costs}
              maximize={maximize}
              width={680}
              height={Math.max(360, 60 * step.lx.length + 80)}
            />
          </div>

          <Legend />
        </div>

        <footer className="border-t border-slate-200 px-6 py-3 flex items-center gap-3 flex-wrap">
          <Button onClick={() => setIndex(0)} disabled={atStart} variant="ghost" size="sm">
            ⏮ 起点
          </Button>
          <Button
            onClick={() => setIndex((i) => Math.max(0, i - 1))}
            disabled={atStart}
            size="sm"
          >
            ← 上一步
          </Button>
          <Button
            variant={playing ? 'danger' : 'primary'}
            onClick={() => {
              if (atEnd && !playing) {
                setIndex(0)
                setPlaying(true)
              } else {
                setPlaying((p) => !p)
              }
            }}
            size="sm"
          >
            {playing ? '⏸ 暂停' : atEnd ? '↻ 重放' : '▶ 自动'}
          </Button>
          <Button
            onClick={() => setIndex((i) => Math.min(result.steps.length - 1, i + 1))}
            disabled={atEnd}
            size="sm"
          >
            下一步 →
          </Button>
          <Button
            onClick={() => setIndex(result.steps.length - 1)}
            disabled={atEnd}
            variant="ghost"
            size="sm"
          >
            终点 ⏭
          </Button>
          <div className="ml-auto inline-flex items-center gap-2 text-xs text-slate-500">
            <span>速度</span>
            <input
              type="range"
              min={200}
              max={2000}
              step={100}
              value={2200 - speed}
              onChange={(e) => setSpeed(2200 - Number(e.target.value))}
              className="accent-brand-600 w-32"
            />
          </div>
        </footer>
      </div>
    </div>
  )
}

function Legend() {
  return (
    <div className="text-xs text-slate-500 flex flex-wrap gap-x-4 gap-y-1.5">
      <LegendItem color="#cbd5e1" label="候选边" dashed={false} />
      <LegendItem color="#10b981" label="相等子图 (slack=0)" dashed />
      <LegendItem color="#7c3aed" label="当前匹配" dashed={false} thick />
      <LegendItem color="#ea580c" label="增广路" dashed={false} thick />
      <span className="inline-flex items-center gap-1.5">
        <span className="inline-block w-3 h-3 rounded-full bg-amber-200 border border-amber-600" />
        交错树内节点
      </span>
      <span className="inline-flex items-center gap-1.5">
        <span className="inline-block w-3 h-3 rounded-full bg-white border-2 border-yellow-400" />
        当前 root
      </span>
      <span className="inline-flex items-center gap-1.5">
        <span className="inline-block w-3 h-3 rounded-full bg-white border-2 border-orange-500" />
        选中 y
      </span>
    </div>
  )
}

function LegendItem({
  color,
  label,
  dashed,
  thick,
}: {
  color: string
  label: string
  dashed?: boolean
  thick?: boolean
}) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <svg width="20" height="6">
        <line
          x1="0"
          y1="3"
          x2="20"
          y2="3"
          stroke={color}
          strokeWidth={thick ? 2.4 : 1.4}
          strokeDasharray={dashed ? '3 2' : undefined}
        />
      </svg>
      {label}
    </span>
  )
}
