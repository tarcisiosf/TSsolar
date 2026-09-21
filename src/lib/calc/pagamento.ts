/** Parcela pela Tabela Price (PMT): valor presente, taxa mensal e número de parcelas. */
export function calcularPMT(valorPresente: number, taxaMensal: number, parcelas: number): number {
  if (parcelas <= 0) return 0
  if (taxaMensal === 0) return valorPresente / parcelas
  const fator = Math.pow(1 + taxaMensal, parcelas)
  return (valorPresente * taxaMensal * fator) / (fator - 1)
}

export interface SimulacaoPagamento {
  parcelaCartao: number
  parcelaFinanciamento: number
  financiamentoMenorQueContaAtual: boolean
}

export function simularPagamento(
  precoFinal: number,
  taxaCartaoMensal: number,
  parcelasCartao: number,
  taxaFinanciamentoMensal: number,
  parcelasFinanciamento: number,
  contaAtual: number | null,
): SimulacaoPagamento {
  const parcelaCartao = calcularPMT(precoFinal, taxaCartaoMensal, parcelasCartao)
  const parcelaFinanciamento = calcularPMT(precoFinal, taxaFinanciamentoMensal, parcelasFinanciamento)
  const financiamentoMenorQueContaAtual = contaAtual != null && parcelaFinanciamento < contaAtual

  return { parcelaCartao, parcelaFinanciamento, financiamentoMenorQueContaAtual }
}
