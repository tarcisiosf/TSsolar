import { useId, useState, type FocusEvent } from 'react'

interface DecimalInputProps {
  label: string
  value: number | null
  onChange: (valor: number | null) => void
  suffix?: string
  integer?: boolean
  casasDecimais?: number
  error?: string
  hint?: string
  id?: string
}

function paraTexto(valor: number | null, integer: boolean, casasDecimais: number): string {
  if (valor === null) return ''
  return integer ? String(Math.round(valor)) : valor.toLocaleString('pt-BR', { maximumFractionDigits: casasDecimais })
}

/** Campo numérico com vírgula decimal (padrão brasileiro) — inteiro ou decimal, com sufixo opcional. */
export function DecimalInput({ label, value, onChange, suffix, integer = false, casasDecimais = 2, error, hint, id }: DecimalInputProps) {
  const autoId = useId()
  const inputId = id ?? autoId
  const [texto, setTexto] = useState(() => paraTexto(value, integer, casasDecimais))
  const [focado, setFocado] = useState(false)

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const bruto = e.target.value
    const limpo = integer ? bruto.replace(/[^\d]/g, '') : bruto.replace(/[^\d,]/g, '').replace(/(,.*),/g, '$1')
    setTexto(limpo)
    if (limpo === '') {
      onChange(null)
      return
    }
    const numerico = integer ? parseInt(limpo, 10) : parseFloat(limpo.replace(',', '.'))
    onChange(Number.isNaN(numerico) ? null : numerico)
  }

  function handleBlur(_e: FocusEvent<HTMLInputElement>) {
    setFocado(false)
    setTexto(paraTexto(value, integer, casasDecimais))
  }

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={inputId} className="text-sm font-semibold text-graphite">
        {label}
      </label>
      <div className="relative">
        <input
          id={inputId}
          inputMode={integer ? 'numeric' : 'decimal'}
          value={focado ? texto : paraTexto(value, integer, casasDecimais)}
          placeholder={integer ? '0' : '0,00'}
          onChange={handleChange}
          onFocus={() => setFocado(true)}
          onBlur={handleBlur}
          aria-invalid={!!error}
          className={`h-12 w-full rounded-field border bg-surface px-4 text-[0.9375rem] text-graphite
            tabular-nums outline-none transition-shadow
            focus:ring-2 focus:ring-sun focus:border-sun
            ${error ? 'border-danger' : 'border-[#D9D3C7]'}
            ${suffix ? 'pr-14' : ''}`}
        />
        {suffix && (
          <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm text-muted">{suffix}</span>
        )}
      </div>
      {error && <p className="text-xs font-medium text-danger">{error}</p>}
      {!error && hint && <p className="text-xs text-muted">{hint}</p>}
    </div>
  )
}
