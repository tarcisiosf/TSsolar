import { describe, expect, it } from 'vitest'
import { calcularCustoTotal, calcularMargemResultante, calcularPrecificacao, calcularPrecoSugerido } from './precificacao'
import type { ProposalServicos } from '@/types/firestore'

const servicos: ProposalServicos = {
  materiais: 8900,
  projeto: 300,
  instalacao: 1800,
  art: 150,
  frete: 200,
  homologacao: 250,
  outros: [{ descricao: 'Extra', valor: 100 }],
}

describe('calcularCustoTotal', () => {
  it('soma o custo dos materiais mais os serviços', () => {
    const custoServicos = 300 + 1800 + 150 + 200 + 250 + 100
    expect(calcularCustoTotal(servicos)).toBe(8900 + custoServicos)
  })
})

describe('calcularPrecoSugerido', () => {
  it('arredonda para cima até a dezena', () => {
    const preco = calcularPrecoSugerido(10000, 0.25, 0.06, 0)
    expect(preco % 10).toBe(0)
    expect(preco).toBeGreaterThanOrEqual(10000 / (1 - 0.25 - 0.06))
  })
})

describe('calcularMargemResultante', () => {
  it('é consistente com calcularPrecoSugerido (ida e volta)', () => {
    const custoTotal = 10000
    const margem = 0.25
    const aliquota = 0.06
    const comissao = 0.02
    const preco = calcularPrecoSugerido(custoTotal, margem, aliquota, comissao)
    const margemResultante = calcularMargemResultante(custoTotal, preco, aliquota, comissao)
    // o arredondamento para a dezena faz a margem resultante ficar levemente acima da configurada
    expect(margemResultante).toBeGreaterThanOrEqual(margem - 0.001)
  })
})

describe('calcularPrecificacao', () => {
  it('calcula lucro e R$/Wp no modo margem', () => {
    const resultado = calcularPrecificacao(servicos, 4.4, 'margem', 0.25, 0, 0.06, null)
    expect(resultado.custoTotal).toBeGreaterThan(0)
    expect(resultado.precoFinal).toBeGreaterThan(resultado.custoTotal)
    expect(resultado.precoPorWp).toBeCloseTo(resultado.precoFinal / 4400, 5)
  })

  it('usa o preço manual quando o modo é manual', () => {
    const resultado = calcularPrecificacao(servicos, 4.4, 'manual', 0.25, 0, 0.06, 18990)
    expect(resultado.precoFinal).toBe(18990)
  })
})
