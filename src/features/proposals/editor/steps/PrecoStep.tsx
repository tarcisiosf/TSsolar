import { Card } from '@/components/ui/Card'
import { MoneyInput } from '@/components/ui/MoneyInput'
import { PercentField } from '@/components/ui/PercentField'
import { Segmented } from '@/components/ui/Segmented'
import { simularPagamento } from '@/lib/calc/pagamento'
import { formatBRL, formatPercent } from '@/lib/format'
import type { CalcSettings, ProposalPrecificacao, ProposalResultados } from '@/types/firestore'

interface PrecoStepProps {
  precificacao: ProposalPrecificacao
  onChange: (precificacao: ProposalPrecificacao) => void
  resultados: ProposalResultados | null
  precoFinal: number
  calc: CalcSettings
  contaAtual: number | null
}

export function PrecoStep({ precificacao, onChange, resultados, precoFinal, calc, contaAtual }: PrecoStepProps) {
  function set<K extends keyof ProposalPrecificacao>(key: K, value: ProposalPrecificacao[K]) {
    onChange({ ...precificacao, [key]: value })
  }

  const pagamento = simularPagamento(precoFinal, calc.taxaCartaoMensal, calc.parcelasCartao, calc.taxaFinanciamentoMensal, calc.parcelasFinanciamento, contaAtual)

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-lg font-bold text-graphite">Preço e pagamento</h2>

      <Segmented
        aria-label="Modo de precificação"
        value={precificacao.modo}
        onChange={(v) => set('modo', v as ProposalPrecificacao['modo'])}
        options={[
          { value: 'margem', label: 'Por margem' },
          { value: 'manual', label: 'Preço manual' },
        ]}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {precificacao.modo === 'margem' ? (
          <PercentField label="Margem desejada" value={precificacao.margem} onChange={(v) => set('margem', v)} />
        ) : (
          <MoneyInput label="Preço final" value={precificacao.precoFinal} onChange={(v) => set('precoFinal', v)} />
        )}
        <PercentField label="Comissão" value={precificacao.comissao} onChange={(v) => set('comissao', v)} />
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <SummaryTile label="Preço" value={formatBRL(precoFinal, false)} />
        <SummaryTile label="Custo total" value={resultados ? formatBRL(resultados.custoTotal, false) : '—'} />
        <SummaryTile label="Lucro" value={resultados ? formatBRL(resultados.lucroEstimado, false) : '—'} tone="success" />
        <SummaryTile label="Margem" value={resultados ? formatPercent(resultados.margemResultante, 1) : '—'} />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Card>
          <p className="text-xs font-bold uppercase tracking-wide text-muted">Cartão em {calc.parcelasCartao}x</p>
          <p className="tabular-nums text-xl font-extrabold text-graphite">{formatBRL(pagamento.parcelaCartao)}</p>
        </Card>
        <Card className={pagamento.financiamentoMenorQueContaAtual ? 'bg-sun-soft' : ''}>
          <p className={`text-xs font-bold uppercase tracking-wide ${pagamento.financiamentoMenorQueContaAtual ? 'text-sun-ink' : 'text-muted'}`}>
            Financiamento em {calc.parcelasFinanciamento}x
          </p>
          <p className={`tabular-nums text-xl font-extrabold ${pagamento.financiamentoMenorQueContaAtual ? 'text-sun-ink' : 'text-graphite'}`}>
            {formatBRL(pagamento.parcelaFinanciamento)}
          </p>
          {pagamento.financiamentoMenorQueContaAtual && <p className="mt-1 text-xs font-semibold text-sun-ink">Menor que a conta atual</p>}
        </Card>
      </div>
      <p className="text-xs text-muted">Parcelas simuladas — condições finais dependem do banco ou operadora escolhida.</p>
    </div>
  )
}

function SummaryTile({ label, value, tone }: { label: string; value: string; tone?: 'success' }) {
  return (
    <div className={`rounded-card p-3 ${tone === 'success' ? 'bg-success-soft' : 'bg-chip'}`}>
      <p className={`text-[11px] font-bold uppercase tracking-wide ${tone === 'success' ? 'text-success' : 'text-muted'}`}>{label}</p>
      <p className={`tabular-nums text-base font-extrabold ${tone === 'success' ? 'text-success' : 'text-graphite'}`}>{value}</p>
    </div>
  )
}
