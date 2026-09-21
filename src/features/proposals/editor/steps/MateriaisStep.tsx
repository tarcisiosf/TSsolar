import { Plus, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { MoneyInput } from '@/components/ui/MoneyInput'
import { Segmented } from '@/components/ui/Segmented'
import { Select } from '@/components/ui/Select'
import { formatBRL } from '@/lib/format'
import { novoItemId } from '@/lib/data/proposals'
import type { CatalogItem, ProposalItem, ProposalSistema, StatusItem } from '@/types/firestore'
import { CATEGORIA_LABELS } from '@/features/catalog/catalogLabels'

interface MateriaisStepProps {
  itens: ProposalItem[]
  onChange: (itens: ProposalItem[]) => void
  sistema: ProposalSistema
  catalogo: CatalogItem[]
}

function itemDeCatalogo(catalogItem: CatalogItem, quantidade = 1): ProposalItem {
  return {
    id: novoItemId(),
    catalogId: catalogItem.id,
    descricao: `${catalogItem.marca} ${catalogItem.modelo}`,
    especificacao: catalogItem.potenciaW ? `${catalogItem.potenciaW} W` : '',
    quantidade,
    unidade: catalogItem.unidade,
    custoUnitario: catalogItem.custoUnitario,
    status: 'incluso',
  }
}

export function MateriaisStep({ itens, onChange, sistema, catalogo }: MateriaisStepProps) {
  const [catalogSelecionado, setCatalogSelecionado] = useState('')

  // Garante que módulo e inversor escolhidos no passo anterior apareçam aqui automaticamente.
  useEffect(() => {
    let novosItens = itens
    let mudou = false

    if (sistema.moduloId && !novosItens.some((i) => i.catalogId === sistema.moduloId)) {
      const modulo = catalogo.find((c) => c.id === sistema.moduloId)
      if (modulo) {
        novosItens = [...novosItens, itemDeCatalogo(modulo, sistema.qtdModulos)]
        mudou = true
      }
    }
    if (sistema.inversorId && !novosItens.some((i) => i.catalogId === sistema.inversorId)) {
      const inversor = catalogo.find((c) => c.id === sistema.inversorId)
      if (inversor) {
        novosItens = [...novosItens, itemDeCatalogo(inversor)]
        mudou = true
      }
    }
    if (mudou) onChange(novosItens)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sistema.moduloId, sistema.inversorId])

  function atualizarItem(id: string, patch: Partial<ProposalItem>) {
    onChange(itens.map((i) => (i.id === id ? { ...i, ...patch } : i)))
  }

  function removerItem(id: string) {
    onChange(itens.filter((i) => i.id !== id))
  }

  function adicionarDoCatalogo() {
    const catalogItem = catalogo.find((c) => c.id === catalogSelecionado)
    if (!catalogItem) return
    onChange([...itens, itemDeCatalogo(catalogItem)])
    setCatalogSelecionado('')
  }

  function adicionarAvulso() {
    onChange([
      ...itens,
      { id: novoItemId(), catalogId: null, descricao: 'Item avulso', especificacao: '', quantidade: 1, unidade: 'un', custoUnitario: 0, status: 'incluso' },
    ])
  }

  const custoTotalIncluso = itens.filter((i) => i.status === 'incluso').reduce((acc, i) => acc + i.quantidade * i.custoUnitario, 0)

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-lg font-bold text-graphite">Materiais</h2>

      <div className="flex flex-col gap-3">
        {itens.map((item) => (
          <div key={item.id} className="rounded-card bg-surface p-4 shadow-card">
            <div className="mb-3 flex items-start justify-between gap-3">
              {item.catalogId ? (
                <div>
                  <p className="text-sm font-bold text-graphite">{item.descricao}</p>
                  {item.especificacao && <p className="text-xs text-muted">{item.especificacao}</p>}
                </div>
              ) : (
                <input
                  value={item.descricao}
                  onChange={(e) => atualizarItem(item.id, { descricao: e.target.value })}
                  className="flex-1 rounded-field border border-[#D9D3C7] bg-surface px-3 py-1.5 text-sm font-bold text-graphite outline-none focus:ring-2 focus:ring-sun"
                />
              )}
              <button
                onClick={() => removerItem(item.id)}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-field text-muted hover:bg-danger-soft hover:text-danger"
                aria-label={`Remover ${item.descricao}`}
              >
                <Trash2 className="h-4 w-4" aria-hidden />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <div>
                <label className="mb-1 block text-xs font-semibold text-muted">Quantidade ({item.unidade})</label>
                <input
                  type="number"
                  value={item.quantidade}
                  onChange={(e) => atualizarItem(item.id, { quantidade: Number(e.target.value) })}
                  className="h-10 w-full rounded-field border border-[#D9D3C7] bg-surface px-3 text-sm tabular-nums outline-none focus:ring-2 focus:ring-sun"
                />
              </div>
              <MoneyInput label="Custo unitário" value={item.custoUnitario} onChange={(v) => atualizarItem(item.id, { custoUnitario: v })} />
              <div className="col-span-2 sm:col-span-1">
                <label className="mb-1 block text-xs font-semibold text-muted">Status</label>
                <Segmented
                  size="sm"
                  aria-label={`Status de ${item.descricao}`}
                  value={item.status}
                  onChange={(v) => atualizarItem(item.id, { status: v as StatusItem })}
                  options={[
                    { value: 'incluso', label: 'Incluso' },
                    { value: 'fornecido_cliente', label: 'Cliente' },
                    { value: 'nao_incluso', label: 'Não incluso' },
                  ]}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-2 rounded-card border border-dashed border-line p-4 sm:flex-row sm:items-end">
        <div className="flex-1">
          <Select
            label="Adicionar do catálogo"
            value={catalogSelecionado}
            onChange={(e) => setCatalogSelecionado(e.target.value)}
            options={[
              { value: '', label: 'Selecione um item' },
              ...catalogo.map((c) => ({ value: c.id, label: `${CATEGORIA_LABELS[c.categoria]} · ${c.marca} ${c.modelo}` })),
            ]}
          />
        </div>
        <button
          type="button"
          onClick={adicionarDoCatalogo}
          disabled={!catalogSelecionado}
          className="flex h-12 items-center justify-center gap-2 rounded-field border border-[#D9D3C7] bg-surface px-4 text-sm font-bold text-graphite hover:bg-chip disabled:opacity-50"
        >
          <Plus className="h-4 w-4" aria-hidden /> Adicionar
        </button>
        <button
          type="button"
          onClick={adicionarAvulso}
          className="flex h-12 items-center justify-center gap-2 rounded-field border border-[#D9D3C7] bg-surface px-4 text-sm font-bold text-graphite hover:bg-chip"
        >
          <Plus className="h-4 w-4" aria-hidden /> Item avulso
        </button>
      </div>

      <p className="text-sm font-semibold text-graphite">
        Custo dos itens inclusos: <span className="tabular-nums">{formatBRL(custoTotalIncluso)}</span>
      </p>
    </div>
  )
}
