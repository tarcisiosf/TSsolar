import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { DecimalInput } from '@/components/ui/DecimalInput'
import { Input } from '@/components/ui/Input'
import { MoneyInput } from '@/components/ui/MoneyInput'
import { Select } from '@/components/ui/Select'
import { Sheet } from '@/components/ui/Sheet'
import { Switch } from '@/components/ui/Switch'
import { createCatalogItem, updateCatalogItem, type CatalogItemInput } from '@/lib/data/catalog'
import type { CatalogItem } from '@/types/firestore'
import { defaultCatalogItemInput } from './catalogDisplay'
import { validarCatalogItem } from './catalogSchema'
import {
  BITOLAS_CABO,
  CATEGORIAS,
  CATEGORIA_LABELS,
  FASE_LABELS,
  TIPO_CABO_LABELS,
  TIPO_INVERSOR_LABELS,
  TIPO_PROTECAO_LABELS,
  TIPO_TELHADO_LABELS,
  UNIDADE_CATEGORIA_LABELS,
} from './catalogLabels'

function paraInput(item: CatalogItem | null): CatalogItemInput {
  if (!item) return defaultCatalogItemInput('modulo')
  const { id: _id, nome: _nome, criadoEm: _criadoEm, atualizadoEm: _atualizadoEm, ...resto } = item
  return resto as CatalogItemInput
}

