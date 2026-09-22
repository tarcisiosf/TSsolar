import { Package, Plus } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { SkeletonRow } from '@/components/ui/Skeleton'
import { subscribeKits } from '@/lib/data/kits'
import type { CatalogItem, Kit } from '@/types/firestore'
import { KitSheet } from './KitSheet'

export function KitsTab({ catalogo }: { catalogo: CatalogItem[] }) {
  const [kits, setKits] = useState<Kit[] | null>(null)
  const [sheetAberta, setSheetAberta] = useState(false)
  const [kitEditando, setKitEditando] = useState<Kit | null>(null)

  useEffect(() => subscribeKits(setKits), [])

  function abrirNovo() {
    setKitEditando(null)
    setSheetAberta(true)
  }

  function abrirEdicao(kit: Kit) {
    setKitEditando(kit)
    setSheetAberta(true)
  }

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <Button variant="primary" onClick={abrirNovo}>
          <Plus className="h-4 w-4" /> Novo kit
        </Button>
      </div>

      {kits === null && (
        <div className="flex flex-col gap-3">
          <SkeletonRow />
          <SkeletonRow />
        </div>
      )}

      {kits !== null && kits.length === 0 && (
        <EmptyState
          icon={Package}
          title="Nenhum kit cadastrado"
          description="Monte um kit com itens do catálogo para agilizar o passo Materiais da proposta."
          actionLabel="Novo kit"
          onAction={abrirNovo}
        />
      )}

      <div className="flex flex-col gap-3">
        {kits?.map((kit) => (
          <Card key={kit.id} onClick={() => abrirEdicao(kit)} className="cursor-pointer">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-graphite">{kit.nome}</p>
                <p className="text-xs text-muted">{kit.itens.length} {kit.itens.length === 1 ? 'item' : 'itens'}</p>
              </div>
              {!kit.ativo && <span className="shrink-0 rounded-pill bg-chip px-2 py-1 text-[11px] font-bold text-muted">Inativo</span>}
            </div>
            {kit.descricao && <p className="mt-2 text-xs text-muted">{kit.descricao}</p>}
          </Card>
        ))}
      </div>

      <KitSheet key={kitEditando?.id ?? 'novo'} open={sheetAberta} onClose={() => setSheetAberta(false)} kit={kitEditando} catalogo={catalogo} />
    </div>
  )
}
