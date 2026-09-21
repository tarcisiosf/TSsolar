import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type { CatalogItem } from '@/types/firestore'

const catalogCollection = collection(db, 'catalog')

export type CatalogItemInput = Omit<CatalogItem, 'id' | 'criadoEm' | 'atualizadoEm'>

export function subscribeCatalog(onData: (itens: CatalogItem[]) => void) {
  const q = query(catalogCollection, orderBy('marca'))
  return onSnapshot(q, (snap) => {
    onData(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as CatalogItem))
  })
}

export async function createCatalogItem(input: CatalogItemInput): Promise<string> {
  const ref = await addDoc(catalogCollection, {
    ...input,
    criadoEm: serverTimestamp(),
    atualizadoEm: serverTimestamp(),
  })
  return ref.id
}

export async function updateCatalogItem(id: string, input: Partial<CatalogItemInput>): Promise<void> {
  await updateDoc(doc(db, 'catalog', id), { ...input, atualizadoEm: serverTimestamp() })
}

export async function deleteCatalogItem(id: string): Promise<void> {
  await deleteDoc(doc(db, 'catalog', id))
}
