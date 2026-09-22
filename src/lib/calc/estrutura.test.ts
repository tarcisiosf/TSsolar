import { describe, expect, it } from 'vitest'
import type { Timestamp } from 'firebase/firestore'
import type { CatalogItemEstrutura, FormaVendaEstrutura, TipoPecaEstrutura } from '@/types/firestore'
import { quantidadeSugeridaEstrutura, type EstruturaConfig } from './estrutura'

const TS = {} as Timestamp
const CONFIG: EstruturaConfig = { larguraModuloPadraoM: 1.15, espacamentoHookM: 1.2 }

function item(tipoPeca: TipoPecaEstrutura, formaVenda: FormaVendaEstrutura, pecasPorPacote: number | null): CatalogItemEstrutura {
  return {
    id: 'x',
    nome: '',
    criadoEm: TS,
    atualizadoEm: TS,
    categoria: 'estrutura',
    unidade: formaVenda === 'pacote' ? 'pacote' : formaVenda === 'barra' ? 'barra' : 'un',
    marca: '',
    tipoPeca,
    tipoTelhado: null,
    medida: '',
    formaVenda,
    pecasPorPacote,
    custoUnitario: 10,
    ativo: true,
  }
}

describe('quantidadeSugeridaEstrutura', () => {
  it('grampo terminal: 4 peças fixas, arredonda pro pacote', () => {
    expect(quantidadeSugeridaEstrutura(item('grampo_terminal', 'pacote', 4), 10, 1.15, CONFIG)).toBe(1)
    expect(quantidadeSugeridaEstrutura(item('grampo_terminal', 'pacote', 3), 10, 1.15, CONFIG)).toBe(2)
  })

  it('grampo intermediário: 2×(N−1) peças', () => {
    expect(quantidadeSugeridaEstrutura(item('grampo_intermediario', 'pacote', 4), 10, 1.15, CONFIG)).toBe(5)
    expect(quantidadeSugeridaEstrutura(item('grampo_intermediario', 'pacote', 4), 1, 1.15, CONFIG)).toBe(0)
  })

  it('perfil: 2×N×largura, barras de 2,4 m + 1 de sobra', () => {
    // N=10, largura 1,15 -> total 23 m -> ceil(23/2.4)=10 barras + 1 = 11
    expect(quantidadeSugeridaEstrutura(item('perfil', 'barra', null), 10, 1.15, CONFIG)).toBe(11)
  })

  it('emenda de perfil: 2×(barras sem sobra − 1)', () => {
    // barrasSemSobra=10 -> 2*(10-1)=18 -> ceil(18/4)=5
    expect(quantidadeSugeridaEstrutura(item('emenda_perfil', 'pacote', 4), 10, 1.15, CONFIG)).toBe(5)
  })

  it('suporte hook: 1 a cada 1,2 m de perfil', () => {
    // total 23 m / 1,2 = 19,17 -> ceil=20 -> ceil(20/4)=5
    expect(quantidadeSugeridaEstrutura(item('suporte_hook', 'pacote', 4), 10, 1.15, CONFIG)).toBe(5)
  })

  it('aterramento (chapa e grampo): 1 peça por módulo', () => {
    expect(quantidadeSugeridaEstrutura(item('chapa_aterramento', 'pacote', 4), 10, 1.15, CONFIG)).toBe(3)
    expect(quantidadeSugeridaEstrutura(item('grampo_aterramento', 'pacote', 4), 10, 1.15, CONFIG)).toBe(3)
  })

  it('kit_completo e outro não têm regra própria', () => {
    expect(quantidadeSugeridaEstrutura(item('kit_completo', 'unidade', null), 10, 1.15, CONFIG)).toBeNull()
    expect(quantidadeSugeridaEstrutura(item('outro', 'unidade', null), 10, 1.15, CONFIG)).toBeNull()
  })
})
