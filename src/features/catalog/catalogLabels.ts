import type {
  AlturaInstalacao,
  ApresentacaoCabo,
  BitolaCaboMm2,
  CategoriaCatalogo,
  CorCabo,
  FormaVendaEstrutura,
  Ligacao,
  OrientacaoTelhado,
  TecnologiaModulo,
  TipoCabo,
  TipoImovel,
  TipoInversor,
  TipoPecaEstrutura,
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
export const UNIDADE_CATEGORIA_LABELS: Record<Exclude<CategoriaCatalogo, 'outro' | 'cabo' | 'estrutura'>, string> = {
  modulo: 'por unidade',
  inversor: 'por unidade',
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

export const TIPO_IMOVEL_LABELS: Record<TipoImovel, string> = {
  residencial: 'Residencial',
  comercial: 'Comercial',
  rural: 'Rural',
  industrial: 'Industrial',
}

export const ALTURA_LABELS: Record<AlturaInstalacao, string> = {
  ate_5m: 'Até 5 m',
  '5_12m': '5 a 12 m',
  acima_12m: 'Acima de 12 m',
}

export const ORIENTACAO_LABELS: Record<OrientacaoTelhado, string> = {
  norte: 'Norte',
  nordeste: 'Nordeste',
  noroeste: 'Noroeste',
  leste: 'Leste',
  oeste: 'Oeste',
  sul: 'Sul',
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

export const TIPOS_PECA_ESTRUTURA: TipoPecaEstrutura[] = [
  'perfil', 'suporte_hook', 'grampo_intermediario', 'grampo_terminal',
  'emenda_perfil', 'chapa_aterramento', 'grampo_aterramento', 'kit_completo', 'outro',
]

export const TIPO_PECA_ESTRUTURA_LABELS: Record<TipoPecaEstrutura, string> = {
  perfil: 'Perfil de alumínio',
  suporte_hook: 'Suporte hook',
  grampo_intermediario: 'Grampo intermediário',
  grampo_terminal: 'Grampo terminal',
  emenda_perfil: 'Emenda de perfil',
  chapa_aterramento: 'Chapa de aterramento',
  grampo_aterramento: 'Grampo de aterramento',
  kit_completo: 'Kit completo',
  outro: 'Outro',
}

export const FORMA_VENDA_LABELS: Record<FormaVendaEstrutura, string> = {
  unidade: 'Unidade',
  pacote: 'Pacote',
  barra: 'Barra',
}
