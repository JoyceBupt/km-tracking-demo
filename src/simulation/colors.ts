// 跟踪轨迹的颜色板。刻意避开了紫色域（violet / purple / fuchsia），
// 因为紫色在二部图视图中固定用于匹配边的语义色，避免视觉混淆。
const PALETTE = [
  '#0ea5e9', // sky
  '#10b981', // emerald
  '#f59e0b', // amber
  '#ef4444', // red
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#84cc16', // lime
  '#f97316', // orange
  '#14b8a6', // teal
  '#eab308', // yellow
  '#3b82f6', // blue
  '#22c55e', // green
]

export function colorForTrackId(id: number): string {
  return PALETTE[id % PALETTE.length]
}
