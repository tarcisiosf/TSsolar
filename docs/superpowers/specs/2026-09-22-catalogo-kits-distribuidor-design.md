# Catálogo do distribuidor, kits prontos e quantidades sugeridas

Data: 2026-09-22
Status: aprovado para implementação

## Contexto e objetivo

O catálogo hoje modela `estrutura` como um item genérico "por módulo", cabo sem
cor/apresentação de compra, e módulo sem tecnologia (mono/bifacial). Não existe
noção de "kit" (conjunto de itens que formam um sistema), e a sugestão de
quantidade ao adicionar um item numa proposta é um cálculo fixo e simplista
dentro de `MateriaisStep`.

Objetivo: cadastrar os itens reais do distribuidor, montar dois kits prontos
("Kit Sofar 5 kW · fibrocimento" e "Kit Sofar 4 kW · fibrocimento"), e sugerir
quantidades de cada peça de estrutura com base no número de módulos do
sistema — sempre editável e claramente marcada como sugestão.

Segue `DESIGN.md` (identidade visual) e a skill `apple-design` (movimento e
interação) para qualquer UI nova.

## Decisões já validadas com o usuário

1. **Documentos legados de `estrutura`** (sem `tipoPeca`): normalizados em
   memória na leitura (`subscribeCatalog`), não via script de migração.
2. **Custo do cabo**: o item de proposta sempre usa `custoPorMetro` como
   `custoUnitario` e a unidade continua "metros", independente da apresentação
   de compra (metro ou rolo).
3. **Import idempotente**: IDs de documento determinísticos (slug) + checagem
   de existência antes de criar — nunca sobrescreve um item já editado.

## 1. Modelo de dados — `src/types/firestore.ts`

### Módulo
```ts
export type TecnologiaModulo = 'monofacial' | 'bifacial'

export interface CatalogItemModulo extends CatalogItemBase {
  categoria: 'modulo'
  unidade: 'un'
  marca: string
  potenciaWp: number
  areaM2: number | null
  larguraM: number | null          // NOVO — usado na fórmula do perfil (seção 4)
  tecnologia: TecnologiaModulo | null // NOVO — opcional
  garantiaProdutoAnos: number | null
  garantiaPerformanceAnos: number | null
}
```
Nome gerado: `Módulo ${marca} ${potenciaWp} Wp${tecnologia ? ' ' + tecnologia : ''}`
→ "Módulo Leapton 620 Wp bifacial".

### Inversor
Adiciona `mppts: number | null` (opcional, sem alterar o resto).

### Cabo
```ts
export type CorCabo = 'preto' | 'vermelho' | 'outro'
export type ApresentacaoCabo = 'metro' | 'rolo'

export interface CatalogItemCabo extends CatalogItemBase {
  categoria: 'cabo'
  unidade: 'm'
  tipo: TipoCabo
  bitolaMm2: BitolaCaboMm2
  cor: CorCabo                     // NOVO
  apresentacao: ApresentacaoCabo   // NOVO
  metrosPorRolo: number | null     // NOVO — obrigatório quando apresentacao='rolo'
  custoPorMetro: number            // NOVO — calculado, nunca digitado
}
```
`custoUnitario` continua sendo o valor digitado no formulário, interpretado
conforme `apresentacao` (preço do rolo OU preço do metro). `custoPorMetro` é
derivado (`calcularCustoPorMetro` em `catalogDisplay.ts`):
- `apresentacao==='metro'` → `custoPorMetro = custoUnitario`
- `apresentacao==='rolo'` → `custoPorMetro = custoUnitario / metrosPorRolo`

Calculado e persistido em `createCatalogItem`/`updateCatalogItem`, do mesmo
jeito que `nome` já é (via `gerarNomeCatalogItem`).

Nome gerado: `Cabo solar ${TIPO_CABO_LABELS[tipo]} ${bitolaMm2} mm² 1 kV ${corLabel}${apresentacao==='rolo' ? ' · rolo ' + metrosPorRolo + ' m' : ''}`
→ "Cabo solar CC 4 mm² 1 kV preto · rolo 25 m". O texto fixo "1 kV" só se
aplica a `tipo==='cc_solar'` (padrão de mercado para cabo solar CC); para
`ca` a fórmula não inclui esse trecho.

### Componente de estrutura (substitui "estrutura")
Mantém a chave discriminante `categoria: 'estrutura'` (compatibilidade —
nenhuma migração do discriminante em si é necessária).

