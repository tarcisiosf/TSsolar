import { ChevronLeft, ChevronRight, Copy, Download, MessageCircle, Trash2 } from 'lucide-react'
import { motion, useReducedMotion } from 'motion/react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/components/ui/Toast'
import { Sheet } from '@/components/ui/Sheet'
import { SavedIndicator, type SaveStatus } from '@/components/ui/SavedIndicator'
import { SunLogo } from '@/components/ui/SunLogo'
import { subscribeCatalog } from '@/lib/data/catalog'
import { subscribeKits } from '@/lib/data/kits'
import { subscribeClients } from '@/lib/data/clients'
import { criarPropostaVazia, createProposal, moverPropostaParaLixeira, publicarProposta, restaurarProposta, saveProposalFields, subscribeProposal } from '@/lib/data/proposals'
import { getCalcSettings, getCompanySettings } from '@/lib/data/settings'
import { calcularResultadosProposta } from '@/lib/calc/proposalResultados'
import { toPublicSnapshot } from '@/lib/calc/toPublicSnapshot'
import { useDebouncedEffect } from '@/lib/useDebouncedEffect'
import { formatBRL } from '@/lib/format'
import type { CalcSettings, CatalogItem, Client, CompanySettings, Kit, Proposal, ProposalEntrada, ProposalItem, ProposalPagamentoConfig, ProposalPrecificacao, ProposalServicos, ProposalSistema, PublicProposal } from '@/types/firestore'
import { ClienteStep } from './steps/ClienteStep'
import { ConsumoStep } from './steps/ConsumoStep'
import { SistemaStep } from './steps/SistemaStep'
import { MateriaisStep } from './steps/MateriaisStep'
import { ServicosStep } from './steps/ServicosStep'
import { PrecoStep } from './steps/PrecoStep'
import { SummaryPanel } from './SummaryPanel'
import { Stepper, type StepDef } from './Stepper'
import { ProposalView } from '@/features/public/ProposalView'

const STEPS: StepDef[] = [
  { id: 'cliente', label: 'Cliente' },
  { id: 'consumo', label: 'Consumo' },
  { id: 'sistema', label: 'Sistema' },
  { id: 'materiais', label: 'Materiais' },
  { id: 'servicos', label: 'Serviços' },
  { id: 'preco', label: 'Preço' },
  { id: 'revisao', label: 'Revisão' },
]

interface EditorDraft {
  clientId: string
  clienteNome: string
  entrada: ProposalEntrada
  sistema: ProposalSistema
  itens: ProposalItem[]
  servicos: ProposalServicos
  precificacao: ProposalPrecificacao
  condicoesPagamento: string
  pagamento: ProposalPagamentoConfig
}

function draftFromProposal(p: Proposal): EditorDraft {
  return {
    clientId: p.clientId,
    clienteNome: p.clienteNome,
    entrada: p.entrada,
    sistema: p.sistema,
    itens: p.itens,
    servicos: p.servicos,
    precificacao: p.precificacao,
    condicoesPagamento: p.condicoesPagamento,
    pagamento: p.pagamento,
  }
}

