import { Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { MoneyInput } from '@/components/ui/MoneyInput'
import type { ProposalServicos } from '@/types/firestore'

export function ServicosStep({ servicos, onChange }: { servicos: ProposalServicos; onChange: (servicos: ProposalServicos) => void }) {
  function set<K extends keyof ProposalServicos>(key: K, value: ProposalServicos[K]) {
    onChange({ ...servicos, [key]: value })
  }

  function adicionarOutro() {
    set('outros', [...servicos.outros, { descricao: '', valor: 0 }])
  }

  function atualizarOutro(index: number, patch: Partial<{ descricao: string; valor: number }>) {
    set(
      'outros',
      servicos.outros.map((o, i) => (i === index ? { ...o, ...patch } : o)),
    )
  }

  function removerOutro(index: number) {
    set(
      'outros',
      servicos.outros.filter((_, i) => i !== index),
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-lg font-bold text-graphite">Serviços e custos</h2>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <MoneyInput label="Materiais" value={servicos.materiais} onChange={(v) => set('materiais', v)} hint="Custo total dos equipamentos e materiais da proposta" />
        <MoneyInput label="Projeto" value={servicos.projeto} onChange={(v) => set('projeto', v)} />
        <MoneyInput label="Instalação" value={servicos.instalacao} onChange={(v) => set('instalacao', v)} />
        <MoneyInput label="ART" value={servicos.art} onChange={(v) => set('art', v)} />
        <MoneyInput label="Frete" value={servicos.frete} onChange={(v) => set('frete', v)} />
        <MoneyInput label="Homologação" value={servicos.homologacao} onChange={(v) => set('homologacao', v)} />
      </div>

      <div>
        <p className="mb-2 text-sm font-semibold text-graphite">Outros custos</p>
        <div className="flex flex-col gap-2">
          {servicos.outros.map((outro, i) => (
            <div key={i} className="flex items-end gap-2">
              <div className="flex-1">
                <label className="mb-1.5 block text-sm font-semibold text-graphite">Descrição</label>
                <input
                  value={outro.descricao}
                  onChange={(e) => atualizarOutro(i, { descricao: e.target.value })}
                  className="h-12 w-full rounded-field border border-[#D9D3C7] bg-surface px-4 text-sm outline-none focus:ring-2 focus:ring-sun"
                />
              </div>
              <div className="w-36">
                <MoneyInput label="Valor" value={outro.valor} onChange={(v) => atualizarOutro(i, { valor: v })} />
              </div>
              <button
                onClick={() => removerOutro(i)}
                className="mb-0.5 flex h-12 w-12 shrink-0 items-center justify-center rounded-field text-muted hover:bg-danger-soft hover:text-danger"
                aria-label="Remover custo"
              >
                <Trash2 className="h-4 w-4" aria-hidden />
              </button>
            </div>
          ))}
        </div>
        <Button type="button" variant="secondary" onClick={adicionarOutro} className="mt-3 h-10 px-4">
          <Plus className="h-4 w-4" /> Adicionar custo
        </Button>
      </div>
    </div>
  )
}
