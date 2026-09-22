import { z } from 'zod'
import { BITOLAS_CABO } from './catalogLabels'

const base = {
  custoUnitario: z.number().min(0.01, 'Informe o custo unitário'),
  ativo: z.boolean(),
}

const moduloSchema = z.object({
  categoria: z.literal('modulo'),
  unidade: z.literal('un'),
  marca: z.string().min(1, 'Informe a marca'),
  potenciaWp: z.number().int('Informe um número inteiro de Wp').positive('Informe a potência em Wp'),
  areaM2: z.number().positive('Informe uma área maior que zero').nullable(),
  larguraM: z.number().positive('Informe uma largura maior que zero').nullable(),
  tecnologia: z.enum(['monofacial', 'bifacial']).nullable(),
  garantiaProdutoAnos: z.number().int().nonnegative().nullable(),
  garantiaPerformanceAnos: z.number().int().nonnegative().nullable(),
  ...base,
})

const inversorSchema = z.object({
  categoria: z.literal('inversor'),
  unidade: z.literal('un'),
  marca: z.string().min(1, 'Informe a marca'),
  tipo: z.enum(['string', 'micro', 'hibrido']),
  potenciaKw: z.number().positive('Informe a potência em kW'),
  fase: z.enum(['mono', 'bi', 'tri']),
  monitoramentoWifi: z.boolean(),
  garantiaAnos: z.number().int().nonnegative().nullable(),
  mppts: z.number().int().positive().nullable(),
  ...base,
})

const estruturaSchema = z.object({
  categoria: z.literal('estrutura'),
  unidade: z.literal('modulo'),
  marca: z.string(),
  tipoTelhado: z.enum(['ceramico', 'fibrocimento', 'metalico', 'laje', 'solo']),
  ...base,
})

const caboSchema = z.object({
  categoria: z.literal('cabo'),
  unidade: z.literal('m'),
  tipo: z.enum(['cc_solar', 'ca']),
  bitolaMm2: z.union(BITOLAS_CABO.map((b) => z.literal(b)) as [z.ZodLiteral<number>, z.ZodLiteral<number>, ...z.ZodLiteral<number>[]]),
  ...base,
})

const mc4Schema = z.object({
  categoria: z.literal('mc4'),
  unidade: z.literal('par'),
  marca: z.string(),
  ...base,
})

const stringboxSchema = z.object({
  categoria: z.literal('stringbox'),
  unidade: z.literal('un'),
  marca: z.string(),
  entradas: z.number().int().positive('Informe o número de entradas'),
  ...base,
})

const protecaoSchema = z.object({
  categoria: z.literal('protecao'),
  unidade: z.literal('un'),
  tipo: z.enum(['disjuntor', 'dps']),
  correnteA: z.number().int().positive('Informe a corrente em A'),
  ...base,
})

const outroSchema = z.object({
  categoria: z.literal('outro'),
  unidade: z.string().min(1, 'Informe a unidade'),
  descricao: z.string().min(1, 'Informe a descrição'),
  ...base,
})

export const catalogItemSchema = z.discriminatedUnion('categoria', [
  moduloSchema,
  inversorSchema,
  estruturaSchema,
  caboSchema,
  mc4Schema,
  stringboxSchema,
  protecaoSchema,
  outroSchema,
])

/** Valida o payload do formulário e devolve um mapa campo -> primeira mensagem de erro (vazio se válido). */
export function validarCatalogItem(input: unknown): Record<string, string> {
  const resultado = catalogItemSchema.safeParse(input)
  if (resultado.success) return {}
  const erros: Record<string, string> = {}
  for (const issue of resultado.error.issues) {
    const campo = String(issue.path[0] ?? '_')
    if (!erros[campo]) erros[campo] = issue.message
  }
  return erros
}
