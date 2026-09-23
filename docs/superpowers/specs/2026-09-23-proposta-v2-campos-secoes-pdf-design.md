# Proposta v2 — correções, novos campos e novas seções — Design

**Data:** 2026-09-23
**Status:** Aprovado para plano de implementação

## Contexto

A proposta (página pública `/p/:publicId` e o PDF baixável, ambos derivados de
`toPublicSnapshot`) precisa de: correção de bugs visuais/textuais, campos
técnicos novos e opcionais na entrada da proposta / cliente / configurações
da empresa, novas seções que exibem esses campos, um QR Code no PDF, e alguns
ajustes de texto. Segue `DESIGN.md` (identidade visual) e a skill
`apple-design` (comportamento/movimento) deste projeto.

Fora de escopo deste spec (tratado como tarefa avulsa e pequena, fora do
plano de implementação): excluir proposta, excluir cliente (editar cliente
já existe).

## 1. Correções de bugs

### 1a. Ligaduras "fi" somem no PDF

Causa raiz conhecida do `@react-pdf/renderer`: o motor de hifenização padrão
calcula mal o ponto de quebra dentro do par de letras "fi"/"fl" e descarta
parte da palavra ao quebrar linha. Não é um problema de formato de fonte.

**Fix:** em `src/features/pdf/fonts.ts`, registrar
`Font.registerHyphenationCallback((word) => [word])` (desliga a
quebra silábica) dentro de `registrarFontesPdf()`. Continuar usando os
arquivos WOFF já existentes de `@fontsource/plus-jakarta-sans` (o `fontkit`
usado pelo react-pdf lê WOFF normalmente; não há TTF publicado no pacote).

**Verificação:** gerar um PDF de exemplo com um item de catálogo contendo as
palavras "Perfil" e "fibrocimento" na descrição/especificação, extrair o
texto do PDF gerado (`pdftotext -layout`) e confirmar que "perfil",
"fibrocimento", "eficiência", "configuração" e "financiamento" aparecem
inteiras. Se a callback sozinha não resolver, buscar arquivos TTF reais
(Google Fonts) e trocar o registro — mas só como segundo passo, se
necessário.

### 1b. Pluralização ("1 unidades" → "1 unidade")

Hoje `unidadeDisplay()` (`src/features/catalog/catalogDisplay.ts`) sempre
devolve a forma plural ("unidades", "metros", "pares", "pacotes", "barras"),
e esse valor é gravado direto em `ProposalItem.unidade` quando o item é
adicionado — por isso fica errado quando a quantidade muda para 1.

**Fix:**
- Novo helper genérico em `src/lib/format.ts`:
  `plural(n: number, singular: string, pluralForm: string): string` — devolve
  `singular` se `n === 1`, senão `pluralForm`.
- `unidadeDisplay()` passa a devolver a forma **singular** (`unidade`,
  `metro`, `par`, `pacote`, `barra`) em vez da plural. `itemVazio()` em
  `src/lib/data/proposals.ts` muda o padrão de `'unidades'` para `'unidade'`.
- Novo helper `unidadeItemExibicao(quantidade: number, unidadeArmazenada: string): string`
  em `src/features/catalog/catalogDisplay.ts`: mapeia formas plurais
  legadas de volta para singular (tabela reversa — documentos já salvos têm
  `unidade: "unidades"` etc.), depois aplica `plural()` com a tabela de
  plural correta (`par` → `pares`, os demais só recebem `s`). Palavras fora
  da tabela (categoria `outro`, texto livre) voltam como estão, sem tentar
  pluralizar.
- Todo lugar que hoje exibe `{item.quantidade} {item.unidade}` passa a
  chamar `unidadeItemExibicao(item.quantidade, item.unidade)`:
  `MateriaisStep.tsx`, `ProposalView.tsx`, `ProposalPdf.tsx`.

### 1c. Payback em anos e meses no PDF

A página web já formata certo (`ProposalView.tsx`, `CenarioCard`):
`${Math.floor(meses/12)} anos e ${meses % 12} meses`. O PDF ainda mostra só
anos. Extrair essa lógica para `formatPayback(meses: number | null): string`
em `src/lib/format.ts`, usar em `ProposalView.tsx` (substituindo a lógica
inline) e em `ProposalPdf.tsx` (as duas seções de cenário).

### 1d. Rodapé do PDF com localhost

