export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded-field bg-line-soft ${className}`} aria-hidden />
}

export function SkeletonCard() {
  return (
    <div className="rounded-card bg-surface p-[18px] shadow-card md:p-6">
      <Skeleton className="mb-3 h-4 w-24" />
      <Skeleton className="mb-2 h-7 w-32" />
      <Skeleton className="h-3 w-20" />
    </div>
  )
}

export function SkeletonRow() {
  return (
    <div className="flex items-center gap-4 rounded-card bg-surface p-4 shadow-card">
      <Skeleton className="h-10 w-10 rounded-full" />
      <div className="flex-1">
        <Skeleton className="mb-2 h-4 w-1/3" />
        <Skeleton className="h-3 w-1/4" />
      </div>
    </div>
  )
}
