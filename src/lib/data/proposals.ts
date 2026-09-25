import { addDays } from 'date-fns'
import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  type DocumentData,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { calcularResultadosProposta } from '@/lib/calc/proposalResultados'
import { toPublicSnapshot } from '@/lib/calc/toPublicSnapshot'
import type { Client, Proposal, ProposalItem, ProposalServicos, StatusProposta } from '@/types/firestore'
import { getCalcSettings, getCompanySettings, proximoNumeroProposta } from './settings'

const proposalsCollection = collection(db, 'proposals')
const publicProposalsCollection = collection(db, 'publicProposals')

export function novoProposalId(): string {
  return doc(proposalsCollection).id
}

export function novoItemId(): string {
  return crypto.randomUUID()
}

export const SERVICOS_VAZIOS: ProposalServicos = {
  materiais: 0,
  projeto: 0,
  instalacao: 0,
  art: 0,
  frete: 0,
  homologacao: 0,
  outros: [],
}

export function criarPropostaVazia(id: string, client: Pick<Client, 'id' | 'nome'> | null): Proposal {
  const agora = Timestamp.now()
  return {
    id,
    numero: '',
    versao: 1,
    clientId: client?.id ?? '',
    clienteNome: client?.nome ?? '',
    status: 'rascunho',
    criadoEm: agora,
    atualizadoEm: agora,
    enviadaEm: null,
    validaAte: null,
    entrada: {
      consumoMedioKwh: null,
      consumoMensalKwh: null,
      contaAtual: null,
      tarifaKwh: 0.99,
      ligacao: 'mono',
      tipoTelhado: '',
      observacoes: '',
      tipoImovel: '',
      alturaInstalacao: '',
      inclinacaoGraus: null,
      orientacaoTelhado: '',
      distribuidora: 'Equatorial Goiás',
      unidadeConsumidora: '',
      coordenadas: { lat: null, lng: null },
    },
    sistema: { potenciaKwp: 0, qtdModulos: 0, moduloId: null, inversorId: null, areaM2: null },
    itens: [],
    servicos: SERVICOS_VAZIOS,
    precificacao: { modo: 'margem', margem: 0.25, comissao: 0, precoFinal: 0 },
    condicoesPagamento: 'A combinar',
    resultados: null,
    publicId: crypto.randomUUID(),
    historicoVersoes: [],
  }
}

const ENTRADA_VAZIA_NOVOS_CAMPOS = {
  tipoImovel: '' as const,
  alturaInstalacao: '' as const,
  inclinacaoGraus: null,
  orientacaoTelhado: '' as const,
  distribuidora: 'Equatorial Goiás',
  unidadeConsumidora: '',
  coordenadas: { lat: null, lng: null },
}

/** Propostas salvas antes do campo `materiais` existir não o têm em `servicos` — preenche com o
 * padrão (0) ao ler, sem tocar no Firestore, para não gerar NaN nos cálculos de custo/margem.
 * O mesmo vale para os campos de instalação de `entrada`, adicionados depois. */
function normalizarProposal(raw: Proposal): Proposal {
  return {
    ...raw,
    servicos: { ...SERVICOS_VAZIOS, ...raw.servicos },
    entrada: { ...ENTRADA_VAZIA_NOVOS_CAMPOS, ...raw.entrada },
    condicoesPagamento: raw.condicoesPagamento ?? 'A combinar',
  }
}

export async function createProposal(proposal: Proposal): Promise<void> {
  await setDoc(doc(db, 'proposals', proposal.id), { ...proposal, criadoEm: serverTimestamp(), atualizadoEm: serverTimestamp() })
}

export function subscribeProposals(onData: (propostas: Proposal[]) => void) {
  const q = query(proposalsCollection, orderBy('criadoEm', 'desc'))
  return onSnapshot(q, (snap) => {
    onData(snap.docs.map((d) => normalizarProposal({ id: d.id, ...d.data() } as Proposal)))
  })
}

export function subscribeProposal(id: string, onData: (proposal: Proposal | null) => void) {
  return onSnapshot(doc(db, 'proposals', id), (snap) => {
    onData(snap.exists() ? normalizarProposal({ id: snap.id, ...snap.data() } as Proposal) : null)
  })
}

