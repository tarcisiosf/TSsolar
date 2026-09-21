import { describe, expect, it } from 'vitest'
import { calcularAreaEstimada, calcularRelacaoCcCa, potenciaFinalKwp, sugerirDimensionamento } from './dimensionamento'

describe('sugerirDimensionamento', () => {
  it('sugere kWp e quantidade de módulos a partir do consumo anual', () => {
    // consumo médio 500 kWh/mês -> 6000 kWh/ano ; produtividade 1400 -> 4.2857 kWp
    const { kWpSugerido, qtdModulosSugerido } = sugerirDimensionamento(500, 1400, 550)
    expect(kWpSugerido).toBeCloseTo(4.2857, 3)
    expect(qtdModulosSugerido).toBe(Math.ceil((4.2857 * 1000) / 550))
  })

  it('retorna zero quando os parâmetros são inválidos', () => {
    expect(sugerirDimensionamento(500, 0, 550)).toEqual({ kWpSugerido: 0, qtdModulosSugerido: 0 })
  })
})

describe('potenciaFinalKwp', () => {
  it('multiplica quantidade pela potência do módulo', () => {
    expect(potenciaFinalKwp(8, 550)).toBeCloseTo(4.4, 5)
  })
})

describe('calcularRelacaoCcCa', () => {
  it('classifica como ok até 1.35', () => {
    expect(calcularRelacaoCcCa(6.6, 5).nivel).toBe('ok')
  })

  it('classifica como aviso acima de 1.35', () => {
    expect(calcularRelacaoCcCa(7, 5).nivel).toBe('aviso')
  })

  it('classifica como alerta acima de 1.5', () => {
    expect(calcularRelacaoCcCa(8, 5).nivel).toBe('alerta')
  })
})

describe('calcularAreaEstimada', () => {
  it('multiplica quantidade × área do módulo × 1,1 de folga', () => {
    expect(calcularAreaEstimada(8, 2)).toBeCloseTo(8 * 2 * 1.1, 5)
  })

  it('retorna null quando o módulo não tem área cadastrada', () => {
    expect(calcularAreaEstimada(8, null)).toBeNull()
  })
})
