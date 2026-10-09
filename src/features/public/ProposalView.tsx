import { AlertTriangle, CheckCircle2, Clock, Download, Loader2, MessageCircle, MinusCircle, ShieldCheck, TrendingUp } from 'lucide-react'
import { AnimatePresence, motion, useInView, useReducedMotion } from 'motion/react'
import { forwardRef, useRef } from 'react'
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { BrandLogo } from '@/components/ui/SunLogo'
import { StatusItemChip } from '@/components/ui/Chip'
import { CountUp, GrowBar, Reveal, SPRING, SPRING_TAP, Stagger, StaggerItem } from '@/components/motion/Motion'
import { dataDoTimestamp, formatBRL, formatDataPorExtenso, formatDateBR, formatKwh, formatKwp, formatNumber, formatPayback } from '@/lib/format'
import { unidadeItemExibicao } from '@/features/catalog/catalogDisplay'
import { ALTURA_LABELS, ORIENTACAO_LABELS, TIPO_IMOVEL_LABELS, TIPO_TELHADO_LABELS } from '@/features/catalog/catalogLabels'
import type { PublicOpcaoPagamento, PublicProposal } from '@/types/firestore'

const MESES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

interface ProposalViewProps {
  proposal: PublicProposal
  onBaixarPdf?: () => void
  baixandoPdf?: boolean
  preview?: boolean
}

