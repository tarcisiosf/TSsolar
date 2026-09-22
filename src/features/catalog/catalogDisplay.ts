import { formatDecimalBR } from '@/lib/format'
import type { ApresentacaoCabo, CategoriaCatalogo, CatalogItem, DistributiveOmit, TipoTelhado } from '@/types/firestore'
import { TIPO_CABO_LABELS, TIPO_INVERSOR_LABELS, TIPO_PECA_ESTRUTURA_LABELS, TIPO_PROTECAO_LABELS, TIPO_TELHADO_LABELS } from './catalogLabels'

export type CatalogItemInput = DistributiveOmit<CatalogItem, 'id' | 'nome' | 'criadoEm' | 'atualizadoEm' | 'custoPorMetro'>

const PADROES: Record<CategoriaCatalogo, CatalogItemInput> = {
  modulo: { categoria: 'modulo', unidade: 'un', marca: '', potenciaWp: 0, areaM2: null, larguraM: null, tecnologia: null, garantiaProdutoAnos: null, garantiaPerformanceAnos: null, custoUnitario: 0, ativo: true },
  inversor: { categoria: 'inversor', unidade: 'un', marca: '', tipo: 'string', potenciaKw: 0, fase: 'mono', monitoramentoWifi: false, garantiaAnos: null, mppts: null, custoUnitario: 0, ativo: true },
  estrutura: { categoria: 'estrutura', unidade: 'un', marca: '', tipoPeca: 'perfil', tipoTelhado: null, medida: '', formaVenda: 'unidade', pecasPorPacote: null, custoUnitario: 0, ativo: true },
  cabo: { categoria: 'cabo', unidade: 'm', tipo: 'cc_solar', bitolaMm2: 6, cor: 'preto', apresentacao: 'metro', metrosPorRolo: null, custoUnitario: 0, ativo: true },
  mc4: { categoria: 'mc4', unidade: 'par', marca: '', custoUnitario: 0, ativo: true },
  stringbox: { categoria: 'stringbox', unidade: 'un', marca: '', entradas: 1, custoUnitario: 0, ativo: true },
  protecao: { categoria: 'protecao', unidade: 'un', tipo: 'disjuntor', correnteA: 0, custoUnitario: 0, ativo: true },
  outro: { categoria: 'outro', unidade: '', descricao: '', custoUnitario: 0, ativo: true },
}

type CatalogItemInputFor<C extends CategoriaCatalogo> = Extract<CatalogItemInput, { categoria: C }>

/** Valores padrão ao trocar de categoria no formulário — preserva custo/ativo se informados. */
export function defaultCatalogItemInput<C extends CategoriaCatalogo>(
  categoria: C,
  preservar?: { custoUnitario: number; ativo: boolean },
): CatalogItemInputFor<C> {
  const padrao = PADROES[categoria] as CatalogItemInputFor<C>
  return preservar ? ({ ...padrao, custoUnitario: preservar.custoUnitario, ativo: preservar.ativo } as CatalogItemInputFor<C>) : padrao
}

/** Nome exibido, gerado a partir da categoria e dos campos específicos — nunca digitado à mão. */
export function gerarNomeCatalogItem(input: CatalogItemInput): string {
  switch (input.categoria) {
    case 'modulo':
      return `Módulo ${input.marca} ${input.potenciaWp} Wp${input.tecnologia ? ' ' + input.tecnologia : ''}`.trim()
    case 'inversor':
      return `Inversor ${input.marca} ${formatDecimalBR(input.potenciaKw)} kW`.trim()
    case 'estrutura': {
      const label = TIPO_PECA_ESTRUTURA_LABELS[input.tipoPeca]
      const telhado =
        input.tipoPeca === 'suporte_hook' && input.tipoTelhado === 'fibrocimento'
          ? ' fibrocimento/madeira'
          : input.tipoTelhado
            ? ` ${TIPO_TELHADO_LABELS[input.tipoTelhado].toLowerCase()}`
            : ''
      const medida = input.medida ? ` ${input.medida}` : ''
      const pacote = input.formaVenda === 'pacote' && input.pecasPorPacote ? ` · pct ${input.pecasPorPacote}` : ''
      return `${label}${telhado}${medida}${pacote}`
    }
    case 'cabo': {
      const kv = input.tipo === 'cc_solar' ? ' 1 kV' : ''
      const rolo = input.apresentacao === 'rolo' && input.metrosPorRolo ? ` · rolo ${input.metrosPorRolo} m` : ''
      return `Cabo solar ${TIPO_CABO_LABELS[input.tipo]} ${input.bitolaMm2} mm²${kv} ${input.cor}${rolo}`
    }
    case 'mc4':
      return input.marca ? `Conector MC4 ${input.marca}` : 'Conector MC4'
    case 'stringbox':
      return input.marca ? `String box ${input.marca} ${input.entradas} entradas` : `String box ${input.entradas} entradas`
    case 'protecao':
      return `${TIPO_PROTECAO_LABELS[input.tipo]} ${input.correnteA} A`
    case 'outro':
      return input.descricao
  }
}

