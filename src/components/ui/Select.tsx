import { useId, type SelectHTMLAttributes } from 'react'

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string
  hideLabel?: boolean
  options: { value: string; label: string }[]
}

export function Select({ label, hideLabel, options, id, className = '', ...props }: SelectProps) {
  const autoId = useId()
  const selectId = id ?? autoId

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={selectId} className={hideLabel ? 'sr-only' : 'text-sm font-semibold text-graphite'}>
        {label}
      </label>
      <select
        id={selectId}
        className={`h-12 w-full rounded-field border border-[#D9D3C7] bg-surface px-4 text-[0.9375rem] text-graphite
          outline-none focus:ring-2 focus:ring-sun focus:border-sun ${className}`}
        {...props}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  )
}