export function ProposalView({ proposal, onBaixarPdf, baixandoPdf, preview }: ProposalViewProps) {
  const vencida = proposal.validaAte ? proposal.validaAte.toDate().getTime() < Date.now() : false
  const primeiroNome = proposal.clienteNome.split(' ')[0] || proposal.clienteNome
  const heroRef = useRef<HTMLElement>(null)
  const heroVisivel = useInView(heroRef, { margin: '0px 0px -40% 0px' })

  const whatsappEmpresa = `https://wa.me/${proposal.empresa.whatsapp}?text=${encodeURIComponent(`Olá! Vi a proposta ${proposal.numero}`)}`

  return (
    <div data-theme="light" className={`bg-ivory text-graphite ${preview ? '' : 'pb-24 sm:pb-0'}`}>
      <div className="mx-auto max-w-[1200px] px-5 py-6 sm:px-8 md:px-16 md:py-10">
        {/* 1. Topo */}
        <Reveal y={8} className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <BrandLogo logoUrl={proposal.empresa.logoUrl} />
          <div className="text-right">
            <p className="text-xs font-semibold text-muted">
              {proposal.numero} · v{proposal.versao}
            </p>
            {proposal.validaAte && (
              <span className={`mt-1 inline-flex items-center gap-1.5 rounded-pill px-2.5 py-1 text-[11px] font-bold ${vencida ? 'bg-danger-soft text-danger' : 'bg-sun-soft text-sun-ink'}`}>
                {!vencida && <span className="h-1.5 w-1.5 rounded-full bg-sun" aria-hidden />}
                {vencida ? 'Proposta vencida' : `Válida até ${formatDateBR(proposal.validaAte.toDate())}`}
              </span>
            )}
          </div>
        </Reveal>

        <ClienteHeaderInfo proposal={proposal} />

        {preview && (
          <div className="mb-6 rounded-field bg-info-soft px-4 py-2 text-xs font-bold text-info">Prévia — é assim que o cliente vai ver a proposta.</div>
        )}

        {vencida && (
          <div className="mb-6 flex flex-col items-start gap-2 rounded-card bg-danger-soft p-4 text-danger sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm font-semibold">Esta proposta venceu. Fale com a gente para receber uma atualização.</p>
            <a href={whatsappEmpresa} target="_blank" rel="noreferrer" className="shrink-0 text-sm font-bold underline">
              Pedir atualização no WhatsApp
            </a>
          </div>
        )}

        {/* 2. Hero */}
        <Hero ref={heroRef} proposal={proposal} primeiroNome={primeiroNome} />

        <FichaTecnicaCard proposal={proposal} />

        <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-3">
          {/* 4. Gráfico */}
          <Reveal className="rounded-card bg-surface p-5 shadow-card md:col-span-2 md:p-6">
            <GraficoConsumoGeracao proposal={proposal} />
          </Reveal>

          {/* 5. Retorno */}
          <Stagger quandoVisivel className="flex flex-col gap-3">
            <StaggerItem>
              <CenarioCard titulo="Cenário conservador" economia25={proposal.resultados.economia25AnosConservador} paybackMeses={proposal.resultados.paybackMesesConservador} />
            </StaggerItem>
            <StaggerItem>
              <CenarioCard titulo="Cenário otimista" economia25={proposal.resultados.economia25AnosOtimista} paybackMeses={proposal.resultados.paybackMesesOtimista} destaque />
            </StaggerItem>
            <StaggerItem>
              <p className="text-xs leading-relaxed text-muted">
                Estimativa considera reajuste anual da tarifa e da taxa mínima e a degradação dos módulos. Com o sistema, a conta passa a ser a taxa mínima da distribuidora. Premissas configuradas pela TS Solar — valide contra
                sua fatura da Equatorial Goiás.
              </p>
            </StaggerItem>
          </Stagger>
        </div>

        {/* 6. Equipamentos + 7. Investimento */}
        <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2">
          <Reveal className="rounded-card bg-surface p-5 shadow-card md:p-6">
            <h2 className="mb-4 text-base font-bold text-graphite">Equipamentos</h2>
            <Stagger quandoVisivel className="flex flex-col gap-3" gap={0.04}>
              {proposal.itens.map((item) => (
                <StaggerItem key={item.id} className="flex items-center justify-between gap-3 border-b border-line-soft pb-3 last:border-0 last:pb-0">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-graphite">{item.descricao}</p>
                    <p className="truncate text-xs text-muted">
                      {item.quantidade} {unidadeItemExibicao(item.quantidade, item.unidade)} {item.especificacao && `· ${item.especificacao}`}
                    </p>
                  </div>
                  <StatusItemChip status={item.status} />
                </StaggerItem>
              ))}
            </Stagger>
          </Reveal>

          <Reveal delay={0.06} className="relative overflow-hidden rounded-card bg-surface p-5 shadow-card md:p-6">
            <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-sun/15 blur-3xl" aria-hidden />
            <h2 className="mb-4 text-base font-bold text-graphite">Investimento</h2>
            <p className="tabular-nums text-[2.25rem] font-extrabold leading-[1.05] tracking-[-0.035em] text-graphite">
              <CountUp value={proposal.precoFinal} format={(v) => formatBRL(v, false)} />
            </p>
            <p className="mt-1 text-xs text-muted">Sistema completo instalado · {formatNumber(proposal.resultados.precoPorWp, 2)} R$/Wp</p>
            <div className="mt-5 grid grid-cols-2 gap-3 border-t border-line-soft pt-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">Economia no 1º ano</p>
                <p className="tabular-nums text-base font-extrabold text-success">{formatBRL(proposal.resultados.economiaAno1Conservador, false)}</p>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">Retorno em</p>
                <p className="text-base font-extrabold text-graphite">{formatPayback(proposal.resultados.paybackMesesConservador)}</p>
              </div>
            </div>
          </Reveal>
        </div>

        <CondicoesPagamentoCard proposal={proposal} />

        {/* 8. Incluso, garantias, prazo, exclusões */}
        <Stagger quandoVisivel className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-3">
          <StaggerItem className="h-full">
            <InfoCard titulo="O que está incluso">
              <ul className="flex flex-col gap-2">
                {proposal.servicosInclusos.map((s, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-graphite">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" aria-hidden /> {s}
                  </li>
                ))}
              </ul>
            </InfoCard>
          </StaggerItem>
          <StaggerItem className="h-full">
            <InfoCard titulo="Garantias">
              <ul className="flex flex-col gap-2">
                <GarantiaLinha rotulo="Painéis" valor={proposal.garantias.paineis} />
                <GarantiaLinha rotulo="Inversor" valor={proposal.garantias.inversor} />
                {proposal.garantias.instalacao && <GarantiaLinha rotulo="Instalação" valor={proposal.garantias.instalacao} />}
                {proposal.garantiaDemaisEquipamentos && <GarantiaLinha rotulo="Demais equipamentos e serviços" valor={proposal.garantiaDemaisEquipamentos} />}
              </ul>
              <p className="mt-4 flex items-start gap-2 rounded-field bg-chip px-3 py-2 text-sm text-graphite">
                <Clock className="mt-0.5 h-4 w-4 shrink-0 text-muted" aria-hidden />
                <span>
                  <span className="font-semibold">Prazo:</span> {proposal.prazoInstalacao}
                </span>
              </p>
            </InfoCard>
          </StaggerItem>
          <StaggerItem className="h-full">
            <InfoCard titulo="Não incluso">
              <ul className="flex flex-col gap-2">
                {proposal.exclusoes.map((e, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-graphite">
                    <MinusCircle className="mt-0.5 h-4 w-4 shrink-0 text-muted" aria-hidden /> {e}
                  </li>
                ))}
              </ul>
              {proposal.observacaoPreliminar && <p className="mt-3 text-xs text-muted">{proposal.observacaoPreliminar}</p>}
            </InfoCard>
          </StaggerItem>
        </Stagger>

        {/* 9. Botões */}
        <Reveal className="mb-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <BotaoWhatsapp href={whatsappEmpresa} className="w-full sm:w-auto" />
          <motion.button
            onClick={onBaixarPdf}
            disabled={baixandoPdf || !onBaixarPdf}
            whileTap={{ scale: 0.97 }}
            transition={SPRING_TAP}
            className="flex h-14 w-full cursor-pointer items-center justify-center gap-2 rounded-button border border-[#D9D3C7] bg-surface px-6 text-sm font-bold text-graphite transition-colors hover:bg-chip focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sun disabled:cursor-default disabled:opacity-60 sm:w-auto"
          >
            {baixandoPdf ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Download className="h-4 w-4" aria-hidden />}
            {baixandoPdf ? 'Gerando PDF…' : 'Baixar proposta em PDF'}
          </motion.button>
        </Reveal>

        {proposal.resultados.relacaoCcCa > 1.5 && (
          <div className="mb-6 flex items-center gap-2 rounded-field bg-danger-soft px-4 py-3 text-xs font-semibold text-danger">
            <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden />
            Relação entre a potência dos módulos e do inversor acima do recomendado — confirme o dimensionamento antes de instalar.
          </div>
        )}

        <FechamentoDocumento proposal={proposal} />

        {/* 10. Rodapé */}
        <footer className="border-t border-line py-6 text-center text-xs text-muted">
          <p>
            {proposal.empresa.nome} em parceria com {proposal.empresa.parceria.nome} · CNPJ {proposal.empresa.parceria.cnpj} · {proposal.empresa.cidade}
          </p>
          {proposal.empresa.instagram && <p className="mt-1">{proposal.empresa.instagram}</p>}
        </footer>
      </div>

      {!preview && <BarraContatoFlutuante visivel={!heroVisivel} href={whatsappEmpresa} onBaixarPdf={onBaixarPdf} baixandoPdf={baixandoPdf} />}
    </div>
  )
}

