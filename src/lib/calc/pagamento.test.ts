import { describe, expect, it } from 'vitest'
import { calcularPMT, simularPagamento } from './pagamento'

describe('calcularPMT', () => {
  it('calcula a parcela pela Tabela Price', () => {
    // PV=1000, i=1%, n=12 -> PMT ≈ 88.85
    expect(calcularPMT(1000, 0.01, 12)).toBeCloseTo(88.85, 1)
  })

  it('divide igualmente quando a taxa é zero', () => {
    expect(calcularPMT(1200, 0, 12)).toBe(100)
  })
})

describe('simularPagamento', () => {
  it('sinaliza quando o financiamento fica menor que a conta atual', () => {
    const resultado = simularPagamento(15000, 0.0099, 12, 0.0149, 60, 500)
    expect(resultado.parcelaFinanciamento).toBeLessThan(500)
    expect(resultado.financiamentoMenorQueContaAtual).toBe(true)
  })

  it('não sinaliza quando não há conta atual informada', () => {
    const resultado = simularPagamento(15000, 0.0099, 12, 0.0149, 60, null)
    expect(resultado.financiamentoMenorQueContaAtual).toBe(false)
  })
})
