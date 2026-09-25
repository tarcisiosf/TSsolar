import type { PublicProposal } from '@/types/firestore'

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
    pagamento: raw.pagamento ?? { cartao: { parcelas: 0, valor: 0 }, financiamento: { parcelas: 0, valor: 0 } },
    garantiaDemaisEquipamentos: raw.garantiaDemaisEquipamentos ?? '',
    exclusoes,
    observacaoPreliminar: raw.observacaoPreliminar ?? '',
    responsavelTecnico: raw.responsavelTecnico ?? { nome: '', titulo: '', crea: '' },
  }
}
