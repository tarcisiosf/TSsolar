import type { CatalogItemEstrutura } from '@/types/firestore'

export interface EstruturaConfig {
  larguraModuloPadraoM: number
  espacamentoHookM: number
}

const COMPRIMENTO_BARRA_M = 2.4

function pacotes(pecas: number, pecasPorPacote: number | null): number {
  if (!pecasPorPacote || pecasPorPacote <= 0) return pecas
  return Math.ceil(pecas / pecasPorPacote)
}

function comprimentoTotalPerfilM(n: number, larguraModuloM: number): number {
  return 2 * n * larguraModuloM
}

/** Quantidade sugerida (na unidade de venda do item) para um componente de estrutura, a partir
 * do número de módulos N — assume 1 fileira retrato com 2 perfis por módulo. Retorna null quando
 * o tipoPeca não tem regra própria (kit_completo, outro); quem chama decide o fallback. */
export function quantidadeSugeridaEstrutura(
  item: CatalogItemEstrutura,
  n: number,
  larguraModuloM: number,
  config: EstruturaConfig,
): number | null {
  const comprimentoTotal = comprimentoTotalPerfilM(n, larguraModuloM)

  switch (item.tipoPeca) {
    case 'grampo_terminal':
      return pacotes(4, item.pecasPorPacote)
    case 'grampo_intermediario':
      return pacotes(Math.max(0, 2 * (n - 1)), item.pecasPorPacote)
    case 'perfil':
      return Math.ceil(comprimentoTotal / COMPRIMENTO_BARRA_M) + 1
    case 'emenda_perfil': {
      const barrasSemSobra = Math.ceil(comprimentoTotal / COMPRIMENTO_BARRA_M)
      return pacotes(Math.max(0, 2 * (barrasSemSobra - 1)), item.pecasPorPacote)
    }
    case 'suporte_hook':
      return pacotes(Math.ceil(comprimentoTotal / config.espacamentoHookM), item.pecasPorPacote)
    case 'chapa_aterramento':
    case 'grampo_aterramento':
      return pacotes(n, item.pecasPorPacote)
    case 'kit_completo':
    case 'outro':
      return null
  }
}
