import type { StatusItem, StatusProposta } from '@/types/firestore'

type ChipTone = 'success' | 'neutral-chip' | 'danger' | 'sun' | 'chip' | 'info'

const toneClasses: Record<ChipTone, string> = {
  success: 'bg-success-soft text-success',
  'neutral-chip': 'bg-neutral-chip-soft text-neutral-chip',
  danger: 'bg-danger-soft text-danger',
  sun: 'bg-sun-soft text-sun-ink',
  chip: 'bg-chip text-graphite',
  info: 'bg-info-soft text-info',
}

export function Chip({ tone, children }: { tone: ChipTone; children: React.ReactNode }) {
  return (
    <span className={`inline-flex items-center rounded-pill px-2.5 py-[5px] text-xs font-bold ${toneClasses[tone]}`}>
      {children}
    </span>
  )
}

const statusItemConfig: Record<StatusItem, { label: string; tone: ChipTone }> = {
  incluso: { label: 'Incluso', tone: 'success' },
  fornecido_cliente: { label: 'Fornecido pelo cliente', tone: 'neutral-chip' },
  nao_incluso: { label: 'Não incluso', tone: 'danger' },
}

export function StatusItemChip({ status }: { status: StatusItem }) {
  const { label, tone } = statusItemConfig[status]
  return <Chip tone={tone}>{label}</Chip>
}

const statusPropostaConfig: Record<StatusProposta, { label: string; tone: ChipTone }> = {
  rascunho: { label: 'Rascunho', tone: 'chip' },
  enviada: { label: 'Proposta enviada', tone: 'sun' },
  negociacao: { label: 'Negociação', tone: 'chip' },
  fechada: { label: 'Fechada', tone: 'success' },
  perdida: { label: 'Perdida', tone: 'danger' },
}

export function StatusPropostaChip({ status }: { status: StatusProposta }) {
  const { label, tone } = statusPropostaConfig[status]
  return <Chip tone={tone}>{label}</Chip>
}
