import { Copy, Download, ExternalLink, FileText, Plus, Search } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { Select } from '@/components/ui/Select'
import { SkeletonRow } from '@/components/ui/Skeleton'
import { StatusPropostaChip } from '@/components/ui/Chip'
import { PageHeader } from '@/components/layout/PageHeader'
import { formatBRL, formatDateBR, formatKwp } from '@/lib/format'
import { duplicateProposal, subscribeProposals, updateProposalStatus } from '@/lib/data/proposals'
import { getClient } from '@/lib/data/clients'
import { getCalcSettings, getCompanySettings } from '@/lib/data/settings'
import { toPublicSnapshot } from '@/lib/calc/toPublicSnapshot'
import type { CalcSettings, CompanySettings, Proposal, StatusProposta } from '@/types/firestore'

const STATUS_OPTIONS: { value: StatusProposta | 'todas'; label: string }[] = [
  { value: 'todas', label: 'Todos os status' },
  { value: 'rascunho', label: 'Rascunho' },
  { value: 'enviada', label: 'Enviada' },
  { value: 'negociacao', label: 'Negociação' },
  { value: 'fechada', label: 'Fechada' },
  { value: 'perdida', label: 'Perdida' },
]

export function ProposalsListPage() {
  const [propostas, setPropostas] = useState<Proposal[] | null>(null)
  const [busca, setBusca] = useState('')
  const [status, setStatus] = useState<StatusProposta | 'todas'>('todas')
  const [calc, setCalc] = useState<CalcSettings | null>(null)
  const [company, setCompany] = useState<CompanySettings | null>(null)

  useEffect(() => subscribeProposals(setPropostas), [])
  useEffect(() => {
    getCalcSettings().then(setCalc)
    getCompanySettings().then(setCompany)
  }, [])

  const filtradas = useMemo(() => {
    if (!propostas) return []
    const termo = busca.trim().toLowerCase()
    return propostas.filter((p) => {
      const bateStatus = status === 'todas' || p.status === status
      const bateBusca = !termo || `${p.numero} ${p.clienteNome}`.toLowerCase().includes(termo)
      return bateStatus && bateBusca
    })
  }, [propostas, busca, status])

  async function handleDuplicar(id: string) {
    const novoId = await duplicateProposal(id)
    window.location.href = `/app/propostas/${novoId}`
  }

  async function handleBaixarPdf(p: Proposal) {
    if (!calc || !company || !p.resultados) return
    const cliente = await getClient(p.clientId)
    const { downloadProposalPdf } = await import('@/features/pdf/downloadProposalPdf')
    const snapshot = toPublicSnapshot({
      proposal: p,
      company,
      client: cliente,
      taxaCartaoMensal: calc.taxaCartaoMensal,
      parcelasCartao: calc.parcelasCartao,
      taxaFinanciamentoMensal: calc.taxaFinanciamentoMensal,
      parcelasFinanciamento: calc.parcelasFinanciamento,
    })
    await downloadProposalPdf(snapshot)
  }

  return (
    <div>
      <PageHeader
        title="Propostas"
        subtitle="Todas as propostas geradas para clientes."
        action={
          <Link to="/app/propostas/nova">
            <Button variant="primary">
              <Plus className="h-4 w-4" /> Nova proposta
            </Button>
          </Link>
        }
      />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden />
          <input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por número ou cliente"
            className="h-12 w-full rounded-field border border-[#D9D3C7] bg-surface pl-11 pr-4 text-[0.9375rem] outline-none focus:ring-2 focus:ring-sun"
          />
        </div>
        <div className="sm:w-52">
          <Select label="Status" value={status} onChange={(e) => setStatus(e.target.value as StatusProposta | 'todas')} options={STATUS_OPTIONS} />
        </div>
      </div>

      {propostas === null && (
        <div className="flex flex-col gap-3">
          <SkeletonRow />
          <SkeletonRow />
          <SkeletonRow />
        </div>
      )}

      {propostas !== null && filtradas.length === 0 && (
        <EmptyState
          icon={FileText}
          title="Nenhuma proposta ainda"
          description={propostas.length === 0 ? 'Crie a primeira proposta.' : 'Ajuste a busca ou o filtro de status.'}
          actionLabel={propostas.length === 0 ? 'Nova proposta' : undefined}
          onAction={propostas.length === 0 ? () => (window.location.href = '/app/propostas/nova') : undefined}
        />
      )}

      <div className="flex flex-col gap-3">
        {filtradas.map((p) => (
          <Card key={p.id}>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <Link to={`/app/propostas/${p.id}`} className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-graphite">{p.numero || 'Rascunho sem número'}</p>
                <p className="truncate text-xs text-muted">
                  {p.clienteNome || 'Sem cliente'} · {formatKwp(p.sistema.potenciaKwp)} · {formatDateBR(p.criadoEm.toDate())}
                </p>
              </Link>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="tabular-nums text-sm font-bold text-graphite">{formatBRL(p.precificacao.precoFinal, false)}</p>
                  {p.resultados && <p className="tabular-nums text-xs text-success">{formatBRL(p.resultados.lucroEstimado, false)} lucro</p>}
                </div>
                <Select
                  label="Mudar status"
                  hideLabel
                  value={p.status}
                  onChange={(e) => updateProposalStatus(p.id, e.target.value as StatusProposta)}
                  className="!h-9 w-36 text-xs"
                  options={STATUS_OPTIONS.filter((o) => o.value !== 'todas') as { value: string; label: string }[]}
                />
              </div>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-line-soft pt-3">
              <StatusPropostaChip status={p.status} />
              {p.numero && (
                <>
                  <button onClick={() => handleDuplicar(p.id)} className="flex items-center gap-1 text-xs font-bold text-muted hover:text-graphite">
                    <Copy className="h-3.5 w-3.5" aria-hidden /> Duplicar
                  </button>
                  <a
                    href={`/p/${p.publicId}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 text-xs font-bold text-muted hover:text-graphite"
                  >
                    <ExternalLink className="h-3.5 w-3.5" aria-hidden /> Abrir link
                  </a>
                  <button onClick={() => handleBaixarPdf(p)} className="flex items-center gap-1 text-xs font-bold text-muted hover:text-graphite">
                    <Download className="h-3.5 w-3.5" aria-hidden /> PDF
                  </button>
                </>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