`publicUrl()` em `ProposalPdf.tsx` já usa `window.location.origin` (correto
em produção). Ainda assim, adicionar `VITE_PUBLIC_BASE_URL` como override
explícito: `import.meta.env.VITE_PUBLIC_BASE_URL || window.location.origin`.
Adicionar a variável (vazia, comentada) em `.env.example`. O valor real fica
a cargo do usuário definir em `.env.local`/no ambiente de produção antes do
deploy — não é necessário para este plano.

### 1e. PDF sem gráfico e sem formas de pagamento

O gráfico é resolvido pela seção 2 abaixo (novo componente de gráfico no
PDF). Formas de pagamento são resolvidas pela nova seção "Condições de
pagamento" (seção 5f) — não duplicar: a seção 5f cobre integralmente esta
lacuna.

## 2. Gráfico consumo × geração no PDF

`@react-pdf/renderer` não roda Recharts (sem canvas/SVG chart lib), mas
suporta `<Svg>`/`<Rect>`/`<Line>`/`<Text>` nativamente (já usado em
`SunMark`). Novo componente `src/features/pdf/ProposalPdfChart.tsx`:

- Recebe os mesmos 12 pontos mensais que a página web usa
  (`proposal.entrada.consumoMensalKwh` ou repetição de `consumoMedioKwh`, e
  `proposal.resultados.geracaoMensalKwh`).
- Desenha duas barras por mês (consumo em `bar-neutral` `#CFD5DE`, geração em
  `sun` `#F2A516`) com `<Rect>` dentro de um `<Svg>` de largura fixa (ex.:
  480×160), altura proporcional ao valor máximo do conjunto, cantos
  superiores levemente arredondados (`rx`), e o nome abreviado do mês
  (Jan..Dez) como `<Text>` pequeno abaixo de cada par de barras.
- Sem eixo Y numérico (o PDF é mais compacto que a tela) — mantém só a barra
  de base e a legenda de cores (dois retângulos pequenos + texto "Consumo" /
  "Geração"), igual à ideia do gráfico web.
- Renderizado dentro de um `card` na mesma posição em que a versão web tem
  a seção "Consumo × geração, mês a mês" (entre o hero e os cards de
  cenário).

## 3. Novos campos de dados

Todos os campos abaixo são **opcionais** (exceto onde indicado) — o que não
for preenchido simplesmente não aparece na proposta. Nenhum bloqueia salvar.

### `ProposalEntrada` (`src/types/firestore.ts`)

```ts
export type TipoImovel = 'residencial' | 'comercial' | 'rural' | 'industrial'
export type AlturaInstalacao = 'ate_5m' | '5_12m' | 'acima_12m'
export type OrientacaoTelhado = 'norte' | 'nordeste' | 'noroeste' | 'leste' | 'oeste' | 'sul'

export interface ProposalEntrada {
  // ...campos existentes...
  tipoImovel: TipoImovel | ''
  alturaInstalacao: AlturaInstalacao | ''
  inclinacaoGraus: number | null
  orientacaoTelhado: OrientacaoTelhado | ''
  distribuidora: string // padrão 'Equatorial Goiás'
  unidadeConsumidora: string
  coordenadas: { lat: number | null; lng: number | null }
}
```

`tipoTelhado` já existe como `string` livre em `ProposalEntrada`; o tipo
`TipoTelhado` já existe no arquivo (usado hoje só no catálogo de estrutura).
A tarefa que mexer em `ConsumoStep.tsx` deve conferir se o select de tipo de
telhado já usa exatamente esses valores — se sim, apertar o tipo para
`TipoTelhado | ''`; se não, manter `string` e só adicionar as opções que
faltarem, sem forçar migração de dados existentes.

Novos campos entram em `ProposalEntrada` no editor, dentro de uma seção
recolhível "Dados da instalação" em `ConsumoStep.tsx` (abaixo dos campos
atuais), usando os componentes de formulário padrão do design system
(`Input`, `Select`/`Segmented`, `MoneyInput` não se aplica aqui). Valores
default em `criarPropostaVazia()` (`src/lib/data/proposals.ts`):
`tipoImovel: ''`, `alturaInstalacao: ''`, `inclinacaoGraus: null`,
`orientacaoTelhado: ''`, `distribuidora: 'Equatorial Goiás'`,
`unidadeConsumidora: ''`, `coordenadas: { lat: null, lng: null }`.
Proposta salva antes desses campos existirem precisa do mesmo tratamento de
`normalizarProposal()` já usado para `servicos.materiais` — mesclar com um
`ENTRADA_VAZIA` parcial ao ler, para não quebrar em `undefined`.

