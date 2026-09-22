import { Package, Plus, Search } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { Segmented } from '@/components/ui/Segmented'
import { Select } from '@/components/ui/Select'
import { SkeletonRow } from '@/components/ui/Skeleton'
import { Switch } from '@/components/ui/Switch'
import { PageHeader } from '@/components/layout/PageHeader'
import { formatBRL, formatDateBR } from '@/lib/format'
import { subscribeCatalog, updateCatalogItem } from '@/lib/data/catalog'
import { importarItensDistribuidor } from '@/lib/data/catalogImport'
import type { CatalogItem } from '@/types/firestore'
import { CATEGORIAS, CATEGORIA_LABELS } from './catalogLabels'
import { CatalogItemSheet } from './CatalogItemSheet'
import { KitsTab } from './KitsTab'

type Aba = 'itens' | 'kits'

export function CatalogPage() {
  const [aba, setAba] = useState<Aba>('itens')
  const [itens, setItens] = useState<CatalogItem[] | null>(null)
  const [busca, setBusca] = useState('')
  const [categoria, setCategoria] = useState<string>('todas')
  const [sheetAberta, setSheetAberta] = useState(false)
  const [itemEditando, setItemEditando] = useState<CatalogItem | null>(null)
  const [importando, setImportando] = useState(false)
  const [mensagemImport, setMensagemImport] = useState<string | null>(null)

  useEffect(() => subscribeCatalog(setItens), [])

  const filtrados = useMemo(() => {
    if (!itens) return []
    const termo = busca.trim().toLowerCase()
    return itens.filter((item) => {
      const bateCategoria = categoria === 'todas' || item.categoria === categoria
      const bateBusca = !termo || item.nome.toLowerCase().includes(termo)
      return bateCategoria && bateBusca
    })
  }, [itens, busca, categoria])

  function abrirNovo() {
    setItemEditando(null)
    setSheetAberta(true)
  }

  function abrirEdicao(item: CatalogItem) {
    setItemEditando(item)
    setSheetAberta(true)
  }

  async function handleImportar() {
    setImportando(true)
    try {
      const resultado = await importarItensDistribuidor()
      setMensagemImport(`${resultado.itensCriados} itens e ${resultado.kitsCriados} kits criados.`)
    } finally {
      setImportando(false)
    }
  }

  return (
    <div>
      <PageHeader
        title="Catálogo"
        subtitle="Equipamentos, materiais e kits usados nas propostas."
        action={
          <div className="flex flex-wrap gap-3">
            <Button variant="secondary" onClick={handleImportar} loading={importando}>
              Importar itens do distribuidor
            </Button>
            <Button variant="primary" onClick={abrirNovo}>
              <Plus className="h-4 w-4" /> Novo item
            </Button>
          </div>
        }
      />

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <Segmented aria-label="Aba do catálogo" value={aba} onChange={(v) => setAba(v)} options={[{ value: 'itens', label: 'Itens' }, { value: 'kits', label: 'Kits' }]} />
        {mensagemImport && <p className="text-xs font-semibold text-success">{mensagemImport}</p>}
      </div>

      {aba === 'kits' ? (
        <KitsTab catalogo={itens ?? []} />
      ) : (
        <>
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden />
              <input
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Buscar por marca ou modelo"
                className="h-12 w-full rounded-field border border-[#D9D3C7] bg-surface pl-11 pr-4 text-[0.9375rem] outline-none focus:ring-2 focus:ring-sun"
              />
            </div>
            <div className="sm:w-56">
              <Select
                label="Categoria"
                value={categoria}
                onChange={(e) => setCategoria(e.target.value)}
                options={[{ value: 'todas', label: 'Todas as categorias' }, ...CATEGORIAS.map((c) => ({ value: c, label: CATEGORIA_LABELS[c] }))]}
              />
            </div>
          </div>

          {itens === null && (
            <div className="flex flex-col gap-3">
              <SkeletonRow />
              <SkeletonRow />
              <SkeletonRow />
            </div>
          )}

          {itens !== null && filtrados.length === 0 && (
            <EmptyState
              icon={Package}
              title="Nenhum item encontrado"
              description={itens.length === 0 ? 'Cadastre o primeiro item do catálogo.' : 'Ajuste a busca ou o filtro de categoria.'}
              actionLabel={itens.length === 0 ? 'Novo item' : undefined}
              onAction={itens.length === 0 ? abrirNovo : undefined}
            />
          )}

          {filtrados.length > 0 && (
            <div className="hidden overflow-x-auto rounded-card bg-surface shadow-card md:block">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-line-soft text-left text-xs font-bold uppercase tracking-wide text-muted">
                    <th className="px-4 py-3">Item</th>
                    <th className="px-4 py-3">Categoria</th>
                    <th className="px-4 py-3">Custo</th>
                    <th className="px-4 py-3">Atualizado</th>
                    <th className="px-4 py-3">Ativo</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {filtrados.map((item) => (
                    <CatalogRow key={item.id} item={item} onEdit={() => abrirEdicao(item)} />
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="flex flex-col gap-3 md:hidden">
            {filtrados.map((item) => (
              <Card key={item.id} onClick={() => abrirEdicao(item)} className="cursor-pointer">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-graphite">{item.nome}</p>
                    <p className="text-xs text-muted">{CATEGORIA_LABELS[item.categoria]}</p>
                  </div>
                  {!item.ativo && <span className="shrink-0 rounded-pill bg-chip px-2 py-1 text-[11px] font-bold text-muted">Inativo</span>}
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <p className="tabular-nums text-sm font-bold text-graphite">{formatBRL(item.custoUnitario)}</p>
                  {item.custoUnitario === 0 && <span className="rounded-pill bg-sun-soft px-2 py-0.5 text-[11px] font-bold text-sun-ink">Preencha o custo</span>}
                </div>
              </Card>
            ))}
          </div>

          <CatalogItemSheet open={sheetAberta} onClose={() => setSheetAberta(false)} item={itemEditando} />
        </>
      )}
    </div>
  )
}

function CatalogRow({ item, onEdit }: { item: CatalogItem; onEdit: () => void }) {
  async function toggleAtivo() {
    await updateCatalogItem(item.id, { ativo: !item.ativo })
  }

  return (
    <tr className="cursor-pointer border-b border-line-soft last:border-0 hover:bg-ivory" onClick={onEdit}>
      <td className="px-4 py-3">
        <p className="font-bold text-graphite">{item.nome}</p>
      </td>
      <td className="px-4 py-3 text-muted">{CATEGORIA_LABELS[item.categoria]}</td>
      <td className="px-4 py-3 tabular-nums font-semibold text-graphite">
        <div className="flex items-center gap-2">
          {formatBRL(item.custoUnitario)}
          {item.custoUnitario === 0 && <span className="rounded-pill bg-sun-soft px-2 py-0.5 text-[11px] font-bold text-sun-ink">Preencha o custo</span>}
        </div>
      </td>
      <td className="px-4 py-3 text-muted">{item.atualizadoEm ? formatDateBR(item.atualizadoEm.toDate()) : '—'}</td>
      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
        <Switch label="" checked={item.ativo} onChange={toggleAtivo} id={`ativo-${item.id}`} ariaLabel={item.ativo ? 'Desativar item' : 'Ativar item'} />
      </td>
      <td className="px-4 py-3 text-right text-xs font-bold text-sun">Editar</td>
    </tr>
  )
}