/** Texto curto de especificação usado no item da proposta, na página pública e no PDF. */
export function especificacaoCatalogItem(item: CatalogItem): string {
  switch (item.categoria) {
    case 'modulo':
      if (item.garantiaPerformanceAnos != null) return `garantia de performance de ${item.garantiaPerformanceAnos} anos`
      if (item.garantiaProdutoAnos != null) return `garantia de ${item.garantiaProdutoAnos} anos`
      return ''
    case 'inversor':
      return item.garantiaAnos != null ? `garantia de ${item.garantiaAnos} anos` : TIPO_INVERSOR_LABELS[item.tipo]
    case 'estrutura': {
      const partes: string[] = []
      if (item.tipoTelhado) partes.push(`telhado ${TIPO_TELHADO_LABELS[item.tipoTelhado].toLowerCase()}`)
      if (item.medida) partes.push(item.medida)
      return partes.join(' · ')
    }
    case 'cabo':
      return `${item.bitolaMm2} mm²`
    case 'mc4':
      return ''
    case 'stringbox':
      return `${item.entradas} entradas`
    case 'protecao':
      return `${item.correnteA} A`
    case 'outro':
      return ''
  }
}

/** Palavra de unidade usada ao lado da quantidade num item de proposta (ex.: "6 unidades", "30 metros"). */
export function unidadeDisplay(item: CatalogItem): string {
  switch (item.categoria) {
    case 'cabo':
      return 'metros'
    case 'mc4':
      return 'pares'
    case 'estrutura':
      return item.unidade === 'pacote' ? 'pacotes' : item.unidade === 'barra' ? 'barras' : 'unidades'
    case 'outro':
      return item.unidade || 'unidades'
    default:
      return 'unidades'
  }
}

/** custoPorMetro do cabo — sempre derivado, nunca digitado: preço por metro direto, ou preço do
 * rolo dividido pelos metros do rolo. */
export function calcularCustoPorMetro(input: { apresentacao: ApresentacaoCabo; custoUnitario: number; metrosPorRolo: number | null }): number {
  if (input.apresentacao === 'metro') return input.custoUnitario
  if (!input.metrosPorRolo || input.metrosPorRolo <= 0) return 0
  return input.custoUnitario / input.metrosPorRolo
}

/** Documentos antigos de 'estrutura' (sem tipoPeca) ou de 'cabo' (sem apresentacao) são de
 * formatos pré-reforma do catálogo. Normaliza em memória, sem tocar no Firestore — se o item
 * for reaberto e salvo, passa a gravar no formato novo. */
export function normalizarCatalogItem(raw: CatalogItem): CatalogItem {
  const bruto = raw as unknown as Record<string, unknown>
  if (raw.categoria === 'estrutura' && !('tipoPeca' in bruto)) {
    return {
      ...bruto,
      tipoPeca: 'kit_completo',
      tipoTelhado: (bruto.tipoTelhado as TipoTelhado | undefined) ?? null,
      medida: '',
      formaVenda: 'unidade',
      pecasPorPacote: null,
      unidade: 'un',
    } as CatalogItem
  }
  if (raw.categoria === 'cabo' && !('apresentacao' in bruto)) {
    return {
      ...bruto,
      cor: 'outro',
      apresentacao: 'metro',
      metrosPorRolo: null,
      custoPorMetro: bruto.custoUnitario as number,
    } as CatalogItem
  }
  return raw
}