### `Client` (`src/lib/data/clients.ts` / `src/types/firestore.ts`)

```ts
export interface Client {
  // ...campos existentes...
  cpfCnpj: string
  cep: string
}
```

- `cpfCnpj`: máscara conforme a contagem de dígitos (≤11 → CPF
  `000.000.000-00`, >11 → CNPJ `00.000.000/0000-00`), aplicada enquanto
  digita. Validação de dígito verificador (algoritmo padrão de CPF/CNPJ) é
  **não bloqueante**: mostra aviso inline em vermelho se inválido, mas não
  impede salvar (campo opcional, evita travar em casos legítimos fora do
  padrão). Novo helper `src/lib/format/cpfCnpj.ts`:
  `maskCpfCnpj(value: string): string` e `isValidCpfCnpj(value: string): boolean`.
- `cep`: máscara `00000-000`, sem busca automática de endereço (fora de
  escopo).
- `ClientSheet.tsx` ganha os dois campos; `VAZIO` (`ClientInput` default) e
  `updateClient` já aceitam objetos parciais, sem mudança de assinatura.

### `CompanySettings` (`src/types/firestore.ts`)

```ts
export interface CompanySettings {
  // ...campos existentes...
  responsavelTecnico: { nome: string; titulo: string; crea: string }
  garantiaDemaisEquipamentos: string // padrão '1 ano'
  exclusoes: string[] // MUDA de string para string[]
  observacaoPreliminar: string
}
```

`exclusoes` muda de `string` (texto livre) para `string[]` (lista editável).
Isso é uma mudança de formato — precisa de normalização ao ler, igual ao
padrão já usado em `getCalcSettings`/`getCompanySettings`
(`src/lib/data/settings.ts`): se `raw.exclusoes` vier como `string` (dado
legado), converter para `[raw.exclusoes]`; se vier `undefined`, usar a lista
padrão abaixo.

`DEFAULT_COMPANY.exclusoes` (novos cadastros e fallback):
```
"Reforços estruturais na edificação, quando necessários"
"Obras civis não previstas neste orçamento"
"Adequação do padrão de entrada às normas da distribuidora"
"Poda de árvores ou remoção de obstáculos de sombreamento"
"Material adicional exigido pela distribuidora fora das normas vigentes"
```

`DEFAULT_COMPANY.observacaoPreliminar`:
```
"Orçamento preliminar, sujeito a confirmação após a vistoria técnica. O medidor bidirecional é de responsabilidade da distribuidora, conforme a REN 687/2015 da ANEEL."
```

`DEFAULT_COMPANY.garantiaDemaisEquipamentos = '1 ano'`,
`DEFAULT_COMPANY.responsavelTecnico = { nome: '', titulo: '', crea: '' }`.

`CompanyForm.tsx` ganha: campos de responsável técnico (nome, título, CREA),
campo de garantia dos demais equipamentos, editor de lista para `exclusoes`
(adicionar/remover/editar linha, sem reordenar — YAGNI), campo de texto para
`observacaoPreliminar`.

### `Proposal.condicoesPagamento`

```ts
export interface Proposal {
  // ...campos existentes...
  condicoesPagamento: string // padrão 'A combinar'
}
```

Editável em `PrecoStep.tsx` (mesmo passo onde já mexe com preço/margem/
comissão), campo de texto livre. Default `'A combinar'` em
`criarPropostaVazia()`. Entra na allowlist de `toPublicSnapshot` (não é
custo/margem/comissão — é texto para o cliente ver).

### Catálogo de módulo: `pesoKg`

```ts
export interface CatalogItemModulo extends CatalogItemBase {
  // ...campos existentes...
  pesoKg: number | null
}
```

Opcional, editado em `CatalogItemSheet.tsx` junto dos outros campos do
módulo. Usado no cálculo de peso estimado (seção 4 abaixo).

## 4. Peso estimado da instalação

Novo cálculo puro em `src/lib/calc/dimensionamento.ts` (mesmo arquivo de
`calcularAreaEstimada`):

