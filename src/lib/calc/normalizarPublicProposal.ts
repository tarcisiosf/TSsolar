import type { PublicOpcaoPagamento, PublicProposal } from '@/types/firestore'

/** Snapshots publicados antes destes campos existirem (ou com `exclusoes` no formato
 * antigo, texto único) ficam com os campos ausentes — mescla com o padrão ao ler, sem
 * tocar no Firestore. Mesmo padrão de `normalizarProposal`/`normalizarCompanySettings`. */
export function normalizarPublicProposal(raw: PublicProposal): PublicProposal {
  const bruto = raw as unknown as Record<string, unknown>
  const exclusoesBrutas = bruto.exclusoes
  const exclusoes = Array.isArray(exclusoesBrutas)
    ? exclusoesBrutas
    : typeof exclusoesBrutas === 'string' && exclusoesBrutas
      ? [exclusoesBrutas]
      : []

  return {
    ...raw,
    cliente: raw.cliente ?? { cpfCnpj: '', telefone: '', endereco: '', cidade: '' },
    entrada: {
      ...raw.entrada,
      tipoImovel: raw.entrada?.tipoImovel ?? '',
      alturaInstalacao: raw.entrada?.alturaInstalacao ?? '',
      inclinacaoGraus: raw.entrada?.inclinacaoGraus ?? null,
      orientacaoTelhado: raw.entrada?.orientacaoTelhado ?? '',
      distribuidora: raw.entrada?.distribuidora ?? '',
      unidadeConsumidora: raw.entrada?.unidadeConsumidora ?? '',
      coordenadas: raw.entrada?.coordenadas ?? { lat: null, lng: null },
    },
    resultados: {
      ...raw.resultados,
      pesoEstimado: raw.resultados?.pesoEstimado ?? { totalKg: 0, kgPorM2: 0, estimativa: true },
    },
    condicoesPagamento: raw.condicoesPagamento ?? '',
    pagamento: normalizarPagamentoPublico(raw),
    garantiaDemaisEquipamentos: raw.garantiaDemaisEquipamentos ?? '',
    exclusoes,
    observacaoPreliminar: raw.observacaoPreliminar ?? '',
    responsavelTecnico: raw.responsavelTecnico ?? { nome: '', titulo: '', crea: '' },
  }
}

/** Snapshots antigos não tinham `avista` nem `exibicao`: opção com valor vira "valor";
 * sem valor (ou ausente) vira "A combinar" em vez de mostrar R$ 0,00. */
function normalizarOpcaoPublica(raw: Partial<PublicOpcaoPagamento> | undefined): PublicOpcaoPagamento {
  if (raw?.exibicao) return { exibicao: raw.exibicao, parcelas: raw.parcelas ?? 0, valor: raw.valor ?? 0 }
  const valor = raw?.valor ?? 0
  return { exibicao: valor > 0 ? 'valor' : 'combinar', parcelas: raw?.parcelas ?? 0, valor }
}

function normalizarPagamentoPublico(raw: PublicProposal): PublicProposal['pagamento'] {
  const bruto = (raw.pagamento ?? {}) as Partial<PublicProposal['pagamento']>
  return {
    avista: bruto.avista ? normalizarOpcaoPublica(bruto.avista) : normalizarOpcaoPublica({ parcelas: 1, valor: raw.precoFinal ?? 0 }),
    cartao: normalizarOpcaoPublica(bruto.cartao),
    financiamento: normalizarOpcaoPublica(bruto.financiamento),
  }
}
