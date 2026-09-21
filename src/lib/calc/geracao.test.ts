import { describe, expect, it } from 'vitest'
import { fatorDegradacao, gerarGeracaoMensal } from './geracao'

describe('fatorDegradacao', () => {
  it('é 1 no ano 1', () => {
    expect(fatorDegradacao(1, 0.005)).toBe(1)
  })

  it('reduz de forma composta a cada ano', () => {
    expect(fatorDegradacao(3, 0.005)).toBeCloseTo(Math.pow(0.995, 2), 6)
  })
})

describe('gerarGeracaoMensal', () => {
  const distribuicao = [1.042, 1.052, 0.974, 0.954, 0.9, 0.867, 0.906, 1.081, 1.061, 1.067, 1.026, 1.048]

  it('distribui a geração anual pelos fatores mensais no ano 1', () => {
    const meses = gerarGeracaoMensal(5, 1400, distribuicao, 1, 0.005)
    expect(meses).toHaveLength(12)
    // 5 kWp * 1400 kWh/kWp/ano / 12 * 1.042
    expect(meses[0]).toBeCloseTo((5 * 1400) / 12 * 1.042, 3)
  })

  it('aplica a degradação acumulada em anos futuros', () => {
    const ano1 = gerarGeracaoMensal(5, 1400, distribuicao, 1, 0.005)
    const ano5 = gerarGeracaoMensal(5, 1400, distribuicao, 5, 0.005)
    expect(ano5[0]).toBeLessThan(ano1[0])
  })
})
