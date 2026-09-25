import { useState } from 'react'
import { Input } from '@/components/ui/Input'
import { MoneyInput } from '@/components/ui/MoneyInput'
import { Segmented } from '@/components/ui/Segmented'
import { Select } from '@/components/ui/Select'
import { ChevronDown } from 'lucide-react'
import { sugerirTarifa } from '@/lib/calc/consumo'
import { ALTURA_LABELS, ORIENTACAO_LABELS, TIPO_IMOVEL_LABELS, TIPO_TELHADO_LABELS } from '@/features/catalog/catalogLabels'
import type { Ligacao, ProposalEntrada } from '@/types/firestore'

const MESES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

export function ConsumoStep({ entrada, onChange }: { entrada: ProposalEntrada; onChange: (entrada: ProposalEntrada) => void }) {
  const [modo, setModo] = useState<'media' | 'mensal'>(entrada.consumoMensalKwh ? 'mensal' : 'media')

  function set<K extends keyof ProposalEntrada>(key: K, value: ProposalEntrada[K]) {
    onChange({ ...entrada, [key]: value })
  }

  function alternarModo(novoModo: 'media' | 'mensal') {
    setModo(novoModo)
    if (novoModo === 'mensal' && !entrada.consumoMensalKwh) {
      const media = entrada.consumoMedioKwh ?? 0
      onChange({ ...entrada, consumoMensalKwh: new Array(12).fill(media) })
    }
    if (novoModo === 'media') {
      onChange({ ...entrada, consumoMensalKwh: null })
    }
  }

  function setMes(index: number, valor: number) {
    const meses = [...(entrada.consumoMensalKwh ?? new Array(12).fill(0))]
    meses[index] = valor
    onChange({ ...entrada, consumoMensalKwh: meses })
  }

  const consumoMedio =
    entrada.consumoMensalKwh && entrada.consumoMensalKwh.length === 12
      ? entrada.consumoMensalKwh.reduce((a, b) => a + b, 0) / 12
      : (entrada.consumoMedioKwh ?? 0)

  function aplicarTarifaSugerida() {
    if (!entrada.contaAtual) return
    const tarifa = sugerirTarifa(entrada.contaAtual, consumoMedio)
    if (tarifa) set('tarifaKwh', Number(tarifa.toFixed(4)))
  }

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-lg font-bold text-graphite">Consumo</h2>

      <Segmented
        aria-label="Como informar o consumo"
        value={modo}
        onChange={alternarModo}
        options={[
          { value: 'media', label: 'Consumo médio' },
          { value: 'mensal', label: '12 meses' },
        ]}
      />

      {modo === 'media' ? (
        <Input
          label="Consumo médio mensal"
          type="number"
          suffix="kWh"
          value={entrada.consumoMedioKwh ?? ''}
          onChange={(e) => set('consumoMedioKwh', e.target.value === '' ? null : Number(e.target.value))}
        />
      ) : (
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
          {MESES.map((mes, i) => (
            <Input
              key={mes}
              label={mes}
              type="number"
              suffix="kWh"
              value={entrada.consumoMensalKwh?.[i] ?? 0}
              onChange={(e) => setMes(i, Number(e.target.value))}
            />
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <MoneyInput
          label="Conta atual"
          hint="Opcional — ajuda a sugerir a tarifa"
          value={entrada.contaAtual ?? 0}
          onChange={(v) => set('contaAtual', v)}
        />
        <div>
          <MoneyInput label="Tarifa" hint="R$/kWh, com impostos" value={entrada.tarifaKwh} onChange={(v) => set('tarifaKwh', v)} />
          {entrada.contaAtual ? (
            <button type="button" onClick={aplicarTarifaSugerida} className="mt-1.5 text-xs font-semibold text-sun-ink underline">
              Sugerir a partir da conta atual
            </button>
          ) : null}
        </div>
      </div>

      <Segmented
        aria-label="Tipo de ligação"
        value={entrada.ligacao}
        onChange={(v) => set('ligacao', v as Ligacao)}
        options={[
          { value: 'mono', label: 'Monofásico' },
          { value: 'bi', label: 'Bifásico' },
          { value: 'tri', label: 'Trifásico' },
        ]}
      />

      <Select
        label="Tipo de telhado"
        value={entrada.tipoTelhado}
        onChange={(e) => set('tipoTelhado', e.target.value as ProposalEntrada['tipoTelhado'])}
        options={[{ value: '', label: 'Não informado' }, ...Object.entries(TIPO_TELHADO_LABELS).map(([value, label]) => ({ value, label }))]}
      />

      <DadosInstalacaoSection entrada={entrada} set={set} />

      <div>
        <label className="mb-1.5 block text-sm font-semibold text-graphite">Observações</label>
        <textarea
          value={entrada.observacoes}
          onChange={(e) => set('observacoes', e.target.value)}
          rows={2}
          className="w-full rounded-field border border-[#D9D3C7] bg-surface p-3 text-sm text-graphite outline-none focus:ring-2 focus:ring-sun"
        />
      </div>
    </div>
  )
}

function DadosInstalacaoSection({
  entrada,
  set,
}: {
  entrada: ProposalEntrada
  set: <K extends keyof ProposalEntrada>(key: K, value: ProposalEntrada[K]) => void
}) {
  const [aberta, setAberta] = useState(false)

  return (
    <div className="rounded-card border border-line-soft">
      <button
        type="button"
        onClick={() => setAberta((v) => !v)}
        className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-bold text-graphite"
      >
        Dados da instalação
        <ChevronDown className={`h-4 w-4 text-muted transition-transform ${aberta ? 'rotate-180' : ''}`} aria-hidden />
      </button>
      {aberta && (
        <div className="flex flex-col gap-4 border-t border-line-soft p-4">
          <p className="text-xs text-muted">Tudo opcional — ajuda a compor a ficha técnica da proposta, mas nada aqui bloqueia salvar.</p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Select
              label="Tipo de imóvel"
              value={entrada.tipoImovel}
              onChange={(e) => set('tipoImovel', e.target.value as ProposalEntrada['tipoImovel'])}
              options={[{ value: '', label: 'Não informado' }, ...Object.entries(TIPO_IMOVEL_LABELS).map(([value, label]) => ({ value, label }))]}
            />
            <Select
              label="Altura da instalação"
              value={entrada.alturaInstalacao}
              onChange={(e) => set('alturaInstalacao', e.target.value as ProposalEntrada['alturaInstalacao'])}
              options={[{ value: '', label: 'Não informado' }, ...Object.entries(ALTURA_LABELS).map(([value, label]) => ({ value, label }))]}
            />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="Inclinação"
              type="number"
              suffix="°"
              value={entrada.inclinacaoGraus ?? ''}
              onChange={(e) => set('inclinacaoGraus', e.target.value === '' ? null : Number(e.target.value))}
            />
            <Select
              label="Orientação do telhado"
              value={entrada.orientacaoTelhado}
              onChange={(e) => set('orientacaoTelhado', e.target.value as ProposalEntrada['orientacaoTelhado'])}
              options={[{ value: '', label: 'Não informado' }, ...Object.entries(ORIENTACAO_LABELS).map(([value, label]) => ({ value, label }))]}
            />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input label="Distribuidora" value={entrada.distribuidora} onChange={(e) => set('distribuidora', e.target.value)} />
            <Input label="Unidade consumidora" value={entrada.unidadeConsumidora} onChange={(e) => set('unidadeConsumidora', e.target.value)} />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="Latitude"
              type="number"
              value={entrada.coordenadas.lat ?? ''}
              onChange={(e) => set('coordenadas', { ...entrada.coordenadas, lat: e.target.value === '' ? null : Number(e.target.value) })}
            />
            <Input
              label="Longitude"
              type="number"
              value={entrada.coordenadas.lng ?? ''}
              onChange={(e) => set('coordenadas', { ...entrada.coordenadas, lng: e.target.value === '' ? null : Number(e.target.value) })}
            />
          </div>
        </div>
      )}
    </div>
  )
}
