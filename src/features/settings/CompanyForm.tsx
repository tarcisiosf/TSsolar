import { Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { SavedIndicator, type SaveStatus } from '@/components/ui/SavedIndicator'
import { saveCompanySettings } from '@/lib/data/settings'
import { onlyDigits } from '@/lib/format'
import type { CompanySettings } from '@/types/firestore'

export function CompanyForm({ initial }: { initial: CompanySettings }) {
  const [form, setForm] = useState<CompanySettings>(initial)
  const [status, setStatus] = useState<SaveStatus>('idle')
  const [novoServico, setNovoServico] = useState('')

  function set<K extends keyof CompanySettings>(key: K, value: CompanySettings[K]) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  async function handleSalvar() {
    setStatus('saving')
    try {
      await saveCompanySettings(form)
      setStatus('saved')
    } catch {
      setStatus('error')
    }
  }

  function adicionarServico() {
    if (!novoServico.trim()) return
    set('servicosInclusos', [...form.servicosInclusos, novoServico.trim()])
    setNovoServico('')
  }

  function removerServico(index: number) {
    set(
      'servicosInclusos',
      form.servicosInclusos.filter((_, i) => i !== index),
    )
  }

  return (
    <Card className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-graphite">Dados da empresa</h2>
        <SavedIndicator status={status} />
      </div>

      <div className="flex items-center gap-4">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-chip">
          {form.logoUrl ? (
            <img src={form.logoUrl} alt="Logo" className="h-full w-full object-cover" />
          ) : (
            <span className="text-xs text-muted">Sem logo</span>
          )}
        </div>
        <div className="flex-1">
          <Input
            label="URL da logo"
            hint="Opcional — cole o link de uma imagem já hospedada (PNG ou SVG). Sem isso, a proposta usa o sol do DESIGN.md."
            value={form.logoUrl ?? ''}
            onChange={(e) => set('logoUrl', e.target.value || null)}
            placeholder="https://…"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input label="Nome da empresa" value={form.nome} onChange={(e) => set('nome', e.target.value)} />
        <Input label="CNPJ" value={form.cnpj} onChange={(e) => set('cnpj', e.target.value)} placeholder="00.000.000/0001-00" />
        <Input label="Nome da parceria" value={form.parceria.nome} onChange={(e) => set('parceria', { ...form.parceria, nome: e.target.value })} />
        <Input label="CNPJ da parceria" value={form.parceria.cnpj} onChange={(e) => set('parceria', { ...form.parceria, cnpj: e.target.value })} />
        <Input label="Cidade" value={form.cidade} onChange={(e) => set('cidade', e.target.value)} />
        <Input
          label="WhatsApp"
          hint="Só dígitos, com DDI 55 (ex.: 5562999999999)"
          value={form.whatsapp}
          onChange={(e) => set('whatsapp', onlyDigits(e.target.value))}
        />
        <Input label="Instagram" value={form.instagram} onChange={(e) => set('instagram', e.target.value)} placeholder="@tssolar" />
        <Input label="E-mail" type="email" value={form.email} onChange={(e) => set('email', e.target.value)} />
        <Input
          label="Validade da proposta"
          type="number"
          suffix="dias"
          value={form.validadeDias}
          onChange={(e) => set('validadeDias', Number(e.target.value))}
        />
        <Input label="Prazo de instalação" value={form.prazoInstalacao} onChange={(e) => set('prazoInstalacao', e.target.value)} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Input
          label="Garantia dos painéis"
          value={form.garantias.paineis}
          onChange={(e) => set('garantias', { ...form.garantias, paineis: e.target.value })}
        />
        <Input
          label="Garantia do inversor"
          value={form.garantias.inversor}
          onChange={(e) => set('garantias', { ...form.garantias, inversor: e.target.value })}
        />
        <Input
          label="Garantia da instalação"
          value={form.garantias.instalacao}
          onChange={(e) => set('garantias', { ...form.garantias, instalacao: e.target.value })}
        />
      </div>

      <div>
        <p className="mb-2 text-sm font-semibold text-graphite">Serviços inclusos</p>
        <div className="flex flex-col gap-2">
          {form.servicosInclusos.map((servico, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="flex-1 rounded-field border border-line bg-ivory px-3 py-2 text-sm text-graphite">{servico}</span>
              <button
                type="button"
                onClick={() => removerServico(i)}
                className="flex h-9 w-9 items-center justify-center rounded-field text-muted hover:bg-danger-soft hover:text-danger"
                aria-label={`Remover ${servico}`}
              >
                <Trash2 className="h-4 w-4" aria-hidden />
              </button>
            </div>
          ))}
          <div className="flex items-center gap-2">
            <input
              value={novoServico}
              onChange={(e) => setNovoServico(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), adicionarServico())}
              placeholder="Adicionar serviço incluso"
              className="h-10 flex-1 rounded-field border border-[#D9D3C7] bg-surface px-3 text-sm outline-none focus:ring-2 focus:ring-sun"
            />
            <Button type="button" variant="secondary" onClick={adicionarServico} className="h-10 px-3">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-semibold text-graphite">Exclusões (texto padrão)</label>
        <textarea
          value={form.exclusoes}
          onChange={(e) => set('exclusoes', e.target.value)}
          rows={3}
          className="w-full rounded-field border border-[#D9D3C7] bg-surface p-3 text-sm text-graphite outline-none focus:ring-2 focus:ring-sun"
        />
      </div>

      <Button variant="primary" onClick={handleSalvar} loading={status === 'saving'} className="self-start">
        Salvar dados da empresa
      </Button>
    </Card>
  )
}
