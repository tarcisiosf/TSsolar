import type {
  ApresentacaoCabo,
  BitolaCaboMm2,
  CategoriaCatalogo,
  CorCabo,
  Ligacao,
  TecnologiaModulo,
  TipoCabo,
  TipoInversor,
  TipoProtecao,
  TipoTelhado,
} from '@/types/firestore'

export const CATEGORIA_LABELS: Record<CategoriaCatalogo, string> = {
  modulo: 'Módulo',
  inversor: 'Inversor',
  estrutura: 'Estrutura',
  cabo: 'Cabo',
  mc4: 'Conector MC4',
  stringbox: 'String box',
  protecao: 'Proteção CA',
  outro: 'Outro',
}

export const CATEGORIAS: CategoriaCatalogo[] = ['modulo', 'inversor', 'estrutura', 'cabo', 'mc4', 'stringbox', 'protecao', 'outro']

/** Unidade de custo fixa por categoria — mostrada como texto no formulário, exceto em "outro". */
export const UNIDADE_CATEGORIA_LABELS: Record<Exclude<CategoriaCatalogo, 'outro' | 'cabo'>, string> = {
  modulo: 'por unidade',
  inversor: 'por unidade',
  estrutura: 'por módulo',
  mc4: 'por par',
  stringbox: 'por unidade',
  protecao: 'por unidade',
}

export const TIPO_INVERSOR_LABELS: Record<TipoInversor, string> = {
  string: 'String',
  micro: 'Micro',
  hibrido: 'Híbrido',
}

export const TIPO_TELHADO_LABELS: Record<TipoTelhado, string> = {
  ceramico: 'Cerâmico',
  fibrocimento: 'Fibrocimento',
  metalico: 'Metálico',
  laje: 'Laje',
  solo: 'Solo',
}

export const TIPO_CABO_LABELS: Record<TipoCabo, string> = {
  cc_solar: 'CC',
  ca: 'CA',
}

export const COR_CABO_LABELS: Record<CorCabo, string> = {
  preto: 'Preto',
  vermelho: 'Vermelho',
  outro: 'Outro',
}

export const APRESENTACAO_CABO_LABELS: Record<ApresentacaoCabo, string> = {
  metro: 'Metro',
  rolo: 'Rolo',
}

export const TIPO_PROTECAO_LABELS: Record<TipoProtecao, string> = {
  disjuntor: 'Disjuntor',
  dps: 'DPS',
}

export const FASE_LABELS: Record<Ligacao, string> = {
  mono: 'Monofásico',
  bi: 'Bifásico',
  tri: 'Trifásico',
}

export const TECNOLOGIA_MODULO_LABELS: Record<TecnologiaModulo, string> = {
  monofacial: 'Monofacial',
  bifacial: 'Bifacial',
}

export const BITOLAS_CABO: BitolaCaboMm2[] = [4, 6, 10, 16]
