import { useState } from 'react'
import { Input } from '@/components/ui/Input'
import { MoneyInput } from '@/components/ui/MoneyInput'
import { Segmented } from '@/components/ui/Segmented'
import { sugerirTarifa } from '@/lib/calc/consumo'
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

      <Input label="Tipo de telhado" value={entrada.tipoTelhado} onChange={(e) => set('tipoTelhado', e.target.value)} placeholder="Cerâmico, metálico, laje…" />

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