/* ---------------------------------- Hero ---------------------------------- */

const Hero = forwardRef<HTMLElement, { proposal: PublicProposal; primeiroNome: string }>(function Hero({ proposal, primeiroNome }, ref) {
  const reduzir = useReducedMotion()
  const r = proposal.resultados
  const entrar = (delay: number) =>
    reduzir
      ? { initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { duration: 0.2 } }
      : { initial: { opacity: 0, y: 18 }, animate: { opacity: 1, y: 0 }, transition: { ...SPRING, delay } }

  return (
    <section ref={ref} className="relative mb-8 overflow-hidden rounded-hero bg-graphite px-6 py-8 text-ivory md:px-12 md:py-12">
      {/* Nascer do sol: brilho âmbar que sobe uma vez ao abrir a proposta */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -right-24 -top-24 h-[420px] w-[420px] rounded-full md:-right-10 md:-top-40 md:h-[560px] md:w-[560px]"
        style={{ background: 'radial-gradient(circle, rgba(242,165,22,0.38) 0%, rgba(242,165,22,0.12) 38%, rgba(242,165,22,0) 70%)' }}
        initial={reduzir ? { opacity: 0 } : { opacity: 0, y: 120, scale: 0.85 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={reduzir ? { duration: 0.3 } : { type: 'spring', bounce: 0, duration: 1.6 }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.07]"
        style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,0.9) 1px, transparent 1px)', backgroundSize: '22px 22px', maskImage: 'linear-gradient(to bottom, black, transparent 75%)' }}
      />

      <div className="relative md:grid md:grid-cols-[1.25fr_1fr] md:items-center md:gap-12">
        <div>
          <motion.p {...entrar(0.05)} className="text-sm font-semibold text-muted-dark">
            Olá, {primeiroNome}
          </motion.p>
          <motion.h1 {...entrar(0.12)} className="mt-2 max-w-xl text-[clamp(2.1rem,4.5vw,3.25rem)] font-extrabold leading-[1.05] tracking-[-0.035em]">
            Sua conta de luz cai de {formatBRL(r.contaAntesMediaMensal, false)} para <span className="text-sun">{formatBRL(r.contaDepoisMediaMensal, false)}</span> por mês
          </motion.h1>
          <motion.span {...entrar(0.2)} className="mt-5 inline-flex items-center gap-1.5 rounded-pill bg-sun px-3.5 py-1.5 text-sm font-extrabold text-graphite">
            <TrendingUp className="h-4 w-4" aria-hidden />
            Economia de <CountUp value={r.percentualEconomiaMensal * 100} format={(v) => `${Math.round(v)}%`} />
          </motion.span>
        </div>

        <motion.div {...entrar(0.28)} className="mt-8 md:mt-0">
          <ComparacaoConta antes={r.contaAntesMediaMensal} depois={r.contaDepoisMediaMensal} />
        </motion.div>
      </div>

      <div className="relative mt-8 grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          { label: 'Potência', value: proposal.sistema.potenciaKwp, format: (v: number) => formatKwp(v) },
          { label: 'Geração média', value: r.geracaoMediaMensalKwh, format: (v: number) => `${formatKwh(v)}/mês` },
          { label: 'Módulos', value: proposal.sistema.qtdModulos, format: (v: number) => String(Math.round(v)) },
          ...(proposal.sistema.areaM2 != null ? [{ label: 'Área estimada', value: proposal.sistema.areaM2, format: (v: number) => `${formatNumber(v, 1)} m²` }] : []),
        ].map((s, i) => (
          <motion.div key={s.label} {...entrar(0.34 + i * 0.05)} className="rounded-field border border-white/10 bg-white/[0.07] p-3 backdrop-blur-sm">
            <p className="text-[11px] font-semibold text-muted-dark">{s.label}</p>
            <p className="tabular-nums text-lg font-extrabold text-ivory">
              <CountUp value={s.value} format={s.format} />
            </p>
          </motion.div>
        ))}
      </div>
      <p className="relative mt-4 text-[11px] text-muted-dark">Com o sistema, a conta passa a ser a taxa mínima de disponibilidade da Equatorial Goiás. Valores sem a contribuição de iluminação pública, que não muda.</p>
    </section>
  )
})

