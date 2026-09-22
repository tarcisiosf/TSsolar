import type { ModoPrecificacao, ProposalServicos } from '@/types/firestore'

/** Custo total: custo informado dos materiais mais os serviços. */
export function calcularCustoTotal(servicos: ProposalServicos): number {
  const custoServicos =
    servicos.materiais +
    servicos.projeto +
    servicos.instalacao +
    servicos.art +
    servicos.frete +
    servicos.homologacao +
    servicos.outros.reduce((acc, o) => acc + o.valor, 0)

  return custoServicos
}

/** Preço sugerido pelo modo margem, arredondado para cima até a dezena de reais. */
export function calcularPrecoSugerido(custoTotal: number, margem: number, aliquotaSimples: number, comissao: number): number {
  const divisor = 1 - margem - aliquotaSimples - comissao
  if (divisor <= 0) return Infinity
  const preco = custoTotal / divisor
  return Math.ceil(preco / 10) * 10
}

/** No modo manual, a margem resultante a partir do preço digitado. */
export function calcularMargemResultante(custoTotal: number, precoFinal: number, aliquotaSimples: number, comissao: number): number {
  if (precoFinal <= 0) return 0
  return 1 - custoTotal / precoFinal - aliquotaSimples - comissao
}

export interface ResultadoPrecificacao {
  precoFinal: number
  custoTotal: number
  lucroEstimado: number
  margemResultante: number
  precoPorWp: number
}

export function calcularPrecificacao(
  servicos: ProposalServicos,
  potenciaKwp: number,
  modo: ModoPrecificacao,
  margem: number,
  comissao: number,
  aliquotaSimples: number,
  precoManual: number | null,
): ResultadoPrecificacao {
  const custoTotal = calcularCustoTotal(servicos)
  const precoFinal =
    modo === 'margem' ? calcularPrecoSugerido(custoTotal, margem, aliquotaSimples, comissao) : (precoManual ?? 0)
  const margemResultante = calcularMargemResultante(custoTotal, precoFinal, aliquotaSimples, comissao)
  const lucroEstimado = precoFinal - custoTotal - precoFinal * (aliquotaSimples + comissao)
  const precoPorWp = potenciaKwp > 0 ? precoFinal / (potenciaKwp * 1000) : 0

  return { precoFinal, custoTotal, lucroEstimado, margemResultante, precoPorWp }
}
