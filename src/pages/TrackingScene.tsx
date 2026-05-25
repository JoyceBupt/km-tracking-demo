import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { BipartiteGraph } from '../components/BipartiteGraph'
import { TrackingCanvas } from '../components/TrackingCanvas'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { SegmentedControl } from '../components/ui/SegmentedControl'
import { Slider } from '../components/ui/Slider'
import { TrackingSimulation } from '../simulation/engine'
import { DEFAULT_CONFIG, type FrameSnapshot, type SimulationConfig } from '../simulation/types'

export function TrackingScene() {
  const [config, setConfig] = useState<SimulationConfig>(DEFAULT_CONFIG)
  const simRef = useRef<TrackingSimulation>(new TrackingSimulation(config))
  const [snapshot, setSnapshot] = useState<FrameSnapshot | null>(null)
  const [playing, setPlaying] = useState(false)
  const [fps, setFps] = useState(12)
  const [showTruth, setShowTruth] = useState(false)
  const [showFalsePositives, setShowFalsePositives] = useState(true)

  useEffect(() => {
    simRef.current.updateConfig(config)
  }, [config])

  useEffect(() => {
    if (!playing) return
    const id = window.setInterval(() => {
      const snap = simRef.current.step()
      setSnapshot(snap)
    }, Math.max(20, Math.round(1000 / fps)))
    return () => window.clearInterval(id)
  }, [playing, fps])

  const stepOnce = useCallback(() => {
    const snap = simRef.current.step()
    setSnapshot(snap)
  }, [])

  const reset = useCallback(() => {
    setPlaying(false)
    simRef.current.reset(config)
    setSnapshot(null)
  }, [config])

  const patch = useCallback(<K extends keyof SimulationConfig>(key: K, value: SimulationConfig[K]) => {
    setConfig((prev) => ({ ...prev, [key]: value }))
  }, [])

  const bipartiteAssignment = useMemo(() => {
    if (!snapshot) return undefined
    const n = snapshot.preMatchTrackIds.length
    const ass = new Array<number>(n).fill(-1)
    for (const { trackIdx, detectionIdx } of snapshot.matches) {
      if (trackIdx < n) ass[trackIdx] = detectionIdx
    }
    return ass
  }, [snapshot])

  const bipartiteLeftLabels = useMemo(
    () => snapshot?.preMatchTrackIds.map((id) => `#${id}`) ?? [],
    [snapshot],
  )

  const bipartiteRightLabels = useMemo(
    () => snapshot?.preMatchDetectionIds.map((id) => `d${id}`) ?? [],
    [snapshot],
  )

  return (
    <div className="grid lg:grid-cols-12 gap-6 p-6 max-w-[1400px] mx-auto">
      <div className="lg:col-span-8 space-y-6">
        <Card
          title="跟踪场景"
          subtitle="彩色框 = 跟踪轨迹，灰色框 = 模拟检测，红色框 = 误检"
          actions={
            <div className="flex items-center gap-2">
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
          <div className="flex justify-center">
            <TrackingCanvas
              snapshot={snapshot}
              config={config}
              showTruth={showTruth}
              showFalsePositives={showFalsePositives}
            />
          </div>
          <div className="grid sm:grid-cols-4 gap-3 mt-4 text-sm">
            <Metric label="帧" value={snapshot?.frame ?? 0} />
            <Metric
              label="活跃轨迹"
              value={snapshot?.metrics.activeTracks ?? 0}
            />
            <Metric
              label="真值数"
              value={snapshot?.metrics.activeTruth ?? 0}
            />
            <Metric
              label="ID 切换累计"
              value={snapshot?.metrics.idSwitches ?? 0}
              tone={
                (snapshot?.metrics.idSwitches ?? 0) > 0 ? 'warn' : 'normal'
              }
            />
          </div>
        </Card>

        <Card title="当前帧关联（二部图）" subtitle="左部为已有轨迹，右部为本帧检测，紫色边为算法输出的匹配">
          {snapshot && snapshot.costMatrix.length > 0 ? (
            <div className="flex justify-center overflow-auto">
              <BipartiteGraph
                costs={snapshot.costMatrix}
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
                      snapshot.preMatchTrackIds.length,
                      snapshot.preMatchDetectionIds.length,
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
      </div>

      <div className="lg:col-span-4 space-y-6">
        <Card title="关联策略">
          <div className="space-y-3">
            <div>
              <div className="text-xs font-medium text-slate-600 mb-1.5">算法</div>
              <SegmentedControl
                value={config.algorithm}
                onChange={(v) => patch('algorithm', v)}
                options={[
                  { value: 'km', label: 'KM' },
                  { value: 'greedy', label: '贪心' },
                ]}
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
