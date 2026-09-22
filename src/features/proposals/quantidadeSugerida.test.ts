import { describe, expect, it } from 'vitest'
import type { Timestamp } from 'firebase/firestore'
import type { CalcSettings, CatalogItem, ProposalSistema } from '@/types/firestore'
import { quantidadeSugerida } from './quantidadeSugerida'

const TS = {} as Timestamp

const CALC: CalcSettings = {
  produtividadeKwhKwpAno: 1400,
  distribuicaoMensal: Array(12).fill(1),
  tarifaKwh: 0.99,
  fioBKwh: 0.28,
  fioBPercentualPorAno: {},
  fatorSimultaneidade: 0.3,
  custoDisponibilidadeKwh: { mono: 30, bi: 50, tri: 100 },
  iluminacaoPublica: 0,
  reajusteConservador: 0.06,
  reajusteOtimista: 0.09,
  degradacaoAnual: 0.005,
  horizonteAnos: 25,
  taxaCartaoMensal: 0.0099,
  parcelasCartao: 12,
  taxaFinanciamentoMensal: 0.0149,
  parcelasFinanciamento: 60,
  aliquotaSimples: 0.06,
  comissaoPadrao: 0,
  margemPadrao: 0.25,
  larguraModuloPadraoM: 1.15,
  espacamentoHookM: 1.2,
  proximoNumero: 1,
}

const SISTEMA: ProposalSistema = { potenciaKwp: 6.2, qtdModulos: 10, moduloId: 'modulo-1', inversorId: null, areaM2: null }

const MODULO: CatalogItem = {
  id: 'modulo-1', nome: '', criadoEm: TS, atualizadoEm: TS,
  categoria: 'modulo', unidade: 'un', marca: 'Leapton', potenciaWp: 620, areaM2: null,
  larguraM: 1.0, tecnologia: 'bifacial', garantiaProdutoAnos: null, garantiaPerformanceAnos: null,
  custoUnitario: 0, ativo: true,
}

function estrutura(overrides: Partial<CatalogItem>): CatalogItem {
  return {
    id: 'e1', nome: '', criadoEm: TS, atualizadoEm: TS,
    categoria: 'estrutura', unidade: 'pacote', marca: '', tipoPeca: 'grampo_terminal',
    tipoTelhado: null, medida: '', formaVenda: 'pacote', pecasPorPacote: 4,
    custoUnitario: 5, ativo: true,
    ...overrides,
  } as CatalogItem
}

describe('quantidadeSugerida', () => {
  it('módulo sugere a quantidade do sistema', () => {
    expect(quantidadeSugerida(MODULO, SISTEMA, [MODULO], CALC)).toBe(10)
  })

  it('inversor sugere 1', () => {
    const inversor: CatalogItem = {
      id: 'inv1', nome: '', criadoEm: TS, atualizadoEm: TS, categoria: 'inversor', unidade: 'un',
      marca: 'Sofar', tipo: 'string', potenciaKw: 5, fase: 'mono', monitoramentoWifi: false,
      garantiaAnos: null, mppts: null, custoUnitario: 0, ativo: true,
    }
    expect(quantidadeSugerida(inversor, SISTEMA, [MODULO], CALC)).toBe(1)
  })

  it('mc4 sugere 4 (2 pares por string + 2 de reserva)', () => {
    const mc4: CatalogItem = { id: 'mc4', nome: '', criadoEm: TS, atualizadoEm: TS, categoria: 'mc4', unidade: 'par', marca: '', custoUnitario: 0, ativo: true }
    expect(quantidadeSugerida(mc4, SISTEMA, [MODULO], CALC)).toBe(4)
  })

  it('cabo em rolo sugere um rolo inteiro', () => {
    const cabo: CatalogItem = {
      id: 'cabo1', nome: '', criadoEm: TS, atualizadoEm: TS, categoria: 'cabo', unidade: 'm',
      tipo: 'cc_solar', bitolaMm2: 4, cor: 'preto', apresentacao: 'rolo', metrosPorRolo: 25,
      custoPorMetro: 2, custoUnitario: 50, ativo: true,
    }
    expect(quantidadeSugerida(cabo, SISTEMA, [MODULO], CALC)).toBe(25)
  })

  it('cabo por metro cai no fallback (sem quantidadePadrao, usa 1)', () => {
    const cabo: CatalogItem = {
      id: 'cabo2', nome: '', criadoEm: TS, atualizadoEm: TS, categoria: 'cabo', unidade: 'm',
      tipo: 'cc_solar', bitolaMm2: 4, cor: 'preto', apresentacao: 'metro', metrosPorRolo: null,
      custoPorMetro: 2, custoUnitario: 2, ativo: true,
    }
    expect(quantidadeSugerida(cabo, SISTEMA, [MODULO], CALC)).toBe(1)
  })

  it('estrutura usa a largura do módulo selecionado', () => {
    // N=10, largura do módulo 1,0 m -> total 20 m -> ceil(20/2.4)+1 = 9+1 = 10
    // (o teste seguinte usa a largura padrão de Configurações, 1,15 m, e dá 11 — números
    // diferentes de propósito, para provar que é a largura do módulo que está sendo usada aqui)
    const perfil = estrutura({ tipoPeca: 'perfil', formaVenda: 'barra', pecasPorPacote: null, unidade: 'barra' })
    expect(quantidadeSugerida(perfil, SISTEMA, [MODULO], CALC)).toBe(10)
  })

  it('estrutura sem módulo selecionado usa a largura padrão de Configurações', () => {
    const sistemaSemModulo: ProposalSistema = { ...SISTEMA, moduloId: null }
    const perfil = estrutura({ tipoPeca: 'perfil', formaVenda: 'barra', pecasPorPacote: null, unidade: 'barra' })
    // N=10, largura padrão 1,15 -> total 23 m -> ceil(23/2.4)+1 = 11
    expect(quantidadeSugerida(perfil, sistemaSemModulo, [MODULO], CALC)).toBe(11)
  })

  it('kit_completo (item legado) cai no fallback do número de módulos', () => {
    const legado = estrutura({ tipoPeca: 'kit_completo', formaVenda: 'unidade', pecasPorPacote: null, unidade: 'un' })
    expect(quantidadeSugerida(legado, SISTEMA, [MODULO], CALC)).toBe(10)
  })

  it('categorias sem regra própria usam quantidadePadrao do kit, com fallback 1', () => {
    const protecao: CatalogItem = { id: 'p1', nome: '', criadoEm: TS, atualizadoEm: TS, categoria: 'protecao', unidade: 'un', tipo: 'disjuntor', correnteA: 32, custoUnitario: 0, ativo: true }
    expect(quantidadeSugerida(protecao, SISTEMA, [MODULO], CALC)).toBe(1)
    expect(quantidadeSugerida(protecao, SISTEMA, [MODULO], CALC, 3)).toBe(3)
  })
})
