import { format as formatDate } from 'date-fns'
import { ptBR } from 'date-fns/locale'

const brl = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
})

const brlSemCentavos = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  maximumFractionDigits: 0,
})

export function formatBRL(valor: number, comCentavos = true): string {
  return comCentavos ? brl.format(valor) : brlSemCentavos.format(valor)
}

export function formatNumber(valor: number, casasDecimais = 0): string {
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: casasDecimais,
    maximumFractionDigits: casasDecimais,
  }).format(valor)
}

export function formatDecimalBR(valor: number, maxCasas = 2): string {
  return valor.toLocaleString('pt-BR', { maximumFractionDigits: maxCasas })
}

export function formatKwp(valor: number): string {
  return `${formatNumber(valor, 2)} kWp`
}

export function formatKwh(valor: number): string {
  return `${formatNumber(valor, 0)} kWh`
}

export function formatPercent(valor: number, casasDecimais = 0): string {
  return `${formatNumber(valor * 100, casasDecimais)}%`
}

export function formatDateBR(data: Date): string {
  return formatDate(data, 'dd/MM/yyyy', { locale: ptBR })
}

export function formatDateTimeBR(data: Date): string {
  return formatDate(data, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
}

export function onlyDigits(valor: string): string {
  return valor.replace(/\D/g, '')
}

/** "1 unidade" vs "2 unidades" — devolve a forma certa conforme a quantidade. */
export function plural(n: number, singular: string, pluralForm: string): string {
  return n === 1 ? singular : pluralForm
}

/** "2 anos e 5 meses" — nunca só anos. `null` = fora do horizonte considerado. */
export function formatPayback(meses: number | null): string {
  if (meses == null) return 'fora do horizonte de 25 anos'
  return `${Math.floor(meses / 12)} anos e ${meses % 12} meses`
}

/** "23 de setembro de 2026" — usado no fechamento do documento da proposta. */
export function formatDataPorExtenso(data: Date): string {
  return formatDate(data, "d 'de' MMMM 'de' yyyy", { locale: ptBR })
}
