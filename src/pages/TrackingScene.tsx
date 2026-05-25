import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { BipartiteGraph } from '../components/BipartiteGraph'
import { TrackingCanvas } from '../components/TrackingCanvas'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { SegmentedControl } from '../components/ui/SegmentedControl'
import { Slider } from '../components/ui/Slider'
import { decodeState, encodeState, readHashParams, writeHashParams } from '../lib/urlState'
import { TrackingSimulation } from '../simulation/engine'
import { SCENARIOS, DEFAULT_SCENARIO_ID } from '../simulation/scenarios'
import {
  type FrameSnapshot,
  type GroundTruthTarget,
  type SimulationConfig,
} from '../simulation/types'

const FIRST_SCENARIO =
  SCENARIOS.find((s) => s.id === DEFAULT_SCENARIO_ID) ?? SCENARIOS[0]

interface TrackingState {
  scenarioId: string
  config: SimulationConfig
  compareMode: boolean
}

function readInitialTracking(): TrackingState {
  const decoded = decodeState<TrackingState>(readHashParams().get('tk'))
  if (decoded && decoded.config && decoded.scenarioId) return decoded
  return {
    scenarioId: FIRST_SCENARIO.id,
    config: FIRST_SCENARIO.config,
    compareMode: false,
  }
}

function cloneTargets(targets?: GroundTruthTarget[]): GroundTruthTarget[] | undefined {
  return targets?.map((t) => ({
    ...t,
    bbox: { ...t.bbox },
    velocity: { ...t.velocity },
  }))
}

function buildSim(
  config: SimulationConfig,
  algorithm: 'km' | 'greedy',
  initialTargets?: GroundTruthTarget[],
): TrackingSimulation {
  return new TrackingSimulation({ ...config, algorithm }, cloneTargets(initialTargets))
}

