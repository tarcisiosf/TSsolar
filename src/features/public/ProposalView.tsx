import { AlertTriangle, Download, MessageCircle } from 'lucide-react'
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { BrandLogo } from '@/components/ui/SunLogo'
import { StatusItemChip } from '@/components/ui/Chip'
import { formatBRL, formatDataPorExtenso, formatDateBR, formatKwh, formatKwp, formatNumber, formatPayback, formatPercent } from '@/lib/format'
import { unidadeItemExibicao } from '@/features/catalog/catalogDisplay'
import { TIPO_TELHADO_LABELS } from '@/features/catalog/catalogLabels'
import type { PublicProposal } from '@/types/firestore'

const MESES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

interface ProposalViewProps {
  proposal: PublicProposal
  onBaixarPdf?: () => void
  preview?: boolean
}

export function ProposalView({ proposal, onBaixarPdf, preview }: ProposalViewProps) {
  const vencida = proposal.validaAte ? proposal.validaAte.toDate().getTime() < Date.now() : false
  const primeiroNome = proposal.clienteNome.split(' ')[0] || proposal.clienteNome

  const consumoMensal =
    proposal.entrada.consumoMensalKwh ?? new Array(12).fill(proposal.entrada.consumoMedioKwh ?? 0)
  const dadosGrafico = MESES.map((mes, i) => ({
    mes,
    Consumo: Math.round(consumoMensal[i] ?? 0),
    Geração: Math.round(proposal.resultados.geracaoMensalKwh[i] ?? 0),
  }))

  const whatsappEmpresa = `https://wa.me/${proposal.empresa.whatsapp}?text=${encodeURIComponent(`Olá! Vi a proposta ${proposal.numero}`)}`

  return (
    <div className="bg-ivory">
      <div className="mx-auto max-w-[1200px] px-5 py-6 sm:px-8 md:px-16 md:py-10">
        {/* 1. Topo */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <BrandLogo logoUrl={proposal.empresa.logoUrl} />
          <div className="flex items-center gap-2 text-right">
            <div>
              <p className="text-xs font-semibold text-muted">
                {proposal.numero} · v{proposal.versao}
              </p>
              {proposal.validaAte && (
                <span className={`inline-block rounded-pill px-2.5 py-1 text-[11px] font-bold ${vencida ? 'bg-danger-soft text-danger' : 'bg-sun-soft text-sun-ink'}`}>
                  {vencida ? 'Proposta vencida' : `Válida até ${formatDateBR(proposal.validaAte.toDate())}`}
                </span>
              )}
            </div>
          </div>
        </div>

        <ClienteHeaderInfo proposal={proposal} />

        {preview && (
          <div className="mb-6 rounded-field bg-info-soft px-4 py-2 text-xs font-bold text-info">
            Prévia — é assim que o cliente vai ver a proposta.
          </div>
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
        <section className="mb-8 rounded-hero bg-graphite px-6 py-8 text-ivory md:px-12 md:py-12">
          <div className="md:flex md:items-center md:justify-between md:gap-10">
            <div>
              <p className="text-sm font-semibold text-muted-dark">Olá, {primeiroNome}</p>
              <h1 className="mt-2 max-w-xl text-[clamp(2.1rem,4.5vw,3.25rem)] font-extrabold leading-[1.05] tracking-[-0.035em]">
                Sua conta de luz cai de {formatBRL(proposal.resultados.contaAntesMediaMensal, false)} para{' '}
                {formatBRL(proposal.resultados.contaDepoisMediaMensal, false)} por mês
              </h1>
              <span className="mt-4 inline-block rounded-pill bg-sun px-3 py-1.5 text-sm font-extrabold text-graphite">
                Economia de {formatPercent(proposal.resultados.percentualEconomiaMensal, 0)}
              </span>
            </div>
          </div>

          <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-4">
            <HeroStat label="Potência" value={formatKwp(proposal.sistema.potenciaKwp)} />
            <HeroStat label="Geração média" value={formatKwh(proposal.resultados.geracaoMediaMensalKwh) + '/mês'} />
            <HeroStat label="Módulos" value={String(proposal.sistema.qtdModulos)} />
            <HeroStat label="Área estimada" value={proposal.sistema.areaM2 != null ? `${formatNumber(proposal.sistema.areaM2, 1)} m²` : '—'} />
          </div>
          <p className="mt-4 text-[11px] text-muted-dark">Mesmo com o sistema, permanece a cobrança da taxa mínima de disponibilidade da rede.</p>
        </section>

        <FichaTecnicaCard proposal={proposal} />

        <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-3">
          {/* 4. Gráfico */}
          <div className="rounded-card bg-surface p-5 shadow-card md:col-span-2">
            <h2 className="mb-4 text-base font-bold text-graphite">Consumo × geração, mês a mês</h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dadosGrafico}>
                  <CartesianGrid vertical={false} stroke="#E6E1D7" />
                  <XAxis dataKey="mes" tick={{ fontSize: 12, fill: '#5B6472' }} axisLine={{ stroke: '#E6E1D7' }} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: '#5B6472' }} axisLine={false} tickLine={false} width={40} />
                  <Tooltip formatter={(value: number) => `${formatNumber(value)} kWh`} contentStyle={{ borderRadius: 12, border: '1px solid #E6E1D7' }} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="Consumo" fill="#CFD5DE" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Geração" fill="#F2A516" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* 5. Retorno */}
          <div className="flex flex-col gap-3">
            <CenarioCard
              titulo="Cenário conservador"
              economia25={proposal.resultados.economia25AnosConservador}
              paybackMeses={proposal.resultados.paybackMesesConservador}
            />
            <CenarioCard
              titulo="Cenário otimista"
              economia25={proposal.resultados.economia25AnosOtimista}
              paybackMeses={proposal.resultados.paybackMesesOtimista}
            />
            <p className="text-xs text-muted">
              Estimativa considera reajuste anual da tarifa, degradação dos módulos e a cobrança progressiva do Fio B. Premissas configuradas pela TS Solar — valide contra sua fatura da Equatorial Goiás.
            </p>
          </div>
        </div>

        {/* 6. Equipamentos + 7. Investimento */}
        <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="rounded-card bg-surface p-5 shadow-card">
            <h2 className="mb-4 text-base font-bold text-graphite">Equipamentos</h2>
            <div className="flex flex-col gap-3">
              {proposal.itens.map((item) => (
                <div key={item.id} className="flex items-center justify-between gap-3 border-b border-line-soft pb-3 last:border-0 last:pb-0">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-graphite">{item.descricao}</p>
                    <p className="truncate text-xs text-muted">
                      {item.quantidade} {unidadeItemExibicao(item.quantidade, item.unidade)} {item.especificacao && `· ${item.especificacao}`}
                    </p>
                  </div>
                  <StatusItemChip status={item.status} />
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-card bg-surface p-5 shadow-card">
            <h2 className="mb-4 text-base font-bold text-graphite">Investimento</h2>
            <p className="tabular-nums text-[1.75rem] font-extrabold leading-[1.1] tracking-[-0.03em] text-graphite">
              {formatBRL(proposal.precoFinal, false)}
            </p>
            <p className="text-xs text-muted">à vista · {formatNumber(proposal.resultados.precoPorWp, 2)} R$/Wp</p>
          </div>
        </div>

        <CondicoesPagamentoCard proposal={proposal} />

        {/* 8. Incluso, garantias, prazo, exclusões */}
        <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-3">
          <InfoCard titulo="O que está incluso">
            <ul className="flex flex-col gap-1.5">
              {proposal.servicosInclusos.map((s, i) => (
                <li key={i} className="text-sm text-graphite">
                  · {s}
                </li>
              ))}
            </ul>
          </InfoCard>
          <InfoCard titulo="Garantias">
            <p className="text-sm text-graphite">Painéis: {proposal.garantias.paineis}</p>
            <p className="text-sm text-graphite">Inversor: {proposal.garantias.inversor}</p>
            {proposal.garantias.instalacao && <p className="text-sm text-graphite">Instalação: {proposal.garantias.instalacao}</p>}
            <p className="text-sm text-graphite">Demais equipamentos e serviços: {proposal.garantiaDemaisEquipamentos}</p>
            <p className="mt-3 text-sm text-graphite">Prazo: {proposal.prazoInstalacao}</p>
          </InfoCard>
          <InfoCard titulo="Não incluso">
            <ul className="flex flex-col gap-1.5">
              {proposal.exclusoes.map((e, i) => (
                <li key={i} className="text-sm text-graphite">
                  · {e}
                </li>
              ))}
            </ul>
            {proposal.observacaoPreliminar && <p className="mt-3 text-xs text-muted">{proposal.observacaoPreliminar}</p>}
          </InfoCard>
        </div>

        {/* 9. Botões */}
        <div className="mb-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <a
            href={whatsappEmpresa}
            target="_blank"
            rel="noreferrer"
            className="flex h-14 w-full items-center justify-center gap-2 rounded-button bg-sun px-6 text-sm font-extrabold text-graphite sm:w-auto"
          >
            <MessageCircle className="h-4 w-4" aria-hidden /> Falar com a TS Solar no WhatsApp
          </a>
          <button
            onClick={onBaixarPdf}
            className="flex h-14 w-full items-center justify-center gap-2 rounded-button border border-[#D9D3C7] bg-surface px-6 text-sm font-bold text-graphite sm:w-auto"
          >
            <Download className="h-4 w-4" aria-hidden /> Baixar proposta em PDF
          </button>
        </div>

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
    </div>
  )
}

function HeroStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-field bg-white/10 p-3">
      <p className="text-[11px] font-semibold text-muted-dark">{label}</p>
      <p className="tabular-nums text-lg font-extrabold text-ivory">{value}</p>
    </div>
  )
}

function CenarioCard({ titulo, economia25, paybackMeses }: { titulo: string; economia25: number; paybackMeses: number | null }) {
  return (
    <div className="rounded-card bg-surface p-4 shadow-card">
      <p className="text-xs font-bold uppercase tracking-wide text-muted">{titulo}</p>
      <p className="tabular-nums mt-1 text-lg font-extrabold text-success">{formatBRL(economia25, false)}</p>
      <p className="text-xs text-muted">economia em 25 anos</p>
      <p className="mt-2 text-sm font-semibold text-graphite">Payback: {formatPayback(paybackMeses)}</p>
    </div>
  )
}

function InfoCard({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div className="rounded-card bg-surface p-5 shadow-card">
      <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-muted">{titulo}</h3>
      {children}
    </div>
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

  return (
    <p className="mb-6 text-xs text-muted">{linhas.join(' · ')}</p>
  )
}

const TIPO_IMOVEL_LABELS: Record<string, string> = { residencial: 'Residencial', comercial: 'Comercial', rural: 'Rural', industrial: 'Industrial' }
const ALTURA_LABELS: Record<string, string> = { ate_5m: 'Até 5 m', '5_12m': '5 a 12 m', acima_12m: 'Acima de 12 m' }
const ORIENTACAO_LABELS: Record<string, string> = { norte: 'Norte', nordeste: 'Nordeste', noroeste: 'Noroeste', leste: 'Leste', oeste: 'Oeste', sul: 'Sul' }

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
  campos.push({
    label: 'Peso estimado',
    valor: `${formatNumber(resultados.pesoEstimado.totalKg, 0)} kg (${formatNumber(resultados.pesoEstimado.kgPorM2, 1)} kg/m²)${resultados.pesoEstimado.estimativa ? ' — estimativa' : ''}`,
  })

  if (campos.length === 0) return null

  return (
    <section className="mb-8 rounded-card bg-surface p-5 shadow-card">
      <h2 className="mb-4 text-base font-bold text-graphite">Ficha técnica da instalação</h2>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {campos.map((c) => (
          <div key={c.label}>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">{c.label}</p>
            <p className="text-sm font-semibold text-graphite">{c.valor}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

function CondicoesPagamentoCard({ proposal }: { proposal: PublicProposal }) {
  return (
    <section className="mb-8 rounded-card bg-surface p-5 shadow-card">
      <h2 className="mb-4 text-base font-bold text-graphite">Condições de pagamento</h2>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-field bg-chip p-3">
          <p className="text-[11px] font-bold uppercase text-muted">À vista</p>
          <p className="tabular-nums text-lg font-extrabold text-graphite">{formatBRL(proposal.precoFinal, false)}</p>
        </div>
        <div className="rounded-field bg-chip p-3">
          <p className="text-[11px] font-bold uppercase text-muted">Cartão {proposal.pagamento.cartao.parcelas}x</p>
          <p className="tabular-nums text-lg font-extrabold text-graphite">{formatBRL(proposal.pagamento.cartao.valor)}</p>
        </div>
        <div className="rounded-field bg-chip p-3">
          <p className="text-[11px] font-bold uppercase text-muted">Financiamento {proposal.pagamento.financiamento.parcelas}x</p>
          <p className="tabular-nums text-lg font-extrabold text-graphite">{formatBRL(proposal.pagamento.financiamento.valor)}</p>
        </div>
      </div>
      {proposal.condicoesPagamento && <p className="mt-3 text-xs text-muted">{proposal.condicoesPagamento}</p>}
    </section>
  )
}

function FechamentoDocumento({ proposal }: { proposal: PublicProposal }) {
  const cidade = proposal.empresa.cidade.split(',')[0].trim()
  const { nome, titulo, crea } = proposal.responsavelTecnico
  return (
    <div className="mb-8 border-t border-line pt-6">
      <p className="text-sm text-graphite">
        {cidade}, {formatDataPorExtenso(proposal.atualizadoEm.toDate())}
      </p>
      {nome && (
        <div className="mt-6">
          <p className="text-sm font-semibold text-graphite">{nome}</p>
          <p className="text-xs text-muted">
            {[titulo, crea ? `CREA ${crea}` : ''].filter(Boolean).join(' · ')}
          </p>
        </div>
      )}
    </div>
  )
}