export function CatalogItemSheet({ open, onClose, item }: { open: boolean; onClose: () => void; item: CatalogItem | null }) {
  const [form, setForm] = useState<CatalogItemInput>(() => paraInput(item))
  const [erros, setErros] = useState<Record<string, string>>({})
  const [salvando, setSalvando] = useState(false)
  const [dirty, setDirty] = useState(false)

  function set(key: string, value: unknown) {
    setForm((f) => ({ ...f, [key]: value }) as CatalogItemInput)
    setDirty(true)
  }

  function trocarCategoria(categoria: CatalogItemInput['categoria']) {
    setForm(defaultCatalogItemInput(categoria, { custoUnitario: form.custoUnitario, ativo: form.ativo }))
    setErros({})
    setDirty(true)
  }

  function handleClose() {
    const valores = paraInput(item)
    setForm(valores)
    setErros({})
    setDirty(false)
    onClose()
  }

  async function handleSalvar() {
    const validacao = validarCatalogItem(form)
    if (Object.keys(validacao).length > 0) {
      setErros(validacao)
      return
    }
    setErros({})
    setSalvando(true)
    try {
      if (item) {
        await updateCatalogItem(item.id, form)
      } else {
        await createCatalogItem(form)
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
      title={item ? 'Editar item' : 'Novo item do catálogo'}
      isDirty={dirty}
      footer={
        <div className="flex gap-3">
          <Button type="button" variant="secondary" onClick={handleClose} className="flex-1">
            Cancelar
          </Button>
          <Button type="button" variant="primary" onClick={handleSalvar} loading={salvando} className="flex-1">
            {item ? 'Salvar alterações' : 'Adicionar ao catálogo'}
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-4">
        <Select
          label="Categoria"
          value={form.categoria}
          onChange={(e) => trocarCategoria(e.target.value as CatalogItemInput['categoria'])}
          options={CATEGORIAS.map((c) => ({ value: c, label: CATEGORIA_LABELS[c] }))}
        />

        {form.categoria !== 'outro' && (
          <div className="rounded-field bg-chip px-4 py-2.5 text-sm font-semibold text-graphite">
            Unidade de custo: {UNIDADE_CATEGORIA_LABELS[form.categoria]}
          </div>
        )}

        {form.categoria === 'modulo' && (
          <>
            <Input label="Marca" value={form.marca} onChange={(e) => set('marca', e.target.value)} error={erros.marca} />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <DecimalInput label="Potência nominal (Wp)" integer suffix="Wp" value={form.potenciaWp || null} onChange={(v) => set('potenciaWp', v ?? 0)} error={erros.potenciaWp} />
              <DecimalInput label="Área do módulo (m²)" suffix="m²" hint="Opcional — usada para estimar a área do sistema" value={form.areaM2} onChange={(v) => set('areaM2', v)} error={erros.areaM2} />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <DecimalInput label="Garantia do produto (anos)" integer suffix="anos" value={form.garantiaProdutoAnos} onChange={(v) => set('garantiaProdutoAnos', v)} />
              <DecimalInput label="Garantia de performance (anos)" integer suffix="anos" value={form.garantiaPerformanceAnos} onChange={(v) => set('garantiaPerformanceAnos', v)} />
            </div>
          </>
        )}

        {form.categoria === 'inversor' && (
          <>
            <Input label="Marca" value={form.marca} onChange={(e) => set('marca', e.target.value)} error={erros.marca} />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Select label="Tipo" value={form.tipo} onChange={(e) => set('tipo', e.target.value as typeof form.tipo)} options={Object.entries(TIPO_INVERSOR_LABELS).map(([value, label]) => ({ value, label }))} />
              <DecimalInput label="Potência nominal (kW)" suffix="kW" value={form.potenciaKw || null} onChange={(v) => set('potenciaKw', v ?? 0)} error={erros.potenciaKw} />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Select label="Fase" value={form.fase} onChange={(e) => set('fase', e.target.value as typeof form.fase)} options={Object.entries(FASE_LABELS).map(([value, label]) => ({ value, label }))} />
              <DecimalInput label="Garantia (anos)" integer suffix="anos" value={form.garantiaAnos} onChange={(v) => set('garantiaAnos', v)} />
            </div>
            <Switch label="Monitoramento Wi-Fi" checked={form.monitoramentoWifi} onChange={(v) => set('monitoramentoWifi', v)} />
          </>
        )}

        {form.categoria === 'estrutura' && (
          <>
            <Input label="Marca" hint="Opcional" value={form.marca} onChange={(e) => set('marca', e.target.value)} />
            <Select
              label="Tipo de telhado"
              value={form.tipoTelhado}
              onChange={(e) => set('tipoTelhado', e.target.value as typeof form.tipoTelhado)}
              options={Object.entries(TIPO_TELHADO_LABELS).map(([value, label]) => ({ value, label }))}
            />
          </>
        )}

        {form.categoria === 'cabo' && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Select label="Tipo" value={form.tipo} onChange={(e) => set('tipo', e.target.value as typeof form.tipo)} options={Object.entries(TIPO_CABO_LABELS).map(([value, label]) => ({ value, label }))} />
            <Select
              label="Bitola"
              value={String(form.bitolaMm2)}
              onChange={(e) => set('bitolaMm2', Number(e.target.value) as typeof form.bitolaMm2)}
              options={BITOLAS_CABO.map((b) => ({ value: String(b), label: `${b} mm²` }))}
            />
          </div>
        )}

        {form.categoria === 'mc4' && <Input label="Marca" hint="Opcional" value={form.marca} onChange={(e) => set('marca', e.target.value)} />}

        {form.categoria === 'stringbox' && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input label="Marca" hint="Opcional" value={form.marca} onChange={(e) => set('marca', e.target.value)} />
            <DecimalInput label="Entradas" integer value={form.entradas || null} onChange={(v) => set('entradas', v ?? 0)} error={erros.entradas} />
          </div>
        )}

        {form.categoria === 'protecao' && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Select label="Tipo" value={form.tipo} onChange={(e) => set('tipo', e.target.value as typeof form.tipo)} options={Object.entries(TIPO_PROTECAO_LABELS).map(([value, label]) => ({ value, label }))} />
            <DecimalInput label="Corrente nominal (A)" integer suffix="A" value={form.correnteA || null} onChange={(v) => set('correnteA', v ?? 0)} error={erros.correnteA} />
          </div>
        )}

        {form.categoria === 'outro' && (
          <>
            <Input label="Descrição" value={form.descricao} onChange={(e) => set('descricao', e.target.value)} error={erros.descricao} />
            <Input label="Unidade" hint="Texto livre — ex.: kit, par, rolo" value={form.unidade} onChange={(e) => set('unidade', e.target.value)} error={erros.unidade} />
          </>
        )}

        <MoneyInput label="Custo unitário" value={form.custoUnitario} onChange={(v) => set('custoUnitario', v)} error={erros.custoUnitario} />
        <Switch label="Ativo no catálogo" checked={form.ativo} onChange={(v) => set('ativo', v)} />
      </div>
    </Sheet>
  )
}