export function TrackingScene() {
  const initial = readInitialTracking()
  const initialScenario =
    SCENARIOS.find((s) => s.id === initial.scenarioId) ?? FIRST_SCENARIO
  const [scenarioId, setScenarioId] = useState<string>(initialScenario.id)
  const [config, setConfig] = useState<SimulationConfig>(initial.config)
  const [compareMode, setCompareMode] = useState(initial.compareMode)

  const simARef = useRef<TrackingSimulation>(
    buildSim(initial.config, 'km', initialScenario.buildTargets?.()),
  )
  const simBRef = useRef<TrackingSimulation | null>(
    initial.compareMode
      ? buildSim(initial.config, 'greedy', initialScenario.buildTargets?.())
      : null,
  )

  const [snapshotA, setSnapshotA] = useState<FrameSnapshot | null>(null)
  const [snapshotB, setSnapshotB] = useState<FrameSnapshot | null>(null)
  const [playing, setPlaying] = useState(false)
  const [fps, setFps] = useState(12)
  const [showTruth, setShowTruth] = useState(false)
  const [showFalsePositives, setShowFalsePositives] = useState(true)

  const currentScenario = useMemo(
    () => SCENARIOS.find((s) => s.id === scenarioId) ?? FIRST_SCENARIO,
    [scenarioId],
  )

  useEffect(() => {
    simARef.current.updateConfig({ ...config, algorithm: 'km' })
    if (simBRef.current) {
      simBRef.current.updateConfig({ ...config, algorithm: 'greedy' })
    }
  }, [config])

  useEffect(() => {
    writeHashParams((params) => {
      params.set('tk', encodeState({ scenarioId, config, compareMode }))
    })
  }, [scenarioId, config, compareMode])

  const rebuildSims = useCallback(
    (cfg: SimulationConfig, initial?: GroundTruthTarget[], compare = compareMode) => {
      simARef.current = buildSim(cfg, 'km', initial)
      simBRef.current = compare ? buildSim(cfg, 'greedy', initial) : null
      setSnapshotA(null)
      setSnapshotB(null)
    },
    [compareMode],
  )

  useEffect(() => {
    if (!playing) return
    const interval = Math.max(20, Math.round(1000 / fps))
    const id = window.setInterval(() => {
      const a = simARef.current.step()
      setSnapshotA(a)
      if (simBRef.current) {
        const b = simBRef.current.step()
        setSnapshotB(b)
      }
    }, interval)
    return () => window.clearInterval(id)
  }, [playing, fps])

  const stepOnce = useCallback(() => {
    const a = simARef.current.step()
    setSnapshotA(a)
    if (simBRef.current) {
      const b = simBRef.current.step()
      setSnapshotB(b)
    }
  }, [])

  const reset = useCallback(() => {
    setPlaying(false)
    rebuildSims(config, currentScenario.buildTargets?.())
  }, [config, currentScenario, rebuildSims])

  const applyScenario = useCallback(
    (id: string) => {
      const scenario = SCENARIOS.find((s) => s.id === id) ?? FIRST_SCENARIO
      setScenarioId(id)
      setConfig(scenario.config)
      setPlaying(false)
      rebuildSims(scenario.config, scenario.buildTargets?.())
    },
    [rebuildSims],
  )

  const toggleCompare = useCallback(
    (next: boolean) => {
      setCompareMode(next)
      setPlaying(false)
      const initial = currentScenario.buildTargets?.()
      simARef.current = buildSim(config, 'km', initial)
      simBRef.current = next ? buildSim(config, 'greedy', initial) : null
      setSnapshotA(null)
      setSnapshotB(null)
    },
    [config, currentScenario],
  )

  const patch = useCallback(
    <K extends keyof SimulationConfig>(key: K, value: SimulationConfig[K]) => {
      setConfig((prev) => ({ ...prev, [key]: value }))
    },
    [],
  )

  const bipartiteAssignment = useMemo(() => {
    if (!snapshotA) return undefined
    const n = snapshotA.preMatchTrackIds.length
    const ass: number[] = Array.from({ length: n }, () => -1)
    for (const { trackIdx, detectionIdx } of snapshotA.matches) {
      if (trackIdx < n) ass[trackIdx] = detectionIdx
    }
    return ass
  }, [snapshotA])

  const bipartiteLeftLabels = useMemo(
    () => snapshotA?.preMatchTrackIds.map((id) => `#${id}`) ?? [],
    [snapshotA],
  )

  const bipartiteRightLabels = useMemo(
    () => snapshotA?.preMatchDetectionIds.map((id) => `d${id}`) ?? [],
    [snapshotA],
  )

  return (
    <div className="grid lg:grid-cols-12 gap-6 p-6 max-w-[1400px] mx-auto">
      <div className="lg:col-span-8 space-y-6">
        <Card
          title={compareMode ? '场景 · KM vs 贪心' : '场景'}
          subtitle={
            compareMode
              ? '同 seed、同参数下两种算法并排运行'
              : '彩色框 = 轨迹 · 灰色框 = 检测 · 红色框 = 误检'
          }
          actions={
            <div className="flex items-center gap-2">
              <label className="inline-flex items-center gap-1.5 text-xs text-slate-500 cursor-pointer mr-2">
                <input
                  type="checkbox"
                  checked={compareMode}
                  onChange={(e) => toggleCompare(e.target.checked)}
                  className="accent-brand-600"
                />
                对比模式
              </label>
              <Button
                variant={playing ? 'danger' : 'primary'}
                onClick={() => setPlaying((p) => !p)}
              >
                {playing ? '暂停' : '播放'}
              </Button>
              <Button onClick={stepOnce} disabled={playing}>
                单步
              </Button>
              <Button variant="ghost" onClick={reset}>
                重置
              </Button>
            </div>
          }
        >
          {compareMode ? (
            <div className="grid grid-cols-2 gap-3">
              <ComparePane
                title="KM"
                snapshot={snapshotA}
                config={config}
                showTruth={showTruth}
                showFalsePositives={showFalsePositives}
                tone="primary"
              />
              <ComparePane
                title="贪心"
                snapshot={snapshotB}
                config={config}
                showTruth={showTruth}
                showFalsePositives={showFalsePositives}
                tone="muted"
              />
            </div>
          ) : (
            <>
              <div className="flex justify-center">
                <TrackingCanvas
                  snapshot={snapshotA}
                  config={config}
                  showTruth={showTruth}
                  showFalsePositives={showFalsePositives}
                />
              </div>
              <div className="grid sm:grid-cols-4 gap-3 mt-4 text-sm">
                <Metric label="帧" value={snapshotA?.frame ?? 0} />
                <Metric
                  label="活跃轨迹"
                  value={snapshotA?.metrics.activeTracks ?? 0}
                />
                <Metric
                  label="真值数"
                  value={snapshotA?.metrics.activeTruth ?? 0}
                />
                <Metric
                  label="ID 切换累计"
                  value={snapshotA?.metrics.idSwitches ?? 0}
                  tone={(snapshotA?.metrics.idSwitches ?? 0) > 0 ? 'warn' : 'normal'}
                />
              </div>
            </>
          )}
        </Card>

        {!compareMode && (
          <Card title="当前帧关联" subtitle="左 = 轨迹 · 右 = 检测 · 紫色 = 匹配">
            {snapshotA && snapshotA.costMatrix.length > 0 ? (
              <div className="flex justify-center overflow-auto">
                <BipartiteGraph
                  costs={snapshotA.costMatrix}
                  assignment={bipartiteAssignment}
                  leftLabels={bipartiteLeftLabels}
                  rightLabels={bipartiteRightLabels}
                  leftTitle="轨迹"
                  rightTitle="检测"
                  maximize={config.metric === 'iou'}
                  width={620}
                  height={Math.max(
                    280,
                    60 *
                      Math.max(
                        snapshotA.preMatchTrackIds.length,
                        snapshotA.preMatchDetectionIds.length,
                      ),
                  )}
                />
              </div>
            ) : (
              <p className="text-sm text-slate-400 text-center py-8">
                当前帧没有可关联的对象。
              </p>
            )}
          </Card>
        )}
      </div>

      <div className="lg:col-span-4 space-y-6">
        <Card title="场景预设" subtitle="一键加载典型情形">
          <div className="grid grid-cols-2 gap-2">
            {SCENARIOS.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => applyScenario(s.id)}
                className={`text-left px-3 py-2 rounded-md border transition-colors ${
                  scenarioId === s.id
                    ? 'border-brand-500 bg-brand-50 text-brand-700'
                    : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
                }`}
              >
                <div className="text-sm font-medium">{s.name}</div>
                <div className="text-xs text-slate-500 mt-0.5 leading-snug">
                  {s.description}
                </div>
              </button>
            ))}
          </div>
        </Card>

        <Card title="关联策略">
          <div className="space-y-3">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-medium text-slate-600">算法</span>
                {compareMode && (
                  <span className="text-[11px] text-slate-400">
                    对比模式下两侧固定为 KM / 贪心
                  </span>
                )}
              </div>
              <SegmentedControl
                value={config.algorithm}
                onChange={(v) => patch('algorithm', v)}
                options={[
                  { value: 'km', label: 'KM' },
                  { value: 'greedy', label: '贪心' },
                ]}
                className={compareMode ? 'opacity-40 pointer-events-none' : ''}
              />
            </div>
            <div>
              <div className="text-xs font-medium text-slate-600 mb-1.5">度量</div>
              <SegmentedControl
                value={config.metric}
                onChange={(v) => patch('metric', v)}
                options={[
                  { value: 'iou', label: 'IoU (max)' },
                  { value: 'distance', label: '距离 (min)' },
                ]}
              />
            </div>
            {config.metric === 'iou' ? (
              <Slider
                label="IoU 阈值"
                min={0}
                max={1}
                step={0.05}
                value={config.iouThreshold}
                display={config.iouThreshold.toFixed(2)}
                onChange={(v) => patch('iouThreshold', v)}
              />
            ) : (
              <Slider
                label="距离阈值 (px)"
                min={10}
                max={200}
                value={config.distanceThreshold}
                onChange={(v) => patch('distanceThreshold', v)}
              />
            )}
            <Slider
              label="最大丢失帧数"
              min={1}
              max={30}
              value={config.maxMissBeforeKill}
              onChange={(v) => patch('maxMissBeforeKill', v)}
            />
          </div>
        </Card>

        <Card title="检测器参数">
          <div className="space-y-3">
            <Slider
              label="目标数量"
              min={1}
              max={12}
              value={config.targetCount}
              onChange={(v) => patch('targetCount', v)}
            />
            <Slider
              label="位置噪声 σ (px)"
              min={0}
              max={30}
              value={config.positionNoise}
              onChange={(v) => patch('positionNoise', v)}
            />
            <Slider
              label="漏检概率"
              min={0}
              max={0.6}
              step={0.01}
              value={config.missProbability}
              display={`${(config.missProbability * 100).toFixed(0)}%`}
              onChange={(v) => patch('missProbability', v)}
            />
            <Slider
              label="误检率 (每帧)"
              min={0}
              max={3}
              step={0.1}
              value={config.falsePositiveRate}
              display={config.falsePositiveRate.toFixed(1)}
              onChange={(v) => patch('falsePositiveRate', v)}
            />
            <Slider
              label="目标出生概率"
              min={0}
              max={0.1}
              step={0.005}
              value={config.birthProbability}
              display={`${(config.birthProbability * 100).toFixed(1)}%`}
              onChange={(v) => patch('birthProbability', v)}
            />
            <Slider
              label="目标消失概率"
              min={0}
              max={0.05}
              step={0.001}
              value={config.deathProbability}
              display={`${(config.deathProbability * 100).toFixed(1)}%`}
              onChange={(v) => patch('deathProbability', v)}
            />
          </div>
        </Card>

        <Card title="渲染">
          <div className="space-y-3">
            <Slider
              label="播放速度 (FPS)"
              min={1}
              max={30}
              value={fps}
              onChange={setFps}
            />
            <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
              <input
                type="checkbox"
                checked={showTruth}
                onChange={(e) => setShowTruth(e.target.checked)}
                className="accent-brand-600"
              />
              显示真值（虚线）
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
              <input
                type="checkbox"
                checked={showFalsePositives}
                onChange={(e) => setShowFalsePositives(e.target.checked)}
                className="accent-brand-600"
              />
              显示误检（红色）
            </label>
            <div>
              <div className="text-xs font-medium text-slate-600 mb-1.5">
                随机种子
              </div>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={config.seed}
                  onChange={(e) => patch('seed', Number(e.target.value) || 0)}
                  className="flex-1 px-2 py-1 text-sm border border-slate-200 rounded focus:border-brand-500 focus:outline-none"
                />
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() =>
                    patch('seed', Math.floor(Math.random() * 0xffffff))
                  }
                >
                  随机
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}

