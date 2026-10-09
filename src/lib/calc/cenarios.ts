import type { Ligacao } from '@/types/firestore'
import { calcularContaSemSistemaMes } from './contaComSistema'
import { gerarGeracaoMensal } from './geracao'
import type { CenarioResultado } from './types'

export interface CenarioParams {
  consumoMensalKwh: number[] // 12 valores (repita o mesmo valor se só houver a média)
  potenciaKwp: number
  produtividadeKwhKwpAno: number
  distribuicaoMensal: number[]
  tarifaKwh: number
  ligacao: Ligacao
  /** Taxa mínima da distribuidora (R$/mês com impostos) por tipo de ligação, no ano 1. */
  taxaMinimaReais: Record<Ligacao, number>
  reajusteAnual: number
  degradacaoAnual: number
  horizonteAnos: number
  precoFinal: number
}

/**
 * Calcula economia, payback e fluxo de caixa de um cenário (conservador ou otimista).
 *
 * Mesmo modelo da manchete da proposta: com o sistema, a conta do mês passa a ser a taxa mínima
 * da distribuidora mais o consumo que a geração não cobrir. Tarifa e taxa mínima sobem juntas
 * pelo reajuste anual do cenário. A iluminação pública fica de fora dos dois lados (não muda).
 */
export function calcularCenario(params: CenarioParams): CenarioResultado {
  const { consumoMensalKwh, potenciaKwp, produtividadeKwhKwpAno, distribuicaoMensal, tarifaKwh, ligacao, taxaMinimaReais, reajusteAnual, degradacaoAnual, horizonteAnos, precoFinal } =
    params

  const fluxoCaixaAnual: number[] = []
  const economiaMensalAcumulada: number[] = []
  let geracaoTotalKwh = 0
  let acumulado = 0

  for (let ano = 1; ano <= horizonteAnos; ano++) {
    const reajuste = Math.pow(1 + reajusteAnual, ano - 1)
    const tarifaAno = tarifaKwh * reajuste
    const taxaMinimaAno = (taxaMinimaReais[ligacao] ?? 0) * reajuste
    const geracaoMensal = gerarGeracaoMensal(potenciaKwp, produtividadeKwhKwpAno, distribuicaoMensal, ano, degradacaoAnual)

    let economiaAno = 0
    for (let mes = 0; mes < 12; mes++) {
      const consumoMes = consumoMensalKwh[mes] ?? 0
      const contaSemSistema = calcularContaSemSistemaMes(consumoMes, tarifaAno, 0)
      const contaComSistema = taxaMinimaAno + Math.max(consumoMes - geracaoMensal[mes], 0) * tarifaAno
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
