import type { ReactNode } from 'react'
import { Reveal } from '@/components/motion/Motion'

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <Reveal y={8} className="mb-6 flex flex-wrap items-center justify-between gap-4">
      <div>
        <h1 className="text-[2.125rem] font-extrabold leading-[1.1] tracking-[-0.03em] text-graphite">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
      </div>
      {action}
    </Reveal>
  )
}
