import type { LucideIcon } from 'lucide-react'
import { Button } from './Button'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
  actionLabel?: string
  onAction?: () => void
}

export function EmptyState({ icon: Icon, title, description, actionLabel, onAction }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-card border border-dashed border-line px-6 py-14 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-chip">
        <Icon className="h-6 w-6 text-muted" strokeWidth={2} aria-hidden />
      </div>
      <p className="text-base font-bold text-graphite">{title}</p>
      <p className="max-w-xs text-sm text-muted">{description}</p>
      {actionLabel && onAction && (
        <Button variant="primary" onClick={onAction} className="mt-2">
          {actionLabel}
        </Button>
      )}
    </div>
  )
}
