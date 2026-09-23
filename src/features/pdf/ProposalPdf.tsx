import { Circle, Document, Image, Line, Link, Page, StyleSheet, Svg, Text, View } from '@react-pdf/renderer'
import { formatBRL, formatDateBR, formatKwh, formatKwp, formatNumber, formatPercent } from '@/lib/format'
import type { PublicProposal } from '@/types/firestore'
import { registrarFontesPdf } from './fonts'

registrarFontesPdf()

const cores = {
  graphite: '#0F1B2D',
  ivory: '#F7F4EE',
  surface: '#FFFFFF',
  sun: '#F2A516',
  sunSoft: '#FDF3DC',
  sunInk: '#5A3D00',
  muted: '#5B6472',
  line: '#E6E1D7',
  chip: '#F1EDE4',
  success: '#1E7A50',
  successSoft: '#E3F2EA',
  danger: '#9A3412',
  dangerSoft: '#F6E7E2',
  neutralChip: '#3A4758',
  neutralChipSoft: '#EEF1F5',
}

const styles = StyleSheet.create({
  page: { fontFamily: 'Plus Jakarta Sans', fontSize: 10, color: cores.graphite, backgroundColor: cores.ivory, padding: 32 },
  row: { flexDirection: 'row' },
  spaceBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  brandMark: { width: 20, height: 20, borderRadius: 10 },
  brandName: { fontSize: 13, fontWeight: 800 },
  brandSub: { fontSize: 8, color: cores.muted },
  chip: { borderRadius: 999, paddingVertical: 4, paddingHorizontal: 8, fontSize: 8, fontWeight: 700 },
  hero: { backgroundColor: cores.graphite, borderRadius: 16, padding: 20, marginTop: 16, marginBottom: 16 },
  heroText: { color: cores.ivory },
  heroTitle: { fontSize: 20, fontWeight: 800, color: cores.ivory, marginTop: 8, marginBottom: 10, lineHeight: 1.2 },
  statBox: { backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 8, padding: 8, flex: 1, marginRight: 6 },
  statLabel: { fontSize: 7, color: cores.muted, marginBottom: 2 },
  card: { backgroundColor: cores.surface, borderRadius: 12, padding: 14, marginBottom: 12 },
  sectionTitle: { fontSize: 11, fontWeight: 700, marginBottom: 8 },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: cores.line, paddingVertical: 6 },
  footer: { position: 'absolute', bottom: 20, left: 32, right: 32, textAlign: 'center', fontSize: 7, color: cores.muted },
})

function SunMark() {
  return (
    <Svg width={16} height={16} viewBox="0 0 32 32">
      <Circle cx={16} cy={16} r={7} fill={cores.sun} />
      {Array.from({ length: 8 }).map((_, i) => {
        const angle = (i * Math.PI) / 4
        const x1 = 16 + Math.cos(angle) * 11
        const y1 = 16 + Math.sin(angle) * 11
        const x2 = 16 + Math.cos(angle) * 15
        const y2 = 16 + Math.sin(angle) * 15
        return <Line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={cores.sun} strokeWidth={2} strokeLinecap="round" />
      })}
    </Svg>
  )
}

function StatusChip({ status }: { status: 'incluso' | 'fornecido_cliente' | 'nao_incluso' }) {
  const config = {
    incluso: { label: 'Incluso', bg: cores.successSoft, color: cores.success },
    fornecido_cliente: { label: 'Fornecido pelo cliente', bg: cores.neutralChipSoft, color: cores.neutralChip },
    nao_incluso: { label: 'Não incluso', bg: cores.dangerSoft, color: cores.danger },
  }[status]
  return <Text style={[styles.chip, { backgroundColor: config.bg, color: config.color }]}>{config.label}</Text>
}

function publicUrl(publicId: string): string {
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://tssolar.com.br'
  return `${origin}/p/${publicId}`
}

