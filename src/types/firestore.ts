import type { Timestamp } from 'firebase/firestore'

export type Ligacao = 'mono' | 'bi' | 'tri'
export type CategoriaCatalogo = 'modulo' | 'inversor' | 'estrutura' | 'cabo' | 'mc4' | 'stringbox' | 'protecao' | 'outro'
export type UnidadeCatalogo = 'un' | 'modulo' | 'm' | 'par'
export type TipoInversor = 'string' | 'micro' | 'hibrido'
export type TipoTelhado = 'ceramico' | 'fibrocimento' | 'metalico' | 'laje' | 'solo'
export type TipoCabo = 'cc_solar' | 'ca'
export type TipoProtecao = 'disjuntor' | 'dps'
export type BitolaCaboMm2 = 4 | 6 | 10 | 16
export type TecnologiaModulo = 'monofacial' | 'bifacial'
export type StatusItem = 'incluso' | 'fornecido_cliente' | 'nao_incluso'
export type StatusProposta = 'rascunho' | 'enviada' | 'negociacao' | 'fechada' | 'perdida'
export type ModoPrecificacao = 'margem' | 'manual'

export interface CompanySettings {
  nome: string
  parceria: {
    nome: string
    cnpj: string
  }
  cnpj: string
  cidade: string
  whatsapp: string
  instagram: string
  email: string
  logoUrl: string | null
  validadeDias: number
  prazoInstalacao: string
  garantias: {
    paineis: string
    inversor: string
    instalacao: string
  }
  servicosInclusos: string[]
  exclusoes: string
}

export interface CalcSettings {
  produtividadeKwhKwpAno: number
  distribuicaoMensal: number[]
  tarifaKwh: number
  fioBKwh: number
  fioBPercentualPorAno: Record<string, number>
  fatorSimultaneidade: number
  custoDisponibilidadeKwh: Record<Ligacao, number>
  iluminacaoPublica: number
  reajusteConservador: number
  reajusteOtimista: number
  degradacaoAnual: number
  horizonteAnos: number
  taxaCartaoMensal: number
  parcelasCartao: number
  taxaFinanciamentoMensal: number
  parcelasFinanciamento: number
  aliquotaSimples: number
  comissaoPadrao: number
  margemPadrao: number
  proximoNumero: number
}

interface CatalogItemBase {
  id: string
  nome: string
  custoUnitario: number
  ativo: boolean
  criadoEm: Timestamp
  atualizadoEm: Timestamp
}

export interface CatalogItemModulo extends CatalogItemBase {
  categoria: 'modulo'
  unidade: 'un'
  marca: string
  potenciaWp: number
  areaM2: number | null
  larguraM: number | null
  tecnologia: TecnologiaModulo | null
  garantiaProdutoAnos: number | null
  garantiaPerformanceAnos: number | null
}

export interface CatalogItemInversor extends CatalogItemBase {
  categoria: 'inversor'
  unidade: 'un'
  marca: string
  tipo: TipoInversor
  potenciaKw: number
  fase: Ligacao
  monitoramentoWifi: boolean
  garantiaAnos: number | null
  mppts: number | null
}

export interface CatalogItemEstrutura extends CatalogItemBase {
  categoria: 'estrutura'
  unidade: 'modulo'
  marca: string
  tipoTelhado: TipoTelhado
}

export interface CatalogItemCabo extends CatalogItemBase {
  categoria: 'cabo'
  unidade: 'm'
  tipo: TipoCabo
  bitolaMm2: BitolaCaboMm2
}

export interface CatalogItemMc4 extends CatalogItemBase {
  categoria: 'mc4'
  unidade: 'par'
  marca: string
}

export interface CatalogItemStringBox extends CatalogItemBase {
  categoria: 'stringbox'
  unidade: 'un'
  marca: string
  entradas: number
}

export interface CatalogItemProtecao extends CatalogItemBase {
  categoria: 'protecao'
  unidade: 'un'
  tipo: TipoProtecao
  correnteA: number
}

export interface CatalogItemOutro extends CatalogItemBase {
  categoria: 'outro'
  unidade: string
  descricao: string
}

export type CatalogItem =
  | CatalogItemModulo
  | CatalogItemInversor
  | CatalogItemEstrutura
  | CatalogItemCabo
  | CatalogItemMc4
  | CatalogItemStringBox
  | CatalogItemProtecao
  | CatalogItemOutro

