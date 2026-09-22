# Catálogo do distribuidor, kits prontos e quantidades sugeridas — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Cadastrar os itens reais do distribuidor no catálogo, montar dois kits prontos, e sugerir automaticamente a quantidade de cada peça de estrutura com base no número de módulos do sistema — sempre editável.

**Architecture:** Estende o modelo de catálogo existente (união discriminada por `categoria`) com campos novos em módulo/inversor/cabo, e reformula a categoria `estrutura` em componentes de estrutura tipados por `tipoPeca`. Adiciona uma coleção `kits` (mesmo padrão CRUD do catálogo). Um motor de sugestão puro (`estrutura.ts` + `quantidadeSugerida.ts`) calcula quantidades a partir de N módulos, reaproveitado tanto ao adicionar um item quanto um kit no editor de proposta. Um import idempotente (IDs determinísticos) popula o catálogo e os kits com os itens do distribuidor.

**Tech Stack:** React + TypeScript, Firestore (`firebase/firestore`), Zod, Vitest, Tailwind (tokens do DESIGN.md), Motion (`motion/react`).

**Spec:** `docs/superpowers/specs/2026-09-22-catalogo-kits-distribuidor-design.md`

## Global Constraints

- Todo texto de UI em português do Brasil, seguindo `DESIGN.md` (cores só via tokens Tailwind existentes, nunca hex solto) e a skill `apple-design` para qualquer movimento novo.
- Testes automatizados cobrem só lógica pura (`src/lib/calc/**`, `catalogDisplay.ts`, `catalogSchema.ts`, normalização de legado) — este projeto não tem testes de componente React (nenhum `*.test.tsx` existe); Sheets/páginas/forms são verificados por build + lint + smoke manual.
- `custoPorMetro` (cabo) e `nome` (todas as categorias) são **sempre derivados** na camada de dados (`src/lib/data/catalog.ts`), nunca digitados no formulário — por isso ficam fora de `CatalogItemInput`.
- Reimportar os itens do distribuidor **nunca sobrescreve** um item ou kit já existente (idempotência via ID de documento determinístico + checagem de existência antes de criar).
- Documentos antigos da categoria `estrutura` (sem `tipoPeca`) continuam funcionando via normalização em memória em `subscribeCatalog` — nenhuma migração do Firestore é feita por este plano.
- Nenhum arquivo que importa `@/lib/firebase` (direta ou indiretamente, ex. `@/lib/data/*`) pode ser importado por um arquivo de teste — a inicialização do Firebase quebra em ambiente de teste (sem env vars). Lógica pura testável fica em `src/lib/calc/**` ou `src/features/catalog/catalogDisplay.ts`, nunca em `src/lib/data/**`.

---

## Task 1: Módulo — tecnologia e largura

**Files:**
- Modify: `src/types/firestore.ts`
- Modify: `src/features/catalog/catalogLabels.ts`
- Modify: `src/features/catalog/catalogSchema.ts`
- Modify: `src/features/catalog/catalogDisplay.ts`
- Test: `src/features/catalog/catalogDisplay.test.ts`, `src/features/catalog/catalogSchema.test.ts`

**Interfaces:**
- Produces: `TecnologiaModulo` (`'monofacial' | 'bifacial'`) em `firestore.ts`; `CatalogItemModulo.larguraM: number | null` e `CatalogItemModulo.tecnologia: TecnologiaModulo | null`; `TECNOLOGIA_MODULO_LABELS: Record<TecnologiaModulo, string>` em `catalogLabels.ts`.

- [ ] **Step 1: Escrever os testes que falham**

Em `src/features/catalog/catalogDisplay.test.ts`, logo depois do teste `'módulo com potência decimal'`... na verdade logo depois do teste `it('módulo', ...)` dentro de `describe('gerarNomeCatalogItem', ...)`, adicione:

```ts
  it('módulo com tecnologia', () => {
    const input = { ...defaultCatalogItemInput('modulo'), marca: 'Leapton', potenciaWp: 620, tecnologia: 'bifacial' as const }
    expect(gerarNomeCatalogItem(input)).toBe('Módulo Leapton 620 Wp bifacial')
  })

  it('módulo sem tecnologia não tem sufixo', () => {
    const input = { ...defaultCatalogItemInput('modulo'), marca: 'Astroenergy', potenciaWp: 725 }
    expect(gerarNomeCatalogItem(input)).toBe('Módulo Astroenergy 725 Wp')
  })
```

Depois, atualize o teste existente `it('módulo com garantia de performance', ...)` dentro de `describe('especificacaoCatalogItem', ...)` — ele vai quebrar a compilação porque `comBase({...})` monta um `CatalogItem` literal sem os dois campos novos, que agora são obrigatórios no tipo (mesmo sendo `| null`). Adicione `larguraM: null, tecnologia: null,` ao objeto:

```ts
  it('módulo com garantia de performance', () => {
    const item: CatalogItem = comBase({
      categoria: 'modulo',
      unidade: 'un',
      marca: 'Astroenergy',
      potenciaWp: 725,
      areaM2: null,
      larguraM: null,
      tecnologia: null,
      garantiaProdutoAnos: 12,
      garantiaPerformanceAnos: 30,
      custoUnitario: 900,
      ativo: true,
    })
    expect(especificacaoCatalogItem(item)).toBe('garantia de performance de 30 anos')
  })
```

Em `src/features/catalog/catalogSchema.test.ts`, adicione ao final do arquivo (antes do `})` que fecha `describe('validarCatalogItem', ...)`):

```ts

  it('módulo aceita largura e tecnologia nulas', () => {
    const erros = validarCatalogItem({ ...defaultCatalogItemInput('modulo'), marca: 'Astroenergy', potenciaWp: 725, custoUnitario: 900 })
    expect(erros).toEqual({})
  })

  it('módulo com largura negativa gera erro', () => {
    const erros = validarCatalogItem({ ...defaultCatalogItemInput('modulo'), marca: 'Astroenergy', potenciaWp: 725, custoUnitario: 900, larguraM: -1 })
    expect(erros.larguraM).toBeTruthy()
  })
```

- [ ] **Step 2: Rodar os testes e confirmar que falham**

Run: `npx vitest run src/features/catalog/catalogDisplay.test.ts src/features/catalog/catalogSchema.test.ts`
Expected: FAIL — `tecnologia`/`larguraM` não existem no tipo/objeto ainda (erro de tipo ou de asserção).

- [ ] **Step 3: Adicionar os campos em `firestore.ts`**

Em `src/types/firestore.ts`, logo acima de `export interface CatalogItemModulo`, adicione o novo tipo:

```ts
export type TecnologiaModulo = 'monofacial' | 'bifacial'
```

E substitua a interface `CatalogItemModulo`:

```ts
export interface CatalogItemModulo extends CatalogItemBase {
  categoria: 'modulo'
  unidade: 'un'
  marca: string
  potenciaWp: number
  areaM2: number | null
  larguraM: number | null
  tecnologia: TecnologiaModulo | null
  garantiaProdutoAnos: number | null
  garantiaPerformanceAnos: number | null
}
```

- [ ] **Step 4: Adicionar o rótulo em `catalogLabels.ts`**

No topo do arquivo, adicione `TecnologiaModulo` ao import de `@/types/firestore`:

```ts
import type {
  BitolaCaboMm2,
  CategoriaCatalogo,
  Ligacao,
  TecnologiaModulo,
  TipoCabo,
  TipoInversor,
  TipoProtecao,
  TipoTelhado,
} from '@/types/firestore'
```

E, depois de `FASE_LABELS`, adicione:

```ts
export const TECNOLOGIA_MODULO_LABELS: Record<TecnologiaModulo, string> = {
  monofacial: 'Monofacial',
  bifacial: 'Bifacial',
}
```

- [ ] **Step 5: Atualizar `catalogSchema.ts`**

Substitua `moduloSchema`:

```ts
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
```

- [ ] **Step 6: Atualizar `catalogDisplay.ts`**

Em `PADROES.modulo`, adicione os dois campos:

```ts
  modulo: { categoria: 'modulo', unidade: 'un', marca: '', potenciaWp: 0, areaM2: null, larguraM: null, tecnologia: null, garantiaProdutoAnos: null, garantiaPerformanceAnos: null, custoUnitario: 0, ativo: true },
```

Em `gerarNomeCatalogItem`, troque o `case 'modulo':`:

```ts
    case 'modulo':
      return `Módulo ${input.marca} ${input.potenciaWp} Wp${input.tecnologia ? ' ' + input.tecnologia : ''}`.trim()
```

- [ ] **Step 7: Rodar os testes e confirmar que passam**

Run: `npx vitest run src/features/catalog/catalogDisplay.test.ts src/features/catalog/catalogSchema.test.ts`
Expected: PASS

- [ ] **Step 8: Commit**

```bash
git add src/types/firestore.ts src/features/catalog/catalogLabels.ts src/features/catalog/catalogSchema.ts src/features/catalog/catalogDisplay.ts src/features/catalog/catalogDisplay.test.ts src/features/catalog/catalogSchema.test.ts
git commit -m "feat: módulo ganha tecnologia (mono/bifacial) e largura no catálogo"
```

---

## Task 2: Inversor — MPPTs

**Files:**
- Modify: `src/types/firestore.ts`
- Modify: `src/features/catalog/catalogSchema.ts`
- Modify: `src/features/catalog/catalogDisplay.ts`
- Test: `src/features/catalog/catalogSchema.test.ts`

**Interfaces:**
- Consumes: nada de tasks anteriores.
- Produces: `CatalogItemInversor.mppts: number | null`.

- [ ] **Step 1: Escrever o teste que falha**

Em `src/features/catalog/catalogSchema.test.ts`, adicione:

```ts

  it('inversor aceita mppts nulo ou preenchido', () => {
    const semMppts = validarCatalogItem({ ...defaultCatalogItemInput('inversor'), marca: 'Sofar', potenciaKw: 5 })
    expect(semMppts).toEqual({})
    const comMppts = validarCatalogItem({ ...defaultCatalogItemInput('inversor'), marca: 'Sofar', potenciaKw: 4, mppts: 1 })
    expect(comMppts).toEqual({})
  })
```

- [ ] **Step 2: Rodar o teste e confirmar que falha**

Run: `npx vitest run src/features/catalog/catalogSchema.test.ts`
Expected: FAIL — `mppts` não existe no tipo `CatalogItemInput` ainda.

- [ ] **Step 3: Adicionar o campo em `firestore.ts`**

Em `CatalogItemInversor`, adicione `mppts: number | null` depois de `garantiaAnos`:

```ts
export interface CatalogItemInversor extends CatalogItemBase {
  categoria: 'inversor'
  unidade: 'un'
  marca: string
  tipo: TipoInversor
  potenciaKw: number
  fase: Ligacao
  monitoramentoWifi: boolean
  garantiaAnos: number | null
  mppts: number | null
}
```

- [ ] **Step 4: Atualizar `catalogSchema.ts`**

Em `inversorSchema`, adicione a linha `mppts: z.number().int().positive().nullable(),` logo depois de `garantiaAnos`:

```ts
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
```

- [ ] **Step 5: Atualizar `catalogDisplay.ts`**

Em `PADROES.inversor`, adicione `mppts: null,`:

```ts
  inversor: { categoria: 'inversor', unidade: 'un', marca: '', tipo: 'string', potenciaKw: 0, fase: 'mono', monitoramentoWifi: false, garantiaAnos: null, mppts: null, custoUnitario: 0, ativo: true },
```

(`gerarNomeCatalogItem`/`especificacaoCatalogItem` para inversor não mudam — MPPTs é só informativo, não entra no nome/especificação.)

- [ ] **Step 6: Rodar o teste e confirmar que passa**

Run: `npx vitest run src/features/catalog/catalogSchema.test.ts`
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add src/types/firestore.ts src/features/catalog/catalogSchema.ts src/features/catalog/catalogDisplay.ts src/features/catalog/catalogSchema.test.ts
git commit -m "feat: inversor ganha campo opcional de MPPTs"
```

---

## Task 3: Cabo — cor, apresentação e custoPorMetro

**Files:**
- Modify: `src/types/firestore.ts`
- Modify: `src/features/catalog/catalogLabels.ts`
- Modify: `src/features/catalog/catalogSchema.ts`
- Modify: `src/features/catalog/catalogDisplay.ts`
- Test: `src/features/catalog/catalogDisplay.test.ts`, `src/features/catalog/catalogSchema.test.ts`

**Interfaces:**
- Produces: `CorCabo`, `ApresentacaoCabo` em `firestore.ts`; `CatalogItemCabo.{cor,apresentacao,metrosPorRolo,custoPorMetro}`; `COR_CABO_LABELS`, `APRESENTACAO_CABO_LABELS` em `catalogLabels.ts`; `calcularCustoPorMetro(input): number` exportada de `catalogDisplay.ts` — usada pela camada de dados (Task 8 em diante) para persistir `custoPorMetro`.
- `custoPorMetro` fica **fora** de `CatalogItemInput` (é derivado, como `nome`) — os dois `type CatalogItemInput = DistributiveOmit<...>` (em `catalogDisplay.ts` e em `src/lib/data/catalog.ts`) precisam excluir `'custoPorMetro'`.

- [ ] **Step 1: Escrever os testes que falham**

Em `src/features/catalog/catalogDisplay.test.ts`, dentro de `describe('gerarNomeCatalogItem', ...)`, substitua o teste `it('cabo', ...)` por:

```ts
  it('cabo comprado em rolo', () => {
    const input = { ...defaultCatalogItemInput('cabo'), tipo: 'cc_solar' as const, bitolaMm2: 4 as const, cor: 'preto' as const, apresentacao: 'rolo' as const, metrosPorRolo: 25 }
    expect(gerarNomeCatalogItem(input)).toBe('Cabo solar CC 4 mm² 1 kV preto · rolo 25 m')
  })

  it('cabo comprado por metro não mostra sufixo de rolo', () => {
    const input = { ...defaultCatalogItemInput('cabo'), tipo: 'cc_solar' as const, bitolaMm2: 6 as const, cor: 'vermelho' as const, apresentacao: 'metro' as const }
    expect(gerarNomeCatalogItem(input)).toBe('Cabo solar CC 6 mm² 1 kV vermelho')
  })

  it('cabo CA não mostra "1 kV"', () => {
    const input = { ...defaultCatalogItemInput('cabo'), tipo: 'ca' as const, bitolaMm2: 10 as const, cor: 'outro' as const, apresentacao: 'metro' as const }
    expect(gerarNomeCatalogItem(input)).toBe('Cabo solar CA 10 mm² outro')
  })