```ts
export type TipoPecaEstrutura =
  | 'perfil' | 'suporte_hook' | 'grampo_intermediario' | 'grampo_terminal'
  | 'emenda_perfil' | 'chapa_aterramento' | 'grampo_aterramento'
  | 'kit_completo' | 'outro'

export type FormaVendaEstrutura = 'unidade' | 'pacote' | 'barra'

export interface CatalogItemEstrutura extends CatalogItemBase {
  categoria: 'estrutura'
  unidade: 'un' | 'pacote' | 'barra'  // espelha formaVenda
  marca: string
  tipoPeca: TipoPecaEstrutura
  tipoTelhado: TipoTelhado | null     // agora opcional
  medida: string                      // texto curto opcional, ex. "2,4 m", "35 mm"
  formaVenda: FormaVendaEstrutura
  pecasPorPacote: number | null       // obrigatório quando formaVenda='pacote'
}
```
`custoUnitario` é sempre "por forma de venda" (por pacote, por barra ou por
unidade) — sem campo derivado, porque a unidade de venda já é a unidade usada
na proposta.

`TIPO_PECA_ESTRUTURA_LABELS` (novo, em `catalogLabels.ts`) — rótulo fixo por
`tipoPeca`, usado tanto no formulário quanto no nome gerado:

| tipoPeca | label |
|---|---|
| `perfil` | "Perfil de alumínio" |
| `suporte_hook` | "Suporte hook" |
| `grampo_intermediario` | "Grampo intermediário" |
| `grampo_terminal` | "Grampo terminal" |
| `emenda_perfil` | "Emenda de perfil" |
| `chapa_aterramento` | "Chapa de aterramento" |
| `grampo_aterramento` | "Grampo de aterramento" |
| `kit_completo` | "Kit completo" |
| `outro` | "Outro" |

Padrão geral do nome:
`${label}${telhadoTexto}${medida ? ' ' + medida : ''}${formaVenda==='pacote' ? ' · pct ' + pecasPorPacote : ''}`,
onde `telhadoTexto` é `' ' + TIPO_TELHADO_LABELS[tipoTelhado].toLowerCase()`
— **exceto** para `suporte_hook` com `tipoTelhado==='fibrocimento'`, cujo
texto é fixo `' fibrocimento/madeira'` (rótulo especial só desse par
peça+telhado, os demais telhados usam o label padrão).

Exemplos:
- `perfil` + medida "2,4 m" → "Perfil de alumínio 2,4 m"
- `suporte_hook` + tipoTelhado fibrocimento + medida "25 cm" + pacote de 4 →
  "Suporte hook fibrocimento/madeira 25 cm · pct 4"
- `grampo_intermediario` + medida "35 mm" + pacote de 4 →
  "Grampo intermediário 35 mm · pct 4"

### Normalização de documentos legados
Em `subscribeCatalog` (e em qualquer outro ponto que leia `catalog` diretamente
do Firestore — hoje só existe esse), aplicar antes de repassar ao chamador:

```ts
function normalizarItem(raw: CatalogItem): CatalogItem {
  if (raw.categoria === 'estrutura' && !('tipoPeca' in raw)) {
    return {
      ...raw,
      tipoPeca: 'kit_completo',
      tipoTelhado: (raw as any).tipoTelhado ?? null,
      medida: '',
      formaVenda: 'unidade',
      pecasPorPacote: null,
      unidade: 'un',
    }
  }
  return raw
}
```
Não reescreve o Firestore — só normaliza em memória. Se o item for reaberto e
salvo no `CatalogItemSheet`, passa a gravar no formato novo.

### `CalcSettings` — dois campos novos
```ts
larguraModuloPadraoM: number   // default 1.15
espacamentoHookM: number       // default 1.2
```
Adicionados em `DEFAULT_CALC` (`src/lib/data/settings.ts`) e expostos em
`CalcForm` (`src/features/settings/CalcForm.tsx`).

## 2. `kits` — nova coleção

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

`src/lib/data/kits.ts` — mesmo padrão de `catalog.ts`:
`subscribeKits`, `createKit`, `updateKit`, `deleteKit`.

`firestore.rules` — nova regra:
```
match /kits/{kitId} {
  allow read, write: if isAdmin();
}
```

## 3. Import idempotente do distribuidor

`src/lib/data/catalogImport.ts`, função `importarItensDistribuidor()`:

- Monta os 8 itens do catálogo (seção 2 do pedido original) e os 2 kits,
  cada um com um **ID de documento determinístico** (slug estável derivado da
  categoria + specs, ex. `import-modulo-leapton-620-bifacial`,
  `import-cabo-4mm-preto`, `kit-sofar-5kw-fibrocimento`).
