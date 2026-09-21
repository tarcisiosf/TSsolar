/** Fator de degradação acumulada dos módulos até o ano informado (ano 1 = 100%). */
export function fatorDegradacao(ano: number, degradacaoAnual: number): number {
  return Math.pow(1 - degradacaoAnual, ano - 1)
}

/**
 * Geração mensal estimada (kWh) para um ano do sistema, aplicando a distribuição
 * sazonal (12 fatores, média 1) e a degradação acumulada dos módulos.
 */
export function gerarGeracaoMensal(
  potenciaKwp: number,
  produtividadeKwhKwpAno: number,
  distribuicaoMensal: number[],
  ano: number,
  degradacaoAnual: number,
): number[] {
  const geracaoAnualBase = potenciaKwp * produtividadeKwhKwpAno
  const degradacao = fatorDegradacao(ano, degradacaoAnual)
  return distribuicaoMensal.map((fator) => (geracaoAnualBase / 12) * fator * degradacao)
}
