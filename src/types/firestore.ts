import type { Timestamp } from 'firebase/firestore'

export type Ligacao = 'mono' | 'bi' | 'tri'
export type CategoriaCatalogo = 'modulo' | 'inversor' | 'estrutura' | 'cabo' | 'stringbox' | 'protecao' | 'outro'
export type UnidadeCatalogo = 'un' | 'm' | 'kit'
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

export interface CatalogItem {
  id: string
  categoria: CategoriaCatalogo
  marca: string
  modelo: string
  potenciaW: number | null
  unidade: UnidadeCatalogo
  custoUnitario: number
  garantiaDefeitos: string
  garantiaEficiencia: string
  monitoramento: string
  fase: string
  ativo: boolean
  criadoEm: Timestamp
  atualizadoEm: Timestamp
}

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
  areaM2: number
}

export interface ProposalItem {
  id: string
  catalogId: string | null
  descricao: string
  especificacao: string
  quantidade: number
  unidade: UnidadeCatalogo
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
  resultados: ProposalResultados
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