```

No mesmo arquivo, dentro de `describe('especificacaoCatalogItem', ...)`, atualize o objeto do teste `it('cabo mostra a bitola', ...)` para incluir os campos novos:

```ts
  it('cabo mostra a bitola', () => {
    const item: CatalogItem = comBase({
      categoria: 'cabo',
      unidade: 'm',
      tipo: 'cc_solar',
      bitolaMm2: 6,
      cor: 'preto',
      apresentacao: 'metro',
      metrosPorRolo: null,
      custoPorMetro: 4,
      custoUnitario: 4,
      ativo: true,
    })
    expect(especificacaoCatalogItem(item)).toBe('6 mm²')
  })
```

Dentro de `describe('unidadeDisplay', ...)`, atualize `it('cabo é medido em metros', ...)`:

```ts
  it('cabo é medido em metros', () => {
    const item: CatalogItem = comBase({ categoria: 'cabo', unidade: 'm', tipo: 'ca', bitolaMm2: 4, cor: 'preto', apresentacao: 'metro', metrosPorRolo: null, custoPorMetro: 3, custoUnitario: 3, ativo: true })
    expect(unidadeDisplay(item)).toBe('metros')
  })
```

Ao final do arquivo, adicione um novo `describe`:

```ts

describe('calcularCustoPorMetro', () => {
  it('apresentação por metro: custoPorMetro = custoUnitario', () => {
    expect(calcularCustoPorMetro({ apresentacao: 'metro', custoUnitario: 3.5, metrosPorRolo: null })).toBeCloseTo(3.5, 5)
  })

  it('apresentação por rolo: custoPorMetro = custoUnitario / metrosPorRolo', () => {
    expect(calcularCustoPorMetro({ apresentacao: 'rolo', custoUnitario: 87.5, metrosPorRolo: 25 })).toBeCloseTo(3.5, 5)
  })

  it('rolo sem metrosPorRolo válido retorna 0', () => {
    expect(calcularCustoPorMetro({ apresentacao: 'rolo', custoUnitario: 87.5, metrosPorRolo: null })).toBe(0)
  })
})
```

E adicione `calcularCustoPorMetro` ao import no topo do arquivo:

```ts
import { defaultCatalogItemInput, especificacaoCatalogItem, gerarNomeCatalogItem, unidadeDisplay, calcularCustoPorMetro } from './catalogDisplay'
```

Em `src/features/catalog/catalogSchema.test.ts`, adicione:

```ts

  it('cabo em rolo sem metrosPorRolo gera erro', () => {
    const erros = validarCatalogItem({ ...defaultCatalogItemInput('cabo'), apresentacao: 'rolo', metrosPorRolo: null, custoUnitario: 80 })
    expect(erros.metrosPorRolo).toBeTruthy()
  })

  it('cabo por metro não exige metrosPorRolo', () => {
    const erros = validarCatalogItem({ ...defaultCatalogItemInput('cabo'), apresentacao: 'metro', metrosPorRolo: null, custoUnitario: 3.5 })
    expect(erros.metrosPorRolo).toBeUndefined()
  })
```

- [ ] **Step 2: Rodar os testes e confirmar que falham**

Run: `npx vitest run src/features/catalog/catalogDisplay.test.ts src/features/catalog/catalogSchema.test.ts`
Expected: FAIL (tipos/campos ainda não existem).

- [ ] **Step 3: Adicionar os campos em `firestore.ts`**

Acima de `CatalogItemCabo`, adicione:

```ts
export type CorCabo = 'preto' | 'vermelho' | 'outro'
export type ApresentacaoCabo = 'metro' | 'rolo'
```

Substitua `CatalogItemCabo`:

```ts
export interface CatalogItemCabo extends CatalogItemBase {
  categoria: 'cabo'
  unidade: 'm'
  tipo: TipoCabo
  bitolaMm2: BitolaCaboMm2
  cor: CorCabo
  apresentacao: ApresentacaoCabo
  metrosPorRolo: number | null
  custoPorMetro: number
}
```

- [ ] **Step 4: Adicionar os rótulos em `catalogLabels.ts`**

Adicione `ApresentacaoCabo` e `CorCabo` ao import de tipos, e os dois `Record`s abaixo de `TIPO_CABO_LABELS`:

```ts
export const COR_CABO_LABELS: Record<CorCabo, string> = {
  preto: 'Preto',
  vermelho: 'Vermelho',
  outro: 'Outro',
}

export const APRESENTACAO_CABO_LABELS: Record<ApresentacaoCabo, string> = {
  metro: 'Metro',
  rolo: 'Rolo',
}
```

Também troque a linha de `UNIDADE_CATEGORIA_LABELS` — o custo do cabo agora depende da apresentação, então ele sai desse mapa de rótulo fixo (o formulário mostra um hint dinâmico em vez do banner, feito na Task 6):

```ts
export const UNIDADE_CATEGORIA_LABELS: Record<Exclude<CategoriaCatalogo, 'outro' | 'cabo'>, string> = {
  modulo: 'por unidade',
  inversor: 'por unidade',
  estrutura: 'por módulo',
  mc4: 'por par',
  stringbox: 'por unidade',
  protecao: 'por unidade',
}
```

- [ ] **Step 5: Atualizar `catalogSchema.ts`**

Substitua `caboSchema`:

```ts
const caboSchema = z.object({
  categoria: z.literal('cabo'),
  unidade: z.literal('m'),
  tipo: z.enum(['cc_solar', 'ca']),
  bitolaMm2: z.union(BITOLAS_CABO.map((b) => z.literal(b)) as [z.ZodLiteral<number>, z.ZodLiteral<number>, ...z.ZodLiteral<number>[]]),
  cor: z.enum(['preto', 'vermelho', 'outro']),
  apresentacao: z.enum(['metro', 'rolo']),
  metrosPorRolo: z.number().positive().nullable(),
  ...base,
})
```

E, no final do arquivo, troque a montagem do `catalogItemSchema` para incluir uma validação cruzada (Zod não permite `.superRefine` dentro de um branch de `z.discriminatedUnion` — o refino tem que ficar no nível do union inteiro):

```ts
export const catalogItemSchema = z.discriminatedUnion('categoria', [
  moduloSchema,
  inversorSchema,
  estruturaSchema,
  caboSchema,
  mc4Schema,
  stringboxSchema,
  protecaoSchema,
  outroSchema,
]).superRefine((val, ctx) => {
  if (val.categoria === 'cabo' && val.apresentacao === 'rolo' && (!val.metrosPorRolo || val.metrosPorRolo <= 0)) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['metrosPorRolo'], message: 'Informe os metros por rolo' })
  }
})
```

- [ ] **Step 6: Atualizar `catalogDisplay.ts`**

No topo do arquivo, importe `COR_CABO_LABELS`... na verdade não é necessário — o nome usa `input.cor` cru (já é a palavra em português minúscula). Importe só o que falta; `ApresentacaoCabo` não precisa de import porque não é usado por nome explícito no arquivo.

Em `PADROES.cabo`, adicione os campos novos (sem `custoPorMetro` — ele é derivado, fica fora de `CatalogItemInput`):

```ts
  cabo: { categoria: 'cabo', unidade: 'm', tipo: 'cc_solar', bitolaMm2: 6, cor: 'preto', apresentacao: 'metro', metrosPorRolo: null, custoUnitario: 0, ativo: true },
```

Troque a linha 5 (`export type CatalogItemInput = ...`) para excluir `custoPorMetro`:

```ts
export type CatalogItemInput = DistributiveOmit<CatalogItem, 'id' | 'nome' | 'criadoEm' | 'atualizadoEm' | 'custoPorMetro'>
```

Em `gerarNomeCatalogItem`, troque o `case 'cabo':`:

```ts
    case 'cabo': {
      const kv = input.tipo === 'cc_solar' ? ' 1 kV' : ''
      const rolo = input.apresentacao === 'rolo' && input.metrosPorRolo ? ` · rolo ${input.metrosPorRolo} m` : ''
      return `Cabo solar ${TIPO_CABO_LABELS[input.tipo]} ${input.bitolaMm2} mm²${kv} ${input.cor}${rolo}`
    }
```

Ao final do arquivo, adicione a função derivada:

```ts

/** custoPorMetro do cabo — sempre derivado, nunca digitado: preço por metro direto, ou preço do
 * rolo dividido pelos metros do rolo. */
export function calcularCustoPorMetro(input: { apresentacao: ApresentacaoCabo; custoUnitario: number; metrosPorRolo: number | null }): number {
  if (input.apresentacao === 'metro') return input.custoUnitario
  if (!input.metrosPorRolo || input.metrosPorRolo <= 0) return 0
  return input.custoUnitario / input.metrosPorRolo
}
```

E importe `ApresentacaoCabo` no topo do arquivo junto com os outros tipos de `@/types/firestore`.

- [ ] **Step 7: Rodar os testes e confirmar que passam**

Run: `npx vitest run src/features/catalog/catalogDisplay.test.ts src/features/catalog/catalogSchema.test.ts`
Expected: PASS

- [ ] **Step 8: Commit**

```bash
git add src/types/firestore.ts src/features/catalog/catalogLabels.ts src/features/catalog/catalogSchema.ts src/features/catalog/catalogDisplay.ts src/features/catalog/catalogDisplay.test.ts src/features/catalog/catalogSchema.test.ts
git commit -m "feat: cabo ganha cor, apresentação (metro/rolo) e custoPorMetro derivado"
```

---

## Task 4: Componente de estrutura — tipoPeca, formaVenda e normalização de legado

**Files:**
- Modify: `src/types/firestore.ts`
- Modify: `src/features/catalog/catalogLabels.ts`
- Modify: `src/features/catalog/catalogSchema.ts`
- Modify: `src/features/catalog/catalogDisplay.ts`
- Test: `src/features/catalog/catalogDisplay.test.ts`, `src/features/catalog/catalogSchema.test.ts`

**Interfaces:**
- Produces: `TipoPecaEstrutura`, `FormaVendaEstrutura` em `firestore.ts`; `CatalogItemEstrutura.{tipoPeca,tipoTelhado,medida,formaVenda,pecasPorPacote}`; `TIPOS_PECA_ESTRUTURA`, `TIPO_PECA_ESTRUTURA_LABELS`, `FORMA_VENDA_LABELS` em `catalogLabels.ts`; `normalizarCatalogItem(raw): CatalogItem` exportada de `catalogDisplay.ts` (usada por `src/lib/data/catalog.ts` na Task 14).

- [ ] **Step 1: Escrever os testes que falham**

Em `src/features/catalog/catalogDisplay.test.ts`, dentro de `describe('gerarNomeCatalogItem', ...)`, substitua o teste `it('estrutura', ...)` por:

```ts
  it('componente de estrutura: perfil', () => {
    const input = { ...defaultCatalogItemInput('estrutura'), tipoPeca: 'perfil' as const, formaVenda: 'barra' as const, medida: '2,4 m' }
    expect(gerarNomeCatalogItem(input)).toBe('Perfil de alumínio 2,4 m')
  })

  it('componente de estrutura: suporte hook em fibrocimento usa rótulo especial', () => {
    const input = { ...defaultCatalogItemInput('estrutura'), tipoPeca: 'suporte_hook' as const, tipoTelhado: 'fibrocimento' as const, medida: '25 cm', formaVenda: 'pacote' as const, pecasPorPacote: 4 }
    expect(gerarNomeCatalogItem(input)).toBe('Suporte hook fibrocimento/madeira 25 cm · pct 4')
  })

  it('componente de estrutura: grampo intermediário', () => {
    const input = { ...defaultCatalogItemInput('estrutura'), tipoPeca: 'grampo_intermediario' as const, medida: '35 mm', formaVenda: 'pacote' as const, pecasPorPacote: 4 }
    expect(gerarNomeCatalogItem(input)).toBe('Grampo intermediário 35 mm · pct 4')
  })

  it('componente de estrutura: telhado diferente de fibrocimento usa o rótulo padrão', () => {
    const input = { ...defaultCatalogItemInput('estrutura'), tipoPeca: 'suporte_hook' as const, tipoTelhado: 'ceramico' as const, medida: '20 cm', formaVenda: 'pacote' as const, pecasPorPacote: 6 }
    expect(gerarNomeCatalogItem(input)).toBe('Suporte hook cerâmico 20 cm · pct 6')
  })
```

Dentro de `describe('especificacaoCatalogItem', ...)`, adicione:

```ts

  it('componente de estrutura combina telhado e medida', () => {
    const item: CatalogItem = comBase({
      categoria: 'estrutura', unidade: 'pacote', marca: '', tipoPeca: 'suporte_hook', tipoTelhado: 'fibrocimento',
      medida: '25 cm', formaVenda: 'pacote', pecasPorPacote: 4, custoUnitario: 12, ativo: true,
    })
    expect(especificacaoCatalogItem(item)).toBe('telhado fibrocimento · 25 cm')
  })

  it('componente de estrutura sem telhado nem medida retorna vazio', () => {
    const item: CatalogItem = comBase({
      categoria: 'estrutura', unidade: 'pacote', marca: '', tipoPeca: 'chapa_aterramento', tipoTelhado: null,
      medida: '', formaVenda: 'pacote', pecasPorPacote: 4, custoUnitario: 3, ativo: true,
    })
    expect(especificacaoCatalogItem(item)).toBe('')
  })
