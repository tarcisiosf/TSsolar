import { doc, getDoc } from 'firebase/firestore'
import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { db } from '@/lib/firebase'
import { SunLogo } from '@/components/ui/SunLogo'
import { normalizarPublicProposal } from '@/lib/calc/normalizarPublicProposal'
import type { PublicProposal } from '@/types/firestore'
import { ProposalView } from './ProposalView'

export function PublicProposalPage() {
  const { publicId } = useParams<{ publicId: string }>()
  const [proposal, setProposal] = useState<PublicProposal | null | 'not-found'>(null)
  const [baixandoPdf, setBaixandoPdf] = useState(false)

  useEffect(() => {
    if (!publicId) return
    getDoc(doc(db, 'publicProposals', publicId)).then((snap) => {
      const dados = snap.exists() ? (snap.data() as PublicProposal) : null
      // Proposta na lixeira: para o cliente, é como se o link não existisse.
      setProposal(dados && !dados.arquivada && dados.numero ? normalizarPublicProposal(dados) : 'not-found')
    })
  }, [publicId])

  async function handleBaixarPdf() {
    if (!proposal || proposal === 'not-found' || baixandoPdf) return
    setBaixandoPdf(true)
    try {
      const { downloadProposalPdf } = await import('@/features/pdf/downloadProposalPdf')
      await downloadProposalPdf(proposal)
    } catch (e) {
      console.error(e)
      alert('Não foi possível gerar o PDF agora. Tente novamente em instantes.')
    } finally {
      setBaixandoPdf(false)
    }
  }

  if (proposal === null) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ivory">
        <SunLogo size={40} className="animate-pulse" />
      </div>
    )
  }

  if (proposal === 'not-found') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-ivory px-6 text-center">
        <SunLogo size={40} />
        <h1 className="text-lg font-bold text-graphite">Proposta não encontrada</h1>
        <p className="max-w-xs text-sm text-muted">Esse link pode estar incorreto. Fale com a TS Solar para receber o link certo.</p>
      </div>
    )
  }

  return <ProposalView proposal={proposal} onBaixarPdf={handleBaixarPdf} baixandoPdf={baixandoPdf} />
}
