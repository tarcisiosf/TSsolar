import type { HTMLAttributes } from 'react'

export function Card({ className = '', children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`rounded-card bg-surface p-[18px] shadow-card md:p-6 ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}