function ComparacaoConta({ antes, depois }: { antes: number; depois: number }) {
  const percentDepois = antes > 0 ? Math.max(4, (depois / antes) * 100) : 0
  return (
    <div className="rounded-card border border-white/10 bg-white/[0.06] p-5 backdrop-blur-md">
      <p className="text-[11px] font-bold uppercase tracking-[0.06em] text-muted-dark">Conta de luz por mês</p>
      <div className="mt-4 flex flex-col gap-4">
        <div>
          <div className="mb-1.5 flex items-baseline justify-between text-sm">
            <span className="font-semibold text-muted-dark">Hoje</span>
            <span className="tabular-nums font-extrabold text-ivory">{formatBRL(antes, false)}</span>
          </div>
          <div className="h-3 overflow-hidden rounded-pill bg-white/10">
            <GrowBar percent={100} className="h-full rounded-pill bg-bar-neutral" delay={0.4} />
          </div>
        </div>
        <div>
          <div className="mb-1.5 flex items-baseline justify-between text-sm">
            <span className="font-semibold text-muted-dark">Com energia solar</span>
            <span className="tabular-nums font-extrabold text-sun">{formatBRL(depois, false)}</span>
          </div>
          <div className="h-3 overflow-hidden rounded-pill bg-white/10">
            <GrowBar percent={percentDepois} className="h-full rounded-pill bg-sun" delay={0.6} />
          </div>
        </div>
      </div>
      <div className="mt-5 flex items-baseline justify-between border-t border-white/10 pt-4">
        <span className="text-sm font-semibold text-muted-dark">Você deixa de pagar</span>
        <span className="tabular-nums text-xl font-extrabold text-ivory">
          <CountUp value={Math.max(0, antes - depois)} format={(v) => formatBRL(v, false)} />
          <span className="text-sm font-semibold text-muted-dark">/mês</span>
        </span>
      </div>
    </div>
  )
}

