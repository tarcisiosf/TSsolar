import { simularPagamento } from './pagamento'
import type { Client, CompanySettings, PublicProposal, Proposal } from '@/types/firestore'

export interface ToPublicSnapshotParams {
  proposal: Proposal
  company: CompanySettings
  client: Client | null
  taxaCartaoMensal: number
  parcelasCartao: number
  taxaFinanciamentoMensal: number
  parcelasFinanciamento: number
}

/**
 * Converte uma proposta (documento privado, com custo/margem/comissão) no snapshot
 * público que o cliente vê em `/p/:publicId`.
 *
 * REGRA DE OURO: esta função só pode copiar campos desta allowlist. Nunca adicione
 * `precificacao.margem`, `precificacao.comissao`, `precificacao.modo`, `custoUnitario`
 * dos itens, `custoTotal` ou `lucroEstimado` aqui — há um teste (`toPublicSnapshot.test.ts`)
 * que falha caso esses campos apareçam no snapshot.
 */
export function toPublicSnapshot(params: ToPublicSnapshotParams): PublicProposal {
  const { proposal, company, client, taxaCartaoMensal, parcelasCartao, taxaFinanciamentoMensal, parcelasFinanciamento } = params

  if (!proposal.resultados) {
    throw new Error('Proposta sem resultados calculados — calcule antes de gerar o snapshot público.')
  }

  const precoFinal = proposal.precificacao.precoFinal
  const pagamento = simularPagamento(precoFinal, taxaCartaoMensal, parcelasCartao, taxaFinanciamentoMensal, parcelasFinanciamento, proposal.entrada.contaAtual)

  return {
    publicId: proposal.publicId,
    numero: proposal.numero,
    versao: proposal.versao,
    status: proposal.status,
    clienteNome: proposal.clienteNome,
    cliente: {
      cpfCnpj: client?.cpfCnpj ?? '',
      telefone: client?.telefone ?? '',
      endereco: client?.endereco ?? '',
      cidade: client?.cidade ?? '',
    },
    criadoEm: proposal.criadoEm,
    atualizadoEm: proposal.atualizadoEm,
    validaAte: proposal.validaAte,
    entrada: {
      consumoMedioKwh: proposal.entrada.consumoMedioKwh,
      consumoMensalKwh: proposal.entrada.consumoMensalKwh,
      contaAtual: proposal.entrada.contaAtual,
      ligacao: proposal.entrada.ligacao,
      tipoImovel: proposal.entrada.tipoImovel,
      tipoTelhado: proposal.entrada.tipoTelhado,
      alturaInstalacao: proposal.entrada.alturaInstalacao,
      inclinacaoGraus: proposal.entrada.inclinacaoGraus,
      orientacaoTelhado: proposal.entrada.orientacaoTelhado,
      distribuidora: proposal.entrada.distribuidora,
      unidadeConsumidora: proposal.entrada.unidadeConsumidora,
      coordenadas: proposal.entrada.coordenadas,
    },
    sistema: { ...proposal.sistema },
    itens: proposal.itens.map((item) => ({
      id: item.id,
      descricao: item.descricao,
      especificacao: item.especificacao,
      quantidade: item.quantidade,
      unidade: item.unidade,
      status: item.status,
    })),
    resultados: {
      precoPorWp: proposal.resultados.precoPorWp,
      geracaoMediaMensalKwh: proposal.resultados.geracaoMediaMensalKwh,
      economiaAno1Conservador: proposal.resultados.economiaAno1Conservador,
      economiaAno1Otimista: proposal.resultados.economiaAno1Otimista,
      economia25AnosConservador: proposal.resultados.economia25AnosConservador,
      economia25AnosOtimista: proposal.resultados.economia25AnosOtimista,
      paybackMesesConservador: proposal.resultados.paybackMesesConservador,
      paybackMesesOtimista: proposal.resultados.paybackMesesOtimista,
      custoKwhGerado: proposal.resultados.custoKwhGerado,
      relacaoCcCa: proposal.resultados.relacaoCcCa,
      contaAntesMediaMensal: proposal.resultados.contaAntesMediaMensal,
      contaDepoisMediaMensal: proposal.resultados.contaDepoisMediaMensal,
      percentualEconomiaMensal: proposal.resultados.percentualEconomiaMensal,
      geracaoMensalKwh: proposal.resultados.geracaoMensalKwh,
      pesoEstimado: proposal.resultados.pesoEstimado ?? { totalKg: 0, kgPorM2: 0, estimativa: true },
    },
    precoFinal,
    condicoesPagamento: proposal.condicoesPagamento,
    pagamento: {
      cartao: { parcelas: parcelasCartao, valor: pagamento.parcelaCartao },
      financiamento: { parcelas: parcelasFinanciamento, valor: pagamento.parcelaFinanciamento },
    },
    empresa: {
      nome: company.nome,
      parceria: company.parceria,
      cnpj: company.cnpj,
      cidade: company.cidade,
      whatsapp: company.whatsapp,
      instagram: company.instagram,
      logoUrl: company.logoUrl,
    },
    validadeDias: company.validadeDias,
    prazoInstalacao: company.prazoInstalacao,
    garantias: company.garantias,
    garantiaDemaisEquipamentos: company.garantiaDemaisEquipamentos,
    servicosInclusos: company.servicosInclusos,
    exclusoes: company.exclusoes,
    observacaoPreliminar: company.observacaoPreliminar,
    responsavelTecnico: company.responsavelTecnico,
  }
}
