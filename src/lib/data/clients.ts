import { addDoc, collection, doc, getDoc, getDocs, onSnapshot, orderBy, query, serverTimestamp, updateDoc, where, writeBatch } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type { Client } from '@/types/firestore'

const clientsCollection = collection(db, 'clients')

export type ClientInput = Omit<Client, 'id' | 'criadoEm' | 'excluidoEm'>

const CLIENT_DEFAULTS = { cpfCnpj: '', cep: '', excluidoEm: null }

function normalizarClient(raw: Client): Client {
  return { ...CLIENT_DEFAULTS, ...raw }
}

function assinarClientes(onData: (clientes: Client[]) => void, naLixeira: boolean) {
  const q = query(clientsCollection, orderBy('nome'))
  return onSnapshot(q, (snap) => {
    const todos = snap.docs.map((d) => normalizarClient({ id: d.id, ...d.data({ serverTimestamps: 'estimate' }) } as Client))
    onData(todos.filter((c) => (c.excluidoEm != null) === naLixeira))
  })
}

/** Clientes ativos (fora da lixeira). */
export function subscribeClients(onData: (clientes: Client[]) => void) {
  return assinarClientes(onData, false)
}

export function subscribeLixeiraClientes(onData: (clientes: Client[]) => void) {
  return assinarClientes(onData, true)
}

/** Move o cliente para a lixeira. As propostas dele não mudam. */
export async function moverClienteParaLixeira(id: string): Promise<void> {
  await updateDoc(doc(db, 'clients', id), { excluidoEm: serverTimestamp() })
}

export async function restaurarCliente(id: string): Promise<void> {
  await updateDoc(doc(db, 'clients', id), { excluidoEm: null })
}

export async function createClient(input: ClientInput): Promise<string> {
  const ref = await addDoc(clientsCollection, { ...input, criadoEm: serverTimestamp(), excluidoEm: null })
  return ref.id
}

export async function updateClient(id: string, input: Partial<ClientInput>): Promise<void> {
  await updateDoc(doc(db, 'clients', id), input)
}

export async function getClient(id: string): Promise<Client | null> {
  const snap = await getDoc(doc(db, 'clients', id))
  return snap.exists() ? normalizarClient({ id: snap.id, ...snap.data() } as Client) : null
}

/** Quantas propostas estão ligadas a este cliente — para avisar antes de apagar. */
export async function contarPropostasDoCliente(id: string): Promise<number> {
  const snap = await getDocs(query(collection(db, 'proposals'), where('clientId', '==', id)))
  return snap.size
}

/** Apaga o cliente para sempre (usado só na lixeira). As propostas dele NÃO são apagadas: só perdem o vínculo (`clientId` vazio)
 * e continuam mostrando o nome que já estava gravado nelas. */
export async function excluirCliente(id: string): Promise<void> {
  const propostas = await getDocs(query(collection(db, 'proposals'), where('clientId', '==', id)))
  const batch = writeBatch(db)
  propostas.forEach((p) => batch.update(p.ref, { clientId: '' }))
  batch.delete(doc(db, 'clients', id))
  await batch.commit()
}
