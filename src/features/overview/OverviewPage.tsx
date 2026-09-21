import { FileText, Package, Plus, Users } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { SkeletonRow } from '@/components/ui/Skeleton'
import { StatusPropostaChip } from '@/components/ui/Chip'
import { PageHeader } from '@/components/layout/PageHeader'
import { formatBRL, formatDateBR, formatKwp } from '@/lib/format'
import { subscribeProposals } from '@/lib/data/proposals'
import type { Proposal } from '@/types/firestore'

const atalhos = [
  { to: '/app/propostas/nova', label: 'Nova proposta', icon: Plus },
  { to: '/app/clientes', label: 'Clientes', icon: Users },
  { to: '/app/catalogo', label: 'Catálogo', icon: Package },
  { to: '/app/propostas', label: 'Todas as propostas', icon: FileText },
]

export function OverviewPage() {
  const [propostas, setPropostas] = useState<Proposal[] | null>(null)

  useEffect(() => subscribeProposals(setPropostas), [])

  const ultimas = propostas?.slice(0, 5) ?? []

  return (
    <div>
      <PageHeader
        title="Visão geral"
        subtitle="Suas últimas propostas e atalhos rápidos."
        action={
          <Link to="/app/propostas/nova">
            <Button variant="primary">
              <Plus className="h-4 w-4" /> Nova proposta
            </Button>
          </Link>
        }
      />

      <div className="mb-8 grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
        {atalhos.map((a) => (
          <Link key={a.to} to={a.to}>
            <Card className="flex flex-col items-start gap-2 transition-shadow hover:shadow-[0_2px_8px_rgba(15,27,45,0.1)]">
              <a.icon className="h-5 w-5 text-sun" strokeWidth={2} aria-hidden />
              <span className="text-sm font-bold text-graphite">{a.label}</span>
            </Card>
          </Link>
        ))}
      </div>

      <h2 className="mb-3 text-lg font-bold text-graphite">Últimas propostas</h2>

      {propostas === null && (
        <div className="flex flex-col gap-3">
          <SkeletonRow />
          <SkeletonRow />
          <SkeletonRow />
        </div>
      )}

      {propostas !== null && ultimas.length === 0 && (
        <EmptyState
          icon={FileText}
          title="Nenhuma proposta ainda"
          description="Crie a primeira proposta para ver o resumo aqui."
          actionLabel="Criar proposta"
          onAction={() => (window.location.href = '/app/propostas/nova')}
        />
      )}

      <div className="flex flex-col gap-3">
        {ultimas.map((p) => (
          <Link key={p.id} to={`/app/propostas/${p.id}`}>
            <Card className="flex items-center justify-between gap-4 transition-shadow hover:shadow-[0_2px_8px_rgba(15,27,45,0.1)]">
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-graphite">{p.numero || 'Rascunho sem número'}</p>
                <p className="truncate text-xs text-muted">
                  {p.clienteNome || 'Sem cliente'} · {formatKwp(p.sistema.potenciaKwp)} · {formatDateBR(p.criadoEm.toDate())}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <span className="tabular-nums text-sm font-bold text-graphite">{formatBRL(p.precificacao.precoFinal, false)}</span>
                <StatusPropostaChip status={p.status} />
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