/* --------------------------------- Seções --------------------------------- */

function GraficoConsumoGeracao({ proposal }: { proposal: PublicProposal }) {
  const ref = useRef<HTMLDivElement>(null)
  const visivel = useInView(ref, { once: true, margin: '0px 0px -15% 0px' })
  const reduzir = useReducedMotion()

  const consumoMensal = proposal.entrada.consumoMensalKwh ?? new Array(12).fill(proposal.entrada.consumoMedioKwh ?? 0)
  const dadosGrafico = MESES.map((mes, i) => ({
    mes,
    Consumo: Math.round(consumoMensal[i] ?? 0),
    Geração: Math.round(proposal.resultados.geracaoMensalKwh[i] ?? 0),
  }))

  return (
    <>
      <h2 className="mb-4 text-base font-bold text-graphite">Consumo × geração, mês a mês</h2>
      <div ref={ref} className="h-64">
        {/* O gráfico só monta ao aparecer na tela, para as barras crescerem diante do cliente. */}
        {visivel && (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dadosGrafico}>
              <CartesianGrid vertical={false} stroke="#E6E1D7" />
              <XAxis dataKey="mes" tick={{ fontSize: 12, fill: '#5B6472' }} axisLine={{ stroke: '#E6E1D7' }} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: '#5B6472' }} axisLine={false} tickLine={false} width={40} />
              <Tooltip
                cursor={{ fill: 'rgba(15,27,45,0.04)' }}
                formatter={(value: number) => `${formatNumber(value)} kWh`}
                contentStyle={{ borderRadius: 14, border: '1px solid #E6E1D7', boxShadow: '0 8px 24px rgba(15,27,45,0.08)' }}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="Consumo" fill="#CFD5DE" radius={[4, 4, 0, 0]} isAnimationActive={!reduzir} animationDuration={900} animationEasing="ease-out" />
              <Bar dataKey="Geração" fill="#F2A516" radius={[4, 4, 0, 0]} isAnimationActive={!reduzir} animationBegin={150} animationDuration={900} animationEasing="ease-out" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </>
  )
}

