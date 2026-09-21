/** Sol âmbar (círculo + 8 raios) — fallback do logo quando a empresa não tem um arquivo configurado. */
export function SunLogo({ size = 28, className = '' }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      className={className}
      aria-hidden
    >
      <circle cx="16" cy="16" r="7" fill="#F2A516" />
      {Array.from({ length: 8 }).map((_, i) => {
        const angle = (i * Math.PI) / 4
        const x1 = 16 + Math.cos(angle) * 11
        const y1 = 16 + Math.sin(angle) * 11
        const x2 = 16 + Math.cos(angle) * 15
        const y2 = 16 + Math.sin(angle) * 15
        return (
          <line
            key={i}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke="#F2A516"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        )
      })}
    </svg>
  )
}

export function BrandLogo({
  logoUrl,
  tone = 'light',
  className = '',
}: {
  logoUrl?: string | null
  tone?: 'light' | 'dark'
  className?: string
}) {
  const textColor = tone === 'dark' ? 'text-ivory' : 'text-graphite'
  const subColor = tone === 'dark' ? 'text-muted-dark' : 'text-muted'

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      {logoUrl ? (
        <img src={logoUrl} alt="TS Solar" className="h-8 w-8 rounded-full object-cover" />
      ) : (
        <SunLogo size={28} />
      )}
      <div className="leading-tight">
        <p className={`text-base font-extrabold ${textColor}`}>TS Solar</p>
        <p className={`text-[11px] ${subColor}`}>em parceria com TechSolar</p>
      </div>
    </div>
  )
}
