import type { CalcSettings, ProposalEntrada, ProposalItem, ProposalPrecificacao, ProposalResultados, ProposalServicos, ProposalSistema } from '@/types/firestore'
import { calcularCenario, calcularCustoKwhGerado } from './cenarios'
import { calcularConsumoMedioMensal } from './consumo'
import { calcularContaComSistemaMes, calcularContaSemSistemaMes, percentualFioBPorAno } from './contaComSistema'
import { calcularRelacaoCcCa } from './dimensionamento'
import { gerarGeracaoMensal } from './geracao'
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

  // Conta "antes x depois" do ano 1, para a manchete de economia real da proposta pública.
  const geracaoMensalAno1 = gerarGeracaoMensal(sistema.potenciaKwp, calc.produtividadeKwhKwpAno, calc.distribuicaoMensal, 1, calc.degradacaoAnual)
  const percentualFioBAno1 = percentualFioBPorAno(anoCalendarioInicial, calc.fioBPercentualPorAno)
  let contaAntesTotal = 0
  let contaDepoisTotal = 0
  for (let mes = 0; mes < 12; mes++) {
    const consumoMes = consumoMensalKwh[mes] ?? 0
    contaAntesTotal += calcularContaSemSistemaMes(consumoMes, entrada.tarifaKwh, calc.iluminacaoPublica)
    contaDepoisTotal += calcularContaComSistemaMes({
      consumoKwh: consumoMes,
      geracaoKwh: geracaoMensalAno1[mes],
      tarifaKwh: entrada.tarifaKwh,
      fioBKwh: calc.fioBKwh,
      percentualFioB: percentualFioBAno1,
      fatorSimultaneidade: calc.fatorSimultaneidade,
      ligacao: entrada.ligacao,
      custoDisponibilidadeKwh: calc.custoDisponibilidadeKwh,
      iluminacaoPublica: calc.iluminacaoPublica,
    })
  }
  const contaAntesMediaMensal = contaAntesTotal / 12
  const contaDepoisMediaMensal = contaDepoisTotal / 12
  const percentualEconomiaMensal = contaAntesMediaMensal > 0 ? (contaAntesMediaMensal - contaDepoisMediaMensal) / contaAntesMediaMensal : 0

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
      contaAntesMediaMensal,
      contaDepoisMediaMensal,
      percentualEconomiaMensal,
      geracaoMensalKwh: geracaoMensalAno1,
    },
  }
}