function CenarioCard({ titulo, economia25, paybackMeses, destaque }: { titulo: string; economia25: number; paybackMeses: number | null; destaque?: boolean }) {
  return (
    <div className={`rounded-card p-4 shadow-card ${destaque ? 'bg-success-soft' : 'bg-surface'}`}>
      <div className="flex items-center justify-between">
        <p className={`text-xs font-bold uppercase tracking-wide ${destaque ? 'text-success' : 'text-muted'}`}>{titulo}</p>
        <TrendingUp className={`h-4 w-4 ${destaque ? 'text-success' : 'text-muted'}`} aria-hidden />
      </div>
      <p className="tabular-nums mt-1 text-xl font-extrabold tracking-[-0.02em] text-success">
        <CountUp value={economia25} format={(v) => formatBRL(v, false)} />
      </p>
      <p className="text-xs text-muted">economia em 25 anos</p>
      <p className="mt-2 flex items-center gap-1.5 text-sm font-semibold text-graphite">
        <Clock className="h-3.5 w-3.5 text-muted" aria-hidden /> Retorno em {formatPayback(paybackMeses)}
      </p>
    </div>
  )
}

function InfoCard({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div className="h-full rounded-card bg-surface p-5 shadow-card md:p-6">
      <h3 className="mb-3 text-[0.8125rem] font-bold uppercase tracking-[0.06em] text-muted">{titulo}</h3>
      {children}
    </div>
  )
}

function GarantiaLinha({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <li className="flex items-start gap-2 text-sm text-graphite">
      <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-success" aria-hidden />
      <span>
        <span className="font-semibold">{rotulo}:</span> {valor}
      </span>
    </li>
  )
}

function ClienteHeaderInfo({ proposal }: { proposal: PublicProposal }) {
  const linhas = [
    proposal.clienteNome,
    proposal.cliente.cpfCnpj,
    proposal.cliente.telefone,
    proposal.cliente.endereco,
    [proposal.cliente.cidade, proposal.entrada.unidadeConsumidora ? `UC ${proposal.entrada.unidadeConsumidora}` : ''].filter(Boolean).join(' · '),
  ].filter(Boolean)

  if (linhas.length === 0) return null

  return <p className="mb-6 text-xs text-muted">{linhas.join(' · ')}</p>
}

function FichaTecnicaCard({ proposal }: { proposal: PublicProposal }) {
  const { entrada, sistema, resultados } = proposal
  const campos: { label: string; valor: string }[] = []

  if (entrada.tipoImovel) campos.push({ label: 'Tipo de imóvel', valor: TIPO_IMOVEL_LABELS[entrada.tipoImovel] ?? entrada.tipoImovel })
  if (entrada.tipoTelhado) campos.push({ label: 'Tipo de telhado', valor: TIPO_TELHADO_LABELS[entrada.tipoTelhado] ?? entrada.tipoTelhado })
  if (entrada.alturaInstalacao) campos.push({ label: 'Altura', valor: ALTURA_LABELS[entrada.alturaInstalacao] ?? entrada.alturaInstalacao })
  if (entrada.inclinacaoGraus != null) campos.push({ label: 'Inclinação', valor: `${entrada.inclinacaoGraus}°` })
  if (entrada.orientacaoTelhado) campos.push({ label: 'Orientação', valor: ORIENTACAO_LABELS[entrada.orientacaoTelhado] ?? entrada.orientacaoTelhado })
  if (entrada.distribuidora) campos.push({ label: 'Distribuidora', valor: entrada.distribuidora })
  if (entrada.unidadeConsumidora) campos.push({ label: 'Unidade consumidora', valor: entrada.unidadeConsumidora })
  if (entrada.coordenadas.lat != null && entrada.coordenadas.lng != null) campos.push({ label: 'Coordenadas', valor: `${entrada.coordenadas.lat}, ${entrada.coordenadas.lng}` })
  if (sistema.areaM2 != null) campos.push({ label: 'Área necessária', valor: `${formatNumber(sistema.areaM2, 1)} m²` })
  if (resultados.pesoEstimado.totalKg > 0) {
    campos.push({
      label: 'Peso estimado',
      valor: `${formatNumber(resultados.pesoEstimado.totalKg, 0)} kg (${formatNumber(resultados.pesoEstimado.kgPorM2, 1)} kg/m²)${resultados.pesoEstimado.estimativa ? ' — estimativa' : ''}`,
    })
  }

  if (campos.length === 0) return null

  return (
    <Reveal className="mb-8 rounded-card bg-surface p-5 shadow-card md:p-6">
      <h2 className="mb-4 text-base font-bold text-graphite">Ficha técnica da instalação</h2>
      <Stagger quandoVisivel className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2 lg:grid-cols-3" gap={0.03}>
        {campos.map((c) => (
          <StaggerItem key={c.label} className="border-l-2 border-sun/50 pl-3">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">{c.label}</p>
            <p className="text-sm font-semibold text-graphite">{c.valor}</p>
          </StaggerItem>
        ))}
      </Stagger>
    </Reveal>
  )
}

