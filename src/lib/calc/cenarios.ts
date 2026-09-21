import type { Ligacao } from '@/types/firestore'
import { calcularContaComSistemaMes, calcularContaSemSistemaMes, percentualFioBPorAno } from './contaComSistema'
import { gerarGeracaoMensal } from './geracao'
import type { CenarioResultado } from './types'

export interface CenarioParams {
  consumoMensalKwh: number[] // 12 valores (repita o mesmo valor se só houver a média)
  potenciaKwp: number
  produtividadeKwhKwpAno: number
  distribuicaoMensal: number[]
  tarifaKwh: number
  fioBKwh: number
  fioBPercentualPorAno: Record<string, number>
  anoCalendarioInicial: number
  fatorSimultaneidade: number
  ligacao: Ligacao
  custoDisponibilidadeKwh: Record<Ligacao, number>
  iluminacaoPublica: number
  reajusteAnual: number
  degradacaoAnual: number
  horizonteAnos: number
  precoFinal: number
}

/** Calcula economia, payback e fluxo de caixa de um cenário (conservador ou otimista). */
export function calcularCenario(params: CenarioParams): CenarioResultado {
  const {
    consumoMensalKwh,
    potenciaKwp,
    produtividadeKwhKwpAno,
    distribuicaoMensal,
    tarifaKwh,
    fioBKwh,
    fioBPercentualPorAno,
    anoCalendarioInicial,
    fatorSimultaneidade,
    ligacao,
    custoDisponibilidadeKwh,
    iluminacaoPublica,
    reajusteAnual,
    degradacaoAnual,
    horizonteAnos,
    precoFinal,
  } = params

  const fluxoCaixaAnual: number[] = []
  const economiaMensalAcumulada: number[] = []
  let geracaoTotalKwh = 0
  let acumulado = 0

  for (let ano = 1; ano <= horizonteAnos; ano++) {
    const reajuste = Math.pow(1 + reajusteAnual, ano - 1)
    const tarifaAno = tarifaKwh * reajuste
    const fioBAno = fioBKwh * reajuste
    const anoCalendario = anoCalendarioInicial + ano - 1
    const percentualFioB = percentualFioBPorAno(anoCalendario, fioBPercentualPorAno)
    const geracaoMensal = gerarGeracaoMensal(potenciaKwp, produtividadeKwhKwpAno, distribuicaoMensal, ano, degradacaoAnual)

    let economiaAno = 0
    for (let mes = 0; mes < 12; mes++) {
      const consumoMes = consumoMensalKwh[mes] ?? 0
      const contaSemSistema = calcularContaSemSistemaMes(consumoMes, tarifaAno, iluminacaoPublica)
      const contaComSistema = calcularContaComSistemaMes({
        consumoKwh: consumoMes,
        geracaoKwh: geracaoMensal[mes],
        tarifaKwh: tarifaAno,
        fioBKwh: fioBAno,
        percentualFioB,
        fatorSimultaneidade,
        ligacao,
        custoDisponibilidadeKwh,
        iluminacaoPublica,
      })
      const economiaMes = contaSemSistema - contaComSistema
      economiaAno += economiaMes
      acumulado += economiaMes
      economiaMensalAcumulada.push(acumulado)
      geracaoTotalKwh += geracaoMensal[mes]
    }
    fluxoCaixaAnual.push(economiaAno)
  }

  const paybackIndex = economiaMensalAcumulada.findIndex((valor) => valor >= precoFinal)
  const paybackMeses = paybackIndex === -1 ? null : paybackIndex + 1

  return {
    economiaAno1: fluxoCaixaAnual[0] ?? 0,
    economiaAcumulada25Anos: fluxoCaixaAnual.reduce((acc, v) => acc + v, 0),
    paybackMeses,
    fluxoCaixaAnual,
    geracaoTotalKwh,
  }
}

/** Custo do kWh gerado ao longo de todo o horizonte: preço da proposta / geração total. */
export function calcularCustoKwhGerado(precoFinal: number, geracaoTotalKwh: number): number {
  if (geracaoTotalKwh <= 0) return 0
  return precoFinal / geracaoTotalKwh
}
