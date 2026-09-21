import { useId, useState, type FocusEvent } from 'react'
import { onlyDigits } from '@/lib/format'

interface MoneyInputProps {
  label: string
  value: number
  onChange: (valor: number) => void
  error?: string
  hint?: string
  id?: string
  disabled?: boolean
}

function centavosParaTexto(centavos: number): string {
  const reais = centavos / 100
  return reais.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

/** Campo de dinheiro com máscara R$ 0.000,00 — digita-se da direita para a esquerda, como em caixas eletrônicos. */
export function MoneyInput({ label, value, onChange, error, hint, id, disabled }: MoneyInputProps) {
  const autoId = useId()
  const inputId = id ?? autoId
  const [texto, setTexto] = useState(() => centavosParaTexto(Math.round(value * 100)))
  const [focado, setFocado] = useState(false)

  function sincronizarComValorExterno() {
    setTexto(centavosParaTexto(Math.round(value * 100)))
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const digitos = onlyDigits(e.target.value)
    const centavos = digitos === '' ? 0 : parseInt(digitos, 10)
    setTexto(centavosParaTexto(centavos))
    onChange(centavos / 100)
  }

  function handleFocus() {
    setFocado(true)
  }

  function handleBlur(_e: FocusEvent<HTMLInputElement>) {
    setFocado(false)
    sincronizarComValorExterno()
  }

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={inputId} className="text-sm font-semibold text-graphite">
        {label}
      </label>
      <div className="relative">
        <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm text-muted tabular-nums">
          R$
        </span>
        <input
          id={inputId}
          inputMode="numeric"
          disabled={disabled}
          value={focado || texto !== '0,00' ? texto : ''}
          placeholder="0,00"
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          aria-invalid={!!error}
          className={`h-12 w-full rounded-field border bg-surface pl-10 pr-4 text-[0.9375rem] text-graphite
            tabular-nums outline-none transition-shadow
            focus:ring-2 focus:ring-sun focus:border-sun
            ${error ? 'border-danger' : 'border-[#D9D3C7]'}
            ${disabled ? 'opacity-60' : ''}`}
        />
      </div>
      {error && <p className="text-xs font-medium text-danger">{error}</p>}
      {!error && hint && <p className="text-xs text-muted">{hint}</p>}
    </div>
  )
}