function ComparePane({
  title,
  snapshot,
  config,
  showTruth,
  showFalsePositives,
  tone,
}: {
  title: string
  snapshot: FrameSnapshot | null
  config: SimulationConfig
  showTruth: boolean
  showFalsePositives: boolean
  tone: 'primary' | 'muted'
}) {
  const idSwitches = snapshot?.metrics.idSwitches ?? 0
  const titleClass =
    tone === 'primary'
      ? 'text-brand-700'
      : 'text-slate-700'
  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between">
        <span className={`text-sm font-semibold ${titleClass}`}>{title}</span>
        <span className="text-xs text-slate-500 tabular-nums">
          frame {snapshot?.frame ?? 0}
        </span>
      </div>
      <div className="flex justify-center">
        <TrackingCanvas
          snapshot={snapshot}
          config={config}
          showTruth={showTruth}
          showFalsePositives={showFalsePositives}
          displayScale={0.62}
        />
      </div>
      <div className="grid grid-cols-3 gap-2 text-xs">
        <Pill label="轨迹" value={snapshot?.metrics.activeTracks ?? 0} />
        <Pill label="真值" value={snapshot?.metrics.activeTruth ?? 0} />
        <Pill
          label="ID 切换"
          value={idSwitches}
          tone={idSwitches > 0 ? 'warn' : 'normal'}
        />
      </div>
    </div>
  )
}

function Pill({
  label,
  value,
  tone = 'normal',
}: {
  label: string
  value: number
  tone?: 'normal' | 'warn'
}) {
  return (
    <div className="rounded border border-slate-200 bg-slate-50 px-2 py-1">
      <div className="text-[10px] text-slate-500 uppercase">{label}</div>
      <div
        className={`text-base font-semibold tabular-nums ${
          tone === 'warn' ? 'text-rose-600' : 'text-slate-800'
        }`}
      >
        {value}
      </div>
    </div>
  )
}

function Metric({
  label,
  value,
  tone = 'normal',
}: {
  label: string
  value: number
  tone?: 'normal' | 'warn'
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
      <div className="text-[11px] text-slate-500 uppercase tracking-wide">
        {label}
      </div>
      <div
        className={`text-xl font-semibold tabular-nums ${
          tone === 'warn' ? 'text-rose-600' : 'text-slate-800'
        }`}
      >
        {value}
      </div>
    </div>
  )
}
