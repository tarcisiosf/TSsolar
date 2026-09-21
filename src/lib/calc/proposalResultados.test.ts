import { describe, expect, it } from 'vitest'
import type { CalcSettings, ProposalEntrada, ProposalItem, ProposalPrecificacao, ProposalServicos, ProposalSistema } from '@/types/firestore'
import { calcularResultadosProposta } from './proposalResultados'

const calc: CalcSettings = {
  produtividadeKwhKwpAno: 1400,
  distribuicaoMensal: [1.042, 1.052, 0.974, 0.954, 0.9, 0.867, 0.906, 1.081, 1.061, 1.067, 1.026, 1.048],
  tarifaKwh: 0.99,
  fioBKwh: 0.28,
  fioBPercentualPorAno: { '2026': 0.6, '2027': 0.75, '2028': 0.9, '2029': 1.0 },
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
  proximoNumero: 1,
}

const entrada: ProposalEntrada = {
  consumoMedioKwh: 500,
  consumoMensalKwh: null,
  contaAtual: 495,
  tarifaKwh: 0.99,
  ligacao: 'mono',
  tipoTelhado: 'ceramico',
  observacoes: '',
}

const sistema: ProposalSistema = { potenciaKwp: 4.4, qtdModulos: 8, moduloId: 'mod-1', inversorId: 'inv-1', areaM2: 24 }

const itens: ProposalItem[] = [
  { id: '1', catalogId: 'mod-1', descricao: 'Módulo 550W', especificacao: '', quantidade: 8, unidade: 'un', custoUnitario: 700, status: 'incluso' },
  { id: '2', catalogId: 'inv-1', descricao: 'Inversor 5kW', especificacao: '', quantidade: 1, unidade: 'un', custoUnitario: 3200, status: 'incluso' },
]

const servicos: ProposalServicos = { projeto: 300, instalacao: 1800, art: 150, frete: 200, homologacao: 250, outros: [] }
const precificacao: ProposalPrecificacao = { modo: 'margem', margem: 0.25, comissao: 0, precoFinal: 0 }

describe('calcularResultadosProposta', () => {
  it('calcula um conjunto de resultados coerente', () => {
    const { resultados, precoFinal } = calcularResultadosProposta({
      entrada,
      sistema,
      itens,
      servicos,
      precificacao,
      inversorPotenciaKw: 5,
      calc,
      anoCalendarioInicial: 2026,
    })

    expect(precoFinal).toBeGreaterThan(resultados.custoTotal)
    expect(resultados.relacaoCcCa).toBeCloseTo(4.4 / 5, 5)
    expect(resultados.economiaAno1Conservador).toBeGreaterThan(0)
    expect(resultados.economia25AnosOtimista).toBeGreaterThan(resultados.economia25AnosConservador)
    expect(resultados.paybackMesesConservador).not.toBeNull()
    expect(resultados.custoKwhGerado).toBeGreaterThan(0)
  })
})