```

Dentro de `describe('unidadeDisplay', ...)`, adicione:

```ts

  it('componente de estrutura vendido em barra', () => {
    const item: CatalogItem = comBase({ categoria: 'estrutura', unidade: 'barra', marca: '', tipoPeca: 'perfil', tipoTelhado: null, medida: '2,4 m', formaVenda: 'barra', pecasPorPacote: null, custoUnitario: 30, ativo: true })
    expect(unidadeDisplay(item)).toBe('barras')
  })

  it('componente de estrutura vendido em pacote', () => {
    const item: CatalogItem = comBase({ categoria: 'estrutura', unidade: 'pacote', marca: '', tipoPeca: 'grampo_terminal', tipoTelhado: null, medida: '', formaVenda: 'pacote', pecasPorPacote: 4, custoUnitario: 8, ativo: true })
    expect(unidadeDisplay(item)).toBe('pacotes')
  })
```

Ao final do arquivo, adicione (e importe `normalizarCatalogItem` no topo, junto com os outros):

```ts

describe('normalizarCatalogItem', () => {
  it('trata documento antigo de estrutura (sem tipoPeca) como kit_completo', () => {
    const legado = comBase({
      categoria: 'estrutura',
      unidade: 'modulo',
      marca: 'Romagnole',
      tipoTelhado: 'ceramico',
      custoUnitario: 120,
      ativo: true,
    })
    expect(normalizarCatalogItem(legado)).toMatchObject({
      categoria: 'estrutura',
      tipoPeca: 'kit_completo',
      tipoTelhado: 'ceramico',
      medida: '',
      formaVenda: 'unidade',
      pecasPorPacote: null,
      unidade: 'un',
    })
  })

  it('não mexe em um documento de estrutura que já tem tipoPeca', () => {
    const novo = comBase({
      categoria: 'estrutura', unidade: 'barra', marca: '', tipoPeca: 'perfil', tipoTelhado: null,
      medida: '2,4 m', formaVenda: 'barra', pecasPorPacote: null, custoUnitario: 30, ativo: true,
    })
    expect(normalizarCatalogItem(novo)).toEqual(novo)
  })

  it('não mexe em outras categorias', () => {
    const modulo = comBase({ categoria: 'modulo', unidade: 'un', marca: 'X', potenciaWp: 550, areaM2: null, larguraM: null, tecnologia: null, garantiaProdutoAnos: null, garantiaPerformanceAnos: null, custoUnitario: 700, ativo: true })
    expect(normalizarCatalogItem(modulo)).toEqual(modulo)
  })
})
```

Em `src/features/catalog/catalogSchema.test.ts`, adicione:

```ts

  it('componente de estrutura vendido em pacote sem pecasPorPacote gera erro', () => {
    const erros = validarCatalogItem({ ...defaultCatalogItemInput('estrutura'), formaVenda: 'pacote', pecasPorPacote: null, custoUnitario: 8 })
    expect(erros.pecasPorPacote).toBeTruthy()
  })

  it('componente de estrutura vendido em barra não exige pecasPorPacote', () => {
    const erros = validarCatalogItem({ ...defaultCatalogItemInput('estrutura'), formaVenda: 'barra', pecasPorPacote: null, custoUnitario: 30 })
    expect(erros.pecasPorPacote).toBeUndefined()
  })
```

- [ ] **Step 2: Rodar os testes e confirmar que falham**

Run: `npx vitest run src/features/catalog/catalogDisplay.test.ts src/features/catalog/catalogSchema.test.ts`
Expected: FAIL

- [ ] **Step 3: Adicionar os campos em `firestore.ts`**

Acima de `CatalogItemEstrutura`, adicione:

```ts
export type TipoPecaEstrutura =
  | 'perfil' | 'suporte_hook' | 'grampo_intermediario' | 'grampo_terminal'
  | 'emenda_perfil' | 'chapa_aterramento' | 'grampo_aterramento' | 'kit_completo' | 'outro'

export type FormaVendaEstrutura = 'unidade' | 'pacote' | 'barra'
```

Substitua `CatalogItemEstrutura`:

```ts
export interface CatalogItemEstrutura extends CatalogItemBase {
  categoria: 'estrutura'
  unidade: 'un' | 'pacote' | 'barra'
  marca: string
  tipoPeca: TipoPecaEstrutura
  tipoTelhado: TipoTelhado | null
  medida: string
  formaVenda: FormaVendaEstrutura
  pecasPorPacote: number | null
}
```

- [ ] **Step 4: Adicionar os rótulos em `catalogLabels.ts`**

Adicione `TipoPecaEstrutura` e `FormaVendaEstrutura` ao import de tipos, e ao final do arquivo:

```ts

export const TIPOS_PECA_ESTRUTURA: TipoPecaEstrutura[] = [
  'perfil', 'suporte_hook', 'grampo_intermediario', 'grampo_terminal',
  'emenda_perfil', 'chapa_aterramento', 'grampo_aterramento', 'kit_completo', 'outro',
]

export const TIPO_PECA_ESTRUTURA_LABELS: Record<TipoPecaEstrutura, string> = {
  perfil: 'Perfil de alumínio',
  suporte_hook: 'Suporte hook',
  grampo_intermediario: 'Grampo intermediário',
  grampo_terminal: 'Grampo terminal',
  emenda_perfil: 'Emenda de perfil',
  chapa_aterramento: 'Chapa de aterramento',
  grampo_aterramento: 'Grampo de aterramento',
  kit_completo: 'Kit completo',
  outro: 'Outro',
}

export const FORMA_VENDA_LABELS: Record<FormaVendaEstrutura, string> = {
  unidade: 'Unidade',
  pacote: 'Pacote',
  barra: 'Barra',
}
```

E remova `estrutura` de `UNIDADE_CATEGORIA_LABELS` (o custo agora depende da forma de venda, mostrada como hint dinâmico na Task 6):

```ts
export const UNIDADE_CATEGORIA_LABELS: Record<Exclude<CategoriaCatalogo, 'outro' | 'cabo' | 'estrutura'>, string> = {
  modulo: 'por unidade',
  inversor: 'por unidade',
  mc4: 'por par',
  stringbox: 'por unidade',
  protecao: 'por unidade',
}
```

- [ ] **Step 5: Atualizar `catalogSchema.ts`**

Substitua `estruturaSchema`:

```ts
const estruturaSchema = z.object({
  categoria: z.literal('estrutura'),
  unidade: z.enum(['un', 'pacote', 'barra']),
  marca: z.string(),
  tipoPeca: z.enum(['perfil', 'suporte_hook', 'grampo_intermediario', 'grampo_terminal', 'emenda_perfil', 'chapa_aterramento', 'grampo_aterramento', 'kit_completo', 'outro']),
  tipoTelhado: z.enum(['ceramico', 'fibrocimento', 'metalico', 'laje', 'solo']).nullable(),
  medida: z.string(),
  formaVenda: z.enum(['unidade', 'pacote', 'barra']),
  pecasPorPacote: z.number().int().positive().nullable(),
  ...base,
})
```

E amplie o `.superRefine` adicionado na Task 3:

```ts
export const catalogItemSchema = z.discriminatedUnion('categoria', [
  moduloSchema,
  inversorSchema,
  estruturaSchema,
  caboSchema,
  mc4Schema,
  stringboxSchema,
  protecaoSchema,
  outroSchema,
]).superRefine((val, ctx) => {
  if (val.categoria === 'cabo' && val.apresentacao === 'rolo' && (!val.metrosPorRolo || val.metrosPorRolo <= 0)) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['metrosPorRolo'], message: 'Informe os metros por rolo' })
  }
  if (val.categoria === 'estrutura' && val.formaVenda === 'pacote' && (!val.pecasPorPacote || val.pecasPorPacote <= 0)) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['pecasPorPacote'], message: 'Informe quantas peças por pacote' })
  }
})
```

- [ ] **Step 6: Atualizar `catalogDisplay.ts`**

Importe `TIPO_PECA_ESTRUTURA_LABELS` de `./catalogLabels` no topo do arquivo (junto aos outros imports de labels).

Em `PADROES.estrutura`, troque para:

```ts
  estrutura: { categoria: 'estrutura', unidade: 'un', marca: '', tipoPeca: 'perfil', tipoTelhado: null, medida: '', formaVenda: 'unidade', pecasPorPacote: null, custoUnitario: 0, ativo: true },
```

Em `gerarNomeCatalogItem`, troque o `case 'estrutura':`:

```ts
    case 'estrutura': {
      const label = TIPO_PECA_ESTRUTURA_LABELS[input.tipoPeca]
      const telhado =
        input.tipoPeca === 'suporte_hook' && input.tipoTelhado === 'fibrocimento'
          ? ' fibrocimento/madeira'
          : input.tipoTelhado
            ? ` ${TIPO_TELHADO_LABELS[input.tipoTelhado].toLowerCase()}`
            : ''
      const medida = input.medida ? ` ${input.medida}` : ''
      const pacote = input.formaVenda === 'pacote' && input.pecasPorPacote ? ` · pct ${input.pecasPorPacote}` : ''
      return `${label}${telhado}${medida}${pacote}`
    }
```

Em `especificacaoCatalogItem`, troque o `case 'estrutura':`:

```ts
    case 'estrutura': {
      const partes: string[] = []
      if (item.tipoTelhado) partes.push(`telhado ${TIPO_TELHADO_LABELS[item.tipoTelhado].toLowerCase()}`)
      if (item.medida) partes.push(item.medida)
      return partes.join(' · ')
    }
```

Em `unidadeDisplay`, adicione um `case 'estrutura':` antes do `default:`:

```ts
    case 'estrutura':
      return item.unidade === 'pacote' ? 'pacotes' : item.unidade === 'barra' ? 'barras' : 'unidades'
```

Ao final do arquivo, adicione a normalização de legado:

```ts

/** Documentos antigos da categoria 'estrutura' não têm tipoPeca (formato pré-reforma do
 * catálogo). Normaliza em memória para tipoPeca='kit_completo', sem tocar no Firestore — se o
 * item for reaberto e salvo, passa a gravar no formato novo. */
export function normalizarCatalogItem(raw: CatalogItem): CatalogItem {
  if (raw.categoria === 'estrutura' && !('tipoPeca' in raw)) {
    return {
      ...raw,
      tipoPeca: 'kit_completo',
      tipoTelhado: (raw as { tipoTelhado?: TipoTelhado }).tipoTelhado ?? null,
      medida: '',
      formaVenda: 'unidade',
      pecasPorPacote: null,
      unidade: 'un',
    }
  }
  return raw
}
```

Importe `TipoTelhado` no topo do arquivo (junto aos outros tipos de `@/types/firestore`) se ainda não estiver importado.

- [ ] **Step 7: Rodar os testes e confirmar que passam**

Run: `npx vitest run src/features/catalog/catalogDisplay.test.ts src/features/catalog/catalogSchema.test.ts`
Expected: PASS

- [ ] **Step 8: Commit**

```bash
git add src/types/firestore.ts src/features/catalog/catalogLabels.ts src/features/catalog/catalogSchema.ts src/features/catalog/catalogDisplay.ts src/features/catalog/catalogDisplay.test.ts src/features/catalog/catalogSchema.test.ts
git commit -m "feat: reformula estrutura em componentes tipados (tipoPeca/formaVenda) com normalização de legado"
```

---

## Task 5: CalcSettings — largura padrão do módulo e espaçamento do hook

**Files:**
- Modify: `src/types/firestore.ts`
- Modify: `src/lib/data/settings.ts`
- Modify: `src/features/settings/CalcForm.tsx`

**Interfaces:**
- Produces: `CalcSettings.{larguraModuloPadraoM, espacamentoHookM}` — consumidos pelo dispatcher da Task 12.

- [ ] **Step 1: Adicionar os campos em `firestore.ts`**

Em `CalcSettings`, adicione as duas linhas no final (antes do `proximoNumero`):

```ts
export interface CalcSettings {
  produtividadeKwhKwpAno: number
  distribuicaoMensal: number[]
  tarifaKwh: number
  fioBKwh: number
  fioBPercentualPorAno: Record<string, number>
  fatorSimultaneidade: number
  custoDisponibilidadeKwh: Record<Ligacao, number>
  iluminacaoPublica: number
  reajusteConservador: number
  reajusteOtimista: number
  degradacaoAnual: number
  horizonteAnos: number
  taxaCartaoMensal: number
  parcelasCartao: number
  taxaFinanciamentoMensal: number
  parcelasFinanciamento: number
  aliquotaSimples: number
  comissaoPadrao: number
  margemPadrao: number
  larguraModuloPadraoM: number
  espacamentoHookM: number
  proximoNumero: number
}
```

- [ ] **Step 2: Atualizar o valor padrão em `settings.ts`**

Em `DEFAULT_CALC`, adicione as duas linhas antes de `proximoNumero: 1,`:

```ts
  margemPadrao: 0.25,
  larguraModuloPadraoM: 1.15,
  espacamentoHookM: 1.2,
  proximoNumero: 1,
```

- [ ] **Step 3: Adicionar os campos em `CalcForm.tsx`**

Adicione uma nova `<section>` em `src/features/settings/CalcForm.tsx`, logo depois da seção "Comercial" e antes do `<Button variant="primary" ...>` final:

```tsx
      <section>
        <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-muted">Estrutura</h3>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <Input
            label="Largura padrão do módulo"
            type="number"
            step="0.01"
            suffix="m"
            value={form.larguraModuloPadraoM}
            onChange={(e) => set('larguraModuloPadraoM', Number(e.target.value))}
          />
          <Input
            label="Espaçamento do hook"
            type="number"
            step="0.1"
            suffix="m"
            value={form.espacamentoHookM}
            onChange={(e) => set('espacamentoHookM', Number(e.target.value))}
          />
        </div>
      </section>
