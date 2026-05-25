const PALETTE = [
  '#7c3aed', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444',
  '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#8b5cf6',
  '#14b8a6', '#eab308', '#3b82f6', '#a855f7', '#22c55e',
]

export function colorForTrackId(id: number): string {
  return PALETTE[id % PALETTE.length]
}