```ts
export interface PesoEstimado {
  totalKg: number
  kgPorM2: number
  estimativa: boolean // true quando o módulo não tem pesoKg cadastrado
}

export function calcularPesoEstimado(qtdModulos: number, areaM2: number, pesoKgModulo: number | null): PesoEstimado {
  const totalKg = pesoKgModulo != null
    ? qtdModulos * pesoKgModulo * 1.15
    : areaM2 * 13.5
  return { totalKg, kgPorM2: areaM2 > 0 ? totalKg / areaM2 : 0, estimativa: pesoKgModulo == null }
}
```

Chamado em `ProposalEditorPage.tsx`/`proposalResultados.ts` ao montar os
resultados (precisa do `pesoKg` do módulo selecionado, buscado do catálogo
igual a como `areaM2`/`potenciaWp` já são hoje). Resultado guardado em
`ProposalResultados.pesoEstimado: PesoEstimado` (novo campo), propagado para
`PublicProposal` normalmente (não é custo/margem — pode ir na allowlist).

## 5. Novas seções — página pública e PDF, nesta ordem

Ambas (`ProposalView.tsx` e `ProposalPdf.tsx`) recebem as mesmas seções, na
mesma ordem, usando os tokens de `DESIGN.md` (cards `surface` com
`shadow-card`/equivalente no PDF, tipografia igual ao resto do documento).

### 5a. Cabeçalho — dados do cliente

Logo abaixo do topo atual (logo + número/validade), um bloco discreto (texto
pequeno, `muted`) com nome, CPF/CNPJ, telefone, endereço, cidade/UF e
unidade consumidora do cliente — **só os campos preenchidos**, cada um numa
linha ou separados por "·". Requer que `toPublicSnapshot` receba o `Client`
completo (hoje só recebe `proposal` e `company`): novo parâmetro opcional
`client: Client | null` em `ToPublicSnapshotParams`, e um novo
`getClient(id): Promise<Client | null>` em `src/lib/data/clients.ts`
(mirror de `getProposal`), buscado nos 3 pontos que chamam
`toPublicSnapshot` (`publicarProposta`, `ProposalEditorPage` preview,
`ProposalsListPage` "Baixar PDF") antes de montar o snapshot.
`PublicProposal` ganha `cliente: { nome, cpfCnpj, telefone, endereco, cidade, unidadeConsumidora }`
(todos opcionais/strings vazias quando ausentes).

### 5b. "Ficha técnica da instalação" (após "Seu sistema")

Card em duas colunas, só com os campos preenchidos: Tipo de imóvel, Tipo de
telhado, Altura, Inclinação, Orientação, Distribuidora, Unidade consumidora,
Coordenadas (formatado `lat, lng`), Área necessária (`sistema.areaM2`, já
existe), Peso estimado (`resultados.pesoEstimado.totalKg` formatado em kg +
nota "(estimativa)" quando `estimativa: true`, e `kgPorM2` como texto
auxiliar "X kg/m²").

### 5c. Nota da taxa mínima (nos indicadores)

Uma linha de texto pequeno perto dos indicadores/hero:
"Mesmo com o sistema, permanece a cobrança da taxa mínima de disponibilidade
da rede."

### 5d. "Não incluso" vira lista de exclusões + observação

Troca o parágrafo único atual pela lista `company.exclusoes` (um `·` por
linha, igual ao padrão já usado em "O que está incluso"), com
`company.observacaoPreliminar` abaixo, em fonte menor (`muted`).

### 5e. Garantias ganha "Demais equipamentos"

Nova linha no card de garantias: "Demais equipamentos e serviços:
{garantiaDemaisEquipamentos}".

### 5f. "Condições de pagamento" (nova seção, antes de garantias)

Reintroduz cartão e financiamento — removidos hoje mais cedo da seção de
Investimento — agora numa seção própria e dedicada. Mostra três colunas
(à vista / cartão / financiamento), reaproveitando `simularPagamento()`
(`src/lib/calc/pagamento.ts`), mais o texto livre
`proposal.condicoesPagamento`.

