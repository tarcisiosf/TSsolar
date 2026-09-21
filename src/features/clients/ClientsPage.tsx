import { Plus, Search, Users } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { SkeletonRow } from '@/components/ui/Skeleton'
import { PageHeader } from '@/components/layout/PageHeader'
import { subscribeClients } from '@/lib/data/clients'
import type { Client } from '@/types/firestore'
import { ClientSheet } from './ClientSheet'

export function ClientsPage() {
  const [clientes, setClientes] = useState<Client[] | null>(null)
  const [busca, setBusca] = useState('')
  const [sheetAberta, setSheetAberta] = useState(false)
  const [clienteEditando, setClienteEditando] = useState<Client | null>(null)

  useEffect(() => subscribeClients(setClientes), [])

  const filtrados = useMemo(() => {
    if (!clientes) return []
    const termo = busca.trim().toLowerCase()
    if (!termo) return clientes
    return clientes.filter((c) => `${c.nome} ${c.telefone} ${c.cidade}`.toLowerCase().includes(termo))
  }, [clientes, busca])

  function abrirNovo() {
    setClienteEditando(null)
    setSheetAberta(true)
  }

  function abrirEdicao(cliente: Client) {
    setClienteEditando(cliente)
    setSheetAberta(true)
  }

  return (
    <div>
      <PageHeader
        title="Clientes"
        subtitle="Quem já pediu ou recebeu uma proposta."
        action={
          <Button variant="primary" onClick={abrirNovo}>
            <Plus className="h-4 w-4" /> Novo cliente
          </Button>
        }
      />

      <div className="relative mb-4">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden />
        <input
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar por nome, telefone ou cidade"
          className="h-12 w-full rounded-field border border-[#D9D3C7] bg-surface pl-11 pr-4 text-[0.9375rem] outline-none focus:ring-2 focus:ring-sun"
        />
      </div>

      {clientes === null && (
        <div className="flex flex-col gap-3">
          <SkeletonRow />
          <SkeletonRow />
          <SkeletonRow />
        </div>
      )}

      {clientes !== null && filtrados.length === 0 && (
        <EmptyState
          icon={Users}
          title="Nenhum cliente ainda"
          description={clientes.length === 0 ? 'Cadastre o primeiro cliente.' : 'Ajuste a busca para encontrar alguém.'}
          actionLabel={clientes.length === 0 ? 'Novo cliente' : undefined}
          onAction={clientes.length === 0 ? abrirNovo : undefined}
        />
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
        {filtrados.map((cliente) => (
          <Card key={cliente.id} onClick={() => abrirEdicao(cliente)} className="cursor-pointer">
            <p className="truncate text-sm font-bold text-graphite">{cliente.nome}</p>
            <p className="truncate text-xs text-muted">{cliente.telefone || 'Sem telefone'}</p>
            <p className="truncate text-xs text-muted">{cliente.cidade || 'Sem cidade'}</p>
          </Card>
        ))}
      </div>

      <ClientSheet open={sheetAberta} onClose={() => setSheetAberta(false)} client={clienteEditando} />
    </div>
  )
}
