interface Option<T extends string> {
  value: T
  label: string
}

interface SegmentedControlProps<T extends string> {
  value: T
  options: Option<T>[]
  onChange: (v: T) => void
  className?: string
}

export function SegmentedControl<T extends string>({
  value,
  options,
  onChange,
  className = '',
}: SegmentedControlProps<T>) {
  return (
    <div
      className={`inline-flex rounded-md bg-slate-100 p-0.5 ${className}`}
      role="radiogroup"
    >
      {options.map((opt) => {
        const active = opt.value === value
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(opt.value)}
            className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
              active
                ? 'bg-white text-brand-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-800'
            }`}
          >
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}
