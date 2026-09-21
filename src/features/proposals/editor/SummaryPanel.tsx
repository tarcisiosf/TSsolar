import { formatBRL, formatNumber, formatPercent } from '@/lib/format'
import type { ProposalResultados } from '@/types/firestore'

export function SummaryPanel({ precoFinal, resultados }: { precoFinal: number; resultados: ProposalResultados | null }) {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <p className="text-xs font-bold uppercase tracking-wide text-muted">Preço da proposta</p>
        <p className="tabular-nums text-[1.75rem] font-extrabold leading-[1.1] tracking-[-0.03em] text-graphite">
          {formatBRL(precoFinal, false)}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-card bg-success-soft p-3">
          <p className="text-[11px] font-bold uppercase tracking-wide text-success">Lucro estimado</p>
          <p className="tabular-nums text-lg font-extrabold text-success">
            {resultados ? formatBRL(resultados.lucroEstimado, false) : '—'}
          </p>
        </div>
        <div className="rounded-card bg-chip p-3">
          <p className="text-[11px] font-bold uppercase tracking-wide text-muted">Margem</p>
          <p className="tabular-nums text-lg font-extrabold text-graphite">
            {resultados ? formatPercent(resultados.margemResultante, 1) : '—'}
          </p>
        </div>
        <div className="rounded-card bg-chip p-3">
          <p className="text-[11px] font-bold uppercase tracking-wide text-muted">R$/Wp</p>
          <p className="tabular-nums text-lg font-extrabold text-graphite">
            {resultados ? formatNumber(resultados.precoPorWp, 2) : '—'}
          </p>
        </div>
        <div className="rounded-card bg-chip p-3">
          <p className="text-[11px] font-bold uppercase tracking-wide text-muted">Payback</p>
          <p className="tabular-nums text-lg font-extrabold text-graphite">
            {resultados?.paybackMesesConservador ? `${Math.ceil(resultados.paybackMesesConservador / 12)} anos` : '—'}
          </p>
        </div>
      </div>

      {resultados && resultados.relacaoCcCa > 1.35 && (
        <p className={`text-xs font-semibold ${resultados.relacaoCcCa > 1.5 ? 'text-danger' : 'text-sun-ink'}`}>
          Relação CC/CA de {formatNumber(resultados.relacaoCcCa, 2)} — {resultados.relacaoCcCa > 1.5 ? 'risco alto de clipping.' : 'atenção ao clipping.'}
        </p>
      )}
    </div>
  )
}