- Para cada um, `getDoc` para checar existência; só entra no `writeBatch` se
  ainda não existir. Nunca sobrescreve um doc existente (preserva custo já
  preenchido pelo usuário).
- Todos os itens de catálogo: `custoUnitario: 0`, `ativo: true`.
- Os kits referenciam os `catalogId`s pelos mesmos slugs determinísticos —
  por isso os itens têm que ser criados (ou já existir) antes dos kits no
  mesmo batch/sequência.
- Retorna um resumo simples (`{ itensCriados: number; kitsCriados: number }`)
  para feedback opcional na UI.

Botão "Importar itens do distribuidor" na aba Itens do Catálogo, ao lado de
"Novo item" (botão secundário).

**Aviso de custo zero** — não é exclusivo do import: qualquer item do
catálogo com `custoUnitario === 0` exibe um chip "Preencha o custo"
(`sun-soft`/`sun-ink`, seguindo DESIGN.md) na tabela (computador) e no card
(celular).

## 4. Motor de quantidade sugerida

### `src/lib/calc/estrutura.ts` (puro, testado — mesmo padrão de `dimensionamento.ts`)

```ts
export interface EstruturaConfig {
  larguraModuloPadraoM: number
  espacamentoHookM: number
}

/** Quantidade sugerida (na unidade de venda do item) para um componente de
 * estrutura, a partir do número de módulos N. Null se o tipoPeca não tem
 * regra própria (kit_completo, outro — usam fallback do chamador). */
export function quantidadeSugeridaEstrutura(
  item: CatalogItemEstrutura,
  n: number,
  larguraModuloM: number,
  config: EstruturaConfig,
): number | null
```

Regras (todas usam `pecasPorPacote` quando `formaVenda==='pacote'`; barra/
unidade não arredondam por pacote):

| tipoPeca | peças | unidade final |
|---|---|---|
| `grampo_terminal` | 4 | `ceil(4 / pecasPorPacote)` pacotes |
| `grampo_intermediario` | `2 × (N − 1)` | `ceil(peças / pecasPorPacote)` pacotes |
| `perfil` | `comprimentoTotal = 2 × N × larguraModuloM` | `ceil(comprimentoTotal / 2.4) + 1` barras (a +1 é sobra) |
| `emenda_perfil` | `2 × (barrasSemSobra − 1)`, mínimo 0, onde `barrasSemSobra = ceil(comprimentoTotal / 2.4)` | `ceil(peças / pecasPorPacote)` pacotes |
| `suporte_hook` | `ceil(comprimentoTotal / espacamentoHookM)` | `ceil(peças / pecasPorPacote)` pacotes |
| `chapa_aterramento` / `grampo_aterramento` | `N` | `ceil(N / pecasPorPacote)` pacotes |
| `kit_completo` / `outro` | — | `null` (fallback no dispatcher) |

`comprimentoTotal` é recalculado internamente a partir de N e
`larguraModuloM` sempre que necessário (não é um parâmetro separado).

### `src/features/proposals/quantidadeSugerida.ts` (dispatcher, com acesso ao catálogo)

```ts
export function quantidadeSugerida(
  item: CatalogItem,
  sistema: ProposalSistema,
  catalogo: CatalogItem[],
  calcSettings: CalcSettings,
  quantidadePadraoKit?: number | null,
): number
```

- `modulo` → `sistema.qtdModulos`
- `inversor` → `1`
- `mc4` → `2 × 1 (strings) + 2` = `4` (substitui a regra atual de 3)
- `cabo` → `apresentacao==='rolo' ? metrosPorRolo : (quantidadePadraoKit ?? 1)`
- `estrutura` → resolve `larguraModuloM` do módulo selecionado em
  `sistema.moduloId` (busca em `catalogo`), com fallback a
  `calcSettings.larguraModuloPadraoM` se o módulo não tiver `larguraM`;
  chama `quantidadeSugeridaEstrutura`; se retornar `null`, usa
  `quantidadePadraoKit ?? sistema.qtdModulos` (preserva o comportamento
  antigo de "1 por módulo" para `kit_completo`)
- demais categorias (`stringbox`, `protecao`, `outro`) → `quantidadePadraoKit ?? 1`

Usado tanto por "Adicionar do catálogo" quanto por "Adicionar kit" em
`MateriaisStep`. `MateriaisStep` ganha um texto fixo perto da lista de itens:
"Quantidades sugeridas com base no número de módulos — confira na vistoria."

O `useEffect` que auto-adiciona módulo/inversor escolhidos no `SistemaStep`
passa a usar o dispatcher em vez do patch manual de quantidade que existe
hoje (simplificação, sem mudança de comportamento).

