export interface DimensionamentoSugerido {
  kWpSugerido: number
  qtdModulosSugerido: number
}

/** kWp sugerido e quantidade de módulos a partir do consumo médio mensal. Editável manualmente na UI. */
export function sugerirDimensionamento(
  consumoMedioMensalKwh: number,
  produtividadeKwhKwpAno: number,
  potenciaModuloW: number,
): DimensionamentoSugerido {
  if (produtividadeKwhKwpAno <= 0 || potenciaModuloW <= 0) {
    return { kWpSugerido: 0, qtdModulosSugerido: 0 }
  }
  const consumoAnual = consumoMedioMensalKwh * 12
  const kWpSugerido = consumoAnual / produtividadeKwhKwpAno
  const qtdModulosSugerido = Math.ceil((kWpSugerido * 1000) / potenciaModuloW)
  return { kWpSugerido, qtdModulosSugerido }
}

/** Potência final do sistema a partir da quantidade de módulos escolhida. */
export function potenciaFinalKwp(qtdModulos: number, potenciaModuloW: number): number {
  return (qtdModulos * potenciaModuloW) / 1000
}

/** Área estimada do sistema: 3 m² por módulo (regra fixa, já cobre espaçamento/orientação). */
export function calcularAreaEstimada(qtdModulos: number): number {
  return qtdModulos * 3
}

export type NivelRelacaoCcCa = 'ok' | 'aviso' | 'alerta'

export interface RelacaoCcCa {
  relacao: number
  nivel: NivelRelacaoCcCa
}

/** Relação CC/CA (potência dos módulos / potência do inversor). >1.35 = aviso de clipping, >1.5 = alerta. */
export function calcularRelacaoCcCa(potenciaCcKwp: number, potenciaInversorKw: number): RelacaoCcCa {
  if (potenciaInversorKw <= 0) return { relacao: 0, nivel: 'ok' }
  const relacao = potenciaCcKwp / potenciaInversorKw
  const nivel: NivelRelacaoCcCa = relacao > 1.5 ? 'alerta' : relacao > 1.35 ? 'aviso' : 'ok'
  return { relacao, nivel }
}
