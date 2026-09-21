import { motion, useReducedMotion } from 'motion/react'
import { useId } from 'react'

interface SegmentedOption<T extends string> {
  value: T
  label: string
}

interface SegmentedProps<T extends string> {
  options: SegmentedOption<T>[]
  value: T
  onChange: (value: T) => void
  'aria-label': string
  size?: 'sm' | 'md'
}

export function Segmented<T extends string>({ options, value, onChange, size = 'md', ...props }: SegmentedProps<T>) {
  const layoutId = useId()
  const shouldReduceMotion = useReducedMotion()

  return (
    <div
      role="radiogroup"
      aria-label={props['aria-label']}
      className="inline-flex rounded-pill bg-[#EDE8DE] p-1 gap-1"
    >
      {options.map((option) => {
        const active = option.value === value
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(option.value)}
            className={`relative rounded-pill font-bold transition-colors
              ${size === 'sm' ? 'px-3 py-1.5 text-xs' : 'px-4 py-2 text-sm'}
              ${active ? 'text-graphite' : 'text-muted hover:text-graphite'}
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sun`}
          >
            {active && (
              <motion.span
                layoutId={`segmented-${layoutId}`}
                className="absolute inset-0 rounded-pill bg-white shadow-segment"
                transition={shouldReduceMotion ? { duration: 0.15 } : { type: 'spring', bounce: 0, duration: 0.35 }}
              />
            )}
            <span className="relative z-10">{option.label}</span>
          </button>
        )
      })}
    </div>
  )
}