interface OpcaoExibida {
  chave: string
  rotulo: string
  opcao: PublicOpcaoPagamento
  parcelado: boolean
}

function CondicoesPagamentoCard({ proposal }: { proposal: PublicProposal }) {
  const { avista, cartao, financiamento } = proposal.pagamento
  const opcoes: OpcaoExibida[] = (
    [
      { chave: 'avista', rotulo: 'À vista', opcao: avista, parcelado: false },
      { chave: 'cartao', rotulo: 'Cartão de crédito', opcao: cartao, parcelado: true },
      { chave: 'financiamento', rotulo: 'Financiamento', opcao: financiamento, parcelado: true },
    ] satisfies OpcaoExibida[]
  ).filter((o) => o.opcao.exibicao !== 'oculto')

  if (opcoes.length === 0 && !proposal.condicoesPagamento) return null

  const colunas = opcoes.length >= 3 ? 'sm:grid-cols-3' : opcoes.length === 2 ? 'sm:grid-cols-2' : ''
  const contaAtual = proposal.resultados.contaAntesMediaMensal

  return (
    <Reveal className="mb-8 rounded-card bg-surface p-5 shadow-card md:p-6">
      <h2 className="mb-4 text-base font-bold text-graphite">Condições de pagamento</h2>
      {opcoes.length > 0 && (
        <Stagger quandoVisivel className={`grid grid-cols-1 gap-3 ${colunas}`}>
          {opcoes.map(({ chave, rotulo, opcao, parcelado }) => {
            const temValor = opcao.exibicao === 'valor'
            const menorQueConta = chave === 'financiamento' && temValor && opcao.valor > 0 && contaAtual > 0 && opcao.valor < contaAtual
            const tom = chave === 'avista' && temValor ? 'escuro' : menorQueConta ? 'sol' : 'neutro'
            return (
              <StaggerItem
                key={chave}
                className={`flex flex-col justify-between rounded-field p-4 ${tom === 'escuro' ? 'bg-graphite text-ivory' : tom === 'sol' ? 'bg-sun-soft' : 'bg-chip'}`}
              >
                <p className={`text-[11px] font-bold uppercase tracking-wide ${tom === 'escuro' ? 'text-muted-dark' : tom === 'sol' ? 'text-sun-ink' : 'text-muted'}`}>{rotulo}</p>
                {temValor ? (
                  <div className="mt-1">
                    {parcelado && <p className={`text-xs font-semibold ${tom === 'sol' ? 'text-sun-ink' : 'text-muted'}`}>{opcao.parcelas}x de</p>}
                    <p className={`tabular-nums text-xl font-extrabold tracking-[-0.02em] ${tom === 'escuro' ? 'text-ivory' : tom === 'sol' ? 'text-sun-ink' : 'text-graphite'}`}>
                      {formatBRL(opcao.valor, parcelado)}
                    </p>
                    {menorQueConta && <p className="mt-1 text-xs font-semibold text-sun-ink">Parcela menor que sua conta de hoje</p>}
                  </div>
                ) : (
                  <p className="mt-1 text-xl font-extrabold tracking-[-0.02em] text-graphite">A combinar</p>
                )}
              </StaggerItem>
            )
          })}
        </Stagger>
      )}
      {proposal.condicoesPagamento && <p className={`${opcoes.length > 0 ? 'mt-3' : ''} whitespace-pre-line text-sm text-muted`}>{proposal.condicoesPagamento}</p>}
    </Reveal>
  )
}

