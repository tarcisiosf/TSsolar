import { describe, expect, it } from 'vitest'
import { calcularCenario, calcularCustoKwhGerado } from './cenarios'
import type { CenarioParams } from './cenarios'

const baseParams: CenarioParams = {
  consumoMensalKwh: new Array(12).fill(500),
  potenciaKwp: 4.29,
  produtividadeKwhKwpAno: 1400,
  distribuicaoMensal: [1.042, 1.052, 0.974, 0.954, 0.9, 0.867, 0.906, 1.081, 1.061, 1.067, 1.026, 1.048],
  tarifaKwh: 0.99,
  fioBKwh: 0.28,
  fioBPercentualPorAno: { '2026': 0.6, '2027': 0.75, '2028': 0.9, '2029': 1.0 },
  anoCalendarioInicial: 2026,
  fatorSimultaneidade: 0.3,
  ligacao: 'mono',
  custoDisponibilidadeKwh: { mono: 30, bi: 50, tri: 100 },
  iluminacaoPublica: 0,
  reajusteAnual: 0.06,
  degradacaoAnual: 0.005,
  horizonteAnos: 25,
  precoFinal: 18990,
}

describe('calcularCenario', () => {
  it('gera economia positiva no ano 1 quando o sistema cobre bem o consumo', () => {
    const resultado = calcularCenario(baseParams)
    expect(resultado.economiaAno1).toBeGreaterThan(0)
    expect(resultado.fluxoCaixaAnual).toHaveLength(25)
  })

  it('encontra o payback dentro do horizonte para um sistema bem dimensionado', () => {
    const resultado = calcularCenario(baseParams)
    expect(resultado.paybackMeses).not.toBeNull()
    expect(resultado.paybackMeses!).toBeGreaterThan(0)
    expect(resultado.paybackMeses!).toBeLessThanOrEqual(25 * 12)
  })

  it('retorna payback nulo quando o preço nunca é coberto pela economia', () => {
    const resultado = calcularCenario({ ...baseParams, precoFinal: 10_000_000 })
    expect(resultado.paybackMeses).toBeNull()
  })

  it('cenário otimista acumula mais economia em 25 anos que o conservador', () => {
    const conservador = calcularCenario({ ...baseParams, reajusteAnual: 0.06 })
    const otimista = calcularCenario({ ...baseParams, reajusteAnual: 0.09 })
    expect(otimista.economiaAcumulada25Anos).toBeGreaterThan(conservador.economiaAcumulada25Anos)
  })
})

describe('calcularCustoKwhGerado', () => {
  it('divide o preço pela geração total', () => {
    expect(calcularCustoKwhGerado(20000, 100000)).toBeCloseTo(0.2, 5)
  })

  it('retorna 0 quando não há geração', () => {
    expect(calcularCustoKwhGerado(20000, 0)).toBe(0)
  })
})
