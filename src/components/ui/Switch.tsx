import { useId } from 'react'

interface SwitchProps {
  label: string
  checked: boolean
  onChange: (checked: boolean) => void
  id?: string
  ariaLabel?: string
}

/** Switch acessível com alvo de toque de 44px mesmo com a trilha visual menor. */
export function Switch({ label, checked, onChange, id, ariaLabel }: SwitchProps) {
  const autoId = useId()
  const switchId = id ?? autoId

  return (
    <div className="flex min-h-11 items-center justify-between gap-3 py-1">
      <label htmlFor={switchId} className="text-sm font-semibold text-graphite">
        {label}
      </label>
      <button
        id={switchId}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={ariaLabel}
        onClick={() => onChange(!checked)}
        className={`relative flex h-11 w-11 shrink-0 items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sun focus-visible:ring-offset-2`}
      >
        <span className={`relative h-6 w-11 rounded-pill transition-colors ${checked ? 'bg-success' : 'bg-line'}`}>
          <span
            className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-card transition-transform ${checked ? 'translate-x-5' : 'translate-x-0.5'}`}
          />
        </span>
      </button>
    </div>
  )
}