export function ProposalEditorPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [proposal, setProposal] = useState<Proposal | null>(null)
  const [draft, setDraft] = useState<EditorDraft | null>(null)
  const [calc, setCalc] = useState<CalcSettings | null>(null)
  const [company, setCompany] = useState<CompanySettings | null>(null)
  const [clients, setClients] = useState<Client[]>([])
  const [catalogo, setCatalogo] = useState<CatalogItem[]>([])
  const [kits, setKits] = useState<Kit[]>([])
  const [step, setStepState] = useState(0)
  const [direcao, setDirecao] = useState(1)
  const reduzirMovimento = useReducedMotion()
  const setStep = (proximo: number | ((atual: number) => number)) => {
    setStepState((atual) => {
      const valor = typeof proximo === 'function' ? proximo(atual) : proximo
      setDirecao(valor >= atual ? 1 : -1)
      return valor
    })
  }
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')
  const [resumoAberto, setResumoAberto] = useState(false)
  const [gerando, setGerando] = useState(false)
  const [baixandoPdf, setBaixandoPdf] = useState(false)
  const mostrarToast = useToast()
  const excluida = useRef(false)

  const carregouDraft = useRef(false)

  // "Nova proposta": cria o documento imediatamente para ter um id estável e permitir o autosave.
  useEffect(() => {
    if (id) return
    let cancelado = false
    ;(async () => {
      const novaProposta = criarPropostaVazia(crypto.randomUUID(), null)
      await createProposal(novaProposta)
      if (!cancelado) navigate(`/app/propostas/${novaProposta.id}`, { replace: true })
    })()
    return () => {
      cancelado = true
    }
  }, [id, navigate])

  useEffect(() => {
    if (!id) return
    return subscribeProposal(id, (p) => {
      setProposal(p)
      if (p && !carregouDraft.current) {
        setDraft(draftFromProposal(p))
        carregouDraft.current = true
      }
    })
  }, [id])

  useEffect(() => {
    getCalcSettings().then(setCalc)
    getCompanySettings().then(setCompany)
    return subscribeClients(setClients)
  }, [])

  useEffect(() => subscribeCatalog((itens) => setCatalogo(itens.filter((i) => i.ativo))), [])

  useEffect(() => subscribeKits((ks) => setKits(ks.filter((k) => k.ativo))), [])

  const modulos = useMemo(() => catalogo.filter((c) => c.categoria === 'modulo'), [catalogo])
  const inversores = useMemo(() => catalogo.filter((c) => c.categoria === 'inversor'), [catalogo])

  const inversorSelecionado = useMemo(() => catalogo.find((c) => c.id === draft?.sistema.inversorId) ?? null, [catalogo, draft?.sistema.inversorId])

  const moduloSelecionado = useMemo(() => catalogo.find((c) => c.id === draft?.sistema.moduloId) ?? null, [catalogo, draft?.sistema.moduloId])
  const pesoKgModulo = moduloSelecionado && moduloSelecionado.categoria === 'modulo' ? moduloSelecionado.pesoKg : null

  const { resultados, precoFinal } = useMemo(() => {
    if (!draft || !calc) return { resultados: null, precoFinal: 0 }
    try {
      return calcularResultadosProposta({
        entrada: draft.entrada,
        sistema: draft.sistema,
        servicos: draft.servicos,
        precificacao: draft.precificacao,
        inversorPotenciaKw: inversorSelecionado && inversorSelecionado.categoria === 'inversor' ? inversorSelecionado.potenciaKw : 0,
        pesoKgModulo,
        calc,
        anoCalendarioInicial: new Date().getFullYear(),
      })
    } catch {
      return { resultados: null, precoFinal: 0 }
    }
  }, [draft, calc, inversorSelecionado, pesoKgModulo])

  // Autosave com debounce curto a cada alteração do rascunho.
  useDebouncedEffect(
    () => {
      if (!id || !draft || excluida.current) return
      setSaveStatus('saving')
      saveProposalFields(id, {
        clientId: draft.clientId,
        clienteNome: draft.clienteNome,
        entrada: draft.entrada,
        sistema: draft.sistema,
        itens: draft.itens,
        servicos: draft.servicos,
        precificacao: { ...draft.precificacao, precoFinal },
        condicoesPagamento: draft.condicoesPagamento,
        pagamento: draft.pagamento,
      })
        .then(() => setSaveStatus('saved'))
        .catch(() => setSaveStatus('error'))
    },
    [draft],
    900,
  )

  const previewPublico: PublicProposal | null = useMemo(() => {
    if (!proposal || !draft || !company || !calc || !resultados) return null
    const propostaTemp: Proposal = { ...proposal, ...draft, precificacao: { ...draft.precificacao, precoFinal }, resultados }
    const clienteSelecionado = clients.find((c) => c.id === draft.clientId) ?? null
    try {
      return toPublicSnapshot({
        proposal: propostaTemp,
        company,
        client: clienteSelecionado,
        taxaCartaoMensal: calc.taxaCartaoMensal,
        parcelasCartao: calc.parcelasCartao,
        taxaFinanciamentoMensal: calc.taxaFinanciamentoMensal,
        parcelasFinanciamento: calc.parcelasFinanciamento,
      })
    } catch {
      return null
    }
  }, [proposal, draft, company, calc, resultados, precoFinal, clients])

  async function moverParaLixeira() {
    if (!proposal) return
    excluida.current = true
    try {
      await moverPropostaParaLixeira(proposal)
    } catch (e) {
      excluida.current = false
      console.error(e)
      alert('Não foi possível apagar agora. Tente de novo.')
      return
    }
    const alvo = proposal
    mostrarToast({
      mensagem: `${alvo.numero || 'Rascunho'} foi para a lixeira`,
      acao: { rotulo: 'Desfazer', onClick: () => restaurarProposta(alvo) },
    })
    navigate('/app/propostas', { replace: true })
  }

  async function baixarPdfPrevia() {
    if (!previewPublico || baixandoPdf) return
    setBaixandoPdf(true)
    try {
      const { downloadProposalPdf } = await import('@/features/pdf/downloadProposalPdf')
      await downloadProposalPdf(previewPublico)
    } catch (e) {
      console.error(e)
      alert('Não foi possível gerar o PDF agora. Tente novamente em instantes.')
    } finally {
      setBaixandoPdf(false)
    }
  }

  async function handleGerarProposta() {
    if (!id) return
    setGerando(true)
    try {
      await publicarProposta(id, inversorSelecionado && inversorSelecionado.categoria === 'inversor' ? inversorSelecionado.potenciaKw : 0, pesoKgModulo)
      setStep(STEPS.length - 1)
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Não foi possível gerar a proposta.')
    } finally {
      setGerando(false)
    }
  }

  if (!draft || !calc || !proposal) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <SunLogo size={36} className="animate-pulse" />
      </div>
    )
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold text-graphite">{proposal.numero || 'Nova proposta'}</h1>
          <p className="text-xs text-muted">{draft.clienteNome || 'Sem cliente selecionado'}</p>
        </div>
        <div className="flex items-center gap-2">
          <SavedIndicator status={saveStatus} />
          <button
            type="button"
            onClick={moverParaLixeira}
            aria-label="Mover para a lixeira"
            title="Mover para a lixeira"
            className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full text-muted transition-colors hover:bg-danger-soft hover:text-danger focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sun"
          >
            <Trash2 className="h-4 w-4" aria-hidden />
          </button>
        </div>
      </div>


      {proposal.excluidoEm && (
        <div className="mb-4 flex flex-col gap-2 rounded-card bg-danger-soft p-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-semibold text-danger">Esta proposta está na lixeira. O link do cliente está fora do ar.</p>
          <button
            type="button"
            onClick={() => restaurarProposta(proposal).then(() => mostrarToast({ mensagem: 'Proposta restaurada' }))}
            className="shrink-0 cursor-pointer rounded-button bg-graphite px-4 py-2 text-xs font-bold text-on-dark"
          >
            Restaurar
          </button>
        </div>
      )}

      <Stepper steps={STEPS} current={step} onSelect={setStep} />

      {proposal.numero && proposal.publicId && (
        <PropostaGeradaBar
          proposal={proposal}
          previewPublico={previewPublico}
          clienteTelefone={clients.find((c) => c.id === proposal.clientId)?.telefone ?? ''}
        />
      )}

      <div className="flex gap-8">
        <motion.div
          key={step}
          className="min-w-0 flex-1 pb-24 lg:pb-0"
          initial={reduzirMovimento ? { opacity: 0 } : { opacity: 0, x: direcao * 16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={reduzirMovimento ? { duration: 0.15 } : { type: 'spring', bounce: 0, duration: 0.35 }}
        >
          {step === 0 && <ClienteStep clients={clients} clientId={draft.clientId} onSelect={(c) => setDraft({ ...draft, clientId: c.id, clienteNome: c.nome })} />}
          {step === 1 && <ConsumoStep entrada={draft.entrada} onChange={(entrada) => setDraft({ ...draft, entrada })} />}
          {step === 2 && (
            <SistemaStep
              sistema={draft.sistema}
              onChange={(sistema) => setDraft({ ...draft, sistema })}
              consumoMedioMensalKwh={draft.entrada.consumoMedioKwh ?? 0}
              produtividadeKwhKwpAno={calc.produtividadeKwhKwpAno}
              modulos={modulos}
              inversores={inversores}
            />
          )}
          {step === 3 && (
            <MateriaisStep
              itens={draft.itens}
              onChange={(itens) => setDraft({ ...draft, itens })}
              sistema={draft.sistema}
              catalogo={catalogo}
              kits={kits}
              calc={calc}
            />
          )}
          {step === 4 && <ServicosStep servicos={draft.servicos} onChange={(servicos) => setDraft({ ...draft, servicos })} />}
          {step === 5 && (
            <PrecoStep
              precificacao={draft.precificacao}
              onChange={(precificacao) => setDraft({ ...draft, precificacao })}
              resultados={resultados}
              precoFinal={precoFinal}
              calc={calc}
              contaAtual={draft.entrada.contaAtual}
              condicoesPagamento={draft.condicoesPagamento}
              onChangeCondicoesPagamento={(v) => setDraft({ ...draft, condicoesPagamento: v })}
              pagamento={draft.pagamento}
              onChangePagamento={(pagamento) => setDraft({ ...draft, pagamento })}
            />
          )}
          {step === 6 && previewPublico && (
            <div className="flex flex-col gap-4">
              <h2 className="text-lg font-bold text-graphite">Revisão</h2>
              <div className="overflow-hidden rounded-card shadow-card">
                <ProposalView proposal={previewPublico} preview onBaixarPdf={baixarPdfPrevia} baixandoPdf={baixandoPdf} />
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button variant="secondary" onClick={() => setSaveStatus('saved')} className="sm:w-auto">
                  Rascunho salvo automaticamente
                </Button>
                <Button variant="primary" onClick={handleGerarProposta} loading={gerando} className="sm:w-auto">
                  {proposal.numero ? 'Salvar nova versão' : 'Gerar proposta'}
                </Button>
              </div>
            </div>
          )}

          <div className="mt-8 flex items-center justify-between">
            <Button variant="secondary" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0}>
              <ChevronLeft className="h-4 w-4" /> Voltar
            </Button>
            {step < STEPS.length - 1 && (
              <Button variant="primary" onClick={() => setStep((s) => Math.min(STEPS.length - 1, s + 1))}>
                Continuar <ChevronRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        </motion.div>

        {/* Resumo — computador */}
        <aside className="hidden w-80 shrink-0 lg:block">
          <div className="sticky top-8 rounded-card bg-surface p-6 shadow-card">
            <SummaryPanel precoFinal={precoFinal} resultados={resultados} />
          </div>
        </aside>
      </div>

      {/* Resumo — celular/tablet */}
      <div
        className="fixed inset-x-0 bottom-0 z-20 flex items-center justify-between border-t border-line bg-ivory/95 px-5 py-3 backdrop-blur-chrome lg:hidden"
        style={{ paddingBottom: 'max(12px, env(safe-area-inset-bottom, 0px))' }}
      >
        <div>
          <p className="text-[11px] font-semibold text-muted">Preço</p>
          <p className="tabular-nums text-base font-extrabold text-graphite">{formatBRL(precoFinal, false)}</p>
        </div>
        <button onClick={() => setResumoAberto(true)} className="rounded-button bg-graphite px-4 py-2.5 text-sm font-bold text-on-dark">
          Ver resumo
        </button>
      </div>
      <Sheet open={resumoAberto} onClose={() => setResumoAberto(false)} title="Resumo da proposta">
        <SummaryPanel precoFinal={precoFinal} resultados={resultados} />
      </Sheet>
    </div>
  )
}

function PropostaGeradaBar({
  proposal,
  previewPublico,
  clienteTelefone,
}: {
  proposal: Proposal
  previewPublico: PublicProposal | null
  clienteTelefone: string
}) {
  const link = `${window.location.origin}/p/${proposal.publicId}`

  async function copiarLink() {
    await navigator.clipboard.writeText(link)
    alert('Link copiado!')
  }

  async function baixarPdf() {
    if (!previewPublico) return
    const { downloadProposalPdf } = await import('@/features/pdf/downloadProposalPdf')
    await downloadProposalPdf(previewPublico)
  }

  const numeroWhatsapp = clienteTelefone.replace(/\D/g, '')
  const whatsappLink = `https://wa.me/${numeroWhatsapp.startsWith('55') ? numeroWhatsapp : `55${numeroWhatsapp}`}?text=${encodeURIComponent(`Olá! Segue a proposta ${proposal.numero}: ${link}`)}`

  return (
    <div className="mb-4 flex flex-col gap-2 rounded-card bg-success-soft p-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm font-semibold text-success">Proposta {proposal.numero} gerada — v{proposal.versao}</p>
      <div className="flex flex-wrap gap-2">
        <button onClick={copiarLink} className="flex items-center gap-1.5 rounded-button border border-success/30 bg-surface px-3 py-2 text-xs font-bold text-success">
          <Copy className="h-3.5 w-3.5" aria-hidden /> Copiar link
        </button>
        <a href={whatsappLink} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 rounded-button border border-success/30 bg-surface px-3 py-2 text-xs font-bold text-success">
          <MessageCircle className="h-3.5 w-3.5" aria-hidden /> WhatsApp
        </a>
        <button onClick={baixarPdf} className="flex items-center gap-1.5 rounded-button border border-success/30 bg-surface px-3 py-2 text-xs font-bold text-success">
          <Download className="h-3.5 w-3.5" aria-hidden /> Baixar PDF
        </button>
      </div>
    </div>
  )
}
