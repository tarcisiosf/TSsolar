import { describe, expect, it } from 'vitest'
import { calcularAreaEstimada, calcularPesoEstimado, calcularRelacaoCcCa, potenciaFinalKwp, sugerirDimensionamento } from './dimensionamento'

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
  it('multiplica a quantidade de módulos por 3 m² cada', () => {
    expect(calcularAreaEstimada(8)).toBe(24)
  })

  it('retorna 0 quando não há módulos', () => {
    expect(calcularAreaEstimada(0)).toBe(0)
  })
})

describe('calcularPesoEstimado', () => {
  it('usa o peso do módulo quando cadastrado, com margem de 1,15', () => {
    const r = calcularPesoEstimado(10, 24, 22)
    expect(r.totalKg).toBeCloseTo(10 * 22 * 1.15)
    expect(r.estimativa).toBe(false)
  })
  it('cai para 13,5 kg/m² quando o módulo não tem peso cadastrado', () => {
    const r = calcularPesoEstimado(10, 24, null)
    expect(r.totalKg).toBeCloseTo(24 * 13.5)
    expect(r.estimativa).toBe(true)
  })
  it('kgPorM2 é 0 quando a área é 0', () => {
    const r = calcularPesoEstimado(0, 0, null)
    expect(r.kgPorM2).toBe(0)
  })
})
