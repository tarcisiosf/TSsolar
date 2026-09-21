import { describe, expect, it } from 'vitest'
import { calcularCustoTotal, calcularMargemResultante, calcularPrecificacao, calcularPrecoSugerido } from './precificacao'
import type { ProposalItem, ProposalServicos } from '@/types/firestore'

const itens: ProposalItem[] = [
  { id: '1', catalogId: null, descricao: 'Módulo', especificacao: '', quantidade: 8, unidade: 'un', custoUnitario: 700, status: 'incluso' },
  { id: '2', catalogId: null, descricao: 'Inversor', especificacao: '', quantidade: 1, unidade: 'un', custoUnitario: 3200, status: 'incluso' },
  { id: '3', catalogId: null, descricao: 'Kit cliente', especificacao: '', quantidade: 1, unidade: 'kit', custoUnitario: 999, status: 'fornecido_cliente' },
  { id: '4', catalogId: null, descricao: 'Fora do escopo', especificacao: '', quantidade: 1, unidade: 'un', custoUnitario: 500, status: 'nao_incluso' },
]

const servicos: ProposalServicos = {
  projeto: 300,
  instalacao: 1800,
  art: 150,
  frete: 200,
  homologacao: 250,
  outros: [{ descricao: 'Extra', valor: 100 }],
}

describe('calcularCustoTotal', () => {
  it('soma apenas itens inclusos mais os serviços', () => {
    const custoItensInclusos = 8 * 700 + 1 * 3200
    const custoServicos = 300 + 1800 + 150 + 200 + 250 + 100
    expect(calcularCustoTotal(itens, servicos)).toBe(custoItensInclusos + custoServicos)
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
    const resultado = calcularPrecificacao(itens, servicos, 4.4, 'margem', 0.25, 0, 0.06, null)
    expect(resultado.custoTotal).toBeGreaterThan(0)
    expect(resultado.precoFinal).toBeGreaterThan(resultado.custoTotal)
    expect(resultado.precoPorWp).toBeCloseTo(resultado.precoFinal / 4400, 5)
  })

  it('usa o preço manual quando o modo é manual', () => {
    const resultado = calcularPrecificacao(itens, servicos, 4.4, 'manual', 0.25, 0, 0.06, 18990)
    expect(resultado.precoFinal).toBe(18990)
  })
})
