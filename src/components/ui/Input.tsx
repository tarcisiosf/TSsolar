import { forwardRef, useId, type InputHTMLAttributes } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
  hint?: string
  suffix?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, suffix, id, className = '', ...props }, ref) => {
    const autoId = useId()
    const inputId = id ?? autoId

    return (
      <div className="flex flex-col gap-1.5">
        <label htmlFor={inputId} className="text-sm font-semibold text-graphite">
          {label}
        </label>
        <div className="relative">
          <input
            id={inputId}
            ref={ref}
            aria-invalid={!!error}
            aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
            className={`h-12 w-full rounded-field border bg-surface px-4 text-[0.9375rem] text-graphite
              placeholder:text-muted/70 outline-none transition-shadow
              focus:ring-2 focus:ring-sun focus:border-sun
              ${error ? 'border-danger' : 'border-[#D9D3C7]'}
              ${suffix ? 'pr-14' : ''} ${className}`}
            {...props}
          />
          {suffix && (
            <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm text-muted">
              {suffix}
            </span>
          )}
        </div>
        {error && (
          <p id={`${inputId}-error`} className="text-xs font-medium text-danger">
            {error}
          </p>
        )}
        {!error && hint && (
          <p id={`${inputId}-hint`} className="text-xs text-muted">
            {hint}
          </p>
        )}
      </div>
    )
  },
)
Input.displayName = 'Input'
