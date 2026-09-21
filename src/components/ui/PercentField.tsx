import { Input } from './Input'

interface PercentFieldProps {
  label: string
  value: number // fração, ex.: 0.06
  onChange: (fracao: number) => void
  hint?: string
  id?: string
}

/** Campo de percentual: guarda fração (0.06) mas exibe/edita em % (6). */
export function PercentField({ label, value, onChange, hint, id }: PercentFieldProps) {
  return (
    <Input
      id={id}
      label={label}
      type="number"
      inputMode="decimal"
      step="0.01"
      suffix="%"
      hint={hint}
      value={Number.isFinite(value) ? Number((value * 100).toFixed(4)) : 0}
      onChange={(e) => {
        const percentual = e.target.value === '' ? 0 : parseFloat(e.target.value)
        onChange(percentual / 100)
      }}
    />
  )
}
