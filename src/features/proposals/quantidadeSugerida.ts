import { quantidadeSugeridaEstrutura } from '@/lib/calc/estrutura'
import type { CalcSettings, CatalogItem, ProposalSistema } from '@/types/firestore'

/** Quantidade sugerida ao adicionar um item de catálogo — individualmente ou via kit — numa
 * proposta. Sempre editável em seguida pelo usuário. */
export function quantidadeSugerida(
  item: CatalogItem,
  sistema: ProposalSistema,
  catalogo: CatalogItem[],
  calcSettings: CalcSettings,
  quantidadePadraoKit?: number | null,
): number {
  switch (item.categoria) {
    case 'modulo':
      return sistema.qtdModulos || 1
    case 'inversor':
      return 1
    case 'mc4':
      return 4
    case 'cabo':
      if (item.apresentacao === 'rolo' && item.metrosPorRolo) return item.metrosPorRolo
      return quantidadePadraoKit ?? 1
    case 'estrutura': {
      const modulo = catalogo.find((c) => c.id === sistema.moduloId)
      const larguraModuloM = (modulo && modulo.categoria === 'modulo' ? modulo.larguraM : null) ?? calcSettings.larguraModuloPadraoM
      const sugestao = quantidadeSugeridaEstrutura(item, sistema.qtdModulos || 0, larguraModuloM, {
        larguraModuloPadraoM: calcSettings.larguraModuloPadraoM,
        espacamentoHookM: calcSettings.espacamentoHookM,
      })
      if (sugestao !== null) return sugestao
      if (quantidadePadraoKit != null) return quantidadePadraoKit
      return sistema.qtdModulos || 1
    }
    default:
      return quantidadePadraoKit ?? 1
  }
}