export async function getProposal(id: string): Promise<Proposal | null> {
  const snap = await getDoc(doc(db, 'proposals', id))
  return snap.exists() ? normalizarProposal({ id: snap.id, ...snap.data() } as Proposal) : null
}

/** Salva campos parciais da proposta (usado no autosave com debounce da UI). */
export async function saveProposalFields(id: string, fields: Partial<DocumentData>): Promise<void> {
  await updateDoc(doc(db, 'proposals', id), { ...fields, atualizadoEm: serverTimestamp() })
}

export async function updateProposalStatus(id: string, status: StatusProposta): Promise<void> {
  await updateDoc(doc(db, 'proposals', id), { status, atualizadoEm: serverTimestamp() })
}

export interface PublicarPropostaResultado {
  numero: string
  versao: number
  publicId: string
}

/**
 * Gera (ou atualiza) a proposta: calcula os resultados, atribui número na primeira vez,
 * cria uma nova versão em edições seguintes e publica o snapshot em publicProposals.
 */
export async function publicarProposta(id: string, inversorPotenciaKw: number): Promise<PublicarPropostaResultado> {
  const [proposalSnap, calc, company] = await Promise.all([getDoc(doc(db, 'proposals', id)), getCalcSettings(), getCompanySettings()])

  if (!proposalSnap.exists()) throw new Error('Proposta não encontrada.')
  const proposal = normalizarProposal({ id: proposalSnap.id, ...proposalSnap.data() } as Proposal)

  const anoCalendarioInicial = new Date().getFullYear()
  const { resultados, precoFinal } = calcularResultadosProposta({
    entrada: proposal.entrada,
    sistema: proposal.sistema,
    servicos: proposal.servicos,
    precificacao: proposal.precificacao,
    inversorPotenciaKw,
    calc,
    anoCalendarioInicial,
  })

  const jaTemNumero = !!proposal.numero
  const numero = jaTemNumero ? proposal.numero : await proximoNumeroProposta()
  const versao = jaTemNumero ? proposal.versao + 1 : 1
  const validaAte = Timestamp.fromDate(addDays(new Date(), company.validadeDias))
  const historicoVersoes = jaTemNumero
    ? [...proposal.historicoVersoes, { versao: proposal.versao, precoFinal: proposal.precificacao.precoFinal, alteradoEm: Timestamp.now() }]
    : proposal.historicoVersoes

  const propostaAtualizada: Proposal = {
    ...proposal,
    numero,
    versao,
    status: proposal.status === 'rascunho' ? 'enviada' : proposal.status,
    enviadaEm: proposal.enviadaEm ?? Timestamp.now(),
    validaAte,
    precificacao: { ...proposal.precificacao, precoFinal },
    resultados,
    historicoVersoes,
  }

  await updateDoc(doc(db, 'proposals', id), {
    numero,
    versao,
    status: propostaAtualizada.status,
    enviadaEm: propostaAtualizada.enviadaEm,
    validaAte,
    'precificacao.precoFinal': precoFinal,
    resultados,
    historicoVersoes,
    atualizadoEm: serverTimestamp(),
  })

  const publicSnapshot = toPublicSnapshot({ proposal: propostaAtualizada, company })

  await setDoc(doc(publicProposalsCollection, proposal.publicId), { ...publicSnapshot, atualizadoEm: serverTimestamp() })

  return { numero, versao, publicId: proposal.publicId }
}

export async function duplicateProposal(id: string): Promise<string> {
  const original = await getProposal(id)
  if (!original) throw new Error('Proposta não encontrada.')

  const novoId = novoProposalId()
  const novaProposta: Proposal = {
    ...original,
    id: novoId,
    numero: '',
    versao: 1,
    status: 'rascunho',
    enviadaEm: null,
    validaAte: null,
    historicoVersoes: [],
    publicId: crypto.randomUUID(),
    itens: original.itens.map((item) => ({ ...item, id: novoItemId() })),
  }
  await createProposal(novaProposta)
  return novoId
}

export function itemVazio(): ProposalItem {
  return {
    id: novoItemId(),
    catalogId: null,
    descricao: '',
    especificacao: '',
    quantidade: 1,
    unidade: 'unidade',
    custoUnitario: 0,
    status: 'incluso',
  }
}