function FechamentoDocumento({ proposal }: { proposal: PublicProposal }) {
  const cidade = proposal.empresa.cidade.split(',')[0].trim()
  const { nome, titulo, crea } = proposal.responsavelTecnico
  return (
    <div className="mb-8 border-t border-line pt-6">
      <p className="text-sm text-graphite">
        {cidade}, {formatDataPorExtenso(dataDoTimestamp(proposal.atualizadoEm))}
      </p>
      {nome && (
        <div className="mt-6">
          <p className="text-sm font-semibold text-graphite">{nome}</p>
          <p className="text-xs text-muted">{[titulo, crea ? `CREA ${crea}` : ''].filter(Boolean).join(' · ')}</p>
        </div>
      )}
    </div>
  )
}

/* ------------------------------ Contato (CTA) ------------------------------ */

function BotaoWhatsapp({ href, className = '', compacto }: { href: string; className?: string; compacto?: boolean }) {
  return (
    <motion.a
      href={href}
      target="_blank"
      rel="noreferrer"
      whileTap={{ scale: 0.97 }}
      transition={SPRING_TAP}
      className={`flex cursor-pointer items-center justify-center gap-2 rounded-button bg-sun px-6 text-sm font-extrabold text-graphite shadow-[0_6px_20px_rgba(242,165,22,0.35)] transition-shadow hover:shadow-[0_10px_28px_rgba(242,165,22,0.45)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-graphite focus-visible:ring-offset-2 ${compacto ? 'h-12 flex-1' : 'h-14'} ${className}`}
    >
      <MessageCircle className="h-4 w-4" aria-hidden /> {compacto ? 'Falar no WhatsApp' : 'Falar com a TS Solar no WhatsApp'}
    </motion.a>
  )
}

/** Barra translúcida no celular que aparece quando o hero sai da tela — entra e sai pelo mesmo caminho (de baixo). */
function BarraContatoFlutuante({ visivel, href, onBaixarPdf, baixandoPdf }: { visivel: boolean; href: string; onBaixarPdf?: () => void; baixandoPdf?: boolean }) {
  const reduzir = useReducedMotion()
  return (
    <AnimatePresence>
      {visivel && (
        <motion.div
          initial={reduzir ? { opacity: 0 } : { y: '110%' }}
          animate={reduzir ? { opacity: 1 } : { y: 0 }}
          exit={reduzir ? { opacity: 0 } : { y: '110%' }}
          transition={reduzir ? { duration: 0.2 } : SPRING}
          className="fixed inset-x-0 bottom-0 z-30 flex gap-2 border-t border-white/50 bg-ivory/80 px-4 pt-3 backdrop-blur-chrome backdrop-saturate-150 sm:hidden"
          style={{ paddingBottom: 'max(12px, env(safe-area-inset-bottom, 0px))' }}
        >
          <BotaoWhatsapp href={href} compacto />
          <motion.button
            onClick={onBaixarPdf}
            whileTap={{ scale: 0.95 }}
            transition={SPRING_TAP}
            disabled={baixandoPdf || !onBaixarPdf}
            aria-label={baixandoPdf ? 'Gerando PDF' : 'Baixar proposta em PDF'}
            className="flex h-12 w-12 shrink-0 cursor-pointer items-center justify-center rounded-button border border-[#D9D3C7] bg-surface text-graphite disabled:opacity-60"
          >
            {baixandoPdf ? <Loader2 className="h-5 w-5 animate-spin" aria-hidden /> : <Download className="h-5 w-5" aria-hidden />}
          </motion.button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
