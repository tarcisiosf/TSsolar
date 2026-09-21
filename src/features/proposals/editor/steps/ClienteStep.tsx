import { Plus, Search, UserCheck } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Card } from '@/components/ui/Card'
import { ClientSheet } from '@/features/clients/ClientSheet'
import type { Client } from '@/types/firestore'

interface ClienteStepProps {
  clients: Client[]
  clientId: string
  onSelect: (client: Client) => void
}

export function ClienteStep({ clients, clientId, onSelect }: ClienteStepProps) {
  const [busca, setBusca] = useState('')
  const [sheetAberta, setSheetAberta] = useState(false)

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLowerCase()
    if (!termo) return clients
    return clients.filter((c) => `${c.nome} ${c.telefone}`.toLowerCase().includes(termo))
  }, [clients, busca])

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-lg font-bold text-graphite">Cliente</h2>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden />
          <input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar cliente"
            className="h-12 w-full rounded-field border border-[#D9D3C7] bg-surface pl-11 pr-4 text-[0.9375rem] outline-none focus:ring-2 focus:ring-sun"
          />
        </div>
        <button
          onClick={() => setSheetAberta(true)}
          className="flex h-12 shrink-0 items-center gap-2 rounded-field border border-[#D9D3C7] bg-surface px-4 text-sm font-bold text-graphite hover:bg-chip"
        >
          <Plus className="h-4 w-4" aria-hidden /> Novo
        </button>
      </div>

      <div className="flex flex-col gap-2">
        {filtrados.map((cliente) => {
          const selecionado = cliente.id === clientId
          return (
            <Card
              key={cliente.id}
              onClick={() => onSelect(cliente)}
              className={`flex cursor-pointer items-center justify-between gap-3 ${selecionado ? 'ring-2 ring-sun' : ''}`}
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-graphite">{cliente.nome}</p>
                <p className="truncate text-xs text-muted">{cliente.telefone || cliente.cidade || 'Sem contato'}</p>
              </div>
              {selecionado && <UserCheck className="h-5 w-5 shrink-0 text-sun" aria-hidden />}
            </Card>
          )
        })}
        {filtrados.length === 0 && <p className="py-6 text-center text-sm text-muted">Nenhum cliente encontrado. Crie um novo.</p>}
      </div>

      <ClientSheet
        open={sheetAberta}
        onClose={() => setSheetAberta(false)}
        client={null}
        onCreated={(id, input) => onSelect({ id, ...input } as Client)}
      />
    </div>
  )
}
