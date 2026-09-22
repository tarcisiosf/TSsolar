import { Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { DecimalInput } from '@/components/ui/DecimalInput'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Sheet } from '@/components/ui/Sheet'
import { Switch } from '@/components/ui/Switch'
import { createKit, updateKit, type KitInput } from '@/lib/data/kits'
import type { CatalogItem, Kit } from '@/types/firestore'

function paraInput(kit: Kit | null): KitInput {
  if (!kit) return { nome: '', descricao: '', itens: [], ativo: true }
  const { id: _id, ...resto } = kit
  return resto
}

export function KitSheet({ open, onClose, kit, catalogo }: { open: boolean; onClose: () => void; kit: Kit | null; catalogo: CatalogItem[] }) {
  const [form, setForm] = useState<KitInput>(() => paraInput(kit))
  const [itemSelecionado, setItemSelecionado] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [dirty, setDirty] = useState(false)

  function set<K extends keyof KitInput>(key: K, value: KitInput[K]) {
    setForm((f) => ({ ...f, [key]: value }))
    setDirty(true)
  }

  function adicionarItem() {
    if (!itemSelecionado || form.itens.some((i) => i.catalogId === itemSelecionado)) return
    set('itens', [...form.itens, { catalogId: itemSelecionado, quantidadePadrao: null }])
    setItemSelecionado('')
  }

  function atualizarQuantidade(catalogId: string, quantidadePadrao: number | null) {
    set('itens', form.itens.map((i) => (i.catalogId === catalogId ? { ...i, quantidadePadrao } : i)))
  }

  function removerItem(catalogId: string) {
    set('itens', form.itens.filter((i) => i.catalogId !== catalogId))
  }

  function handleClose() {
    setForm(paraInput(kit))
    setDirty(false)
    onClose()
  }

  async function handleSalvar() {
    setSalvando(true)
    try {
      if (kit) {
        await updateKit(kit.id, form)
      } else {
        await createKit(form)
      }
      setDirty(false)
      onClose()
    } finally {
      setSalvando(false)
    }
  }

  return (
    <Sheet
      open={open}
      onClose={handleClose}
      title={kit ? 'Editar kit' : 'Novo kit'}
      isDirty={dirty}
      footer={
        <div className="flex gap-3">
          <Button type="button" variant="secondary" onClick={handleClose} className="flex-1">
            Cancelar
          </Button>
          <Button type="button" variant="primary" onClick={handleSalvar} loading={salvando} className="flex-1">
            {kit ? 'Salvar alterações' : 'Criar kit'}
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-4">
        <Input label="Nome" value={form.nome} onChange={(e) => set('nome', e.target.value)} />
        <Input label="Descrição" hint="Opcional" value={form.descricao} onChange={(e) => set('descricao', e.target.value)} />
        <Switch label="Ativo" checked={form.ativo} onChange={(v) => set('ativo', v)} />

        <div>
          <p className="mb-2 text-sm font-semibold text-graphite">Itens do kit</p>
          <div className="flex flex-col gap-2">
            {form.itens.map((kitItem) => {
              const catalogItem = catalogo.find((c) => c.id === kitItem.catalogId)
              return (
                <div key={kitItem.catalogId} className="flex items-center gap-3 rounded-field border border-[#D9D3C7] bg-surface p-3">
                  <p className="flex-1 text-sm font-semibold text-graphite">{catalogItem?.nome ?? 'Item removido do catálogo'}</p>
                  <div className="w-32">
                    <DecimalInput label="Qtd. padrão" integer value={kitItem.quantidadePadrao} onChange={(v) => atualizarQuantidade(kitItem.catalogId, v)} />
                  </div>
                  <button
                    type="button"
                    onClick={() => removerItem(kitItem.catalogId)}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-field text-muted hover:bg-danger-soft hover:text-danger"
                    aria-label="Remover item do kit"
                  >
                    <Trash2 className="h-4 w-4" aria-hidden />
                  </button>
                </div>
              )
            })}
          </div>
        </div>

        <div className="flex items-end gap-3">
          <div className="flex-1">
            <Select
              label="Adicionar item do catálogo"
              value={itemSelecionado}
              onChange={(e) => setItemSelecionado(e.target.value)}
              options={[
                { value: '', label: 'Selecione um item' },
                ...catalogo.filter((c) => !form.itens.some((i) => i.catalogId === c.id)).map((c) => ({ value: c.id, label: c.nome })),
              ]}
            />
          </div>
          <button
            type="button"
            onClick={adicionarItem}
            disabled={!itemSelecionado}
            className="flex h-12 items-center justify-center gap-2 rounded-field border border-[#D9D3C7] bg-surface px-4 text-sm font-bold text-graphite hover:bg-chip disabled:opacity-50"
          >
            <Plus className="h-4 w-4" aria-hidden /> Adicionar
          </button>
        </div>
      </div>
    </Sheet>
  )
}
