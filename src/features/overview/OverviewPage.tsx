import { ArrowUpRight, FileText, Package, Plus, Settings, Users } from 'lucide-react'
import { motion, useReducedMotion } from 'motion/react'
import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { SkeletonRow } from '@/components/ui/Skeleton'
import { StatusPropostaChip } from '@/components/ui/Chip'
import { CountUp, Pressable, SPRING, Stagger, StaggerItem } from '@/components/motion/Motion'
import { dataDoTimestamp, formatBRL, formatDateBR, formatKwp } from '@/lib/format'
import { subscribeProposals } from '@/lib/data/proposals'
import type { Proposal } from '@/types/firestore'

const atalhos = [
  { to: '/app/propostas', label: 'Propostas', descricao: 'Ver e acompanhar', icon: FileText },
  { to: '/app/clientes', label: 'Clientes', descricao: 'Cadastro e contatos', icon: Users },
  { to: '/app/catalogo', label: 'Catálogo', descricao: 'Módulos, inversores e kits', icon: Package },
  { to: '/app/configuracoes', label: 'Configurações', descricao: 'Empresa, taxas e cálculo', icon: Settings },
]

function saudacao(): string {
  const hora = new Date().getHours()
  if (hora < 12) return 'Bom dia'
  if (hora < 18) return 'Boa tarde'
  return 'Boa noite'
}

