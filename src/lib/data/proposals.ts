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
  writeBatch,
  type DocumentData,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { calcularResultadosProposta } from '@/lib/calc/proposalResultados'
import { toPublicSnapshot } from '@/lib/calc/toPublicSnapshot'
import { normalizarPagamentoConfig, PAGAMENTO_CONFIG_PADRAO } from '@/lib/calc/pagamento'
import type { Client, Proposal, ProposalItem, ProposalServicos, StatusProposta } from '@/types/firestore'
import { getClient } from './clients'
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
    condicoesPagamento: '',
    pagamento: PAGAMENTO_CONFIG_PADRAO,
    resultados: null,
    publicId: crypto.randomUUID(),
    historicoVersoes: [],
    excluidoEm: null,
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
    pagamento: normalizarPagamentoConfig(raw.pagamento),
    excluidoEm: raw.excluidoEm ?? null,
  }
}

export async function createProposal(proposal: Proposal): Promise<void> {
  await setDoc(doc(db, 'proposals', proposal.id), { ...proposal, criadoEm: serverTimestamp(), atualizadoEm: serverTimestamp() })
}

function assinarPropostas(onData: (propostas: Proposal[]) => void, naLixeira: boolean) {
  const q = query(proposalsCollection, orderBy('criadoEm', 'desc'))
  return onSnapshot(q, (snap) => {
    const todas = snap.docs.map((d) => normalizarProposal({ id: d.id, ...d.data({ serverTimestamps: 'estimate' }) } as Proposal))
    // Filtra no cliente: documentos antigos não têm o campo `excluidoEm`, e um `where` o exigiria.
    onData(todas.filter((p) => (p.excluidoEm != null) === naLixeira))
  })
}

/** Propostas ativas (fora da lixeira). */
export function subscribeProposals(onData: (propostas: Proposal[]) => void) {
  return assinarPropostas(onData, false)
}

/** Propostas na lixeira, mais recentes primeiro. */
export function subscribeLixeiraPropostas(onData: (propostas: Proposal[]) => void) {
  return assinarPropostas((ps) => onData([...ps].sort((a, b) => (b.excluidoEm?.toMillis() ?? 0) - (a.excluidoEm?.toMillis() ?? 0))), true)
}

export function subscribeProposal(id: string, onData: (proposal: Proposal | null) => void) {
  return onSnapshot(doc(db, 'proposals', id), (snap) => {
    onData(snap.exists() ? normalizarProposal({ id: snap.id, ...snap.data({ serverTimestamps: 'estimate' }) } as Proposal) : null)
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
export async function publicarProposta(id: string, inversorPotenciaKw: number, pesoKgModulo: number | null): Promise<PublicarPropostaResultado> {
  const [proposalSnap, calc, company] = await Promise.all([getDoc(doc(db, 'proposals', id)), getCalcSettings(), getCompanySettings()])

  if (!proposalSnap.exists()) throw new Error('Proposta não encontrada.')
  const proposal = normalizarProposal({ id: proposalSnap.id, ...proposalSnap.data() } as Proposal)
  const client = await getClient(proposal.clientId)

  const anoCalendarioInicial = new Date().getFullYear()
  const { resultados, precoFinal } = calcularResultadosProposta({
    entrada: proposal.entrada,
    sistema: proposal.sistema,
    servicos: proposal.servicos,
    precificacao: proposal.precificacao,
    inversorPotenciaKw,
    pesoKgModulo,
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

  const publicSnapshot = toPublicSnapshot({
    proposal: propostaAtualizada,
    company,
    client,
    taxaCartaoMensal: calc.taxaCartaoMensal,
    parcelasCartao: calc.parcelasCartao,
    taxaFinanciamentoMensal: calc.taxaFinanciamentoMensal,
    parcelasFinanciamento: calc.parcelasFinanciamento,
  })

  await setDoc(doc(publicProposalsCollection, proposal.publicId), {
    ...publicSnapshot,
    atualizadoEm: serverTimestamp(),
    // Republicar uma proposta que está na lixeira não deve reativar o link do cliente.
    arquivada: proposal.excluidoEm != null,
  })

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
    excluidoEm: null,
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

/** Move para a lixeira: some das listas e o link público passa a mostrar "não encontrada".
 * Pode ser desfeito com `restaurarProposta`. */
export async function moverPropostaParaLixeira(proposal: Pick<Proposal, 'id' | 'publicId' | 'numero'>): Promise<void> {
  const batch = writeBatch(db)
  batch.update(doc(db, 'proposals', proposal.id), { excluidoEm: serverTimestamp() })
  if (proposal.numero && proposal.publicId) batch.set(doc(publicProposalsCollection, proposal.publicId), { arquivada: true }, { merge: true })
  await batch.commit()
}

export async function restaurarProposta(proposal: Pick<Proposal, 'id' | 'publicId' | 'numero'>): Promise<void> {
  const batch = writeBatch(db)
  batch.update(doc(db, 'proposals', proposal.id), { excluidoEm: null })
  if (proposal.numero && proposal.publicId) batch.set(doc(publicProposalsCollection, proposal.publicId), { arquivada: false }, { merge: true })
  await batch.commit()
}

/** Apaga para sempre a proposta e o link público dela. Não tem volta — usado só na lixeira. */
export async function excluirProposta(proposal: Pick<Proposal, 'id' | 'publicId'>): Promise<void> {
  const batch = writeBatch(db)
  batch.delete(doc(db, 'proposals', proposal.id))
  if (proposal.publicId) batch.delete(doc(publicProposalsCollection, proposal.publicId))
  await batch.commit()
}
