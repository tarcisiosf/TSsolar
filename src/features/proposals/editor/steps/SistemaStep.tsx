import { Sparkles } from 'lucide-react'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { calcularRelacaoCcCa, potenciaFinalKwp, sugerirDimensionamento } from '@/lib/calc/dimensionamento'
import { formatKwp, formatNumber } from '@/lib/format'
import type { CatalogItem, ProposalSistema } from '@/types/firestore'

// Área por módulo aproximada (m²) — catálogo não guarda dimensões físicas ainda.
const AREA_POR_MODULO_M2 = 2.1

interface SistemaStepProps {
  sistema: ProposalSistema
  onChange: (sistema: ProposalSistema) => void
  consumoMedioMensalKwh: number
  produtividadeKwhKwpAno: number
  modulos: CatalogItem[]
  inversores: CatalogItem[]
}

export function SistemaStep({ sistema, onChange, consumoMedioMensalKwh, produtividadeKwhKwpAno, modulos, inversores }: SistemaStepProps) {
  const moduloSelecionado = modulos.find((m) => m.id === sistema.moduloId) ?? null
  const inversorSelecionado = inversores.find((i) => i.id === sistema.inversorId) ?? null

  function recalcularComQtd(qtdModulos: number, moduloId = sistema.moduloId) {
    const modulo = modulos.find((m) => m.id === moduloId)
    const potenciaKwp = modulo?.potenciaW ? potenciaFinalKwp(qtdModulos, modulo.potenciaW) : sistema.potenciaKwp
    onChange({
      ...sistema,
      moduloId,
      qtdModulos,
      potenciaKwp,
      areaM2: qtdModulos * AREA_POR_MODULO_M2,
    })
  }

  function aplicarSugestao() {
    if (!moduloSelecionado?.potenciaW) return
    const { qtdModulosSugerido } = sugerirDimensionamento(consumoMedioMensalKwh, produtividadeKwhKwpAno, moduloSelecionado.potenciaW)
    recalcularComQtd(qtdModulosSugerido)
  }

  const inversorPotenciaKw = inversorSelecionado?.potenciaW ? inversorSelecionado.potenciaW / 1000 : 0
  const relacao = calcularRelacaoCcCa(sistema.potenciaKwp, inversorPotenciaKw)

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-lg font-bold text-graphite">Sistema</h2>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Select
          label="Módulo"
          value={sistema.moduloId ?? ''}
          onChange={(e) => recalcularComQtd(sistema.qtdModulos, e.target.value || null)}
          options={[{ value: '', label: 'Selecione um módulo' }, ...modulos.map((m) => ({ value: m.id, label: `${m.marca} ${m.modelo} (${m.potenciaW} W)` }))]}
        />
        <Select
          label="Inversor"
          value={sistema.inversorId ?? ''}
          onChange={(e) => onChange({ ...sistema, inversorId: e.target.value || null })}
          options={[{ value: '', label: 'Selecione um inversor' }, ...inversores.map((i) => ({ value: i.id, label: `${i.marca} ${i.modelo} (${(i.potenciaW ?? 0) / 1000} kW)` }))]}
        />
      </div>

      {moduloSelecionado?.potenciaW && (
        <button
          type="button"
          onClick={aplicarSugestao}
          className="flex w-fit items-center gap-1.5 text-xs font-semibold text-sun-ink underline"
        >
          <Sparkles className="h-3.5 w-3.5" aria-hidden />
          Sugerir dimensionamento a partir do consumo
        </button>
      )}

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <Input
          label="Quantidade de módulos"
          type="number"
          value={sistema.qtdModulos}
          onChange={(e) => recalcularComQtd(Number(e.target.value))}
        />
        <div className="flex flex-col justify-center rounded-field bg-chip px-4 py-2">
          <p className="text-xs font-semibold text-muted">Potência final</p>
          <p className="tabular-nums text-base font-extrabold text-graphite">{formatKwp(sistema.potenciaKwp)}</p>
        </div>
        <div className="flex flex-col justify-center rounded-field bg-chip px-4 py-2">
          <p className="text-xs font-semibold text-muted">Área estimada</p>
          <p className="tabular-nums text-base font-extrabold text-graphite">{formatNumber(sistema.areaM2, 1)} m²</p>
        </div>
      </div>

      {inversorSelecionado && (
        <div
          className={`rounded-field px-4 py-3 text-sm font-semibold ${
            relacao.nivel === 'alerta' ? 'bg-danger-soft text-danger' : relacao.nivel === 'aviso' ? 'bg-sun-soft text-sun-ink' : 'bg-success-soft text-success'
          }`}
        >
          Relação CC/CA: {formatNumber(relacao.relacao, 2)}
          {relacao.nivel === 'aviso' && ' — atenção: acima de 1,35, avalie o risco de clipping.'}
          {relacao.nivel === 'alerta' && ' — risco alto de clipping, acima de 1,5.'}
          {relacao.nivel === 'ok' && ' — dentro da faixa recomendada.'}
        </div>
      )}
    </div>
  )
}
