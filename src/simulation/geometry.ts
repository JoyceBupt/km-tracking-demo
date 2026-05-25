import type { BBox, Vec2 } from './types'

export function iou(a: BBox, b: BBox): number {
  const ax1 = a.cx - a.w / 2
  const ay1 = a.cy - a.h / 2
  const ax2 = a.cx + a.w / 2
  const ay2 = a.cy + a.h / 2
  const bx1 = b.cx - b.w / 2
  const by1 = b.cy - b.h / 2
  const bx2 = b.cx + b.w / 2
  const by2 = b.cy + b.h / 2
  const interW = Math.max(0, Math.min(ax2, bx2) - Math.max(ax1, bx1))
  const interH = Math.max(0, Math.min(ay2, by2) - Math.max(ay1, by1))
  const interArea = interW * interH
  const unionArea = a.w * a.h + b.w * b.h - interArea
  return unionArea <= 0 ? 0 : interArea / unionArea
}

export function distance(a: BBox, b: BBox): number {
  const dx = a.cx - b.cx
  const dy = a.cy - b.cy
  return Math.sqrt(dx * dx + dy * dy)
}

export function centroid(b: BBox): Vec2 {
  return { x: b.cx, y: b.cy }
}
