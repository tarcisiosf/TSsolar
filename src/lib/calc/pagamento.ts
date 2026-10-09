import type { OpcaoPagamentoConfig, ProposalPagamentoConfig, PublicOpcaoPagamento, PublicProposalPagamento } from '@/types/firestore'

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

export const PAGAMENTO_CONFIG_PADRAO: ProposalPagamentoConfig = {
  avista: { modo: 'auto', parcelas: 1, valor: 0 },
  cartao: { modo: 'auto', parcelas: 12, valor: 0 },
  financiamento: { modo: 'auto', parcelas: 60, valor: 0 },
}

/** Propostas salvas antes da configuração de pagamento existir — preenche com o padrão. */
export function normalizarPagamentoConfig(raw: Partial<ProposalPagamentoConfig> | undefined | null): ProposalPagamentoConfig {
  return {
    avista: { ...PAGAMENTO_CONFIG_PADRAO.avista, ...raw?.avista },
    cartao: { ...PAGAMENTO_CONFIG_PADRAO.cartao, ...raw?.cartao },
    financiamento: { ...PAGAMENTO_CONFIG_PADRAO.financiamento, ...raw?.financiamento },
  }
}

export interface TaxasPagamento {
  taxaCartaoMensal: number
  parcelasCartao: number
  taxaFinanciamentoMensal: number
  parcelasFinanciamento: number
}

export interface PagamentoResolvido {
  pagamento: PublicProposalPagamento
  financiamentoMenorQueContaAtual: boolean
}

function resolverOpcao(config: OpcaoPagamentoConfig, auto: { parcelas: number; valor: number }): PublicOpcaoPagamento {
  switch (config.modo) {
    case 'oculto':
      return { exibicao: 'oculto', parcelas: 0, valor: 0 }
    case 'combinar':
      return { exibicao: 'combinar', parcelas: 0, valor: 0 }
    case 'manual':
      return { exibicao: 'valor', parcelas: Math.max(1, Math.round(config.parcelas || 1)), valor: config.valor }
    default:
      return { exibicao: 'valor', parcelas: auto.parcelas, valor: auto.valor }
  }
}

/** Resolve o que o cliente vê em cada forma de pagamento, combinando a configuração
 * da proposta com o cálculo automático pelas taxas das Configurações. */
export function resolverPagamento(config: ProposalPagamentoConfig, precoFinal: number, taxas: TaxasPagamento, contaAtual: number | null): PagamentoResolvido {
  const simulacao = simularPagamento(precoFinal, taxas.taxaCartaoMensal, taxas.parcelasCartao, taxas.taxaFinanciamentoMensal, taxas.parcelasFinanciamento, contaAtual)

  const pagamento: PublicProposalPagamento = {
    avista: resolverOpcao({ ...config.avista, parcelas: 1 }, { parcelas: 1, valor: precoFinal }),
    cartao: resolverOpcao(config.cartao, { parcelas: taxas.parcelasCartao, valor: simulacao.parcelaCartao }),
    financiamento: resolverOpcao(config.financiamento, { parcelas: taxas.parcelasFinanciamento, valor: simulacao.parcelaFinanciamento }),
  }
  const fin = pagamento.financiamento
  const financiamentoMenorQueContaAtual = fin.exibicao === 'valor' && fin.valor > 0 && contaAtual != null && fin.valor < contaAtual

  return { pagamento, financiamentoMenorQueContaAtual }
}
