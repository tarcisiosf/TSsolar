import { pdf } from '@react-pdf/renderer'
import type { PublicProposal } from '@/types/firestore'
import { ProposalPdf } from './ProposalPdf'

export async function downloadProposalPdf(proposal: PublicProposal): Promise<void> {
  const blob = await pdf(<ProposalPdf proposal={proposal} />).toBlob()
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `Proposta-${proposal.numero}-v${proposal.versao}.pdf`
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}
