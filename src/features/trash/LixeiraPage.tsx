import { FileText, RotateCcw, Trash2, Users } from 'lucide-react'
import { useEffect, useState } from 'react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Stagger, StaggerItem } from '@/components/motion/Motion'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { EmptyState } from '@/components/ui/EmptyState'
import { Segmented } from '@/components/ui/Segmented'
import { SkeletonRow } from '@/components/ui/Skeleton'
import { useToast } from '@/components/ui/Toast'
import { contarPropostasDoCliente, excluirCliente, restaurarCliente, subscribeLixeiraClientes } from '@/lib/data/clients'
import { excluirProposta, restaurarProposta, subscribeLixeiraPropostas } from '@/lib/data/proposals'
import { dataDoTimestamp, formatBRL, formatDateBR } from '@/lib/format'
import type { Client, Proposal } from '@/types/firestore'

type Aba = 'propostas' | 'clientes'

type Exclusao =
  | { tipo: 'proposta'; proposta: Proposal }
  | { tipo: 'cliente'; cliente: Client; qtdPropostas: number | null }
  | { tipo: 'esvaziar' }

function nomeProposta(p: Proposal) {
  return p.numero || 'Rascunho sem número'
}

export function LixeiraPage() {
  const [aba, setAba] = useState<Aba>('propostas')
  const [propostas, setPropostas] = useState<Proposal[] | null>(null)
  const [clientes, setClientes] = useState<Client[] | null>(null)
  const [exclusao, setExclusao] = useState<Exclusao | null>(null)
  const mostrarToast = useToast()

  useEffect(() => subscribeLixeiraPropostas(setPropostas), [])
  useEffect(() => subscribeLixeiraClientes(setClientes), [])

  const total = (propostas?.length ?? 0) + (clientes?.length ?? 0)

  async function restaurarP(p: Proposal) {
    await restaurarProposta(p)
    mostrarToast({ mensagem: `${nomeProposta(p)} restaurada` })
  }

  async function restaurarC(c: Client) {
    await restaurarCliente(c.id)
    mostrarToast({ mensagem: `${c.nome} restaurado` })
  }

  async function pedirExclusaoCliente(c: Client) {
    setExclusao({ tipo: 'cliente', cliente: c, qtdPropostas: null })
    const qtd = await contarPropostasDoCliente(c.id).catch(() => 0)
    setExclusao((atual) => (atual?.tipo === 'cliente' && atual.cliente.id === c.id ? { ...atual, qtdPropostas: qtd } : atual))
  }

  async function confirmarExclusao() {
    if (!exclusao) return
    if (exclusao.tipo === 'proposta') await excluirProposta(exclusao.proposta)
    else if (exclusao.tipo === 'cliente') await excluirCliente(exclusao.cliente.id)
    else {
      await Promise.all([...(propostas ?? []).map((p) => excluirProposta(p)), ...(clientes ?? []).map((c) => excluirCliente(c.id))])
    }
  }

  const dialogo = (() => {
    if (!exclusao) return { title: '', description: '', confirmLabel: '' }
    if (exclusao.tipo === 'proposta')
      return {
        title: `Apagar ${nomeProposta(exclusao.proposta)} para sempre?`,
        description: 'Ela e o link público deixam de existir. Isso não pode ser desfeito.',
        confirmLabel: 'Apagar para sempre',
      }
    if (exclusao.tipo === 'cliente') {
      const { qtdPropostas } = exclusao
      return {
        title: `Apagar ${exclusao.cliente.nome} para sempre?`,
        description:
          qtdPropostas === null
            ? 'Verificando as propostas deste cliente…'
            : qtdPropostas > 0
              ? `Ele tem ${qtdPropostas} ${qtdPropostas === 1 ? 'proposta' : 'propostas'}, que não serão apagadas — só perdem o vínculo com o cadastro. Isso não pode ser desfeito.`
              : 'Isso não pode ser desfeito.',
        confirmLabel: 'Apagar para sempre',
      }
    }
    return {
      title: 'Esvaziar a lixeira?',
      description: `${total} ${total === 1 ? 'item será apagado' : 'itens serão apagados'} para sempre. Isso não pode ser desfeito.`,
      confirmLabel: 'Esvaziar lixeira',
    }
  })()

  const carregando = aba === 'propostas' ? propostas === null : clientes === null

  return (
    <div>
      <PageHeader
        title="Lixeira"
        subtitle="Propostas e clientes apagados ficam aqui até você restaurar ou apagar para sempre."
        action={
          total > 0 ? (
            <button
              type="button"
              onClick={() => setExclusao({ tipo: 'esvaziar' })}
              className="flex h-11 cursor-pointer items-center gap-2 rounded-button border border-[#D9D3C7] bg-surface px-4 text-sm font-bold text-graphite transition-colors hover:border-danger hover:text-danger"
            >
              <Trash2 className="h-4 w-4" aria-hidden /> Esvaziar lixeira
            </button>
          ) : undefined
        }
      />

      <div className="mb-5">
        <Segmented
          aria-label="O que mostrar"
          value={aba}
          onChange={setAba}
          options={[
            { value: 'propostas', label: `Propostas${propostas?.length ? ` (${propostas.length})` : ''}` },
            { value: 'clientes', label: `Clientes${clientes?.length ? ` (${clientes.length})` : ''}` },
          ]}
        />
      </div>

      {carregando && (
        <div className="flex flex-col gap-3">
          <SkeletonRow />
          <SkeletonRow />
        </div>
      )}

      {aba === 'propostas' && propostas !== null && propostas.length === 0 && (
        <EmptyState icon={FileText} title="Nenhuma proposta na lixeira" description="Propostas que você apagar aparecem aqui e podem ser restauradas." />
      )}
      {aba === 'clientes' && clientes !== null && clientes.length === 0 && (
        <EmptyState icon={Users} title="Nenhum cliente na lixeira" description="Clientes que você apagar aparecem aqui e podem ser restaurados." />
      )}

      {aba === 'propostas' && (
        <Stagger key="propostas" className="flex flex-col gap-3" gap={0.04}>
          {(propostas ?? []).map((p) => (
            <StaggerItem key={p.id}>
              <LinhaLixeira
                titulo={nomeProposta(p)}
                detalhe={`${p.clienteNome || 'Sem cliente'} · ${formatBRL(p.precificacao.precoFinal, false)}`}
                apagadoEm={formatDateBR(dataDoTimestamp(p.excluidoEm))}
                onRestaurar={() => restaurarP(p)}
                onApagar={() => setExclusao({ tipo: 'proposta', proposta: p })}
              />
            </StaggerItem>
          ))}
        </Stagger>
      )}

      {aba === 'clientes' && (
        <Stagger key="clientes" className="flex flex-col gap-3" gap={0.04}>
          {(clientes ?? []).map((c) => (
            <StaggerItem key={c.id}>
              <LinhaLixeira
                titulo={c.nome}
                detalhe={[c.telefone, c.cidade].filter(Boolean).join(' · ') || 'Sem contato'}
                apagadoEm={formatDateBR(dataDoTimestamp(c.excluidoEm))}
                onRestaurar={() => restaurarC(c)}
                onApagar={() => pedirExclusaoCliente(c)}
              />
            </StaggerItem>
          ))}
        </Stagger>
      )}

      <ConfirmDialog
        open={!!exclusao}
        title={dialogo.title}
        description={dialogo.description}
        confirmLabel={dialogo.confirmLabel}
        onConfirm={confirmarExclusao}
        onClose={() => setExclusao(null)}
      />
    </div>
  )
}

