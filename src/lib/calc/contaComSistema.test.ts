import { describe, expect, it } from 'vitest'
import { calcularContaComSistemaMes, calcularContaSemSistemaMes, percentualFioBPorAno } from './contaComSistema'

const custoDisponibilidadeKwh = { mono: 30, bi: 50, tri: 100 }

describe('percentualFioBPorAno', () => {
  const mapa = { '2026': 0.6, '2027': 0.75, '2028': 0.9, '2029': 1.0 }

  it('retorna o percentual exato de um ano cadastrado', () => {
    expect(percentualFioBPorAno(2027, mapa)).toBe(0.75)
  })

  it('usa o último percentual cadastrado para anos posteriores', () => {
    expect(percentualFioBPorAno(2032, mapa)).toBe(1.0)
  })

  it('usa o primeiro percentual cadastrado para anos anteriores', () => {
    expect(percentualFioBPorAno(2020, mapa)).toBe(0.6)
  })
})

describe('calcularContaComSistemaMes', () => {
  it('cobra ao menos o custo de disponibilidade quando a geração cobre todo o consumo', () => {
    const conta = calcularContaComSistemaMes({
      consumoKwh: 500,
      geracaoKwh: 500,
      tarifaKwh: 0.99,
      fioBKwh: 0.28,
      percentualFioB: 0.6,
      fatorSimultaneidade: 0.3,
      ligacao: 'mono',
      custoDisponibilidadeKwh,
      iluminacaoPublica: 0,
    })
    // custoMinimo = 30 * 0.99 = 29.7 ; cobrancaFioB deve ser menor nesse caso
    expect(conta).toBeGreaterThanOrEqual(30 * 0.99)
  })

  it('cobra o consumo não coberto quando a geração é menor que o consumo', () => {
    const conta = calcularContaComSistemaMes({
      consumoKwh: 500,
      geracaoKwh: 200,
      tarifaKwh: 0.99,
      fioBKwh: 0.28,
      percentualFioB: 0.6,
      fatorSimultaneidade: 0.3,
      ligacao: 'mono',
      custoDisponibilidadeKwh,
      iluminacaoPublica: 0,
    })
    const consumoNaoCoberto = (500 - 200) * 0.99
    expect(conta).toBeGreaterThanOrEqual(consumoNaoCoberto)
  })

  it('soma a iluminação pública quando informada', () => {
    const semIluminacao = calcularContaComSistemaMes({
      consumoKwh: 500,
      geracaoKwh: 500,
      tarifaKwh: 0.99,
      fioBKwh: 0.28,
      percentualFioB: 0.6,
      fatorSimultaneidade: 0.3,
      ligacao: 'mono',
      custoDisponibilidadeKwh,
      iluminacaoPublica: 0,
    })
    const comIluminacao = calcularContaComSistemaMes({
      consumoKwh: 500,
      geracaoKwh: 500,
      tarifaKwh: 0.99,
      fioBKwh: 0.28,
      percentualFioB: 0.6,
      fatorSimultaneidade: 0.3,
      ligacao: 'mono',
      custoDisponibilidadeKwh,
      iluminacaoPublica: 15,
    })
    expect(comIluminacao - semIluminacao).toBeCloseTo(15, 5)
  })
})

describe('calcularContaSemSistemaMes', () => {
  it('multiplica consumo pela tarifa e soma iluminação pública', () => {
    expect(calcularContaSemSistemaMes(500, 0.99, 10)).toBeCloseTo(500 * 0.99 + 10, 5)
  })
})
