import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { MoneyInput } from '@/components/ui/MoneyInput'
import { Select } from '@/components/ui/Select'
import { Sheet } from '@/components/ui/Sheet'
import { createCatalogItem, updateCatalogItem, type CatalogItemInput } from '@/lib/data/catalog'
import type { CatalogItem } from '@/types/firestore'
import { CATEGORIAS, CATEGORIA_LABELS, UNIDADES, UNIDADE_LABELS } from './catalogLabels'

const VAZIO: CatalogItemInput = {
  categoria: 'modulo',
  marca: '',
  modelo: '',
  potenciaW: null,
  unidade: 'un',
  custoUnitario: 0,
  garantiaDefeitos: '',
  garantiaEficiencia: '',
  monitoramento: '',
  fase: '',
  ativo: true,
}

export function CatalogItemSheet({ open, onClose, item }: { open: boolean; onClose: () => void; item: CatalogItem | null }) {
  const [form, setForm] = useState<CatalogItemInput>(item ?? VAZIO)
  const [salvando, setSalvando] = useState(false)

  function set<K extends keyof CatalogItemInput>(key: K, value: CatalogItemInput[K]) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  async function handleSalvar() {
    if (!form.marca.trim() || !form.modelo.trim()) {
      alert('Informe marca e modelo.')
      return
    }
    setSalvando(true)
    try {
      if (item) {
        await updateCatalogItem(item.id, form)
      } else {
        await createCatalogItem(form)
      }
      onClose()
    } finally {
      setSalvando(false)
    }
  }

  const mostraPotencia = form.categoria === 'modulo' || form.categoria === 'inversor'
  const mostraInversorExtra = form.categoria === 'inversor'

  return (
    <Sheet open={open} onClose={onClose} title={item ? 'Editar item' : 'Novo item do catálogo'}>
      <div className="flex flex-col gap-4">
        <Select
          label="Categoria"
          value={form.categoria}
          onChange={(e) => set('categoria', e.target.value as CatalogItemInput['categoria'])}
          options={CATEGORIAS.map((c) => ({ value: c, label: CATEGORIA_LABELS[c] }))}
        />
        <div className="grid grid-cols-2 gap-4">
          <Input label="Marca" value={form.marca} onChange={(e) => set('marca', e.target.value)} />
          <Input label="Modelo" value={form.modelo} onChange={(e) => set('modelo', e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          {mostraPotencia && (
            <Input
              label="Potência"
              type="number"
              suffix="W"
              value={form.potenciaW ?? ''}
              onChange={(e) => set('potenciaW', e.target.value === '' ? null : Number(e.target.value))}
            />
          )}
          <Select
            label="Unidade"
            value={form.unidade}
            onChange={(e) => set('unidade', e.target.value as CatalogItemInput['unidade'])}
            options={UNIDADES.map((u) => ({ value: u, label: UNIDADE_LABELS[u] }))}
          />
        </div>
        <MoneyInput label="Custo unitário" value={form.custoUnitario} onChange={(v) => set('custoUnitario', v)} />
        <div className="grid grid-cols-2 gap-4">
          <Input label="Garantia contra defeitos" value={form.garantiaDefeitos} onChange={(e) => set('garantiaDefeitos', e.target.value)} />
          <Input label="Garantia de eficiência" value={form.garantiaEficiencia} onChange={(e) => set('garantiaEficiencia', e.target.value)} />
        </div>
        {mostraInversorExtra && (
          <div className="grid grid-cols-2 gap-4">
            <Input label="Monitoramento" value={form.monitoramento} onChange={(e) => set('monitoramento', e.target.value)} placeholder="App / Wi-Fi" />
            <Input label="Fase" value={form.fase} onChange={(e) => set('fase', e.target.value)} placeholder="Mono / Bi / Tri" />
          </div>
        )}
        <label className="flex items-center gap-2 text-sm font-semibold text-graphite">
          <input type="checkbox" checked={form.ativo} onChange={(e) => set('ativo', e.target.checked)} className="h-4 w-4 accent-sun" />
          Ativo no catálogo
        </label>
        <Button variant="primary" onClick={handleSalvar} loading={salvando} fullWidth>
          {item ? 'Salvar alterações' : 'Adicionar ao catálogo'}
        </Button>
      </div>
    </Sheet>
  )
}
