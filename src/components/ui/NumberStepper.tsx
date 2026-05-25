interface NumberStepperProps {
  value: number
  min?: number
  max?: number
  onChange: (next: number) => void
  label?: string
}

export function NumberStepper({ value, min = -Infinity, max = Infinity, onChange, label }: NumberStepperProps) {
  return (
    <div className="inline-flex items-center gap-2">
      {label && <span className="text-xs text-slate-500">{label}</span>}
      <div className="inline-flex items-center border border-slate-200 rounded-md overflow-hidden">
        <button
          type="button"
          onClick={() => onChange(Math.max(min, value - 1))}
          className="px-2 py-0.5 text-slate-600 hover:bg-slate-100 disabled:opacity-30"
          disabled={value <= min}
          aria-label="decrease"
        >
          −
        </button>
        <span className="px-3 py-0.5 text-sm font-medium tabular-nums">{value}</span>
        <button
          type="button"
          onClick={() => onChange(Math.min(max, value + 1))}
          className="px-2 py-0.5 text-slate-600 hover:bg-slate-100 disabled:opacity-30"
          disabled={value >= max}
          aria-label="increase"
        >
          +
        </button>
      </div>
    </div>
  )
}