export function OverviewPage() {
  const [propostas, setPropostas] = useState<Proposal[] | null>(null)
  const navigate = useNavigate()
  const reduzir = useReducedMotion()

  useEffect(() => subscribeProposals(setPropostas), [])

  const ultimas = propostas?.slice(0, 5) ?? []

  const indicadores = useMemo(() => {
    const lista = propostas ?? []
    const emAberto = lista.filter((p) => p.status === 'enviada' || p.status === 'negociacao')
    const fechadas = lista.filter((p) => p.status === 'fechada')
    return {
      total: lista.length,
      emAberto: emAberto.length,
      valorEmAberto: emAberto.reduce((s, p) => s + (p.precificacao.precoFinal || 0), 0),
      fechadas: fechadas.length,
      valorFechado: fechadas.reduce((s, p) => s + (p.precificacao.precoFinal || 0), 0),
    }
  }, [propostas])

  return (
    <div>
      {/* Boas-vindas */}
      <section className="relative mb-6 overflow-hidden rounded-hero bg-graphite px-6 py-7 text-on-dark ring-1 ring-white/5 md:px-10 md:py-9">
        <motion.div
          aria-hidden
          className="pointer-events-none absolute -right-20 -top-32 h-[380px] w-[380px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(242,165,22,0.35) 0%, rgba(242,165,22,0.1) 40%, rgba(242,165,22,0) 70%)' }}
          initial={reduzir ? { opacity: 0 } : { opacity: 0, y: 80 }}
          animate={{ opacity: 1, y: 0 }}
          transition={reduzir ? { duration: 0.3 } : { type: 'spring', bounce: 0, duration: 1.4 }}
        />
        <div className="relative flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-semibold text-muted-dark">{saudacao()}</p>
            <h1 className="mt-1 text-[2.125rem] font-extrabold leading-[1.1] tracking-[-0.03em]">Visão geral</h1>
            <p className="mt-1 max-w-md text-sm text-muted-dark">Acompanhe suas propostas e comece uma nova em poucos passos.</p>
          </div>
          <Link to="/app/propostas/nova" className="shrink-0">
            <Button variant="primary" className="w-full shadow-[0_8px_24px_rgba(242,165,22,0.35)] md:w-auto">
              <Plus className="h-4 w-4" /> Nova proposta
            </Button>
          </Link>
        </div>

        <div className="relative mt-7 grid grid-cols-2 gap-3 md:grid-cols-4">
          <Indicador rotulo="Propostas" valor={indicadores.total} carregando={propostas === null} formato={(v) => String(Math.round(v))} />
          <Indicador rotulo="Em aberto" valor={indicadores.emAberto} carregando={propostas === null} formato={(v) => String(Math.round(v))} />
          <Indicador rotulo="Valor em aberto" valor={indicadores.valorEmAberto} carregando={propostas === null} formato={(v) => formatBRL(v, false)} />
          <Indicador rotulo="Fechado" valor={indicadores.valorFechado} carregando={propostas === null} formato={(v) => formatBRL(v, false)} destaque />
        </div>
      </section>

      {/* Atalhos */}
      <Stagger className="mb-8 grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
        {atalhos.map((a) => (
          <StaggerItem key={a.to}>
            <Link to={a.to} className="block rounded-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sun">
              <Pressable className="group flex h-full flex-col gap-3 rounded-card bg-surface p-[18px] shadow-card transition-shadow hover:shadow-[0_10px_30px_rgba(15,27,45,0.08)] md:p-5">
                <div className="flex items-center justify-between">
                  <span className="flex h-10 w-10 items-center justify-center rounded-field bg-sun-soft text-sun-ink transition-colors group-hover:bg-sun group-hover:text-graphite">
                    <a.icon className="h-5 w-5" strokeWidth={2} aria-hidden />
                  </span>
                  <ArrowUpRight className="h-4 w-4 text-muted opacity-0 transition-opacity group-hover:opacity-100" aria-hidden />
                </div>
                <div>
                  <p className="text-sm font-bold text-graphite">{a.label}</p>
                  <p className="text-xs text-muted">{a.descricao}</p>
                </div>
              </Pressable>
            </Link>
          </StaggerItem>
        ))}
      </Stagger>

      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-bold text-graphite">Últimas propostas</h2>
        {ultimas.length > 0 && (
          <Link to="/app/propostas" className="text-sm font-bold text-muted transition-colors hover:text-graphite">
            Ver todas
          </Link>
        )}
      </div>

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
          onAction={() => navigate('/app/propostas/nova')}
        />
      )}

      <Stagger className="flex flex-col gap-3" gap={0.05}>
        {ultimas.map((p) => (
          <StaggerItem key={p.id}>
            <Link to={`/app/propostas/${p.id}`} className="block rounded-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sun">
              <Pressable
                lift={false}
                className="flex items-center justify-between gap-4 rounded-card bg-surface p-4 shadow-card transition-shadow hover:shadow-[0_6px_20px_rgba(15,27,45,0.07)] md:px-6"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-full bg-chip text-sm font-extrabold text-graphite sm:flex">
                    {(p.clienteNome || '?').trim().charAt(0).toUpperCase()}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-graphite">{p.numero || 'Rascunho sem número'}</p>
                    <p className="truncate text-xs text-muted">
                      {p.clienteNome || 'Sem cliente'} · {formatKwp(p.sistema.potenciaKwp)} · {formatDateBR(dataDoTimestamp(p.criadoEm))}
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1 sm:flex-row sm:items-center sm:gap-3">
                  <span className="tabular-nums text-sm font-bold text-graphite">{formatBRL(p.precificacao.precoFinal, false)}</span>
                  <StatusPropostaChip status={p.status} />
                </div>
              </Pressable>
            </Link>
          </StaggerItem>
        ))}
      </Stagger>
    </div>
  )
}

function Indicador({
  rotulo,
  valor,
  formato,
  carregando,
  destaque,
}: {
  rotulo: string
  valor: number
  formato: (v: number) => string
  carregando: boolean
  destaque?: boolean
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={SPRING}
      className={`rounded-field border p-3 md:p-4 ${destaque ? 'border-sun/30 bg-sun/15' : 'border-white/10 bg-white/[0.07]'}`}
    >
      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-dark">{rotulo}</p>
      {carregando ? (
        <div className="mt-1.5 h-6 w-16 animate-pulse rounded-md bg-white/10" aria-hidden />
      ) : (
        <p className={`tabular-nums mt-0.5 text-lg font-extrabold md:text-xl ${destaque ? 'text-sun' : 'text-on-dark'}`}>
          <CountUp value={valor} format={formato} duration={0.9} />
        </p>
      )}
    </motion.div>
  )
}
