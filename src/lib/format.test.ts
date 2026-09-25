import { describe, expect, it } from 'vitest'
import {
  formatDataPorExtenso,
  formatDecimalBR,
  formatPayback,
  plural,
} from './format'

describe('formatDecimalBR', () => {
  it('trims trailing zeros', () => {
    expect(formatDecimalBR(4)).toBe('4')
  })

  it('keeps meaningful decimals with a comma', () => {
    expect(formatDecimalBR(2.25)).toBe('2,25')
  })

  it('caps at the given number of decimals', () => {
    expect(formatDecimalBR(2.256, 2)).toBe('2,26')
  })
})

describe('plural', () => {
  it('usa singular quando n é 1', () => {
    expect(plural(1, 'unidade', 'unidades')).toBe('unidade')
  })
  it('usa plural para qualquer outro valor, incluindo 0', () => {
    expect(plural(0, 'unidade', 'unidades')).toBe('unidades')
    expect(plural(2, 'unidade', 'unidades')).toBe('unidades')
  })
})

describe('formatPayback', () => {
  it('formata em anos e meses', () => {
    expect(formatPayback(29)).toBe('2 anos e 5 meses')
  })
  it('formata múltiplos exatos de 12 sem "e 0 meses" incorreto', () => {
    expect(formatPayback(24)).toBe('2 anos e 0 meses')
  })
  it('null vira "fora do horizonte"', () => {
    expect(formatPayback(null)).toBe('fora do horizonte de 25 anos')
  })
})

describe('formatDataPorExtenso', () => {
  it('formata a data por extenso em português', () => {
    expect(formatDataPorExtenso(new Date(2026, 8, 23))).toBe('23 de setembro de 2026')
  })
})
