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

/** Logo padrão (public/logo.png, com "Energia Solar"). Para o cabeçalho usamos só a marca (sol + TS). */
export const LOGO_PADRAO = '/logo.png'

/** Escolhe a imagem da marca: a logo própria da empresa, se trocada nas Configurações, ou a marca
 * TS Solar — na versão clara para fundos escuros (`tone="dark"`). */
export function marcaDaEmpresa(logoUrl: string | null | undefined, tone: 'light' | 'dark' = 'light'): string {
  const personalizada = logoUrl && logoUrl !== LOGO_PADRAO ? logoUrl : null
  if (personalizada) return personalizada
  return tone === 'dark' ? '/logo-mark-dark.png' : '/logo-mark.png'
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
  const textColor = tone === 'dark' ? 'text-on-dark' : 'text-graphite'
  const subColor = tone === 'dark' ? 'text-muted-dark' : 'text-muted'

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <img src={marcaDaEmpresa(logoUrl, tone)} alt="TS Solar" className="h-10 w-auto shrink-0 object-contain" />
      <div className="leading-tight">
        <p className={`text-base font-extrabold ${textColor}`}>TS Solar</p>
        <p className={`text-[11px] ${subColor}`}>em parceria com TechSolar</p>
      </div>
    </div>
  )
}