```

- [ ] **Step 4: Verificar que o projeto compila**

Run: `npx tsc --noEmit`
Expected: sem erros novos relacionados a `CalcSettings`, `settings.ts` ou `CalcForm.tsx`.

- [ ] **Step 5: Commit**

```bash
git add src/types/firestore.ts src/lib/data/settings.ts src/features/settings/CalcForm.tsx
git commit -m "feat: configurações ganham largura padrão do módulo e espaçamento do hook"
```

---

## Task 6: CatalogItemSheet — formulário atualizado

**Files:**
- Modify: `src/features/catalog/CatalogItemSheet.tsx`

**Interfaces:**
- Consumes: todos os tipos/campos/labels das Tasks 1–4 (`TECNOLOGIA_MODULO_LABELS`, `COR_CABO_LABELS`, `APRESENTACAO_CABO_LABELS`, `TIPOS_PECA_ESTRUTURA`, `TIPO_PECA_ESTRUTURA_LABELS`, `FORMA_VENDA_LABELS`).
- Sem testes (componente React — ver Global Constraints). Verificado por `tsc --noEmit` + smoke manual na Task 15.

- [ ] **Step 1: Atualizar os imports**

No topo de `src/features/catalog/CatalogItemSheet.tsx`, troque o import de `./catalogLabels`:

```ts
import {
  APRESENTACAO_CABO_LABELS,
  BITOLAS_CABO,
  CATEGORIAS,
  CATEGORIA_LABELS,
  COR_CABO_LABELS,
  FASE_LABELS,
  FORMA_VENDA_LABELS,
  TECNOLOGIA_MODULO_LABELS,
  TIPOS_PECA_ESTRUTURA,
  TIPO_CABO_LABELS,
  TIPO_INVERSOR_LABELS,
  TIPO_PECA_ESTRUTURA_LABELS,
  TIPO_PROTECAO_LABELS,
  TIPO_TELHADO_LABELS,
  UNIDADE_CATEGORIA_LABELS,
} from './catalogLabels'
```

- [ ] **Step 2: Atualizar o banner de "Unidade de custo"**

Troque a condição do banner (agora `cabo` e `estrutura` também ficam de fora, porque o custo deles passou a depender de um campo variável — cabo mostra hint dinâmico no próprio campo de custo, estrutura já mostra a forma de venda no formulário):

```tsx
        {form.categoria !== 'outro' && form.categoria !== 'cabo' && form.categoria !== 'estrutura' && (
          <div className="rounded-field bg-chip px-4 py-2.5 text-sm font-semibold text-graphite">
            Unidade de custo: {UNIDADE_CATEGORIA_LABELS[form.categoria]}
          </div>
        )}
```

- [ ] **Step 3: Adicionar largura e tecnologia ao bloco de módulo**

No bloco `{form.categoria === 'modulo' && (...)}`, depois do grid de garantias, adicione:

```tsx
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <DecimalInput label="Largura do módulo (m)" suffix="m" hint="Opcional — usada no cálculo de perfis de estrutura" value={form.larguraM} onChange={(v) => set('larguraM', v)} error={erros.larguraM} />
              <Select
                label="Tecnologia"
                value={form.tecnologia ?? ''}
                onChange={(e) => set('tecnologia', e.target.value || null)}
                options={[{ value: '', label: 'Não informado' }, ...Object.entries(TECNOLOGIA_MODULO_LABELS).map(([value, label]) => ({ value, label }))]}
              />
            </div>
```

- [ ] **Step 4: Adicionar MPPTs ao bloco de inversor**

No bloco `{form.categoria === 'inversor' && (...)}`, antes do `<Switch label="Monitoramento Wi-Fi" .../>`, adicione:

```tsx
            <DecimalInput label="MPPTs" integer hint="Opcional" value={form.mppts} onChange={(v) => set('mppts', v)} />
```

- [ ] **Step 5: Reescrever o bloco de cabo**

Substitua o bloco `{form.categoria === 'cabo' && (...)}` inteiro por:

```tsx
        {form.categoria === 'cabo' && (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Select label="Tipo" value={form.tipo} onChange={(e) => set('tipo', e.target.value as typeof form.tipo)} options={Object.entries(TIPO_CABO_LABELS).map(([value, label]) => ({ value, label }))} />
              <Select
                label="Bitola"
                value={String(form.bitolaMm2)}
                onChange={(e) => set('bitolaMm2', Number(e.target.value) as typeof form.bitolaMm2)}
                options={BITOLAS_CABO.map((b) => ({ value: String(b), label: `${b} mm²` }))}
              />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Select label="Cor" value={form.cor} onChange={(e) => set('cor', e.target.value as typeof form.cor)} options={Object.entries(COR_CABO_LABELS).map(([value, label]) => ({ value, label }))} />
              <Select
                label="Apresentação"
                value={form.apresentacao}
                onChange={(e) => set('apresentacao', e.target.value as typeof form.apresentacao)}
                options={Object.entries(APRESENTACAO_CABO_LABELS).map(([value, label]) => ({ value, label }))}
              />
            </div>
            {form.apresentacao === 'rolo' && (
              <DecimalInput label="Metros por rolo" integer suffix="m" value={form.metrosPorRolo} onChange={(v) => set('metrosPorRolo', v)} error={erros.metrosPorRolo} />
            )}
          </>
        )}
```

- [ ] **Step 6: Reescrever o bloco de estrutura**

Substitua o bloco `{form.categoria === 'estrutura' && (...)}` inteiro por:

```tsx
        {form.categoria === 'estrutura' && (
          <>
            <Select
              label="Peça"
              value={form.tipoPeca}
              onChange={(e) => set('tipoPeca', e.target.value as typeof form.tipoPeca)}
              options={TIPOS_PECA_ESTRUTURA.map((t) => ({ value: t, label: TIPO_PECA_ESTRUTURA_LABELS[t] }))}
            />
            <Input label="Marca" hint="Opcional" value={form.marca} onChange={(e) => set('marca', e.target.value)} />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Select
                label="Tipo de telhado"
                value={form.tipoTelhado ?? ''}
                onChange={(e) => set('tipoTelhado', e.target.value || null)}
                options={[{ value: '', label: 'Não se aplica' }, ...Object.entries(TIPO_TELHADO_LABELS).map(([value, label]) => ({ value, label }))]}
              />
              <Input label="Medida" hint="Opcional — ex.: 2,4 m, 35 mm" value={form.medida} onChange={(e) => set('medida', e.target.value)} />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Select
                label="Forma de venda"
                value={form.formaVenda}
                onChange={(e) => set('formaVenda', e.target.value as typeof form.formaVenda)}
                options={Object.entries(FORMA_VENDA_LABELS).map(([value, label]) => ({ value, label }))}
              />
              {form.formaVenda === 'pacote' && (
                <DecimalInput label="Peças por pacote" integer value={form.pecasPorPacote} onChange={(v) => set('pecasPorPacote', v)} error={erros.pecasPorPacote} />
              )}
            </div>
          </>
        )}
```

- [ ] **Step 7: Hint dinâmico no custo unitário**

Troque o `<MoneyInput label="Custo unitário" .../>` final por:

```tsx
        <MoneyInput
          label="Custo unitário"
          value={form.custoUnitario}
          onChange={(v) => set('custoUnitario', v)}
          error={erros.custoUnitario}
          hint={
            form.categoria === 'cabo'
              ? form.apresentacao === 'rolo'
                ? 'Preço do rolo'
                : 'Preço por metro'
              : form.categoria === 'estrutura'
                ? `Preço por ${FORMA_VENDA_LABELS[form.formaVenda].toLowerCase()}`
                : undefined
          }
        />
```

- [ ] **Step 8: Verificar que o projeto compila**

Run: `npx tsc --noEmit`
Expected: sem erros.

- [ ] **Step 9: Commit**

```bash
git add src/features/catalog/CatalogItemSheet.tsx
git commit -m "feat: formulário do catálogo ganha campos de módulo, cabo e componente de estrutura"
```

---

## Task 7: Kits — tipos, dados e regra do Firestore

**Files:**
- Modify: `src/types/firestore.ts`
- Create: `src/lib/data/kits.ts`
- Modify: `firestore.rules`

**Interfaces:**
- Produces: `KitItem`, `Kit` em `firestore.ts`; `KitInput`, `subscribeKits`, `createKit`, `updateKit`, `deleteKit` em `src/lib/data/kits.ts` — usados pela Task 8 (KitSheet), Task 9 (CatalogPage/KitsTab), Task 11 (ProposalEditorPage/MateriaisStep) e Task 13 (catalogImport).

- [ ] **Step 1: Adicionar os tipos em `firestore.ts`**

Depois da interface `CatalogItem` (união discriminada) e do `DistributiveOmit`, adicione:

```ts
export interface KitItem {
  catalogId: string
  quantidadePadrao: number | null
}

export interface Kit {
  id: string
  nome: string
  descricao: string
  itens: KitItem[]
  ativo: boolean
}
```

- [ ] **Step 2: Criar `src/lib/data/kits.ts`**

```ts
import { addDoc, collection, deleteDoc, doc, onSnapshot, query, updateDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type { Kit } from '@/types/firestore'

const kitsCollection = collection(db, 'kits')

export type KitInput = Omit<Kit, 'id'>

export function subscribeKits(onData: (kits: Kit[]) => void) {
  return onSnapshot(query(kitsCollection), (snap) => {
    const kits = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Kit)
    kits.sort((a, b) => (a.nome ?? '').localeCompare(b.nome ?? '', 'pt-BR'))
    onData(kits)
  })
}

export async function createKit(input: KitInput): Promise<string> {
  const ref = await addDoc(kitsCollection, input)
  return ref.id
}

export async function updateKit(id: string, input: Partial<KitInput>): Promise<void> {
  await updateDoc(doc(db, 'kits', id), input)
}

export async function deleteKit(id: string): Promise<void> {
  await deleteDoc(doc(db, 'kits', id))
}
```

- [ ] **Step 3: Adicionar a regra do Firestore**

Em `firestore.rules`, logo depois do bloco `match /catalog/{itemId} { ... }`, adicione:

```
    match /kits/{kitId} {
      allow read, write: if isAdmin();
    }
```

- [ ] **Step 4: Verificar que o projeto compila**

Run: `npx tsc --noEmit`
Expected: sem erros.

- [ ] **Step 5: Commit**

```bash
git add src/types/firestore.ts src/lib/data/kits.ts firestore.rules
git commit -m "feat: adiciona a coleção kits (tipos, CRUD e regra do Firestore)"
```

---

## Task 8: KitSheet — formulário de kit

**Files:**
- Create: `src/features/catalog/KitSheet.tsx`

**Interfaces:**
- Consumes: `Kit`, `KitItem`, `CatalogItem` (`@/types/firestore`); `KitInput`, `createKit`, `updateKit` (`@/lib/data/kits`, Task 7); `Sheet`, `Button`, `Input`, `Select`, `Switch`, `DecimalInput` (componentes existentes).
- Produces: `KitSheet` — usado pela Task 9 (`KitsTab`).
- Sem testes (componente React).

- [ ] **Step 1: Criar `src/features/catalog/KitSheet.tsx`**

```tsx
import { Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { DecimalInput } from '@/components/ui/DecimalInput'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Sheet } from '@/components/ui/Sheet'
import { Switch } from '@/components/ui/Switch'
import { createKit, updateKit, type KitInput } from '@/lib/data/kits'
import type { CatalogItem, Kit } from '@/types/firestore'

function paraInput(kit: Kit | null): KitInput {
  if (!kit) return { nome: '', descricao: '', itens: [], ativo: true }
  const { id: _id, ...resto } = kit
  return resto
}

