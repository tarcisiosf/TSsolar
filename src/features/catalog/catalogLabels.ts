import type { CategoriaCatalogo, UnidadeCatalogo } from '@/types/firestore'

export const CATEGORIA_LABELS: Record<CategoriaCatalogo, string> = {
  modulo: 'Módulo',
  inversor: 'Inversor',
  estrutura: 'Estrutura',
  cabo: 'Cabo',
  stringbox: 'String box',
  protecao: 'Proteção',
  outro: 'Outro',
}

export const UNIDADE_LABELS: Record<UnidadeCatalogo, string> = {
  un: 'un',
  m: 'm',
  kit: 'kit',
}

export const CATEGORIAS: CategoriaCatalogo[] = ['modulo', 'inversor', 'estrutura', 'cabo', 'stringbox', 'protecao', 'outro']
export const UNIDADES: UnidadeCatalogo[] = ['un', 'm', 'kit']
