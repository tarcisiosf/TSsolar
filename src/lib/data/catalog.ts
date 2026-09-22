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
import { calcularCustoPorMetro, gerarNomeCatalogItem, normalizarCatalogItem } from '@/features/catalog/catalogDisplay'

const catalogCollection = collection(db, 'catalog')

export type CatalogItemInput = DistributiveOmit<CatalogItem, 'id' | 'nome' | 'criadoEm' | 'atualizadoEm' | 'custoPorMetro'>

export function comCamposDerivados(input: CatalogItemInput): Record<string, unknown> {
  const patch: Record<string, unknown> = { ...input, nome: gerarNomeCatalogItem(input) }
  if (input.categoria === 'cabo') patch.custoPorMetro = calcularCustoPorMetro(input)
  if (input.categoria === 'estrutura') patch.unidade = input.formaVenda === 'unidade' ? 'un' : input.formaVenda
  return patch
}

export function subscribeCatalog(onData: (itens: CatalogItem[]) => void) {
  return onSnapshot(query(catalogCollection), (snap) => {
    const itens = snap.docs.map((d) => normalizarCatalogItem({ id: d.id, ...d.data() } as CatalogItem))
    itens.sort((a, b) => (a.nome ?? '').localeCompare(b.nome ?? '', 'pt-BR'))
    onData(itens)
  })
}

export async function createCatalogItem(input: CatalogItemInput): Promise<string> {
  const ref = await addDoc(catalogCollection, {
    ...comCamposDerivados(input),
    criadoEm: serverTimestamp(),
    atualizadoEm: serverTimestamp(),
  })
  return ref.id
}

export async function updateCatalogItem(id: string, input: Partial<CatalogItemInput>): Promise<void> {
  const patch: Record<string, unknown> = { ...input, atualizadoEm: serverTimestamp() }
  if ('categoria' in input) {
    Object.assign(patch, comCamposDerivados(input as CatalogItemInput))
  }
  await updateDoc(doc(db, 'catalog', id), patch)
}

export async function deleteCatalogItem(id: string): Promise<void> {
  await deleteDoc(doc(db, 'catalog', id))
}