export function KitSheet({ open, onClose, kit, catalogo }: { open: boolean; onClose: () => void; kit: Kit | null; catalogo: CatalogItem[] }) {
  const [form, setForm] = useState<KitInput>(() => paraInput(kit))
  const [itemSelecionado, setItemSelecionado] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [dirty, setDirty] = useState(false)

  function set<K extends keyof KitInput>(key: K, value: KitInput[K]) {
    setForm((f) => ({ ...f, [key]: value }))
    setDirty(true)
  }

  function adicionarItem() {
    if (!itemSelecionado || form.itens.some((i) => i.catalogId === itemSelecionado)) return
    set('itens', [...form.itens, { catalogId: itemSelecionado, quantidadePadrao: null }])
    setItemSelecionado('')
  }

  function atualizarQuantidade(catalogId: string, quantidadePadrao: number | null) {
    set('itens', form.itens.map((i) => (i.catalogId === catalogId ? { ...i, quantidadePadrao } : i)))
  }

  function removerItem(catalogId: string) {
    set('itens', form.itens.filter((i) => i.catalogId !== catalogId))
  }

  function handleClose() {
    setForm(paraInput(kit))
    setDirty(false)
    onClose()
  }

  async function handleSalvar() {
    setSalvando(true)
    try {
      if (kit) {
        await updateKit(kit.id, form)
      } else {
        await createKit(form)
      }
      setDirty(false)
      onClose()
    } finally {
      setSalvando(false)
    }
  }

  return (
    <Sheet
      open={open}
      onClose={handleClose}
      title={kit ? 'Editar kit' : 'Novo kit'}
      isDirty={dirty}
      footer={
        <div className="flex gap-3">
          <Button type="button" variant="secondary" onClick={handleClose} className="flex-1">
            Cancelar
          </Button>
          <Button type="button" variant="primary" onClick={handleSalvar} loading={salvando} className="flex-1">
            {kit ? 'Salvar alterações' : 'Criar kit'}
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-4">
        <Input label="Nome" value={form.nome} onChange={(e) => set('nome', e.target.value)} />
        <Input label="Descrição" hint="Opcional" value={form.descricao} onChange={(e) => set('descricao', e.target.value)} />
        <Switch label="Ativo" checked={form.ativo} onChange={(v) => set('ativo', v)} />

        <div>
          <p className="mb-2 text-sm font-semibold text-graphite">Itens do kit</p>
          <div className="flex flex-col gap-2">
            {form.itens.map((kitItem) => {
              const catalogItem = catalogo.find((c) => c.id === kitItem.catalogId)
              return (
                <div key={kitItem.catalogId} className="flex items-center gap-3 rounded-field border border-[#D9D3C7] bg-surface p-3">
                  <p className="flex-1 text-sm font-semibold text-graphite">{catalogItem?.nome ?? 'Item removido do catálogo'}</p>
                  <div className="w-32">
                    <DecimalInput label="Qtd. padrão" integer value={kitItem.quantidadePadrao} onChange={(v) => atualizarQuantidade(kitItem.catalogId, v)} />
                  </div>
                  <button
                    type="button"
                    onClick={() => removerItem(kitItem.catalogId)}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-field text-muted hover:bg-danger-soft hover:text-danger"
                    aria-label="Remover item do kit"
                  >
                    <Trash2 className="h-4 w-4" aria-hidden />
                  </button>
                </div>
              )
            })}
          </div>
        </div>

        <div className="flex items-end gap-3">
          <div className="flex-1">
            <Select
              label="Adicionar item do catálogo"
              value={itemSelecionado}
              onChange={(e) => setItemSelecionado(e.target.value)}
              options={[
                { value: '', label: 'Selecione um item' },
                ...catalogo.filter((c) => !form.itens.some((i) => i.catalogId === c.id)).map((c) => ({ value: c.id, label: c.nome })),
              ]}
            />
          </div>
          <button
            type="button"
            onClick={adicionarItem}
            disabled={!itemSelecionado}
            className="flex h-12 items-center justify-center gap-2 rounded-field border border-[#D9D3C7] bg-surface px-4 text-sm font-bold text-graphite hover:bg-chip disabled:opacity-50"
          >
            <Plus className="h-4 w-4" aria-hidden /> Adicionar
          </button>
        </div>
      </div>
    </Sheet>
  )
}
```

- [ ] **Step 2: Verificar que o projeto compila**

Run: `npx tsc --noEmit`
Expected: sem erros.

- [ ] **Step 3: Commit**

```bash
git add src/features/catalog/KitSheet.tsx
git commit -m "feat: adiciona o formulário de kit (KitSheet)"
```

---

## Task 9: CatalogPage — abas Itens/Kits e chip de custo zero

**Files:**
- Create: `src/features/catalog/KitsTab.tsx`
- Modify: `src/features/catalog/CatalogPage.tsx`

**Interfaces:**
- Consumes: `subscribeKits` (Task 7), `KitSheet` (Task 8), `Segmented` (componente existente).
- Produces: `KitsTab` — a aba "Kits" dentro do Catálogo.
- Sem testes (componente React).

- [ ] **Step 1: Criar `src/features/catalog/KitsTab.tsx`**

```tsx
import { Package, Plus } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { SkeletonRow } from '@/components/ui/Skeleton'
import { subscribeKits } from '@/lib/data/kits'
import type { CatalogItem, Kit } from '@/types/firestore'
import { KitSheet } from './KitSheet'

export function KitsTab({ catalogo }: { catalogo: CatalogItem[] }) {
  const [kits, setKits] = useState<Kit[] | null>(null)
  const [sheetAberta, setSheetAberta] = useState(false)
  const [kitEditando, setKitEditando] = useState<Kit | null>(null)

  useEffect(() => subscribeKits(setKits), [])

  function abrirNovo() {
    setKitEditando(null)
    setSheetAberta(true)
  }

  function abrirEdicao(kit: Kit) {
    setKitEditando(kit)
    setSheetAberta(true)
  }

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <Button variant="primary" onClick={abrirNovo}>
          <Plus className="h-4 w-4" /> Novo kit
        </Button>
      </div>

      {kits === null && (
        <div className="flex flex-col gap-3">
          <SkeletonRow />
          <SkeletonRow />
        </div>
      )}

      {kits !== null && kits.length === 0 && (
        <EmptyState
          icon={Package}
          title="Nenhum kit cadastrado"
          description="Monte um kit com itens do catálogo para agilizar o passo Materiais da proposta."
          actionLabel="Novo kit"
          onAction={abrirNovo}
        />
      )}

      <div className="flex flex-col gap-3">
        {kits?.map((kit) => (
          <Card key={kit.id} onClick={() => abrirEdicao(kit)} className="cursor-pointer">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-graphite">{kit.nome}</p>
                <p className="text-xs text-muted">{kit.itens.length} {kit.itens.length === 1 ? 'item' : 'itens'}</p>
              </div>
              {!kit.ativo && <span className="shrink-0 rounded-pill bg-chip px-2 py-1 text-[11px] font-bold text-muted">Inativo</span>}
            </div>
            {kit.descricao && <p className="mt-2 text-xs text-muted">{kit.descricao}</p>}
          </Card>
        ))}
      </div>

      <KitSheet open={sheetAberta} onClose={() => setSheetAberta(false)} kit={kitEditando} catalogo={catalogo} />
    </div>
  )
}
```

- [ ] **Step 2: Reescrever `CatalogPage.tsx`**

Substitua o conteúdo inteiro de `src/features/catalog/CatalogPage.tsx` por:

```tsx
import { Package, Plus, Search } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { Segmented } from '@/components/ui/Segmented'
import { Select } from '@/components/ui/Select'
import { SkeletonRow } from '@/components/ui/Skeleton'
import { Switch } from '@/components/ui/Switch'
import { PageHeader } from '@/components/layout/PageHeader'
import { formatBRL, formatDateBR } from '@/lib/format'
import { subscribeCatalog, updateCatalogItem } from '@/lib/data/catalog'
import { importarItensDistribuidor } from '@/lib/data/catalogImport'
import type { CatalogItem } from '@/types/firestore'
import { CATEGORIAS, CATEGORIA_LABELS } from './catalogLabels'
import { CatalogItemSheet } from './CatalogItemSheet'
import { KitsTab } from './KitsTab'

type Aba = 'itens' | 'kits'