`toPublicSnapshot` recebe de volta os parâmetros de simulação
(`taxaCartaoMensal`, `parcelasCartao`, `taxaFinanciamentoMensal`,
`parcelasFinanciamento` — de `CalcSettings`) e calcula
`pagamento: { cartao: { parcelas, valor }, financiamento: { parcelas, valor } }`
dentro do snapshot (mesma forma que existia antes da remoção desta manhã,
mas agora consumida só pela seção "Condições de pagamento", não mais dentro
do card de Investimento). Os 3 pontos de chamada de `toPublicSnapshot`
passam a buscar `getCalcSettings()` de novo onde ainda não buscam
(`ProposalsListPage` tinha essa busca removida hoje cedo — volta).

### 5g. Fechamento do documento

Abaixo de tudo: "{Cidade}, {data por extenso}" (cidade derivada de
`company.cidade.split(',')[0].trim()`, data de `proposal.atualizadoEm`
formatada com `date-fns` + `ptBR`: `"d 'de' MMMM 'de' yyyy"`), depois nome,
título e CREA do responsável técnico (só se preenchidos), depois razão
social (`company.nome`/`parceria`) com os contatos (whatsapp, instagram,
email). No PDF, uma linha (borda superior 1px) acima do nome do responsável
técnico, como linha de assinatura.

## 6. QR Code

- Nova dependência `qrcode` (+ `@types/qrcode`).
- `downloadProposalPdf.tsx` gera o dataURL antes de renderizar:
  `const qrCodeDataUrl = await QRCode.toDataURL(publicUrl(proposal.publicId))`,
  passado como prop `qrCodeDataUrl` para `<ProposalPdf>`.
- No PDF: só na última página, ao lado do bloco de fechamento (seção 5g),
  com a legenda "Aponte a câmera para abrir a proposta no celular" abaixo,
  renderizado via `<Image src={qrCodeDataUrl} />`.
- Não aparece na página pública (web) — só no PDF, por instrução explícita.

## 7. Ajustes de texto

- Nunca "retorno garantido" → sempre "retorno estimado". Buscar as duas
  telas por essa string.
- "20 anos" de garantia dos painéis → "25 anos de garantia de performance"
  (checar `CenarioCard`/textos fixos e `company.garantias.paineis` como
  valor configurável, sem sobrescrever o texto se já for dado do usuário —
  só o *texto fixo/hardcoded* que mencionar 20 anos muda).
- Revisão geral: todo número na proposta (economia, payback, geração) já
  tem uma nota de premissa por perto (reajuste, Fio B, degradação) — conferir
  se o texto atual (`"Estimativa considera reajuste anual..."`) cobre os
  números novos (peso estimado precisa da nota "(estimativa)" já coberta em
  5b; ficha técnica não tem número calculado além disso).

## Fora de escopo / feito à parte

**Excluir proposta, editar/excluir cliente** — tarefa bounded, implementada
direto (sem worktree/SDD), fora deste plano:
- `deleteClient` já existe em `src/lib/data/clients.ts`, sem UI. Adicionar
  botão "Excluir" no rodapé de `ClientSheet.tsx` (modo edição), com
  `window.confirm()` antes de chamar.
- Editar cliente já funciona (`ClientSheet` reusa create/edit).
- Nova `deleteProposal(id)` em `src/lib/data/proposals.ts` (`deleteDoc`).
  Botão "Excluir" em `ProposalsListPage.tsx` por linha, com
  `window.confirm()`.

## Global Constraints

- Cores/tipografia/espaçamento seguem `DESIGN.md` (tokens já usados no
  projeto — nunca hex solto novo).
- Nenhum campo novo é obrigatório para salvar a proposta/cliente/config.
- `toPublicSnapshot` continua proibido de expor `custoUnitario`, `margem`,
  `comissao`, `modo`, `custoTotal`, `lucroEstimado` — o teste
  `toPublicSnapshot.test.ts` (regra de ouro) permanece a autoridade; as
  novas allowlists (`cliente`, `pagamento`, `condicoesPagamento`, `pesoEstimado`)
  são dados que o cliente já vê em algum lugar do documento, nunca dado
  interno.
- `npx tsc -b` (nunca `tsc --noEmit`, que é no-op neste repo) para verificar
  tipos; `npx vitest run` e `npx oxlint` antes de considerar qualquer tarefa
  concluída.
- Todo dado gravado em formato antigo (proposta sem os campos novos,
  `exclusoes` como string) é normalizado **na leitura**, nunca com migração
  destrutiva no Firestore — mesmo padrão de `normalizarProposal`/
  `normalizarCatalogItem` já usado no projeto.
