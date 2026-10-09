import { describe, expect, it } from 'vitest'
import { calcularPMT, normalizarPagamentoConfig, PAGAMENTO_CONFIG_PADRAO, resolverPagamento, simularPagamento } from './pagamento'

describe('calcularPMT', () => {
  it('calcula a parcela pela Tabela Price', () => {
    // PV=1000, i=1%, n=12 -> PMT ≈ 88.85
    expect(calcularPMT(1000, 0.01, 12)).toBeCloseTo(88.85, 1)
  })

  it('divide igualmente quando a taxa é zero', () => {
    expect(calcularPMT(1200, 0, 12)).toBe(100)
  })
})

describe('simularPagamento', () => {
  it('sinaliza quando o financiamento fica menor que a conta atual', () => {
    const resultado = simularPagamento(15000, 0.0099, 12, 0.0149, 60, 500)
    expect(resultado.parcelaFinanciamento).toBeLessThan(500)
    expect(resultado.financiamentoMenorQueContaAtual).toBe(true)
  })

  it('não sinaliza quando não há conta atual informada', () => {
    const resultado = simularPagamento(15000, 0.0099, 12, 0.0149, 60, null)
    expect(resultado.financiamentoMenorQueContaAtual).toBe(false)
  })
})

describe('resolverPagamento', () => {
  const taxas = { taxaCartaoMensal: 0.0099, parcelasCartao: 12, taxaFinanciamentoMensal: 0.0149, parcelasFinanciamento: 60 }

  it('no modo automático usa o preço e as taxas das configurações', () => {
    const { pagamento } = resolverPagamento(PAGAMENTO_CONFIG_PADRAO, 15000, taxas, null)
    expect(pagamento.avista).toEqual({ exibicao: 'valor', parcelas: 1, valor: 15000 })
    expect(pagamento.cartao.parcelas).toBe(12)
    expect(pagamento.cartao.valor).toBeCloseTo(calcularPMT(15000, 0.0099, 12))
    expect(pagamento.financiamento.parcelas).toBe(60)
  })

  it('respeita valores manuais, "a combinar" e opções ocultas', () => {
    const { pagamento, financiamentoMenorQueContaAtual } = resolverPagamento(
      {
        avista: { modo: 'manual', parcelas: 1, valor: 14200 },
        cartao: { modo: 'combinar', parcelas: 12, valor: 0 },
        financiamento: { modo: 'manual', parcelas: 72, valor: 389.9 },
      },
      15000,
      taxas,
      500,
    )
    expect(pagamento.avista).toEqual({ exibicao: 'valor', parcelas: 1, valor: 14200 })
    expect(pagamento.cartao.exibicao).toBe('combinar')
    expect(pagamento.financiamento).toEqual({ exibicao: 'valor', parcelas: 72, valor: 389.9 })
    expect(financiamentoMenorQueContaAtual).toBe(true)

    const oculto = resolverPagamento({ ...PAGAMENTO_CONFIG_PADRAO, financiamento: { modo: 'oculto', parcelas: 60, valor: 0 } }, 15000, taxas, 5000)
    expect(oculto.pagamento.financiamento.exibicao).toBe('oculto')
    expect(oculto.financiamentoMenorQueContaAtual).toBe(false)
  })

  it('preenche a configuração ausente de propostas antigas', () => {
    expect(normalizarPagamentoConfig(undefined)).toEqual(PAGAMENTO_CONFIG_PADRAO)
  })
})