## 5. UI

### CatalogPage → abas "Itens" | "Kits"
Usa o componente `Segmented` já existente (mesmo padrão do seletor de status
de item), seguindo DESIGN.md (troca de aba com cross-fade curto). "Itens" é a
tela atual + botão "Importar itens do distribuidor" + chip de custo zero.
"Kits" é nova: lista de kits (mesmo padrão visual de linha/card do catálogo),
botão "Novo kit" abrindo `KitSheet`.

### `KitSheet` (novo, mesmo padrão do `Sheet`/`CatalogItemSheet`)
Campos: nome, descrição, ativo. Lista de itens do kit — seletor "Adicionar
item do catálogo" (mesmo padrão do seletor em `MateriaisStep`) + campo
opcional de `quantidadePadrao` por linha + remover.

### `CatalogItemSheet`
Adiciona os campos novos por categoria: tecnologia e largura do módulo, MPPTs
do inversor, cor/apresentação/metros por rolo do cabo, e o formulário
reformulado de componente de estrutura (tipoPeca, tipoTelhado opcional,
medida, formaVenda, peças por pacote condicional).

### `MateriaisStep`
Novo seletor "Adicionar kit" (kits com `ativo=true`) ao lado de "Adicionar do
catálogo". Ao adicionar um kit: para cada item, resolve quantidade sugerida
via dispatcher; se já existe uma linha com o mesmo `catalogId`, soma a
quantidade em vez de duplicar; senão, cria uma nova linha (editável, com o
seletor Incluso/Fornecido pelo cliente/Não incluso, igual a hoje).

## 6. Testes

- `catalogDisplay.test.ts` — casos novos de nome/especificação para módulo
  (tecnologia), cabo (cor/apresentação/custoPorMetro) e componente de
  estrutura (por `tipoPeca`).
- `catalogSchema.test.ts` — validação dos novos campos condicionais
  (`metrosPorRolo` obrigatório com `apresentacao='rolo'`, `pecasPorPacote`
  obrigatório com `formaVenda='pacote'`).
- `estrutura.test.ts` (novo) — uma fórmula por `tipoPeca`, incluindo casos de
  arredondamento (`ceil`) e o fallback `kit_completo`/`outro` → `null`.
- `quantidadeSugerida.test.ts` (novo) — dispatcher, incluindo fallback de
  `larguraModuloM` e merge de quantidade ao readicionar um item existente.

## Arquivos tocados (resumo)

- `src/types/firestore.ts` — modelo de dados
- `src/features/catalog/catalogSchema.ts` — validação zod
- `src/features/catalog/catalogDisplay.ts` — nome/especificação/custoPorMetro
- `src/features/catalog/catalogLabels.ts` — novos labels (tipoPeca, cor, tecnologia)
- `src/features/catalog/CatalogItemSheet.tsx` — formulário
- `src/features/catalog/CatalogPage.tsx` — abas Itens/Kits, botão de import, chip de custo zero
- `src/features/catalog/KitsTab.tsx`, `KitSheet.tsx` (novos)
- `src/lib/data/catalog.ts` — normalização de legado, cálculo de `custoPorMetro`
- `src/lib/data/kits.ts` (novo)
- `src/lib/data/catalogImport.ts` (novo)
- `src/lib/data/settings.ts` — `DEFAULT_CALC` com os 2 campos novos
- `src/features/settings/CalcForm.tsx` — campos novos
- `src/lib/calc/estrutura.ts`, `estrutura.test.ts` (novos)
- `src/features/proposals/quantidadeSugerida.ts`, `.test.ts` (novos)
- `src/features/proposals/editor/steps/MateriaisStep.tsx` — "Adicionar kit", merge por catalogId, aviso de sugestão
- `firestore.rules` — regra da coleção `kits`
- `DESIGN.md` — sem alterações necessárias (reaproveita tokens/componentes existentes)

## Fora de escopo (YAGNI)

- Edição de quantidade de kits após inserido não recalcula automaticamente se
  N mudar depois — o usuário ajusta manualmente (consistente com o resto da
  proposta, que já é editável a qualquer momento).
- Múltiplas fileiras/strings — a fórmula assume 1 fileira retrato com 2
  perfis e 1 string, como especificado. Não modelamos paisagem nem múltiplas
  strings nesta fase.
- Página pública e PDF não precisam de mudanças de lógica — já consomem
  `ProposalItem.descricao/especificacao/unidade` como texto plano, gerado no
  momento da inserção.
