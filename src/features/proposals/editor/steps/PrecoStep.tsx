import { Input } from '@/components/ui/Input'
import { MoneyInput } from '@/components/ui/MoneyInput'
import { PercentField } from '@/components/ui/PercentField'
import { Segmented } from '@/components/ui/Segmented'
import { PAGAMENTO_CONFIG_PADRAO, resolverPagamento } from '@/lib/calc/pagamento'
import { formatBRL, formatPercent } from '@/lib/format'
import type {
  CalcSettings,
  ModoOpcaoPagamento,
  OpcaoPagamentoConfig,
  ProposalPagamentoConfig,
  ProposalPrecificacao,
  ProposalResultados,
  PublicOpcaoPagamento,
} from '@/types/firestore'

interface PrecoStepProps {
  precificacao: ProposalPrecificacao
  onChange: (precificacao: ProposalPrecificacao) => void
  resultados: ProposalResultados | null
  precoFinal: number
  calc: CalcSettings
  contaAtual: number | null
  condicoesPagamento: string
  onChangeCondicoesPagamento: (v: string) => void
  pagamento: ProposalPagamentoConfig
  onChangePagamento: (pagamento: ProposalPagamentoConfig) => void
}

export function PrecoStep({
  precificacao,
  onChange,
  resultados,
  precoFinal,
  calc,
  contaAtual,
  condicoesPagamento,
  onChangeCondicoesPagamento,
  pagamento,
  onChangePagamento,
}: PrecoStepProps) {
  function set<K extends keyof ProposalPrecificacao>(key: K, value: ProposalPrecificacao[K]) {
    onChange({ ...precificacao, [key]: value })
  }

  const taxas = {
    taxaCartaoMensal: calc.taxaCartaoMensal,
    parcelasCartao: calc.parcelasCartao,
    taxaFinanciamentoMensal: calc.taxaFinanciamentoMensal,
    parcelasFinanciamento: calc.parcelasFinanciamento,
  }
  const { financiamentoMenorQueContaAtual } = resolverPagamento(pagamento, precoFinal, taxas, contaAtual)
  const { pagamento: automatico } = resolverPagamento(PAGAMENTO_CONFIG_PADRAO, precoFinal, taxas, contaAtual)

  function setPagamento(opcao: keyof ProposalPagamentoConfig, config: OpcaoPagamentoConfig) {
    onChangePagamento({ ...pagamento, [opcao]: config })
  }

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

      <div className="mt-2 flex flex-col gap-3">
        <div>
          <h3 className="text-base font-bold text-graphite">Formas de pagamento</h3>
          <p className="text-xs text-muted">
            Escolha como cada opção aparece para o cliente. Use “Manual” quando o banco ou a operadora passar valores diferentes do cálculo.
          </p>
        </div>
        <OpcaoPagamentoEditor titulo="À vista" config={pagamento.avista} auto={automatico.avista} semParcelas onChange={(c) => setPagamento('avista', c)} />
        <OpcaoPagamentoEditor titulo="Cartão de crédito" config={pagamento.cartao} auto={automatico.cartao} onChange={(c) => setPagamento('cartao', c)} />
        <OpcaoPagamentoEditor
          titulo="Financiamento"
          config={pagamento.financiamento}
          auto={automatico.financiamento}
          destaque={financiamentoMenorQueContaAtual ? 'Parcela menor que a conta atual' : undefined}
          onChange={(c) => setPagamento('financiamento', c)}
        />
        <p className="text-xs text-muted">No modo automático as parcelas são simuladas com as taxas das Configurações. As condições finais dependem do banco ou da operadora.</p>
      </div>

      <div>
        <label htmlFor="condicoes-pagamento" className="mb-1.5 block text-sm font-semibold text-graphite">
          Observações de pagamento (aparece abaixo das opções)
        </label>
        <textarea
          id="condicoes-pagamento"
          value={condicoesPagamento}
          onChange={(e) => onChangeCondicoesPagamento(e.target.value)}
          rows={2}
          placeholder="Ex.: entrada de 30% e saldo na instalação. Desconto à vista válido no PIX."
          className="w-full rounded-field border border-[#D9D3C7] bg-surface p-3 text-sm text-graphite outline-none placeholder:text-muted/70 focus:ring-2 focus:ring-sun"
        />
      </div>
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

const MODOS: { value: ModoOpcaoPagamento; label: string }[] = [
  { value: 'auto', label: 'Auto' },
  { value: 'manual', label: 'Manual' },
  { value: 'combinar', label: 'A combinar' },
  { value: 'oculto', label: 'Ocultar' },
]

function descreverOpcao(opcao: PublicOpcaoPagamento, semParcelas?: boolean): string {
  return semParcelas ? formatBRL(opcao.valor) : `${opcao.parcelas}x de ${formatBRL(opcao.valor)}`
}

function OpcaoPagamentoEditor({
  titulo,
  config,
  auto,
  semParcelas,
  destaque,
  onChange,
}: {
  titulo: string
  config: OpcaoPagamentoConfig
  auto: PublicOpcaoPagamento
  semParcelas?: boolean
  destaque?: string
  onChange: (config: OpcaoPagamentoConfig) => void
}) {
  function trocarModo(modo: ModoOpcaoPagamento) {
    // Ao entrar no modo manual sem valor salvo, parte do valor calculado — o usuário só ajusta.
    if (modo === 'manual' && config.valor <= 0) {
      onChange({ modo, parcelas: semParcelas ? 1 : auto.parcelas, valor: Math.round(auto.valor * 100) / 100 })
      return
    }
    onChange({ ...config, modo })
  }

  const oculto = config.modo === 'oculto'

  return (
    <div className={`rounded-card border p-4 ${oculto ? 'border-dashed border-line' : 'border-line bg-surface'}`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className={`text-sm font-bold ${oculto ? 'text-muted' : 'text-graphite'}`}>{titulo}</p>
        <Segmented aria-label={`Como mostrar ${titulo}`} size="sm" value={config.modo} onChange={trocarModo} options={MODOS} />
      </div>

      <div className="mt-3">
        {config.modo === 'auto' && <p className="tabular-nums text-xl font-extrabold text-graphite">{descreverOpcao(auto, semParcelas)}</p>}
        {config.modo === 'manual' && (
          <div className={`grid gap-3 ${semParcelas ? 'grid-cols-1' : 'grid-cols-[104px_1fr]'}`}>
            {!semParcelas && (
              <Input
                label="Parcelas"
                type="number"
                inputMode="numeric"
                min={1}
                suffix="x"
                value={config.parcelas || ''}
                onChange={(e) => onChange({ ...config, parcelas: Number(e.target.value) })}
              />
            )}
            <MoneyInput
              label={semParcelas ? 'Valor à vista' : 'Valor da parcela'}
              value={config.valor}
              onChange={(valor) => onChange({ ...config, valor })}
              hint={`Calculado: ${descreverOpcao(auto, semParcelas)}`}
            />
          </div>
        )}
        {config.modo === 'combinar' && <p className="text-sm font-semibold text-graphite">Aparece para o cliente como “A combinar”.</p>}
        {oculto && <p className="text-sm text-muted">Não aparece na proposta.</p>}
        {destaque && (config.modo === 'auto' || config.modo === 'manual') && (
          <p className="mt-2 inline-block rounded-pill bg-sun-soft px-2.5 py-1 text-xs font-bold text-sun-ink">{destaque}</p>
        )}
      </div>
    </div>
  )
}
