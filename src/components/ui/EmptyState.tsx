import type { LucideIcon } from 'lucide-react'
import { motion, useReducedMotion } from 'motion/react'
import { Button } from './Button'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
  actionLabel?: string
  onAction?: () => void
}

export function EmptyState({ icon: Icon, title, description, actionLabel, onAction }: EmptyStateProps) {
  const reduzir = useReducedMotion()
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.25 }}
      className="flex flex-col items-center justify-center gap-3 rounded-card border border-dashed border-line px-6 py-14 text-center"
    >
      <motion.div
        initial={reduzir ? false : { scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', bounce: 0.3, duration: 0.6, delay: 0.05 }}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-sun-soft"
      >
        <Icon className="h-6 w-6 text-sun-ink" strokeWidth={2} aria-hidden />
      </motion.div>
      <p className="text-base font-bold text-graphite">{title}</p>
      <p className="max-w-xs text-sm text-muted">{description}</p>
      {actionLabel && onAction && (
        <Button variant="primary" onClick={onAction} className="mt-2">
          {actionLabel}
        </Button>
      )}
    </motion.div>
  )
}
