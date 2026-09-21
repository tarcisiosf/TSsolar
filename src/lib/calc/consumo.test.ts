import { describe, expect, it } from 'vitest'
import { calcularConsumoMedioMensal, sugerirTarifa } from './consumo'

describe('calcularConsumoMedioMensal', () => {
  it('usa a média dos 12 meses quando informados', () => {
    const meses = [500, 500, 500, 500, 500, 500, 500, 500, 500, 500, 500, 700]
    expect(calcularConsumoMedioMensal({ consumoMedioKwh: null, consumoMensalKwh: meses })).toBeCloseTo(516.67, 1)
  })

  it('usa o consumo médio informado quando não há os 12 meses', () => {
    expect(calcularConsumoMedioMensal({ consumoMedioKwh: 450, consumoMensalKwh: null })).toBe(450)
  })

  it('retorna 0 quando nada foi informado', () => {
    expect(calcularConsumoMedioMensal({ consumoMedioKwh: null, consumoMensalKwh: null })).toBe(0)
  })
})

describe('sugerirTarifa', () => {
  it('divide a conta atual pelo consumo médio', () => {
    expect(sugerirTarifa(495, 500)).toBeCloseTo(0.99, 2)
  })

  it('retorna null quando o consumo é zero', () => {
    expect(sugerirTarifa(495, 0)).toBeNull()
  })
})
