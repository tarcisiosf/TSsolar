import type { Ligacao } from '@/types/firestore'

export interface ContaComSistemaParams {
  consumoKwh: number
  geracaoKwh: number
  tarifaKwh: number
  fioBKwh: number
  percentualFioB: number
  fatorSimultaneidade: number
  ligacao: Ligacao
  custoDisponibilidadeKwh: Record<Ligacao, number>
  iluminacaoPublica: number
}

/**
 * Retorna, para o ano informado, o percentual da tarifa Fio B cobrado sobre a energia
 * compensada, conforme o cronograma legal (Lei 14.300/2022). Anos fora do mapa após o
 * último ano cadastrado são cobrados em 100%.
 */
export function percentualFioBPorAno(ano: number, fioBPercentualPorAno: Record<string, number>): number {
  const anos = Object.keys(fioBPercentualPorAno)
    .map(Number)
    .sort((a, b) => a - b)
  if (anos.length === 0) return 1
  if (ano >= anos[anos.length - 1]) return fioBPercentualPorAno[String(anos[anos.length - 1])]
  if (ano <= anos[0]) return fioBPercentualPorAno[String(anos[0])]
  const anoAplicavel = anos.filter((a) => a <= ano).pop() ?? anos[0]
  return fioBPercentualPorAno[String(anoAplicavel)]
}

/**
 * Estimativa da conta de energia com o sistema instalado.
 *
 * APROXIMAÇÃO: este modelo simplifica a compensação de créditos (não considera o banco
 * de créditos entre postos horários nem excedente para meses futuros). As premissas
 * (Fio B, fator de simultaneidade, custo de disponibilidade) devem ser validadas contra
 * faturas reais da Equatorial Goiás antes de qualquer proposta ser considerada definitiva.
 */
export function calcularContaComSistemaMes(params: ContaComSistemaParams): number {
  const {
    consumoKwh,
    geracaoKwh,
    tarifaKwh,
    fioBKwh,
    percentualFioB,
    fatorSimultaneidade,
    ligacao,
    custoDisponibilidadeKwh,
    iluminacaoPublica,
  } = params

  const energiaInjetada = geracaoKwh * (1 - fatorSimultaneidade)
  const energiaCompensada = Math.min(energiaInjetada, Math.max(consumoKwh - geracaoKwh * fatorSimultaneidade, 0))
  const cobrancaFioB = energiaCompensada * fioBKwh * percentualFioB
  const custoMinimo = custoDisponibilidadeKwh[ligacao] * tarifaKwh
  const consumoNaoCoberto = Math.max(consumoKwh - geracaoKwh, 0) * tarifaKwh

  return Math.max(custoMinimo, cobrancaFioB) + consumoNaoCoberto + iluminacaoPublica
}

/** Conta sem sistema, para efeito de comparação (mesma base de iluminação pública). */
export function calcularContaSemSistemaMes(consumoKwh: number, tarifaKwh: number, iluminacaoPublica: number): number {
  return consumoKwh * tarifaKwh + iluminacaoPublica
}
