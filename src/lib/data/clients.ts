import { addDoc, collection, deleteDoc, doc, getDoc, onSnapshot, orderBy, query, serverTimestamp, updateDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type { Client } from '@/types/firestore'

const clientsCollection = collection(db, 'clients')

export type ClientInput = Omit<Client, 'id' | 'criadoEm'>

const CLIENT_DEFAULTS = { cpfCnpj: '', cep: '' }

function normalizarClient(raw: Client): Client {
  return { ...CLIENT_DEFAULTS, ...raw }
}

export function subscribeClients(onData: (clientes: Client[]) => void) {
  const q = query(clientsCollection, orderBy('nome'))
  return onSnapshot(q, (snap) => {
    onData(snap.docs.map((d) => normalizarClient({ id: d.id, ...d.data() } as Client)))
  })
}

export async function createClient(input: ClientInput): Promise<string> {
  const ref = await addDoc(clientsCollection, { ...input, criadoEm: serverTimestamp() })
  return ref.id
}

export async function updateClient(id: string, input: Partial<ClientInput>): Promise<void> {
  await updateDoc(doc(db, 'clients', id), input)
}

export async function deleteClient(id: string): Promise<void> {
  await deleteDoc(doc(db, 'clients', id))
}

export async function getClient(id: string): Promise<Client | null> {
  const snap = await getDoc(doc(db, 'clients', id))
  return snap.exists() ? normalizarClient({ id: snap.id, ...snap.data() } as Client) : null
}
