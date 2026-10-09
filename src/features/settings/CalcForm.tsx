import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { MoneyInput } from '@/components/ui/MoneyInput'
import { PercentField } from '@/components/ui/PercentField'
import { SavedIndicator, type SaveStatus } from '@/components/ui/SavedIndicator'
import { saveCalcSettings } from '@/lib/data/settings'
import type { CalcSettings } from '@/types/firestore'

const MESES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

export function CalcForm({ initial }: { initial: CalcSettings }) {
  const [form, setForm] = useState<CalcSettings>(initial)
  const [status, setStatus] = useState<SaveStatus>('idle')

  function set<K extends keyof CalcSettings>(key: K, value: CalcSettings[K]) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  function setDistribuicao(index: number, valor: number) {
    const nova = [...form.distribuicaoMensal]
    nova[index] = valor
    set('distribuicaoMensal', nova)
  }

  async function handleSalvar() {
    setStatus('saving')
    try {
      await saveCalcSettings(form)
      setStatus('saved')
    } catch {
      setStatus('error')
    }
  }

  return (
    <Card className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-graphite">Parâmetros de cálculo</h2>
        <SavedIndicator status={status} />
      </div>
      <p className="text-xs text-muted">
        Próximo número de proposta: <span className="font-semibold text-graphite">TS-{new Date().getFullYear()}-{String(form.proximoNumero).padStart(3, '0')}</span>
      </p>

      <section>
        <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-muted">Produção</h3>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <Input
            label="Produtividade"
            type="number"
            suffix="kWh/kWp/ano"
            value={form.produtividadeKwhKwpAno}
            onChange={(e) => set('produtividadeKwhKwpAno', Number(e.target.value))}
          />
          <PercentField label="Degradação anual" value={form.degradacaoAnual} onChange={(v) => set('degradacaoAnual', v)} />
          <Input
            label="Horizonte"
            type="number"
            suffix="anos"
            value={form.horizonteAnos}
            onChange={(e) => set('horizonteAnos', Number(e.target.value))}
          />
        </div>
        <p className="mb-2 mt-4 text-xs font-semibold text-graphite">Distribuição mensal de geração (fatores, média 1)</p>
        <div className="grid grid-cols-4 gap-3 sm:grid-cols-6">
          {MESES.map((mes, i) => (
            <Input
              key={mes}
              label={mes}
              type="number"
              step="0.001"
              value={form.distribuicaoMensal[i]}
              onChange={(e) => setDistribuicao(i, Number(e.target.value))}
            />
          ))}
        </div>
      </section>

      <section>
        <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-muted">Tarifa e conta com o sistema</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <MoneyInput label="Tarifa padrão" value={form.tarifaKwh} onChange={(v) => set('tarifaKwh', v)} hint="R$/kWh com impostos, editável por proposta" />
        </div>
        <p className="mb-1 mt-4 text-xs font-semibold text-graphite">Taxa mínima da conta (R$/mês, com impostos)</p>
        <p className="mb-2 text-xs text-muted">
          É a conta do cliente depois do sistema — usada na manchete, na economia e nos cenários de 25 anos. Padrão: Equatorial Goiás, R$ 0,892/kWh sem impostos (≈ R$ 1,20 com ICMS e PIS/COFINS) × 30, 50 ou 100 kWh.
        </p>
        <div className="grid grid-cols-3 gap-3">
          <MoneyInput label="Monofásico" value={form.taxaMinimaReais.mono} onChange={(v) => set('taxaMinimaReais', { ...form.taxaMinimaReais, mono: v })} />
          <MoneyInput label="Bifásico" value={form.taxaMinimaReais.bi} onChange={(v) => set('taxaMinimaReais', { ...form.taxaMinimaReais, bi: v })} />
          <MoneyInput label="Trifásico" value={form.taxaMinimaReais.tri} onChange={(v) => set('taxaMinimaReais', { ...form.taxaMinimaReais, tri: v })} />
        </div>
      </section>

      <section>
        <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-muted">Reajustes</h3>
        <div className="grid grid-cols-2 gap-4">
          <PercentField label="Cenário conservador" value={form.reajusteConservador} onChange={(v) => set('reajusteConservador', v)} />
          <PercentField label="Cenário otimista" value={form.reajusteOtimista} onChange={(v) => set('reajusteOtimista', v)} />
        </div>
      </section>

      <section>
        <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-muted">Pagamento</h3>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <PercentField label="Taxa do cartão (mês)" value={form.taxaCartaoMensal} onChange={(v) => set('taxaCartaoMensal', v)} />
          <Input
            label="Parcelas do cartão"
            type="number"
            value={form.parcelasCartao}
            onChange={(e) => set('parcelasCartao', Number(e.target.value))}
          />
          <PercentField label="Taxa do financiamento (mês)" value={form.taxaFinanciamentoMensal} onChange={(v) => set('taxaFinanciamentoMensal', v)} />
          <Input
            label="Parcelas do financiamento"
            type="number"
            value={form.parcelasFinanciamento}
            onChange={(e) => set('parcelasFinanciamento', Number(e.target.value))}
          />
        </div>
      </section>

      <section>
        <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-muted">Comercial</h3>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <PercentField label="Alíquota do Simples" value={form.aliquotaSimples} onChange={(v) => set('aliquotaSimples', v)} />
          <PercentField label="Comissão padrão" value={form.comissaoPadrao} onChange={(v) => set('comissaoPadrao', v)} />
          <PercentField label="Margem padrão" value={form.margemPadrao} onChange={(v) => set('margemPadrao', v)} />
        </div>
      </section>

      <section>
        <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-muted">Estrutura</h3>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <Input
            label="Largura padrão do módulo"
            type="number"
            step="0.01"
            suffix="m"
            value={form.larguraModuloPadraoM}
            onChange={(e) => set('larguraModuloPadraoM', Number(e.target.value))}
          />
          <Input
            label="Espaçamento do hook"
            type="number"
            step="0.1"
            suffix="m"
            value={form.espacamentoHookM}
            onChange={(e) => set('espacamentoHookM', Number(e.target.value))}
          />
        </div>
      </section>

      <Button variant="primary" onClick={handleSalvar} loading={status === 'saving'} className="self-start">
        Salvar parâmetros de cálculo
      </Button>
    </Card>
  )
}
