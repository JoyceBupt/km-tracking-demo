interface SliderProps {
  value: number
  min: number
  max: number
  step?: number
  onChange: (v: number) => void
  label?: string
  display?: string
  className?: string
}

export function Slider({
  value,
  min,
  max,
  step = 1,
  onChange,
  label,
  display,
  className = '',
}: SliderProps) {
  return (
    <label className={`block ${className}`}>
      {label && (
        <div className="flex items-baseline justify-between mb-1">
          <span className="text-xs font-medium text-slate-600">{label}</span>
          <span className="text-xs tabular-nums text-slate-500">
            {display ?? value}
          </span>
        </div>
      )}
      <input
        type="range"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-brand-600"
      />
    </label>
  )
}
