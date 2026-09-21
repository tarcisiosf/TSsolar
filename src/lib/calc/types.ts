import type { Ligacao } from '@/types/firestore'

export interface CalcParams {
  produtividadeKwhKwpAno: number
  distribuicaoMensal: number[]
  tarifaKwh: number
  fioBKwh: number
  fioBPercentualPorAno: Record<string, number>
  fatorSimultaneidade: number
  custoDisponibilidadeKwh: Record<Ligacao, number>
  iluminacaoPublica: number
  reajusteConservador: number
  reajusteOtimista: number
  degradacaoAnual: number
  horizonteAnos: number
  taxaCartaoMensal: number
  parcelasCartao: number
  taxaFinanciamentoMensal: number
  parcelasFinanciamento: number
  aliquotaSimples: number
  comissaoPadrao: number
  margemPadrao: number
}

export interface CenarioResultado {
  economiaAno1: number
  economiaAcumulada25Anos: number
  paybackMeses: number | null
  fluxoCaixaAnual: number[]
  geracaoTotalKwh: number
}