function LinhaLixeira({
  titulo,
  detalhe,
  apagadoEm,
  onRestaurar,
  onApagar,
}: {
  titulo: string
  detalhe: string
  apagadoEm: string
  onRestaurar: () => Promise<void>
  onApagar: () => void
}) {
  const [restaurando, setRestaurando] = useState(false)

  async function restaurar() {
    setRestaurando(true)
    try {
      await onRestaurar()
    } catch (e) {
      console.error(e)
      alert('Não foi possível restaurar agora. Tente de novo.')
      setRestaurando(false)
    }
  }

  return (
    <div className="flex flex-col gap-3 rounded-card bg-surface p-4 shadow-card sm:flex-row sm:items-center sm:justify-between md:px-6">
      <div className="min-w-0">
        <p className="truncate text-sm font-bold text-graphite">{titulo}</p>
        <p className="truncate text-xs text-muted">
          {detalhe} · apagado em {apagadoEm}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <button
          type="button"
          onClick={restaurar}
          disabled={restaurando}
          className="flex h-10 cursor-pointer items-center gap-1.5 rounded-button bg-graphite px-4 text-xs font-bold text-on-dark transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          <RotateCcw className="h-3.5 w-3.5" aria-hidden /> {restaurando ? 'Restaurando…' : 'Restaurar'}
        </button>
        <button
          type="button"
          onClick={onApagar}
          className="flex h-10 cursor-pointer items-center gap-1.5 rounded-button px-3 text-xs font-bold text-muted transition-colors hover:bg-danger-soft hover:text-danger"
        >
          <Trash2 className="h-3.5 w-3.5" aria-hidden /> Apagar para sempre
        </button>
      </div>
    </div>
  )
}