export function ProposalPdf({ proposal }: { proposal: PublicProposal }) {
  const url = publicUrl(proposal.publicId)

  return (
    <Document title={`Proposta ${proposal.numero}`}>
      <Page size="A4" style={styles.page}>
        <View style={styles.spaceBetween}>
          <View style={styles.row}>
            {proposal.empresa.logoUrl ? <Image src={proposal.empresa.logoUrl} style={styles.brandMark} /> : <SunMark />}
            <View style={{ marginLeft: 8 }}>
              <Text style={styles.brandName}>{proposal.empresa.nome}</Text>
              <Text style={styles.brandSub}>em parceria com {proposal.empresa.parceria.nome}</Text>
            </View>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={{ fontSize: 9, fontWeight: 700 }}>
              {proposal.numero} · v{proposal.versao}
            </Text>
            {proposal.validaAte && (
              <Text style={{ fontSize: 8, color: cores.muted, marginTop: 2 }}>Válida até {formatDateBR(proposal.validaAte.toDate())}</Text>
            )}
          </View>
        </View>

        <View style={styles.hero} wrap={false}>
          <Text style={[styles.heroText, { fontSize: 9 }]}>Olá, {proposal.clienteNome.split(' ')[0]}</Text>
          <Text style={styles.heroTitle}>
            Sua conta de luz cai de {formatBRL(proposal.resultados.contaAntesMediaMensal, false)} para{' '}
            {formatBRL(proposal.resultados.contaDepoisMediaMensal, false)} por mês
          </Text>
          <Text style={[styles.chip, { backgroundColor: cores.sun, color: cores.graphite, alignSelf: 'flex-start' }]}>
            Economia de {formatPercent(proposal.resultados.percentualEconomiaMensal, 0)}
          </Text>
          <View style={[styles.row, { marginTop: 14 }]}>
            <View style={styles.statBox}>
              <Text style={[styles.statLabel, { color: cores.ivory }]}>Potência</Text>
              <Text style={{ color: cores.ivory, fontSize: 11, fontWeight: 800 }}>{formatKwp(proposal.sistema.potenciaKwp)}</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={[styles.statLabel, { color: cores.ivory }]}>Geração média</Text>
              <Text style={{ color: cores.ivory, fontSize: 11, fontWeight: 800 }}>{formatKwh(proposal.resultados.geracaoMediaMensalKwh)}/mês</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={[styles.statLabel, { color: cores.ivory }]}>Módulos</Text>
              <Text style={{ color: cores.ivory, fontSize: 11, fontWeight: 800 }}>{proposal.sistema.qtdModulos}</Text>
            </View>
            <View style={[styles.statBox, { marginRight: 0 }]}>
              <Text style={[styles.statLabel, { color: cores.ivory }]}>Área estimada</Text>
              <Text style={{ color: cores.ivory, fontSize: 11, fontWeight: 800 }}>
                {proposal.sistema.areaM2 != null ? `${formatNumber(proposal.sistema.areaM2, 1)} m²` : '—'}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.row}>
          <View style={[styles.card, { flex: 1, marginRight: 8 }]} wrap={false}>
            <Text style={styles.sectionTitle}>Cenário conservador</Text>
            <Text style={{ fontSize: 14, fontWeight: 800, color: cores.success }}>{formatBRL(proposal.resultados.economia25AnosConservador, false)}</Text>
            <Text style={{ fontSize: 8, color: cores.muted, marginBottom: 4 }}>economia em 25 anos</Text>
            <Text style={{ fontSize: 9, fontWeight: 700 }}>
              Payback: {proposal.resultados.paybackMesesConservador ? `${Math.floor(proposal.resultados.paybackMesesConservador / 12)} anos` : 'fora do horizonte'}
            </Text>
          </View>
          <View style={[styles.card, { flex: 1 }]} wrap={false}>
            <Text style={styles.sectionTitle}>Cenário otimista</Text>
            <Text style={{ fontSize: 14, fontWeight: 800, color: cores.success }}>{formatBRL(proposal.resultados.economia25AnosOtimista, false)}</Text>
            <Text style={{ fontSize: 8, color: cores.muted, marginBottom: 4 }}>economia em 25 anos</Text>
            <Text style={{ fontSize: 9, fontWeight: 700 }}>
              Payback: {proposal.resultados.paybackMesesOtimista ? `${Math.floor(proposal.resultados.paybackMesesOtimista / 12)} anos` : 'fora do horizonte'}
            </Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Equipamentos</Text>
          {proposal.itens.map((item) => (
            <View key={item.id} style={styles.itemRow} wrap={false}>
              <View>
                <Text style={{ fontWeight: 700 }}>{item.descricao}</Text>
                <Text style={{ fontSize: 8, color: cores.muted }}>
                  {item.quantidade} {item.unidade} {item.especificacao ? `· ${item.especificacao}` : ''}
                </Text>
              </View>
              <StatusChip status={item.status} />
            </View>
          ))}
        </View>

        <View style={styles.row}>
          <View style={[styles.card, { flex: 1, marginRight: 8 }]} wrap={false}>
            <Text style={styles.sectionTitle}>Investimento</Text>
            <Text style={{ fontSize: 18, fontWeight: 800 }}>{formatBRL(proposal.precoFinal, false)}</Text>
            <Text style={{ fontSize: 8, color: cores.muted }}>à vista · {formatNumber(proposal.resultados.precoPorWp, 2)} R$/Wp</Text>
          </View>
          <View style={[styles.card, { flex: 1 }]} wrap={false}>
            <Text style={styles.sectionTitle}>Incluso e garantias</Text>
            {proposal.servicosInclusos.map((s, i) => (
              <Text key={i} style={{ fontSize: 9, marginBottom: 2 }}>
                · {s}
              </Text>
            ))}
            <Text style={{ fontSize: 9, marginTop: 6 }}>Painéis: {proposal.garantias.paineis} · Inversor: {proposal.garantias.inversor}</Text>
            <Text style={{ fontSize: 9, marginTop: 2 }}>Prazo: {proposal.prazoInstalacao}</Text>
          </View>
        </View>

        <View style={styles.card} wrap={false}>
          <Text style={styles.sectionTitle}>Não incluso</Text>
          <Text style={{ fontSize: 9 }}>{proposal.exclusoes}</Text>
        </View>

        <Text
          style={styles.footer}
          render={({ pageNumber, totalPages }) =>
            `${proposal.empresa.nome} em parceria com ${proposal.empresa.parceria.nome} · CNPJ ${proposal.empresa.parceria.cnpj} · ${proposal.empresa.cidade} · ${url} · ${pageNumber}/${totalPages}`
          }
          fixed
        />
        <Link src={url} style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 20 }} />
      </Page>
    </Document>
  )
}