export function CatalogPage() {
  const [aba, setAba] = useState<Aba>('itens')
  const [itens, setItens] = useState<CatalogItem[] | null>(null)
  const [busca, setBusca] = useState('')
  const [categoria, setCategoria] = useState<string>('todas')
  const [sheetAberta, setSheetAberta] = useState(false)
  const [itemEditando, setItemEditando] = useState<CatalogItem | null>(null)
  const [importando, setImportando] = useState(false)
  const [mensagemImport, setMensagemImport] = useState<string | null>(null)

  useEffect(() => subscribeCatalog(setItens), [])

  const filtrados = useMemo(() => {
    if (!itens) return []
    const termo = busca.trim().toLowerCase()
    return itens.filter((item) => {
      const bateCategoria = categoria === 'todas' || item.categoria === categoria
      const bateBusca = !termo || item.nome.toLowerCase().includes(termo)
      return bateCategoria && bateBusca
    })
  }, [itens, busca, categoria])

  function abrirNovo() {
    setItemEditando(null)
    setSheetAberta(true)
  }

  function abrirEdicao(item: CatalogItem) {
    setItemEditando(item)
    setSheetAberta(true)
  }

  async function handleImportar() {
    setImportando(true)
    try {
      const resultado = await importarItensDistribuidor()
      setMensagemImport(`${resultado.itensCriados} itens e ${resultado.kitsCriados} kits criados.`)
    } finally {
      setImportando(false)
    }
  }

  return (
    <div>
      <PageHeader
        title="Catálogo"
        subtitle="Equipamentos, materiais e kits usados nas propostas."
        action={
          <div className="flex flex-wrap gap-3">
            <Button variant="secondary" onClick={handleImportar} loading={importando}>
              Importar itens do distribuidor
            </Button>
            <Button variant="primary" onClick={abrirNovo}>
              <Plus className="h-4 w-4" /> Novo item
            </Button>
          </div>
        }
      />

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <Segmented aria-label="Aba do catálogo" value={aba} onChange={(v) => setAba(v)} options={[{ value: 'itens', label: 'Itens' }, { value: 'kits', label: 'Kits' }]} />
        {mensagemImport && <p className="text-xs font-semibold text-success">{mensagemImport}</p>}
      </div>

      {aba === 'kits' ? (
        <KitsTab catalogo={itens ?? []} />
      ) : (
        <>
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden />
              <input
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Buscar por marca ou modelo"
                className="h-12 w-full rounded-field border border-[#D9D3C7] bg-surface pl-11 pr-4 text-[0.9375rem] outline-none focus:ring-2 focus:ring-sun"
              />
            </div>
            <div className="sm:w-56">
              <Select
                label="Categoria"
                value={categoria}
                onChange={(e) => setCategoria(e.target.value)}
                options={[{ value: 'todas', label: 'Todas as categorias' }, ...CATEGORIAS.map((c) => ({ value: c, label: CATEGORIA_LABELS[c] }))]}
              />
            </div>
          </div>

          {itens === null && (
            <div className="flex flex-col gap-3">
              <SkeletonRow />
              <SkeletonRow />
              <SkeletonRow />
            </div>
          )}

          {itens !== null && filtrados.length === 0 && (
            <EmptyState
              icon={Package}
              title="Nenhum item encontrado"
              description={itens.length === 0 ? 'Cadastre o primeiro item do catálogo.' : 'Ajuste a busca ou o filtro de categoria.'}
              actionLabel={itens.length === 0 ? 'Novo item' : undefined}
              onAction={itens.length === 0 ? abrirNovo : undefined}
            />
          )}

          {filtrados.length > 0 && (
            <div className="hidden overflow-x-auto rounded-card bg-surface shadow-card md:block">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-line-soft text-left text-xs font-bold uppercase tracking-wide text-muted">
                    <th className="px-4 py-3">Item</th>
                    <th className="px-4 py-3">Categoria</th>
                    <th className="px-4 py-3">Custo</th>
                    <th className="px-4 py-3">Atualizado</th>
                    <th className="px-4 py-3">Ativo</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {filtrados.map((item) => (
                    <CatalogRow key={item.id} item={item} onEdit={() => abrirEdicao(item)} />
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="flex flex-col gap-3 md:hidden">
            {filtrados.map((item) => (
              <Card key={item.id} onClick={() => abrirEdicao(item)} className="cursor-pointer">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-graphite">{item.nome}</p>
                    <p className="text-xs text-muted">{CATEGORIA_LABELS[item.categoria]}</p>
                  </div>
                  {!item.ativo && <span className="shrink-0 rounded-pill bg-chip px-2 py-1 text-[11px] font-bold text-muted">Inativo</span>}
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <p className="tabular-nums text-sm font-bold text-graphite">{formatBRL(item.custoUnitario)}</p>
                  {item.custoUnitario === 0 && <span className="rounded-pill bg-sun-soft px-2 py-0.5 text-[11px] font-bold text-sun-ink">Preencha o custo</span>}
                </div>
              </Card>
            ))}
          </div>

          <CatalogItemSheet open={sheetAberta} onClose={() => setSheetAberta(false)} item={itemEditando} />
        </>
      )}
    </div>
  )
}

function CatalogRow({ item, onEdit }: { item: CatalogItem; onEdit: () => void }) {
  async function toggleAtivo() {
    await updateCatalogItem(item.id, { ativo: !item.ativo })
  }

  return (
    <tr className="cursor-pointer border-b border-line-soft last:border-0 hover:bg-ivory" onClick={onEdit}>
      <td className="px-4 py-3">
        <p className="font-bold text-graphite">{item.nome}</p>
      </td>
      <td className="px-4 py-3 text-muted">{CATEGORIA_LABELS[item.categoria]}</td>
      <td className="px-4 py-3 tabular-nums font-semibold text-graphite">
        <div className="flex items-center gap-2">
          {formatBRL(item.custoUnitario)}
          {item.custoUnitario === 0 && <span className="rounded-pill bg-sun-soft px-2 py-0.5 text-[11px] font-bold text-sun-ink">Preencha o custo</span>}
        </div>
      </td>
      <td className="px-4 py-3 text-muted">{item.atualizadoEm ? formatDateBR(item.atualizadoEm.toDate()) : '—'}</td>
      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
        <Switch label="" checked={item.ativo} onChange={toggleAtivo} id={`ativo-${item.id}`} ariaLabel={item.ativo ? 'Desativar item' : 'Ativar item'} />
      </td>
      <td className="px-4 py-3 text-right text-xs font-bold text-sun">Editar</td>
    </tr>
  )
}
```

Isso importa `importarItensDistribuidor` de `@/lib/data/catalogImport`, que só existe a partir da Task 13 — nesta task o `tsc --noEmit` vai acusar erro nesse import. Isso é esperado; a Task 13 resolve. Se preferir manter o build verde a cada task, adie o `import { importarItensDistribuidor } ...` e o botão "Importar itens do distribuidor" (incluindo `handleImportar`, `importando`, `mensagemImport`) para a Task 13 e faça essa Task 9 sem eles — mas então o botão só aparece depois da Task 13. Ambas as ordens são válidas; este plano assume que as tasks são aplicadas em sequência até o fim antes de rodar a suíte completa (Task 14), então o `tsc` "quebrado" entre tasks 9 e 13 é aceitável.

- [ ] **Step 3: Commit**

```bash
git add src/features/catalog/KitsTab.tsx src/features/catalog/CatalogPage.tsx
git commit -m "feat: catálogo ganha abas Itens/Kits e aviso de custo zero"
```

---

## Task 10: `estrutura.ts` — fórmulas de quantidade sugerida

**Files:**
- Create: `src/lib/calc/estrutura.ts`
- Test: `src/lib/calc/estrutura.test.ts`

**Interfaces:**
- Consumes: `CatalogItemEstrutura` (`@/types/firestore`, Task 4).
- Produces: `EstruturaConfig`, `quantidadeSugeridaEstrutura(item, n, larguraModuloM, config): number | null` — usada pela Task 11 (`quantidadeSugerida.ts`).

- [ ] **Step 1: Escrever os testes que falham**

Crie `src/lib/calc/estrutura.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import type { Timestamp } from 'firebase/firestore'
import type { CatalogItemEstrutura, FormaVendaEstrutura, TipoPecaEstrutura } from '@/types/firestore'
import { quantidadeSugeridaEstrutura, type EstruturaConfig } from './estrutura'

const TS = {} as Timestamp
const CONFIG: EstruturaConfig = { larguraModuloPadraoM: 1.15, espacamentoHookM: 1.2 }

function item(tipoPeca: TipoPecaEstrutura, formaVenda: FormaVendaEstrutura, pecasPorPacote: number | null): CatalogItemEstrutura {
  return {
    id: 'x',
    nome: '',
    criadoEm: TS,
    atualizadoEm: TS,
    categoria: 'estrutura',
    unidade: formaVenda === 'pacote' ? 'pacote' : formaVenda === 'barra' ? 'barra' : 'un',
    marca: '',
    tipoPeca,
    tipoTelhado: null,
    medida: '',
    formaVenda,
    pecasPorPacote,
    custoUnitario: 10,
    ativo: true,
  }
}

describe('quantidadeSugeridaEstrutura', () => {
  it('grampo terminal: 4 peças fixas, arredonda pro pacote', () => {
    expect(quantidadeSugeridaEstrutura(item('grampo_terminal', 'pacote', 4), 10, 1.15, CONFIG)).toBe(1)
    expect(quantidadeSugeridaEstrutura(item('grampo_terminal', 'pacote', 3), 10, 1.15, CONFIG)).toBe(2)
  })

  it('grampo intermediário: 2×(N−1) peças', () => {
    expect(quantidadeSugeridaEstrutura(item('grampo_intermediario', 'pacote', 4), 10, 1.15, CONFIG)).toBe(5)
    expect(quantidadeSugeridaEstrutura(item('grampo_intermediario', 'pacote', 4), 1, 1.15, CONFIG)).toBe(0)
  })

  it('perfil: 2×N×largura, barras de 2,4 m + 1 de sobra', () => {
    // N=10, largura 1,15 -> total 23 m -> ceil(23/2.4)=10 barras + 1 = 11
    expect(quantidadeSugeridaEstrutura(item('perfil', 'barra', null), 10, 1.15, CONFIG)).toBe(11)
  })

  it('emenda de perfil: 2×(barras sem sobra − 1)', () => {
    // barrasSemSobra=10 -> 2*(10-1)=18 -> ceil(18/4)=5
    expect(quantidadeSugeridaEstrutura(item('emenda_perfil', 'pacote', 4), 10, 1.15, CONFIG)).toBe(5)
  })

  it('suporte hook: 1 a cada 1,2 m de perfil', () => {
    // total 23 m / 1,2 = 19,17 -> ceil=20 -> ceil(20/4)=5
    expect(quantidadeSugeridaEstrutura(item('suporte_hook', 'pacote', 4), 10, 1.15, CONFIG)).toBe(5)
  })

  it('aterramento (chapa e grampo): 1 peça por módulo', () => {
    expect(quantidadeSugeridaEstrutura(item('chapa_aterramento', 'pacote', 4), 10, 1.15, CONFIG)).toBe(3)
    expect(quantidadeSugeridaEstrutura(item('grampo_aterramento', 'pacote', 4), 10, 1.15, CONFIG)).toBe(3)
  })

  it('kit_completo e outro não têm regra própria', () => {
    expect(quantidadeSugeridaEstrutura(item('kit_completo', 'unidade', null), 10, 1.15, CONFIG)).toBeNull()
    expect(quantidadeSugeridaEstrutura(item('outro', 'unidade', null), 10, 1.15, CONFIG)).toBeNull()
  })
})
```

- [ ] **Step 2: Rodar os testes e confirmar que falham**

Run: `npx vitest run src/lib/calc/estrutura.test.ts`
Expected: FAIL — o módulo `./estrutura` ainda não existe.

- [ ] **Step 3: Criar `src/lib/calc/estrutura.ts`**

```ts
import type { CatalogItemEstrutura } from '@/types/firestore'

export interface EstruturaConfig {
  larguraModuloPadraoM: number
  espacamentoHookM: number
}

const COMPRIMENTO_BARRA_M = 2.4

function pacotes(pecas: number, pecasPorPacote: number | null): number {
  if (!pecasPorPacote || pecasPorPacote <= 0) return pecas
  return Math.ceil(pecas / pecasPorPacote)
}

function comprimentoTotalPerfilM(n: number, larguraModuloM: number): number {
  return 2 * n * larguraModuloM
}

/** Quantidade sugerida (na unidade de venda do item) para um componente de estrutura, a partir
 * do número de módulos N — assume 1 fileira retrato com 2 perfis por módulo. Retorna null quando
 * o tipoPeca não tem regra própria (kit_completo, outro); quem chama decide o fallback. */
export function quantidadeSugeridaEstrutura(
  item: CatalogItemEstrutura,
  n: number,
  larguraModuloM: number,
  config: EstruturaConfig,
): number | null {
  const comprimentoTotal = comprimentoTotalPerfilM(n, larguraModuloM)

  switch (item.tipoPeca) {
    case 'grampo_terminal':
      return pacotes(4, item.pecasPorPacote)
    case 'grampo_intermediario':
      return pacotes(Math.max(0, 2 * (n - 1)), item.pecasPorPacote)
    case 'perfil':
      return Math.ceil(comprimentoTotal / COMPRIMENTO_BARRA_M) + 1
    case 'emenda_perfil': {
      const barrasSemSobra = Math.ceil(comprimentoTotal / COMPRIMENTO_BARRA_M)
      return pacotes(Math.max(0, 2 * (barrasSemSobra - 1)), item.pecasPorPacote)
    }
    case 'suporte_hook':
      return pacotes(Math.ceil(comprimentoTotal / config.espacamentoHookM), item.pecasPorPacote)
    case 'chapa_aterramento':
    case 'grampo_aterramento':
      return pacotes(n, item.pecasPorPacote)
    case 'kit_completo':
    case 'outro':
      return null
  }
}
```

- [ ] **Step 4: Rodar os testes e confirmar que passam**

Run: `npx vitest run src/lib/calc/estrutura.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/calc/estrutura.ts src/lib/calc/estrutura.test.ts
git commit -m "feat: fórmulas de quantidade sugerida por componente de estrutura"
```

---

## Task 11: `quantidadeSugerida.ts` — dispatcher

**Files:**
- Create: `src/features/proposals/quantidadeSugerida.ts`
- Test: `src/features/proposals/quantidadeSugerida.test.ts`

**Interfaces:**
- Consumes: `quantidadeSugeridaEstrutura` (`@/lib/calc/estrutura`, Task 10); `CalcSettings`, `CatalogItem`, `ProposalSistema` (`@/types/firestore`).
- Produces: `quantidadeSugerida(item, sistema, catalogo, calcSettings, quantidadePadraoKit?): number` — usada pela Task 12 (`MateriaisStep`).

- [ ] **Step 1: Escrever os testes que falham**

Crie `src/features/proposals/quantidadeSugerida.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import type { Timestamp } from 'firebase/firestore'
import type { CalcSettings, CatalogItem, ProposalSistema } from '@/types/firestore'
import { quantidadeSugerida } from './quantidadeSugerida'

const TS = {} as Timestamp

const CALC: CalcSettings = {
  produtividadeKwhKwpAno: 1400,
  distribuicaoMensal: Array(12).fill(1),
  tarifaKwh: 0.99,
  fioBKwh: 0.28,
  fioBPercentualPorAno: {},
  fatorSimultaneidade: 0.3,
  custoDisponibilidadeKwh: { mono: 30, bi: 50, tri: 100 },
  iluminacaoPublica: 0,
  reajusteConservador: 0.06,
  reajusteOtimista: 0.09,
  degradacaoAnual: 0.005,
  horizonteAnos: 25,
  taxaCartaoMensal: 0.0099,
  parcelasCartao: 12,
  taxaFinanciamentoMensal: 0.0149,
  parcelasFinanciamento: 60,
  aliquotaSimples: 0.06,
  comissaoPadrao: 0,
  margemPadrao: 0.25,
  larguraModuloPadraoM: 1.15,
  espacamentoHookM: 1.2,
  proximoNumero: 1,
}

const SISTEMA: ProposalSistema = { potenciaKwp: 6.2, qtdModulos: 10, moduloId: 'modulo-1', inversorId: null, areaM2: null }

const MODULO: CatalogItem = {
  id: 'modulo-1', nome: '', criadoEm: TS, atualizadoEm: TS,
  categoria: 'modulo', unidade: 'un', marca: 'Leapton', potenciaWp: 620, areaM2: null,
  larguraM: 1.0, tecnologia: 'bifacial', garantiaProdutoAnos: null, garantiaPerformanceAnos: null,
  custoUnitario: 0, ativo: true,
}

function estrutura(overrides: Partial<CatalogItem>): CatalogItem {
  return {
    id: 'e1', nome: '', criadoEm: TS, atualizadoEm: TS,
    categoria: 'estrutura', unidade: 'pacote', marca: '', tipoPeca: 'grampo_terminal',
    tipoTelhado: null, medida: '', formaVenda: 'pacote', pecasPorPacote: 4,
    custoUnitario: 5, ativo: true,
    ...overrides,
  } as CatalogItem
}

describe('quantidadeSugerida', () => {
  it('módulo sugere a quantidade do sistema', () => {
    expect(quantidadeSugerida(MODULO, SISTEMA, [MODULO], CALC)).toBe(10)
  })

  it('inversor sugere 1', () => {
    const inversor: CatalogItem = {
      id: 'inv1', nome: '', criadoEm: TS, atualizadoEm: TS, categoria: 'inversor', unidade: 'un',
      marca: 'Sofar', tipo: 'string', potenciaKw: 5, fase: 'mono', monitoramentoWifi: false,
      garantiaAnos: null, mppts: null, custoUnitario: 0, ativo: true,
    }
    expect(quantidadeSugerida(inversor, SISTEMA, [MODULO], CALC)).toBe(1)
  })

  it('mc4 sugere 4 (2 pares por string + 2 de reserva)', () => {
    const mc4: CatalogItem = { id: 'mc4', nome: '', criadoEm: TS, atualizadoEm: TS, categoria: 'mc4', unidade: 'par', marca: '', custoUnitario: 0, ativo: true }
    expect(quantidadeSugerida(mc4, SISTEMA, [MODULO], CALC)).toBe(4)
  })

  it('cabo em rolo sugere um rolo inteiro', () => {
    const cabo: CatalogItem = {
      id: 'cabo1', nome: '', criadoEm: TS, atualizadoEm: TS, categoria: 'cabo', unidade: 'm',
      tipo: 'cc_solar', bitolaMm2: 4, cor: 'preto', apresentacao: 'rolo', metrosPorRolo: 25,
      custoPorMetro: 2, custoUnitario: 50, ativo: true,
    }
    expect(quantidadeSugerida(cabo, SISTEMA, [MODULO], CALC)).toBe(25)
  })

  it('cabo por metro cai no fallback (sem quantidadePadrao, usa 1)', () => {
    const cabo: CatalogItem = {
      id: 'cabo2', nome: '', criadoEm: TS, atualizadoEm: TS, categoria: 'cabo', unidade: 'm',
      tipo: 'cc_solar', bitolaMm2: 4, cor: 'preto', apresentacao: 'metro', metrosPorRolo: null,
      custoPorMetro: 2, custoUnitario: 2, ativo: true,
    }
    expect(quantidadeSugerida(cabo, SISTEMA, [MODULO], CALC)).toBe(1)
  })

  it('estrutura usa a largura do módulo selecionado', () => {
    // N=10, largura do módulo 1,0 m -> total 20 m -> ceil(20/2.4)+1 = 9+1 = 10
    // (o teste seguinte usa a largura padrão de Configurações, 1,15 m, e dá 11 — números
    // diferentes de propósito, para provar que é a largura do módulo que está sendo usada aqui)
    const perfil = estrutura({ tipoPeca: 'perfil', formaVenda: 'barra', pecasPorPacote: null, unidade: 'barra' })
    expect(quantidadeSugerida(perfil, SISTEMA, [MODULO], CALC)).toBe(10)
  })

  it('estrutura sem módulo selecionado usa a largura padrão de Configurações', () => {
    const sistemaSemModulo: ProposalSistema = { ...SISTEMA, moduloId: null }
    const perfil = estrutura({ tipoPeca: 'perfil', formaVenda: 'barra', pecasPorPacote: null, unidade: 'barra' })
    // N=10, largura padrão 1,15 -> total 23 m -> ceil(23/2.4)+1 = 11
    expect(quantidadeSugerida(perfil, sistemaSemModulo, [MODULO], CALC)).toBe(11)
  })

  it('kit_completo (item legado) cai no fallback do número de módulos', () => {
    const legado = estrutura({ tipoPeca: 'kit_completo', formaVenda: 'unidade', pecasPorPacote: null, unidade: 'un' })
    expect(quantidadeSugerida(legado, SISTEMA, [MODULO], CALC)).toBe(10)
  })

  it('categorias sem regra própria usam quantidadePadrao do kit, com fallback 1', () => {
    const protecao: CatalogItem = { id: 'p1', nome: '', criadoEm: TS, atualizadoEm: TS, categoria: 'protecao', unidade: 'un', tipo: 'disjuntor', correnteA: 32, custoUnitario: 0, ativo: true }
    expect(quantidadeSugerida(protecao, SISTEMA, [MODULO], CALC)).toBe(1)
    expect(quantidadeSugerida(protecao, SISTEMA, [MODULO], CALC, 3)).toBe(3)
  })
})
```

- [ ] **Step 2: Rodar os testes e confirmar que falham**

Run: `npx vitest run src/features/proposals/quantidadeSugerida.test.ts`
Expected: FAIL — o módulo `./quantidadeSugerida` ainda não existe.

- [ ] **Step 3: Criar `src/features/proposals/quantidadeSugerida.ts`**

```ts
import { quantidadeSugeridaEstrutura } from '@/lib/calc/estrutura'
import type { CalcSettings, CatalogItem, ProposalSistema } from '@/types/firestore'

/** Quantidade sugerida ao adicionar um item de catálogo — individualmente ou via kit — numa
 * proposta. Sempre editável em seguida pelo usuário. */
export function quantidadeSugerida(
  item: CatalogItem,
  sistema: ProposalSistema,
  catalogo: CatalogItem[],
  calcSettings: CalcSettings,
  quantidadePadraoKit?: number | null,
): number {
  switch (item.categoria) {
    case 'modulo':
      return sistema.qtdModulos || 1
    case 'inversor':
      return 1
    case 'mc4':
      return 4
    case 'cabo':
      if (item.apresentacao === 'rolo' && item.metrosPorRolo) return item.metrosPorRolo
      return quantidadePadraoKit ?? 1
    case 'estrutura': {
      const modulo = catalogo.find((c) => c.id === sistema.moduloId)
      const larguraModuloM = (modulo && modulo.categoria === 'modulo' ? modulo.larguraM : null) ?? calcSettings.larguraModuloPadraoM
      const sugestao = quantidadeSugeridaEstrutura(item, sistema.qtdModulos || 0, larguraModuloM, {
        larguraModuloPadraoM: calcSettings.larguraModuloPadraoM,
        espacamentoHookM: calcSettings.espacamentoHookM,
      })
      if (sugestao !== null) return sugestao
      if (quantidadePadraoKit != null) return quantidadePadraoKit
      return sistema.qtdModulos || 1
    }
    default:
      return quantidadePadraoKit ?? 1
  }
}
```

- [ ] **Step 4: Rodar os testes e confirmar que passam**

Run: `npx vitest run src/features/proposals/quantidadeSugerida.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/features/proposals/quantidadeSugerida.ts src/features/proposals/quantidadeSugerida.test.ts
git commit -m "feat: dispatcher de quantidade sugerida por categoria do catálogo"
```

---

## Task 12: MateriaisStep — "Adicionar kit" e quantidade sugerida

**Files:**
- Modify: `src/features/proposals/editor/steps/MateriaisStep.tsx`
- Modify: `src/features/proposals/editor/ProposalEditorPage.tsx`

**Interfaces:**
- Consumes: `quantidadeSugerida` (`@/features/proposals/quantidadeSugerida`, Task 11); `subscribeKits` (`@/lib/data/kits`, Task 7); `Kit` (`@/types/firestore`, Task 7).
- Sem testes (componente React).

- [ ] **Step 1: Reescrever `MateriaisStep.tsx`**

Substitua o conteúdo inteiro de `src/features/proposals/editor/steps/MateriaisStep.tsx` por:

```tsx
import { Plus, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { MoneyInput } from '@/components/ui/MoneyInput'
import { Segmented } from '@/components/ui/Segmented'
import { Select } from '@/components/ui/Select'
import { formatBRL } from '@/lib/format'
import { novoItemId } from '@/lib/data/proposals'
import type { CalcSettings, CatalogItem, Kit, ProposalItem, ProposalSistema, StatusItem } from '@/types/firestore'
import { CATEGORIA_LABELS } from '@/features/catalog/catalogLabels'
import { especificacaoCatalogItem, unidadeDisplay } from '@/features/catalog/catalogDisplay'
import { quantidadeSugerida } from '../../quantidadeSugerida'

interface MateriaisStepProps {
  itens: ProposalItem[]
  onChange: (itens: ProposalItem[]) => void
  sistema: ProposalSistema
  catalogo: CatalogItem[]
  kits: Kit[]
  calc: CalcSettings
}

function itemDeCatalogo(
  catalogItem: CatalogItem,
  sistema: ProposalSistema,
  catalogo: CatalogItem[],
  calc: CalcSettings,
  quantidadePadraoKit?: number | null,
): ProposalItem {
  return {
    id: novoItemId(),
    catalogId: catalogItem.id,
    descricao: catalogItem.nome,
    especificacao: especificacaoCatalogItem(catalogItem),
    quantidade: quantidadeSugerida(catalogItem, sistema, catalogo, calc, quantidadePadraoKit),
    unidade: unidadeDisplay(catalogItem),
    custoUnitario: catalogItem.categoria === 'cabo' ? catalogItem.custoPorMetro : catalogItem.custoUnitario,
    status: 'incluso',
  }
}

export function MateriaisStep({ itens, onChange, sistema, catalogo, kits, calc }: MateriaisStepProps) {
  const [catalogSelecionado, setCatalogSelecionado] = useState('')
  const [kitSelecionado, setKitSelecionado] = useState('')

  // Garante que módulo e inversor escolhidos no passo anterior apareçam aqui automaticamente.
  useEffect(() => {
    let novosItens = itens
    let mudou = false

    if (sistema.moduloId && !novosItens.some((i) => i.catalogId === sistema.moduloId)) {
      const modulo = catalogo.find((c) => c.id === sistema.moduloId)
      if (modulo) {
        novosItens = [...novosItens, itemDeCatalogo(modulo, sistema, catalogo, calc)]
        mudou = true
      }
    }
    if (sistema.inversorId && !novosItens.some((i) => i.catalogId === sistema.inversorId)) {
      const inversor = catalogo.find((c) => c.id === sistema.inversorId)
      if (inversor) {
        novosItens = [...novosItens, itemDeCatalogo(inversor, sistema, catalogo, calc)]
        mudou = true
      }
    }
    if (mudou) onChange(novosItens)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sistema.moduloId, sistema.inversorId])

  function atualizarItem(id: string, patch: Partial<ProposalItem>) {
    onChange(itens.map((i) => (i.id === id ? { ...i, ...patch } : i)))
  }

  function removerItem(id: string) {
    onChange(itens.filter((i) => i.id !== id))
  }

  function adicionarDoCatalogo() {
    const catalogItem = catalogo.find((c) => c.id === catalogSelecionado)
    if (!catalogItem) return
    onChange([...itens, itemDeCatalogo(catalogItem, sistema, catalogo, calc)])
    setCatalogSelecionado('')
  }

  function adicionarKit() {
    const kit = kits.find((k) => k.id === kitSelecionado)
    if (!kit) return
    let novosItens = itens
    for (const kitItem of kit.itens) {
      const catalogItem = catalogo.find((c) => c.id === kitItem.catalogId)
      if (!catalogItem) continue
      const existente = novosItens.find((i) => i.catalogId === catalogItem.id)
      if (existente) {
        const quantidade = quantidadeSugerida(catalogItem, sistema, catalogo, calc, kitItem.quantidadePadrao)
        novosItens = novosItens.map((i) => (i.id === existente.id ? { ...i, quantidade: i.quantidade + quantidade } : i))
      } else {
        novosItens = [...novosItens, itemDeCatalogo(catalogItem, sistema, catalogo, calc, kitItem.quantidadePadrao)]
      }
    }
    onChange(novosItens)
    setKitSelecionado('')
  }

  function adicionarAvulso() {
    onChange([
      ...itens,
      { id: novoItemId(), catalogId: null, descricao: 'Item avulso', especificacao: '', quantidade: 1, unidade: 'unidades', custoUnitario: 0, status: 'incluso' },
    ])
  }

  const custoTotalIncluso = itens.filter((i) => i.status === 'incluso').reduce((acc, i) => acc + i.quantidade * i.custoUnitario, 0)

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-lg font-bold text-graphite">Materiais</h2>
      <p className="text-xs text-muted">Quantidades sugeridas com base no número de módulos — confira na vistoria.</p>

      <div className="flex flex-col gap-3">
        {itens.map((item) => (
          <div key={item.id} className="rounded-card bg-surface p-4 shadow-card">
            <div className="mb-3 flex items-start justify-between gap-3">
              {item.catalogId ? (
                <div>
                  <p className="text-sm font-bold text-graphite">{item.descricao}</p>
                  {item.especificacao && <p className="text-xs text-muted">{item.especificacao}</p>}
                </div>
              ) : (
                <input
                  value={item.descricao}
                  onChange={(e) => atualizarItem(item.id, { descricao: e.target.value })}
                  className="flex-1 rounded-field border border-[#D9D3C7] bg-surface px-3 py-1.5 text-sm font-bold text-graphite outline-none focus:ring-2 focus:ring-sun"
                />
              )}
              <button
                onClick={() => removerItem(item.id)}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-field text-muted hover:bg-danger-soft hover:text-danger"
                aria-label={`Remover ${item.descricao}`}
              >
                <Trash2 className="h-4 w-4" aria-hidden />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <div>
                <label className="mb-1 block text-xs font-semibold text-muted">Quantidade ({item.unidade})</label>
                <input
                  type="number"
                  value={item.quantidade}
                  onChange={(e) => atualizarItem(item.id, { quantidade: Number(e.target.value) })}
                  className="h-10 w-full rounded-field border border-[#D9D3C7] bg-surface px-3 text-sm tabular-nums outline-none focus:ring-2 focus:ring-sun"
                />
              </div>
              <MoneyInput label="Custo unitário" value={item.custoUnitario} onChange={(v) => atualizarItem(item.id, { custoUnitario: v })} />
              <div className="col-span-2 sm:col-span-1">
                <label className="mb-1 block text-xs font-semibold text-muted">Status</label>
                <Segmented
                  size="sm"
                  aria-label={`Status de ${item.descricao}`}
                  value={item.status}
                  onChange={(v) => atualizarItem(item.id, { status: v as StatusItem })}
                  options={[
                    { value: 'incluso', label: 'Incluso' },
                    { value: 'fornecido_cliente', label: 'Cliente' },
                    { value: 'nao_incluso', label: 'Não incluso' },
                  ]}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-2 rounded-card border border-dashed border-line p-4 sm:flex-row sm:items-end">
        <div className="flex-1">
          <Select
            label="Adicionar kit"
            value={kitSelecionado}
            onChange={(e) => setKitSelecionado(e.target.value)}
            options={[{ value: '', label: 'Selecione um kit' }, ...kits.filter((k) => k.ativo).map((k) => ({ value: k.id, label: k.nome }))]}
          />
        </div>
        <button
          type="button"
          onClick={adicionarKit}
          disabled={!kitSelecionado}
          className="flex h-12 items-center justify-center gap-2 rounded-field border border-[#D9D3C7] bg-surface px-4 text-sm font-bold text-graphite hover:bg-chip disabled:opacity-50"
        >
          <Plus className="h-4 w-4" aria-hidden /> Adicionar kit
        </button>
      </div>

      <div className="flex flex-col gap-2 rounded-card border border-dashed border-line p-4 sm:flex-row sm:items-end">
        <div className="flex-1">
          <Select
            label="Adicionar do catálogo"
            value={catalogSelecionado}
            onChange={(e) => setCatalogSelecionado(e.target.value)}
            options={[
              { value: '', label: 'Selecione um item' },
              ...catalogo.map((c) => ({ value: c.id, label: `${CATEGORIA_LABELS[c.categoria]} · ${c.nome}` })),
            ]}
          />
        </div>
        <button
          type="button"
          onClick={adicionarDoCatalogo}
          disabled={!catalogSelecionado}
          className="flex h-12 items-center justify-center gap-2 rounded-field border border-[#D9D3C7] bg-surface px-4 text-sm font-bold text-graphite hover:bg-chip disabled:opacity-50"
        >
          <Plus className="h-4 w-4" aria-hidden /> Adicionar
        </button>
        <button
          type="button"
          onClick={adicionarAvulso}
          className="flex h-12 items-center justify-center gap-2 rounded-field border border-[#D9D3C7] bg-surface px-4 text-sm font-bold text-graphite hover:bg-chip"
        >
          <Plus className="h-4 w-4" aria-hidden /> Item avulso
        </button>
      </div>

      <p className="text-sm font-semibold text-graphite">
        Custo dos itens inclusos: <span className="tabular-nums">{formatBRL(custoTotalIncluso)}</span>
      </p>
    </div>
  )
}
```

- [ ] **Step 2: Ligar `kits` e `calc` em `ProposalEditorPage.tsx`**

No topo do arquivo, adicione o import de `subscribeKits` logo abaixo do import de `subscribeCatalog`:

```ts
import { subscribeCatalog } from '@/lib/data/catalog'
import { subscribeKits } from '@/lib/data/kits'
```

Adicione `Kit` à lista de tipos importada de `@/types/firestore` (mesma linha do `import type { CalcSettings, CatalogItem, Client, ... }`).

Adicione o state, logo abaixo de `const [catalogo, setCatalogo] = useState<CatalogItem[]>([])`:

```ts
  const [kits, setKits] = useState<Kit[]>([])
```

Adicione a subscrição, logo abaixo de `useEffect(() => subscribeCatalog((itens) => setCatalogo(itens.filter((i) => i.ativo))), [])`:

```ts
  useEffect(() => subscribeKits((ks) => setKits(ks.filter((k) => k.ativo))), [])
```

Na renderização do passo 3, passe as duas novas props:

```tsx
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
```

(Isso substitui a linha única `{step === 3 && <MateriaisStep itens={draft.itens} onChange={(itens) => setDraft({ ...draft, itens })} sistema={draft.sistema} catalogo={catalogo} />}`. `calc` já é garantidamente não-nulo nesse ponto do componente, por causa do guard `if (!draft || !calc || !proposal) return <Loading/>` mais acima.)

- [ ] **Step 3: Verificar que o projeto compila**

Run: `npx tsc --noEmit`
Expected: sem erros.

- [ ] **Step 4: Commit**

```bash
git add src/features/proposals/editor/steps/MateriaisStep.tsx src/features/proposals/editor/ProposalEditorPage.tsx
git commit -m "feat: passo Materiais ganha 'Adicionar kit' e usa o dispatcher de quantidade sugerida"
```

---

## Task 13: Import idempotente do distribuidor

**Files:**
- Create: `src/lib/data/catalogImport.ts`

**Interfaces:**
- Consumes: `CatalogItemInput` (`@/lib/data/catalog`, Tasks 1–4/7); `KitInput` (`@/lib/data/kits`, Task 7); `gerarNomeCatalogItem`, `calcularCustoPorMetro` (`@/features/catalog/catalogDisplay`).
- Produces: `importarItensDistribuidor(): Promise<{ itensCriados: number; kitsCriados: number }>` — já referenciada pela Task 9 (`CatalogPage.tsx`).

- [ ] **Step 1: Criar `src/lib/data/catalogImport.ts`**

```ts
import { doc, getDoc, serverTimestamp, writeBatch } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { calcularCustoPorMetro, gerarNomeCatalogItem } from '@/features/catalog/catalogDisplay'
import type { CatalogItemInput } from './catalog'
import type { KitInput } from './kits'

interface ItemImportado {
  id: string
  input: CatalogItemInput
}

const ITENS: ItemImportado[] = [
  {
    id: 'import-modulo-leapton-620-bifacial',
    input: { categoria: 'modulo', unidade: 'un', marca: 'Leapton', potenciaWp: 620, areaM2: null, larguraM: null, tecnologia: 'bifacial', garantiaProdutoAnos: null, garantiaPerformanceAnos: null, custoUnitario: 0, ativo: true },
  },
  {
    id: 'import-inversor-sofar-5kw-mono',
    input: { categoria: 'inversor', unidade: 'un', marca: 'Sofar', tipo: 'string', potenciaKw: 5, fase: 'mono', monitoramentoWifi: false, garantiaAnos: null, mppts: null, custoUnitario: 0, ativo: true },
  },
  {
    id: 'import-inversor-sofar-4kw-mono-1mppt',
    input: { categoria: 'inversor', unidade: 'un', marca: 'Sofar', tipo: 'string', potenciaKw: 4, fase: 'mono', monitoramentoWifi: false, garantiaAnos: null, mppts: 1, custoUnitario: 0, ativo: true },
  },
  {
    id: 'import-cabo-4mm-preto',
    input: { categoria: 'cabo', unidade: 'm', tipo: 'cc_solar', bitolaMm2: 4, cor: 'preto', apresentacao: 'rolo', metrosPorRolo: 25, custoUnitario: 0, ativo: true },
  },
  {
    id: 'import-cabo-4mm-vermelho',
    input: { categoria: 'cabo', unidade: 'm', tipo: 'cc_solar', bitolaMm2: 4, cor: 'vermelho', apresentacao: 'rolo', metrosPorRolo: 25, custoUnitario: 0, ativo: true },
  },
  {
    id: 'import-estrutura-perfil-2-4m',
    input: { categoria: 'estrutura', unidade: 'barra', marca: '', tipoPeca: 'perfil', tipoTelhado: null, medida: '2,4 m', formaVenda: 'barra', pecasPorPacote: null, custoUnitario: 0, ativo: true },
  },
  {
    id: 'import-estrutura-suporte-hook-fibrocimento-25cm',
    input: { categoria: 'estrutura', unidade: 'pacote', marca: '', tipoPeca: 'suporte_hook', tipoTelhado: 'fibrocimento', medida: '25 cm', formaVenda: 'pacote', pecasPorPacote: 4, custoUnitario: 0, ativo: true },
  },
  {
    id: 'import-estrutura-grampo-intermediario-35mm',
    input: { categoria: 'estrutura', unidade: 'pacote', marca: '', tipoPeca: 'grampo_intermediario', tipoTelhado: null, medida: '35 mm', formaVenda: 'pacote', pecasPorPacote: 4, custoUnitario: 0, ativo: true },
  },
  {
    id: 'import-estrutura-grampo-terminal-30-35mm',
    input: { categoria: 'estrutura', unidade: 'pacote', marca: '', tipoPeca: 'grampo_terminal', tipoTelhado: null, medida: '30 e 35 mm', formaVenda: 'pacote', pecasPorPacote: 4, custoUnitario: 0, ativo: true },
  },
  {
    id: 'import-estrutura-chapa-aterramento',
    input: { categoria: 'estrutura', unidade: 'pacote', marca: '', tipoPeca: 'chapa_aterramento', tipoTelhado: null, medida: '', formaVenda: 'pacote', pecasPorPacote: 4, custoUnitario: 0, ativo: true },
  },
  {
    id: 'import-estrutura-emenda-perfil',
    input: { categoria: 'estrutura', unidade: 'pacote', marca: '', tipoPeca: 'emenda_perfil', tipoTelhado: null, medida: '', formaVenda: 'pacote', pecasPorPacote: 4, custoUnitario: 0, ativo: true },
  },
  {
    id: 'import-estrutura-grampo-aterramento',
    input: { categoria: 'estrutura', unidade: 'pacote', marca: '', tipoPeca: 'grampo_aterramento', tipoTelhado: null, medida: '', formaVenda: 'pacote', pecasPorPacote: 4, custoUnitario: 0, ativo: true },
  },
  {
    id: 'import-mc4-par-ip67',
    input: { categoria: 'mc4', unidade: 'par', marca: 'IP67', custoUnitario: 0, ativo: true },
  },
]

const ITENS_KIT_5KW = [
  'import-modulo-leapton-620-bifacial',
  'import-inversor-sofar-5kw-mono',
  'import-cabo-4mm-preto',
  'import-cabo-4mm-vermelho',
  'import-estrutura-perfil-2-4m',
  'import-estrutura-suporte-hook-fibrocimento-25cm',
  'import-estrutura-grampo-intermediario-35mm',
  'import-estrutura-grampo-terminal-30-35mm',
  'import-estrutura-chapa-aterramento',
  'import-estrutura-emenda-perfil',
  'import-estrutura-grampo-aterramento',
  'import-mc4-par-ip67',
]

const ITENS_KIT_4KW = ITENS_KIT_5KW.map((id) => (id === 'import-inversor-sofar-5kw-mono' ? 'import-inversor-sofar-4kw-mono-1mppt' : id))

const KITS: { id: string; input: KitInput }[] = [
  {
    id: 'kit-sofar-5kw-fibrocimento',
    input: {
      nome: 'Kit Sofar 5 kW · fibrocimento',
      descricao: 'Módulo Leapton 620 Wp bifacial, inversor Sofar 5 kW monofásico, cabeamento CC e componentes de estrutura para telhado fibrocimento.',
      itens: ITENS_KIT_5KW.map((catalogId) => ({ catalogId, quantidadePadrao: null })),
      ativo: true,
    },
  },
  {
    id: 'kit-sofar-4kw-fibrocimento',
    input: {
      nome: 'Kit Sofar 4 kW · fibrocimento',
      descricao: 'Módulo Leapton 620 Wp bifacial, inversor Sofar 4 kW monofásico 1 MPPT, cabeamento CC e componentes de estrutura para telhado fibrocimento.',
      itens: ITENS_KIT_4KW.map((catalogId) => ({ catalogId, quantidadePadrao: null })),
      ativo: true,
    },
  },
]

/** Cadastra os itens e kits padrão do distribuidor — idempotente: cada item/kit tem um ID de
 * documento determinístico e só é criado se ainda não existir. Nunca sobrescreve um item já
 * editado (ex.: custo preenchido depois da primeira importação). */
export async function importarItensDistribuidor(): Promise<{ itensCriados: number; kitsCriados: number }> {
  const batch = writeBatch(db)
  let itensCriados = 0
  let kitsCriados = 0

  for (const { id, input } of ITENS) {
    const ref = doc(db, 'catalog', id)
    const existente = await getDoc(ref)
    if (existente.exists()) continue
    const patch: Record<string, unknown> = { ...input, nome: gerarNomeCatalogItem(input) }
    if (input.categoria === 'cabo') patch.custoPorMetro = calcularCustoPorMetro(input)
    batch.set(ref, { ...patch, criadoEm: serverTimestamp(), atualizadoEm: serverTimestamp() })
    itensCriados++
  }

  for (const { id, input } of KITS) {
    const ref = doc(db, 'kits', id)
    const existente = await getDoc(ref)
    if (existente.exists()) continue
    batch.set(ref, input)
    kitsCriados++
  }

  if (itensCriados > 0 || kitsCriados > 0) await batch.commit()
  return { itensCriados, kitsCriados }
}
```

- [ ] **Step 2: Verificar que o projeto compila**

Run: `npx tsc --noEmit`
Expected: sem erros — este é o ponto em que o import pendente em `CatalogPage.tsx` (Task 9) finalmente resolve.

- [ ] **Step 3: Commit**

```bash
git add src/lib/data/catalogImport.ts
git commit -m "feat: importação idempotente dos itens e kits padrão do distribuidor"
```

---

## Task 14: Atualizar a camada de dados do catálogo (normalização + custoPorMetro)

**Files:**
- Modify: `src/lib/data/catalog.ts`

**Interfaces:**
- Consumes: `normalizarCatalogItem`, `calcularCustoPorMetro` (`@/features/catalog/catalogDisplay`, Tasks 3–4).

Esta task fica isolada das anteriores de propósito: `src/lib/data/catalog.ts` importa `@/lib/firebase`, então não pode ganhar testes próprios (ver Global Constraints) — a lógica testável já foi validada nas Tasks 3 e 4 dentro de `catalogDisplay.test.ts`. Aqui só conectamos essas funções puras à leitura/escrita do Firestore.

- [ ] **Step 1: Atualizar `src/lib/data/catalog.ts`**

Troque o conteúdo do arquivo inteiro por:

```ts
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type { CatalogItem, DistributiveOmit } from '@/types/firestore'
import { calcularCustoPorMetro, gerarNomeCatalogItem, normalizarCatalogItem } from '@/features/catalog/catalogDisplay'

const catalogCollection = collection(db, 'catalog')

export type CatalogItemInput = DistributiveOmit<CatalogItem, 'id' | 'nome' | 'criadoEm' | 'atualizadoEm' | 'custoPorMetro'>

function comCamposDerivados(input: CatalogItemInput): Record<string, unknown> {
  const patch: Record<string, unknown> = { ...input, nome: gerarNomeCatalogItem(input) }
  if (input.categoria === 'cabo') patch.custoPorMetro = calcularCustoPorMetro(input)
  return patch
}

export function subscribeCatalog(onData: (itens: CatalogItem[]) => void) {
  return onSnapshot(query(catalogCollection), (snap) => {
    const itens = snap.docs.map((d) => normalizarCatalogItem({ id: d.id, ...d.data() }) as CatalogItem)
    itens.sort((a, b) => (a.nome ?? '').localeCompare(b.nome ?? '', 'pt-BR'))
    onData(itens)
  })
}

export async function createCatalogItem(input: CatalogItemInput): Promise<string> {
  const ref = await addDoc(catalogCollection, {
    ...comCamposDerivados(input),
    criadoEm: serverTimestamp(),
    atualizadoEm: serverTimestamp(),
  })
  return ref.id
}

export async function updateCatalogItem(id: string, input: Partial<CatalogItemInput>): Promise<void> {
  const patch: Record<string, unknown> = { ...input, atualizadoEm: serverTimestamp() }
  if ('categoria' in input) {
    Object.assign(patch, comCamposDerivados(input as CatalogItemInput))
  }
  await updateDoc(doc(db, 'catalog', id), patch)
}

export async function deleteCatalogItem(id: string): Promise<void> {
  await deleteDoc(doc(db, 'catalog', id))
}
```

Note que `normalizarCatalogItem` (Task 4) tem a assinatura `(raw: CatalogItem): CatalogItem` — aqui ela recebe `{ id: d.id, ...d.data() }`, que na prática pode não ter todos os campos de `CatalogItem` (documento legado). Isso já é o mesmo tipo de cast otimista que o código original fazia (`{ id: d.id, ...d.data() } as CatalogItem`); o `as CatalogItem` no fim da linha documenta esse contrato — dado do Firestore não é 100% verificado em tempo de execução neste projeto.

- [ ] **Step 2: Verificar que o projeto compila**

Run: `npx tsc --noEmit`
Expected: sem erros.

- [ ] **Step 3: Commit**

```bash
git add src/lib/data/catalog.ts
git commit -m "feat: conecta normalização de legado e custoPorMetro à leitura/escrita do catálogo"
```

---

## Task 15: Verificação final

**Files:** nenhum (só verificação).

- [ ] **Step 1: Rodar a suíte de testes completa**

Run: `npx vitest run`
Expected: todos os testes passam, incluindo os novos de `catalogDisplay.test.ts`, `catalogSchema.test.ts`, `estrutura.test.ts` e `quantidadeSugerida.test.ts`.

- [ ] **Step 2: Rodar o lint**

Run: `npx oxlint`
Expected: sem erros. Se houver avisos em código pré-existente não tocado por este plano, ignore; corrija qualquer aviso em arquivo criado/modificado por este plano.

- [ ] **Step 3: Rodar o build de produção**

Run: `npm run build`
Expected: `tsc -b && vite build` conclui com exit code 0.

- [ ] **Step 4: Smoke manual no navegador**

Suba o servidor (`npm run dev`) e verifique manualmente:
1. **Catálogo → Itens**: clicar em "Importar itens do distribuidor" cria os 13 itens e 2 kits; clicar de novo não duplica nada (mensagem mostra `0 itens e 0 kits criados`). Itens com custo `R$ 0,00` mostram o chip "Preencha o custo".
2. **Catálogo → Itens → abrir um item "componente de estrutura"** (ex. "Perfil de alumínio 2,4 m"): o formulário mostra Peça, Tipo de telhado, Medida, Forma de venda e (se Pacote) Peças por pacote.
3. **Catálogo → Kits**: os dois kits importados aparecem; abrir um kit mostra a lista de itens e permite adicionar/remover.
4. **Nova proposta → passo Sistema**: selecionar o módulo Leapton e 10 unidades.
5. **Nova proposta → passo Materiais**: clicar "Adicionar kit" → "Kit Sofar 5 kW · fibrocimento" insere todas as linhas com as quantidades sugeridas (conferir ao menos: módulo=10, grampo terminal=1 pacote, cabo preto=25, MC4=4). O aviso "Quantidades sugeridas... confira na vistoria" aparece. Adicionar o kit de novo soma as quantidades em vez de duplicar linhas.
6. **Configurações**: a seção "Estrutura" mostra os campos de largura padrão do módulo e espaçamento do hook, e salva corretamente.

- [ ] **Step 5: Commit final (se algo precisou de ajuste no smoke)**

```bash
git add -A
git commit -m "fix: ajustes pós-smoke do catálogo do distribuidor e kits"
```

(Pule este commit se o smoke não exigiu nenhuma mudança.)
