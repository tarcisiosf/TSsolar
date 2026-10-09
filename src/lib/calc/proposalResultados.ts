import type { CalcSettings, ProposalEntrada, ProposalPrecificacao, ProposalResultados, ProposalServicos, ProposalSistema } from '@/types/firestore'
import { calcularCenario, calcularCustoKwhGerado } from './cenarios'
import { calcularConsumoMedioMensal } from './consumo'
import { calcularContaSemSistemaMes } from './contaComSistema'
import { calcularPesoEstimado, calcularRelacaoCcCa } from './dimensionamento'
import { gerarGeracaoMensal } from './geracao'
import { calcularPrecificacao } from './precificacao'

export interface CalcularResultadosPropostaInput {
  entrada: ProposalEntrada
  sistema: ProposalSistema
  servicos: ProposalServicos
  precificacao: ProposalPrecificacao
  inversorPotenciaKw: number
  pesoKgModulo: number | null
  calc: CalcSettings
  /** Mantido por compatibilidade com quem chama; o cálculo atual não depende do ano calendário. */
  anoCalendarioInicial: number
}

export interface CalcularResultadosPropostaSaida {
  resultados: ProposalResultados
  precoFinal: number
}

/** Junta todos os módulos de cálculo (consumo, geração, cenários, precificação) para uma proposta completa. */
export function calcularResultadosProposta(input: CalcularResultadosPropostaInput): CalcularResultadosPropostaSaida {
  const { entrada, sistema, servicos, precificacao, inversorPotenciaKw, pesoKgModulo, calc } = input

  const consumoMedioMensal = calcularConsumoMedioMensal(entrada)
  const consumoMensalKwh = entrada.consumoMensalKwh ?? new Array(12).fill(consumoMedioMensal)
  const relacaoCcCa = calcularRelacaoCcCa(sistema.potenciaKwp, inversorPotenciaKw).relacao

  const precificacaoResultado = calcularPrecificacao(
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
    ligacao: entrada.ligacao,
    taxaMinimaReais: calc.taxaMinimaReais,
    degradacaoAnual: calc.degradacaoAnual,
    horizonteAnos: calc.horizonteAnos,
    precoFinal: precificacaoResultado.precoFinal,
  }

  const conservador = calcularCenario({ ...cenarioBase, reajusteAnual: calc.reajusteConservador })
  const otimista = calcularCenario({ ...cenarioBase, reajusteAnual: calc.reajusteOtimista })

  const geracaoMediaMensalKwh = (sistema.potenciaKwp * calc.produtividadeKwhKwpAno) / 12
  const custoKwhGerado = calcularCustoKwhGerado(precificacaoResultado.precoFinal, conservador.geracaoTotalKwh)

  // Conta "antes x depois" do ano 1, para a manchete da proposta pública. Com o sistema, a conta
  // passa a ser a taxa mínima da distribuidora (R$ configurado por tipo de ligação) — mais o consumo
  // que a geração não cobrir, se o sistema for menor que o consumo. A iluminação pública fica de fora
  // dos dois lados, porque não muda com o sistema.
  const geracaoMensalAno1 = gerarGeracaoMensal(sistema.potenciaKwp, calc.produtividadeKwhKwpAno, calc.distribuicaoMensal, 1, calc.degradacaoAnual)
  const taxaMinima = calc.taxaMinimaReais[entrada.ligacao] ?? 0
  let contaAntesTotal = 0
  let contaDepoisTotal = 0
  for (let mes = 0; mes < 12; mes++) {
    const consumoMes = consumoMensalKwh[mes] ?? 0
    contaAntesTotal += calcularContaSemSistemaMes(consumoMes, entrada.tarifaKwh, 0)
    contaDepoisTotal += taxaMinima + Math.max(consumoMes - geracaoMensalAno1[mes], 0) * entrada.tarifaKwh
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
      pesoEstimado: calcularPesoEstimado(sistema.qtdModulos, sistema.areaM2 ?? 0, pesoKgModulo),
    },
  }
}
