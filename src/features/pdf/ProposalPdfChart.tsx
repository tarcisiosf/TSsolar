import { Rect, Svg, Text, View } from '@react-pdf/renderer'

const cores = {
  muted: '#5B6472',
  barNeutral: '#CFD5DE',
  sun: '#F2A516',
}

const LARGURA = 480
const ALTURA_BARRAS = 120
const ALTURA_TOTAL = 150
const LARGURA_MES = LARGURA / 12
const LARGURA_BARRA = 12
const GAP_BARRA = 2

interface ProposalPdfChartProps {
  meses: string[]
  consumo: number[]
  geracao: number[]
}

/** Gráfico de barras consumo × geração, desenhado com primitivas SVG do react-pdf
 * (Recharts não roda dentro do PDF). Mesmas cores do gráfico web (bar-neutral/sun). */
export function ProposalPdfChart({ meses, consumo, geracao }: ProposalPdfChartProps) {
  const maxValor = Math.max(1, ...consumo, ...geracao)

  return (
    <View>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
        <View style={{ width: 8, height: 8, backgroundColor: cores.barNeutral, borderRadius: 2, marginRight: 4 }} />
        <Text style={{ fontSize: 7, color: cores.muted, marginRight: 12 }}>Consumo</Text>
        <View style={{ width: 8, height: 8, backgroundColor: cores.sun, borderRadius: 2, marginRight: 4 }} />
        <Text style={{ fontSize: 7, color: cores.muted }}>Geração</Text>
      </View>
      <Svg width={LARGURA} height={ALTURA_TOTAL}>
        {meses.map((mes, i) => {
          const xMes = i * LARGURA_MES
          const alturaConsumo = (consumo[i] / maxValor) * ALTURA_BARRAS
          const alturaGeracao = (geracao[i] / maxValor) * ALTURA_BARRAS
          const xConsumo = xMes + LARGURA_MES / 2 - LARGURA_BARRA - GAP_BARRA / 2
          const xGeracao = xMes + LARGURA_MES / 2 + GAP_BARRA / 2
          return [
            <Rect key={`${mes}-c`} x={xConsumo} y={ALTURA_BARRAS - alturaConsumo} width={LARGURA_BARRA} height={alturaConsumo} fill={cores.barNeutral} rx={2} />,
            <Rect key={`${mes}-g`} x={xGeracao} y={ALTURA_BARRAS - alturaGeracao} width={LARGURA_BARRA} height={alturaGeracao} fill={cores.sun} rx={2} />,
            <Text key={`${mes}-t`} x={xMes + LARGURA_MES / 2} y={ALTURA_BARRAS + 12} textAnchor="middle" style={{ fontSize: 6, fill: cores.muted }}>
              {mes}
            </Text>,
          ]
        })}
        <Rect x={0} y={ALTURA_BARRAS} width={LARGURA} height={1} fill="#E6E1D7" />
      </Svg>
    </View>
  )
}
