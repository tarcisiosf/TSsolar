import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type { CatalogItem, DistributiveOmit } from '@/types/firestore'
import { gerarNomeCatalogItem } from '@/features/catalog/catalogDisplay'

const catalogCollection = collection(db, 'catalog')

export type CatalogItemInput = DistributiveOmit<CatalogItem, 'id' | 'nome' | 'criadoEm' | 'atualizadoEm'>

export function subscribeCatalog(onData: (itens: CatalogItem[]) => void) {
  return onSnapshot(query(catalogCollection), (snap) => {
    const itens = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as CatalogItem)
    itens.sort((a, b) => (a.nome ?? '').localeCompare(b.nome ?? '', 'pt-BR'))
    onData(itens)
  })
}

export async function createCatalogItem(input: CatalogItemInput): Promise<string> {
  const ref = await addDoc(catalogCollection, {
    ...input,
    nome: gerarNomeCatalogItem(input),
    criadoEm: serverTimestamp(),
    atualizadoEm: serverTimestamp(),
  })
  return ref.id
}

export async function updateCatalogItem(id: string, input: Partial<CatalogItemInput>): Promise<void> {
  const patch: Record<string, unknown> = { ...input, atualizadoEm: serverTimestamp() }
  if ('categoria' in input) {
    patch.nome = gerarNomeCatalogItem(input as CatalogItemInput)
  }
  await updateDoc(doc(db, 'catalog', id), patch)
}

export async function deleteCatalogItem(id: string): Promise<void> {
  await deleteDoc(doc(db, 'catalog', id))
}
