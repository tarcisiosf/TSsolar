import { addDoc, collection, deleteDoc, doc, onSnapshot, query, updateDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type { Kit } from '@/types/firestore'

const kitsCollection = collection(db, 'kits')

export type KitInput = Omit<Kit, 'id'>

export function subscribeKits(onData: (kits: Kit[]) => void) {
  return onSnapshot(query(kitsCollection), (snap) => {
    const kits = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Kit)
    kits.sort((a, b) => (a.nome ?? '').localeCompare(b.nome ?? '', 'pt-BR'))
    onData(kits)
  })
}

export async function createKit(input: KitInput): Promise<string> {
  const ref = await addDoc(kitsCollection, input)
  return ref.id
}

export async function updateKit(id: string, input: Partial<KitInput>): Promise<void> {
  await updateDoc(doc(db, 'kits', id), input)
}

export async function deleteKit(id: string): Promise<void> {
  await deleteDoc(doc(db, 'kits', id))
}
