export interface ConsumoEntrada {
  consumoMedioKwh: number | null
  consumoMensalKwh: number[] | null
}

/** Média mensal: usa os 12 meses quando informados, senão o consumo médio direto. */
export function calcularConsumoMedioMensal(entrada: ConsumoEntrada): number {
  if (entrada.consumoMensalKwh && entrada.consumoMensalKwh.length === 12) {
    const soma = entrada.consumoMensalKwh.reduce((acc, v) => acc + v, 0)
    return soma / 12
  }
  return entrada.consumoMedioKwh ?? 0
}

/** Sugere a tarifa a partir da conta atual informada, quando o consumo é conhecido. */
export function sugerirTarifa(contaAtual: number, consumoMedioMensalKwh: number): number | null {
  if (consumoMedioMensalKwh <= 0) return null
  return contaAtual / consumoMedioMensalKwh
}
