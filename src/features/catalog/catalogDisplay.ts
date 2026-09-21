import { formatDecimalBR } from '@/lib/format'
import type { CategoriaCatalogo, CatalogItem, DistributiveOmit } from '@/types/firestore'
import { TIPO_CABO_LABELS, TIPO_INVERSOR_LABELS, TIPO_PROTECAO_LABELS, TIPO_TELHADO_LABELS } from './catalogLabels'

export type CatalogItemInput = DistributiveOmit<CatalogItem, 'id' | 'nome' | 'criadoEm' | 'atualizadoEm'>

const PADROES: Record<CategoriaCatalogo, CatalogItemInput> = {
  modulo: { categoria: 'modulo', unidade: 'un', marca: '', potenciaWp: 0, areaM2: null, garantiaProdutoAnos: null, garantiaPerformanceAnos: null, custoUnitario: 0, ativo: true },
  inversor: { categoria: 'inversor', unidade: 'un', marca: '', tipo: 'string', potenciaKw: 0, fase: 'mono', monitoramentoWifi: false, garantiaAnos: null, custoUnitario: 0, ativo: true },
  estrutura: { categoria: 'estrutura', unidade: 'modulo', marca: '', tipoTelhado: 'ceramico', custoUnitario: 0, ativo: true },
  cabo: { categoria: 'cabo', unidade: 'm', tipo: 'cc_solar', bitolaMm2: 6, custoUnitario: 0, ativo: true },
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
      return `Módulo ${input.marca} ${input.potenciaWp} Wp`.trim()
    case 'inversor':
      return `Inversor ${input.marca} ${formatDecimalBR(input.potenciaKw)} kW`.trim()
    case 'estrutura':
      return `Estrutura para telhado ${TIPO_TELHADO_LABELS[input.tipoTelhado].toLowerCase()}`
    case 'cabo':
      return `Cabo solar ${TIPO_CABO_LABELS[input.tipo]} ${input.bitolaMm2} mm²`
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
    case 'estrutura':
      return `telhado ${TIPO_TELHADO_LABELS[item.tipoTelhado].toLowerCase()}`
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
    case 'outro':
      return item.unidade || 'unidades'
    default:
      return 'unidades'
  }
}