/** `Omit` que distribui sobre uniões discriminadas (o `Omit` nativo colapsa em `keyof` da união e quebraria o discriminante). */
export type DistributiveOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never

export interface Client {
  id: string
  nome: string
  telefone: string
  email: string
  cidade: string
  endereco: string
  observacoes: string
  criadoEm: Timestamp
}

export interface ProposalEntrada {
  consumoMedioKwh: number | null
  consumoMensalKwh: number[] | null
  contaAtual: number | null
  tarifaKwh: number
  ligacao: Ligacao
  tipoTelhado: string
  observacoes: string
}

export interface ProposalSistema {
  potenciaKwp: number
  qtdModulos: number
  moduloId: string | null
  inversorId: string | null
  areaM2: number | null
}

export interface ProposalItem {
  id: string
  catalogId: string | null
  descricao: string
  especificacao: string
  quantidade: number
  unidade: string
  custoUnitario: number
  status: StatusItem
}

export interface ProposalServicos {
  projeto: number
  instalacao: number
  art: number
  frete: number
  homologacao: number
  outros: { descricao: string; valor: number }[]
}

export interface ProposalPrecificacao {
  modo: ModoPrecificacao
  margem: number
  comissao: number
  precoFinal: number
}

export interface ProposalResultados {
  custoTotal: number
  lucroEstimado: number
  margemResultante: number
  precoPorWp: number
  geracaoMediaMensalKwh: number
  economiaAno1Conservador: number
  economiaAno1Otimista: number
  economia25AnosConservador: number
  economia25AnosOtimista: number
  paybackMesesConservador: number | null
  paybackMesesOtimista: number | null
  custoKwhGerado: number
  relacaoCcCa: number
  contaAntesMediaMensal: number
  contaDepoisMediaMensal: number
  percentualEconomiaMensal: number
  geracaoMensalKwh: number[]
}

export interface ProposalVersaoHistorico {
  versao: number
  precoFinal: number
  alteradoEm: Timestamp
}

export interface Proposal {
  id: string
  numero: string
  versao: number
  clientId: string
  clienteNome: string
  status: StatusProposta
  criadoEm: Timestamp
  atualizadoEm: Timestamp
  enviadaEm: Timestamp | null
  validaAte: Timestamp | null
  entrada: ProposalEntrada
  sistema: ProposalSistema
  itens: ProposalItem[]
  servicos: ProposalServicos
  precificacao: ProposalPrecificacao
  resultados: ProposalResultados | null
  publicId: string
  historicoVersoes: ProposalVersaoHistorico[]
}

export interface PublicProposalEmpresa {
  nome: string
  parceria: {
    nome: string
    cnpj: string
  }
  cnpj: string
  cidade: string
  whatsapp: string
  instagram: string
  logoUrl: string | null
}

export type PublicProposalResultados = Omit<ProposalResultados, 'custoTotal' | 'lucroEstimado' | 'margemResultante'>

export interface PublicProposal {
  publicId: string
  numero: string
  versao: number
  status: StatusProposta
  clienteNome: string
  criadoEm: Timestamp
  validaAte: Timestamp | null
  entrada: Pick<ProposalEntrada, 'consumoMedioKwh' | 'consumoMensalKwh' | 'contaAtual' | 'ligacao'>
  sistema: ProposalSistema
  itens: Pick<ProposalItem, 'id' | 'descricao' | 'especificacao' | 'quantidade' | 'unidade' | 'status'>[]
  resultados: PublicProposalResultados
  precoFinal: number
  parcelas: {
    cartao: { valor: number; parcelas: number }
    financiamento: { valor: number; parcelas: number }
  }
  empresa: PublicProposalEmpresa
  validadeDias: number
  prazoInstalacao: string
  garantias: CompanySettings['garantias']
  servicosInclusos: string[]
  exclusoes: string
  atualizadoEm: Timestamp
}

// Fase 2 — modelado agora, implementado depois
export interface ProjectRecord {
  id: string
  proposalId: string
  recebimentos: { data: Timestamp; valor: number; forma: string }[]
  despesas: { data: Timestamp; categoria: string; descricao: string; valor: number }[]
  statusObra: 'vistoria' | 'projeto' | 'homologacao' | 'instalacao' | 'troca_relogio' | 'concluido'
}

export interface FixedCost {
  id: string
  descricao: string
  categoria: string
  valor: number
  recorrencia: 'mensal' | 'unico'
  data: Timestamp
}
