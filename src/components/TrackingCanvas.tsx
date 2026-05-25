import { useEffect, useRef } from 'react'
import type { FrameSnapshot, SimulationConfig } from '../simulation/types'

interface TrackingCanvasProps {
  snapshot: FrameSnapshot | null
  config: SimulationConfig
  showTruth: boolean
  showFalsePositives: boolean
  className?: string
}

export function TrackingCanvas({
  snapshot,
  config,
  showTruth,
  showFalsePositives,
  className,
}: TrackingCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const dpr = window.devicePixelRatio || 1
    canvas.width = config.width * dpr
    canvas.height = config.height * dpr
    canvas.style.width = `${config.width}px`
    canvas.style.height = `${config.height}px`
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    draw(ctx, snapshot, config, showTruth, showFalsePositives)
  }, [snapshot, config, showTruth, showFalsePositives])

  return (
    <canvas
      ref={canvasRef}
      className={`bg-slate-50 rounded-lg border border-slate-200 ${className ?? ''}`}
    />
  )
}

function draw(
  ctx: CanvasRenderingContext2D,
  snap: FrameSnapshot | null,
  config: SimulationConfig,
  showTruth: boolean,
  showFalsePositives: boolean,
) {
  const { width, height } = config
  ctx.clearRect(0, 0, width, height)
  ctx.fillStyle = '#f8fafc'
  ctx.fillRect(0, 0, width, height)
  ctx.strokeStyle = '#e2e8f0'
  ctx.lineWidth = 1
  for (let x = 60; x < width; x += 60) {
    ctx.beginPath()
    ctx.moveTo(x + 0.5, 0)
    ctx.lineTo(x + 0.5, height)
    ctx.stroke()
  }
  for (let y = 60; y < height; y += 60) {
    ctx.beginPath()
    ctx.moveTo(0, y + 0.5)
    ctx.lineTo(width, y + 0.5)
    ctx.stroke()
  }

  if (!snap) {
    ctx.fillStyle = '#94a3b8'
    ctx.font = "500 14px system-ui, -apple-system, 'Segoe UI', sans-serif"
    ctx.textAlign = 'center'
    ctx.fillText('点击"单步"或"播放"开始模拟', width / 2, height / 2)
    return
  }

  if (showTruth) {
    ctx.strokeStyle = 'rgba(15, 23, 42, 0.25)'
    ctx.setLineDash([4, 4])
    ctx.lineWidth = 1
    for (const t of snap.groundTruth) {
      ctx.strokeRect(
        t.bbox.cx - t.bbox.w / 2,
        t.bbox.cy - t.bbox.h / 2,
        t.bbox.w,
        t.bbox.h,
      )
    }
    ctx.setLineDash([])
  }

  for (const det of snap.detections) {
    if (det.isFalsePositive && !showFalsePositives) continue
    ctx.strokeStyle = det.isFalsePositive
      ? 'rgba(244, 63, 94, 0.5)'
      : 'rgba(100, 116, 139, 0.55)'
    ctx.fillStyle = det.isFalsePositive
      ? 'rgba(244, 63, 94, 0.08)'
      : 'rgba(148, 163, 184, 0.08)'
    ctx.lineWidth = 1.2
    ctx.fillRect(
      det.bbox.cx - det.bbox.w / 2,
      det.bbox.cy - det.bbox.h / 2,
      det.bbox.w,
      det.bbox.h,
    )
    ctx.strokeRect(
      det.bbox.cx - det.bbox.w / 2,
      det.bbox.cy - det.bbox.h / 2,
      det.bbox.w,
      det.bbox.h,
    )
  }

  for (const tracklet of snap.tracklets) {
    if (tracklet.history.length < 2) continue
    ctx.strokeStyle = tracklet.color
    ctx.lineWidth = 2
    ctx.globalAlpha = 0.55
    ctx.beginPath()
    const h = tracklet.history
    ctx.moveTo(h[0].x, h[0].y)
    for (let i = 1; i < h.length; i++) ctx.lineTo(h[i].x, h[i].y)
    ctx.stroke()
    ctx.globalAlpha = 1
  }

  ctx.font = "600 11px system-ui, -apple-system, 'Segoe UI', sans-serif"
  ctx.textAlign = 'left'
  for (const tracklet of snap.tracklets) {
    ctx.strokeStyle = tracklet.color
    ctx.lineWidth = 2
    ctx.strokeRect(
      tracklet.bbox.cx - tracklet.bbox.w / 2,
      tracklet.bbox.cy - tracklet.bbox.h / 2,
      tracklet.bbox.w,
      tracklet.bbox.h,
    )

    ctx.fillStyle = tracklet.color
    ctx.beginPath()
    ctx.arc(tracklet.bbox.cx, tracklet.bbox.cy, 3.5, 0, Math.PI * 2)
    ctx.fill()

    const label = `#${tracklet.trackId}`
    const labelW = ctx.measureText(label).width + 8
    const labelH = 16
    const lx = tracklet.bbox.cx - tracklet.bbox.w / 2
    const ly = tracklet.bbox.cy - tracklet.bbox.h / 2 - labelH - 2
    ctx.fillStyle = tracklet.color
    ctx.fillRect(lx, ly, labelW, labelH)
    ctx.fillStyle = '#ffffff'
    ctx.fillText(label, lx + 4, ly + 11)
  }

  ctx.fillStyle = 'rgba(255, 255, 255, 0.85)'
  ctx.fillRect(8, 8, 110, 22)
  ctx.strokeStyle = '#e2e8f0'
  ctx.strokeRect(8.5, 8.5, 110, 22)
  ctx.fillStyle = '#0f172a'
  ctx.font = "600 12px system-ui, -apple-system, 'Segoe UI', sans-serif"
  ctx.fillText(`frame ${snap.frame}`, 14, 24)
}
