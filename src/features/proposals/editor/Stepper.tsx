import { Check } from 'lucide-react'
import { motion, useReducedMotion } from 'motion/react'

export interface StepDef {
  id: string
  label: string
}

export function Stepper({ steps, current, onSelect }: { steps: StepDef[]; current: number; onSelect: (index: number) => void }) {
  const shouldReduceMotion = useReducedMotion()
  const progresso = ((current + 1) / steps.length) * 100

  return (
    <div className="mb-6">
      <div className="mb-3 h-1.5 w-full overflow-hidden rounded-pill bg-line-soft">
        <motion.div
          className="h-full rounded-pill bg-sun"
          animate={{ width: `${progresso}%` }}
          transition={shouldReduceMotion ? { duration: 0.2 } : { type: 'spring', bounce: 0, duration: 0.4 }}
        />
      </div>
      <div className="flex gap-1 overflow-x-auto pb-1">
        {steps.map((step, i) => {
          const ativo = i === current
          const concluido = i < current
          return (
            <button
              key={step.id}
              onClick={() => onSelect(i)}
              className={`flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-pill px-3 py-1.5 text-xs font-bold transition-colors
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sun
                ${ativo ? 'bg-graphite text-ivory' : concluido ? 'bg-chip text-graphite' : 'text-muted'}`}
            >
              {concluido ? <Check className="h-3 w-3" aria-hidden /> : <span>{i + 1}.</span>}
              {step.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
