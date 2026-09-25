import { pdf } from '@react-pdf/renderer'
import QRCode from 'qrcode'
import type { PublicProposal } from '@/types/firestore'
import { ProposalPdf } from './ProposalPdf'

function publicUrl(publicId: string): string {
  const base = import.meta.env.VITE_PUBLIC_BASE_URL || window.location.origin
  return `${base}/p/${publicId}`
}

export async function downloadProposalPdf(proposal: PublicProposal): Promise<void> {
  const qrCodeDataUrl = await QRCode.toDataURL(publicUrl(proposal.publicId), { margin: 1, width: 160 })
  const blob = await pdf(<ProposalPdf proposal={proposal} qrCodeDataUrl={qrCodeDataUrl} />).toBlob()
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `Proposta-${proposal.numero}-v${proposal.versao}.pdf`
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}
