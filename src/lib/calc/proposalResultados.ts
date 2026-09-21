import type { CalcSettings, ProposalEntrada, ProposalItem, ProposalPrecificacao, ProposalResultados, ProposalServicos, ProposalSistema } from '@/types/firestore'
import { calcularCenario, calcularCustoKwhGerado } from './cenarios'
import { calcularConsumoMedioMensal } from './consumo'
import { calcularRelacaoCcCa } from './dimensionamento'
import { calcularPrecificacao } from './precificacao'

export interface CalcularResultadosPropostaInput {
  entrada: ProposalEntrada
  sistema: ProposalSistema
  itens: ProposalItem[]
  servicos: ProposalServicos
  precificacao: ProposalPrecificacao
  inversorPotenciaKw: number
  calc: CalcSettings
  anoCalendarioInicial: number
}

export interface CalcularResultadosPropostaSaida {
  resultados: ProposalResultados
  precoFinal: number
}

/** Junta todos os módulos de cálculo (consumo, geração, cenários, precificação) para uma proposta completa. */
export function calcularResultadosProposta(input: CalcularResultadosPropostaInput): CalcularResultadosPropostaSaida {
  const { entrada, sistema, itens, servicos, precificacao, inversorPotenciaKw, calc, anoCalendarioInicial } = input

  const consumoMedioMensal = calcularConsumoMedioMensal(entrada)
  const consumoMensalKwh = entrada.consumoMensalKwh ?? new Array(12).fill(consumoMedioMensal)
  const relacaoCcCa = calcularRelacaoCcCa(sistema.potenciaKwp, inversorPotenciaKw).relacao

  const precificacaoResultado = calcularPrecificacao(
    itens,
    servicos,
    sistema.potenciaKwp,
    precificacao.modo,
    precificacao.margem,
    precificacao.comissao,
    calc.aliquotaSimples,
    precificacao.modo === 'manual' ? precificacao.precoFinal : null,
  )

  const cenarioBase = {
    consumoMensalKwh,
    potenciaKwp: sistema.potenciaKwp,
    produtividadeKwhKwpAno: calc.produtividadeKwhKwpAno,
    distribuicaoMensal: calc.distribuicaoMensal,
    tarifaKwh: entrada.tarifaKwh,
    fioBKwh: calc.fioBKwh,
    fioBPercentualPorAno: calc.fioBPercentualPorAno,
    anoCalendarioInicial,
    fatorSimultaneidade: calc.fatorSimultaneidade,
    ligacao: entrada.ligacao,
    custoDisponibilidadeKwh: calc.custoDisponibilidadeKwh,
    iluminacaoPublica: calc.iluminacaoPublica,
    degradacaoAnual: calc.degradacaoAnual,
    horizonteAnos: calc.horizonteAnos,
    precoFinal: precificacaoResultado.precoFinal,
  }

  const conservador = calcularCenario({ ...cenarioBase, reajusteAnual: calc.reajusteConservador })
  const otimista = calcularCenario({ ...cenarioBase, reajusteAnual: calc.reajusteOtimista })

  const geracaoMediaMensalKwh = (sistema.potenciaKwp * calc.produtividadeKwhKwpAno) / 12
  const custoKwhGerado = calcularCustoKwhGerado(precificacaoResultado.precoFinal, conservador.geracaoTotalKwh)

  return {
    precoFinal: precificacaoResultado.precoFinal,
    resultados: {
      custoTotal: precificacaoResultado.custoTotal,
      lucroEstimado: precificacaoResultado.lucroEstimado,
      margemResultante: precificacaoResultado.margemResultante,
      precoPorWp: precificacaoResultado.precoPorWp,
      geracaoMediaMensalKwh,
      economiaAno1Conservador: conservador.economiaAno1,
      economiaAno1Otimista: otimista.economiaAno1,
      economia25AnosConservador: conservador.economiaAcumulada25Anos,
      economia25AnosOtimista: otimista.economiaAcumulada25Anos,
      paybackMesesConservador: conservador.paybackMeses,
      paybackMesesOtimista: otimista.paybackMeses,
      custoKwhGerado,
      relacaoCcCa,
    },
  }
}
