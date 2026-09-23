# Proposta v2 — correções, novos campos e novas seções — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Corrigir bugs visuais/textuais da proposta (PDF e web), adicionar campos técnicos opcionais em `entrada`/`clients`/`settings`, exibir esses campos em novas seções (mesma ordem no PDF e na web), adicionar QR Code no PDF, e ajustar textos fixos.

**Architecture:** Mudanças de tipo em `src/types/firestore.ts` primeiro (desbloqueiam tudo), depois helpers puros (`format.ts`, `dimensionamento.ts`), depois cada formulário/tela isolado (catálogo, entrada, cliente, empresa, preço), depois a integração central (`toPublicSnapshot` + os 3 pontos que o chamam), depois as duas telas de saída (`ProposalView.tsx` / `ProposalPdf.tsx`) que consomem tudo.

**Tech Stack:** React + TypeScript + Firestore + Zod + Vitest + `@react-pdf/renderer` + `date-fns` + nova dependência `qrcode`.

**Spec:** `docs/superpowers/specs/2026-09-23-proposta-v2-campos-secoes-pdf-design.md`

## Global Constraints

- Nenhum campo novo é obrigatório para salvar proposta/cliente/config — tudo tem default e é opcional na UI.
- `toPublicSnapshot` nunca pode expor `custoUnitario`, `margem`, `comissao`, `modo`, `custoTotal`, `lucroEstimado` — `toPublicSnapshot.test.ts` é a autoridade (regra de ouro), não remover nem enfraquecer esse teste.
- Verificação de tipos sempre com `npx tsc -b` (nunca `npx tsc --noEmit`, que é no-op neste repo).
- `npx vitest run` e `npx oxlint` limpos antes de considerar qualquer tarefa concluída.
- Dados salvos em formato antigo (proposta sem os campos novos, `settings/company.exclusoes` como string) são normalizados **na leitura**, nunca com migração destrutiva no Firestore — mesmo padrão de `normalizarProposal`/`normalizarCatalogItem`/`getCalcSettings` já usado no projeto.
- Cores/tipografia/espaçamento novos seguem os tokens de `DESIGN.md` — nunca hex solto novo.
- Fora deste plano: excluir proposta, excluir/editar cliente (tarefa bounded separada, feita direto sem worktree).

---

### Task 1: Fix da fonte no PDF (ligaduras "fi" somem)

**Files:**
- Modify: `src/features/pdf/fonts.ts`

**Interfaces:**
- Produces: nenhuma mudança de assinatura pública — `registrarFontesPdf()` continua sem parâmetros.

- [ ] **Step 1: Registrar a callback de hifenização**

Em `src/features/pdf/fonts.ts`, dentro de `registrarFontesPdf()`, logo depois do `Font.register({...})`:

```ts
export function registrarFontesPdf() {
  if (registrado) return
  Font.register({
    family: 'Plus Jakarta Sans',
    fonts: [
      { src: regular400, fontWeight: 400 },
      { src: semibold600, fontWeight: 600 },
      { src: bold700, fontWeight: 700 },
      { src: extrabold800, fontWeight: 800 },
    ],
  })
  // O motor de hifenização padrão do react-pdf quebra mal palavras com "fi"/"fl"
  // (ex.: "Perfil" vira "Perfl", "fibrocimento" vira "fbrocimento"). Desliga a
  // quebra silábica por completo — a palavra nunca é dividida no meio de uma linha.
  Font.registerHyphenationCallback((word) => [word])
  registrado = true
}
```

- [ ] **Step 2: Rodar `npx tsc -b`**

Expected: sem erros.

- [ ] **Step 3: Commit**

```bash
git add src/features/pdf/fonts.ts
git commit -m "fix: desliga hifenizacao do react-pdf para nao cortar ligaduras fi/fl"
```

---

### Task 2: Novos tipos em `src/types/firestore.ts`

**Files:**
- Modify: `src/types/firestore.ts`

**Interfaces:**
- Produces: todos os novos tipos/campos usados pelas tarefas seguintes (2 em diante). Este é o único ponto de verdade dos tipos — nenhuma outra tarefa cria tipo novo em outro arquivo.

- [ ] **Step 1: Novos type alias, logo abaixo de `export type TipoTelhado = ...` (linha 7)**

```ts
export type TipoImovel = 'residencial' | 'comercial' | 'rural' | 'industrial'
export type AlturaInstalacao = 'ate_5m' | '5_12m' | 'acima_12m'
export type OrientacaoTelhado = 'norte' | 'nordeste' | 'noroeste' | 'leste' | 'oeste' | 'sul'
```

- [ ] **Step 2: `CompanySettings` — trocar `exclusoes: string` e adicionar campos novos**

Substituir:

```ts
export interface CompanySettings {
  nome: string
  parceria: {
    nome: string
    cnpj: string
  }
  cnpj: string
  cidade: string
  whatsapp: string
  instagram: string
  email: string
  logoUrl: string | null
  validadeDias: number
  prazoInstalacao: string
  garantias: {
    paineis: string
    inversor: string
    instalacao: string
  }
  servicosInclusos: string[]
  exclusoes: string
}
```

por:

```ts
export interface CompanySettings {
  nome: string
  parceria: {
    nome: string
    cnpj: string
  }
  cnpj: string
  cidade: string
  whatsapp: string
  instagram: string
  email: string
  logoUrl: string | null
  validadeDias: number
  prazoInstalacao: string
  garantias: {
    paineis: string
    inversor: string
    instalacao: string
  }
  servicosInclusos: string[]
  exclusoes: string[]
  observacaoPreliminar: string
  garantiaDemaisEquipamentos: string
  responsavelTecnico: {
    nome: string
    titulo: string
    crea: string
  }
}
```

- [ ] **Step 3: `CatalogItemModulo` ganha `pesoKg`**

Substituir:

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

por:

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
  pesoKg: number | null
}
```

- [ ] **Step 4: `Client` ganha `cpfCnpj` e `cep`**

Substituir:

```ts
export interface Client {
  id: string
  nome: string
  telefone: string
  email: string
  cidade: string
  endereco: string
  observacoes: string
  criadoEm: Timestamp
}
```

por:

```ts
export interface Client {
  id: string
  nome: string
  telefone: string
  email: string
  cidade: string
  endereco: string
  observacoes: string
  cpfCnpj: string
  cep: string
  criadoEm: Timestamp
}
```

- [ ] **Step 5: `ProposalEntrada` ganha os campos de instalação**

Substituir:

```ts
export interface ProposalEntrada {
  consumoMedioKwh: number | null
  consumoMensalKwh: number[] | null
  contaAtual: number | null
  tarifaKwh: number
  ligacao: Ligacao
  tipoTelhado: string
  observacoes: string
}
```

por:

```ts
export interface ProposalEntrada {
  consumoMedioKwh: number | null
  consumoMensalKwh: number[] | null
  contaAtual: number | null
  tarifaKwh: number
  ligacao: Ligacao
  tipoTelhado: TipoTelhado | ''
  observacoes: string
  tipoImovel: TipoImovel | ''
  alturaInstalacao: AlturaInstalacao | ''
  inclinacaoGraus: number | null
  orientacaoTelhado: OrientacaoTelhado | ''
  distribuidora: string
  unidadeConsumidora: string
  coordenadas: { lat: number | null; lng: number | null }
}
```

`tipoTelhado` muda de `string` livre para `TipoTelhado | ''` (o tipo `TipoTelhado` já existe no arquivo, hoje só usado no catálogo de estrutura) — a Tarefa 7 troca o campo de texto livre por um select com essas opções.

- [ ] **Step 6: `Proposal` ganha `condicoesPagamento`**

Substituir:

```ts
export interface Proposal {
  id: string
  numero: string
  versao: number
  clientId: string
  clienteNome: string
  status: StatusProposta
  criadoEm: Timestamp
  atualizadoEm: Timestamp
  enviadaEm: Timestamp | null
  validaAte: Timestamp | null
  entrada: ProposalEntrada
  sistema: ProposalSistema
  itens: ProposalItem[]
  servicos: ProposalServicos
  precificacao: ProposalPrecificacao
  resultados: ProposalResultados | null
  publicId: string
  historicoVersoes: ProposalVersaoHistorico[]
}
```

por:

```ts
export interface Proposal {
  id: string
  numero: string
  versao: number
  clientId: string
  clienteNome: string
  status: StatusProposta
  criadoEm: Timestamp
  atualizadoEm: Timestamp
  enviadaEm: Timestamp | null
  validaAte: Timestamp | null
  entrada: ProposalEntrada
  sistema: ProposalSistema
  itens: ProposalItem[]
  servicos: ProposalServicos
  precificacao: ProposalPrecificacao
  condicoesPagamento: string
  resultados: ProposalResultados | null
  publicId: string
  historicoVersoes: ProposalVersaoHistorico[]
}
```

- [ ] **Step 7: `ProposalResultados` ganha `pesoEstimado`**

Adicionar o tipo `PesoEstimado` logo acima de `ProposalResultados`, e o campo dentro dela:

```ts
export interface PesoEstimado {
  totalKg: number
  kgPorM2: number
  estimativa: boolean
}

export interface ProposalResultados {
  custoTotal: number
  lucroEstimado: number
  margemResultante: number
  precoPorWp: number
  geracaoMediaMensalKwh: number
  economiaAno1Conservador: number
  economiaAno1Otimista: number
  economia25AnosConservador: number
  economia25AnosOtimista: number
  paybackMesesConservador: number | null
  paybackMesesOtimista: number | null
  custoKwhGerado: number
  relacaoCcCa: number
  contaAntesMediaMensal: number
  contaDepoisMediaMensal: number
  percentualEconomiaMensal: number
  geracaoMensalKwh: number[]
  pesoEstimado: PesoEstimado
}
```

- [ ] **Step 8: `PublicProposal` — `entrada` mais completo, novos campos `cliente`, `pagamento`, `condicoesPagamento`, `exclusoes` como lista**

Substituir:

```ts
export interface PublicProposalEmpresa {
  nome: string
  parceria: {
    nome: string
    cnpj: string
  }
  cnpj: string
  cidade: string
  whatsapp: string
  instagram: string
  logoUrl: string | null
}

export type PublicProposalResultados = Omit<ProposalResultados, 'custoTotal' | 'lucroEstimado' | 'margemResultante'>

export interface PublicProposal {
  publicId: string
  numero: string
  versao: number
  status: StatusProposta
  clienteNome: string
  criadoEm: Timestamp
  validaAte: Timestamp | null
  entrada: Pick<ProposalEntrada, 'consumoMedioKwh' | 'consumoMensalKwh' | 'contaAtual' | 'ligacao'>
  sistema: ProposalSistema
  itens: Pick<ProposalItem, 'id' | 'descricao' | 'especificacao' | 'quantidade' | 'unidade' | 'status'>[]
  resultados: PublicProposalResultados
  precoFinal: number
  empresa: PublicProposalEmpresa
  validadeDias: number
  prazoInstalacao: string
  garantias: CompanySettings['garantias']
  servicosInclusos: string[]
  exclusoes: string
  atualizadoEm: Timestamp
}
```

por:

```ts
export interface PublicProposalEmpresa {
  nome: string
  parceria: {
    nome: string
    cnpj: string
  }
  cnpj: string
  cidade: string
  whatsapp: string
  instagram: string
  logoUrl: string | null
}

export interface PublicProposalCliente {
  cpfCnpj: string
  telefone: string
  endereco: string
  cidade: string
}

export interface PublicProposalPagamento {
  cartao: { parcelas: number; valor: number }
  financiamento: { parcelas: number; valor: number }
}

export type PublicProposalResultados = Omit<ProposalResultados, 'custoTotal' | 'lucroEstimado' | 'margemResultante'>

export interface PublicProposal {
  publicId: string
  numero: string
  versao: number
  status: StatusProposta
  clienteNome: string
  cliente: PublicProposalCliente
  criadoEm: Timestamp
  atualizadoEm: Timestamp
  validaAte: Timestamp | null
  entrada: Pick<
    ProposalEntrada,
    | 'consumoMedioKwh'
    | 'consumoMensalKwh'
    | 'contaAtual'
    | 'ligacao'
    | 'tipoImovel'
    | 'tipoTelhado'
    | 'alturaInstalacao'
    | 'inclinacaoGraus'
    | 'orientacaoTelhado'
    | 'distribuidora'
    | 'unidadeConsumidora'
    | 'coordenadas'
  >
  sistema: ProposalSistema
  itens: Pick<ProposalItem, 'id' | 'descricao' | 'especificacao' | 'quantidade' | 'unidade' | 'status'>[]
  resultados: PublicProposalResultados
  precoFinal: number
  condicoesPagamento: string
  pagamento: PublicProposalPagamento
  empresa: PublicProposalEmpresa
  validadeDias: number
  prazoInstalacao: string
  garantias: CompanySettings['garantias']
  garantiaDemaisEquipamentos: string
  servicosInclusos: string[]
  exclusoes: string[]
  observacaoPreliminar: string
  responsavelTecnico: CompanySettings['responsavelTecnico']
}
```

Note: `atualizadoEm` já existia como último campo da interface — só foi realocado para perto de `criadoEm`/`validaAte` nesta reescrita; conferir que não sobrou duplicado no fim do arquivo.

- [ ] **Step 9 (verificação): rodar `npx tsc -b`**

Expected: **erros em cascata** em vários arquivos que ainda não passam os campos novos (`ProposalEditorPage.tsx`, `toPublicSnapshot.ts`, `ConsumoStep.tsx`, `ClientSheet.tsx`, `CompanyForm.tsx`, `PrecoStep.tsx`, `catalogSchema.ts`, `catalogDisplay.ts` PADROES, `proposals.ts`, `settings.ts`, `ProposalView.tsx`, `ProposalPdf.tsx`). Isso é esperado — cada tarefa seguinte resolve o seu pedaço. Não tentar corrigir tudo aqui.

- [ ] **Step 10: Commit**

```bash
git add src/types/firestore.ts
git commit -m "feat: novos tipos para ficha tecnica, cliente, pagamento e exclusoes em lista"
```

---

### Task 3: Helpers puros de formatação

**Files:**
- Modify: `src/lib/format.ts`
- Create: `src/lib/cpfCnpj.ts`
- Create: `src/lib/cpfCnpj.test.ts`
- Modify: `src/lib/format.test.ts`

**Interfaces:**
- Consumes: nada (funções puras).
- Produces: `plural(n, singular, pluralForm)`, `formatPayback(meses)`, `formatDataPorExtenso(data)` em `src/lib/format.ts`; `maskCpfCnpj(value)`, `isValidCpfCnpj(value)` em `src/lib/cpfCnpj.ts`. Usados pelas Tarefas 5, 7, 8, 14, 15.

- [ ] **Step 1: Adicionar `plural`, `formatPayback`, `formatDataPorExtenso` ao fim de `src/lib/format.ts`**

```ts
/** "1 unidade" vs "2 unidades" — devolve a forma certa conforme a quantidade. */
export function plural(n: number, singular: string, pluralForm: string): string {
  return n === 1 ? singular : pluralForm
}

/** "2 anos e 5 meses" — nunca só anos. `null` = fora do horizonte considerado. */
export function formatPayback(meses: number | null): string {
  if (meses == null) return 'fora do horizonte de 25 anos'
  return `${Math.floor(meses / 12)} anos e ${meses % 12} meses`
}

/** "23 de setembro de 2026" — usado no fechamento do documento da proposta. */
export function formatDataPorExtenso(data: Date): string {
  return formatDate(data, "d 'de' MMMM 'de' yyyy", { locale: ptBR })
}
```

- [ ] **Step 2: Testes em `src/lib/format.test.ts`**

Ler o arquivo primeiro para seguir o padrão de `describe`/`it` já usado (`formatBRL`, etc.) e adicionar:

```ts
describe('plural', () => {
  it('usa singular quando n é 1', () => {
    expect(plural(1, 'unidade', 'unidades')).toBe('unidade')
  })
  it('usa plural para qualquer outro valor, incluindo 0', () => {
    expect(plural(0, 'unidade', 'unidades')).toBe('unidades')
    expect(plural(2, 'unidade', 'unidades')).toBe('unidades')
  })
})

describe('formatPayback', () => {
  it('formata em anos e meses', () => {
    expect(formatPayback(29)).toBe('2 anos e 5 meses')
  })
  it('formata múltiplos exatos de 12 sem "e 0 meses" incorreto', () => {
    expect(formatPayback(24)).toBe('2 anos e 0 meses')
  })
  it('null vira "fora do horizonte"', () => {
    expect(formatPayback(null)).toBe('fora do horizonte de 25 anos')
  })
})

describe('formatDataPorExtenso', () => {
  it('formata a data por extenso em português', () => {
    expect(formatDataPorExtenso(new Date(2026, 8, 23))).toBe('23 de setembro de 2026')
  })
})
```

Adicionar `plural`, `formatPayback`, `formatDataPorExtenso` ao import existente de `./format` no topo do arquivo de teste.

- [ ] **Step 3: Criar `src/lib/cpfCnpj.ts`**

```ts
import { onlyDigits } from './format'

/** Aplica a máscara de CPF (≤11 dígitos) ou CNPJ (>11 dígitos) conforme o usuário digita. */
export function maskCpfCnpj(value: string): string {
  const digits = onlyDigits(value).slice(0, 14)
  if (digits.length <= 11) {
    return digits
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
  }
  return digits
    .replace(/(\d{2})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1/$2')
    .replace(/(\d{4})(\d{1,2})$/, '$1-$2')
}

function validarCpf(cpf: string): boolean {
  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false
  const calcDigito = (base: string, pesoInicial: number) => {
    let soma = 0
    for (let i = 0; i < base.length; i++) soma += Number(base[i]) * (pesoInicial - i)
    const resto = (soma * 10) % 11
    return resto === 10 ? 0 : resto
  }
  const d1 = calcDigito(cpf.slice(0, 9), 10)
  const d2 = calcDigito(cpf.slice(0, 9) + d1, 11)
  return cpf === cpf.slice(0, 9) + String(d1) + String(d2)
}

function validarCnpj(cnpj: string): boolean {
  if (cnpj.length !== 14 || /^(\d)\1{13}$/.test(cnpj)) return false
  const calcDigito = (base: string, pesos: number[]) => {
    let soma = 0
    for (let i = 0; i < base.length; i++) soma += Number(base[i]) * pesos[i]
    const resto = soma % 11
    return resto < 2 ? 0 : 11 - resto
  }
  const pesos1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
  const pesos2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
  const d1 = calcDigito(cnpj.slice(0, 12), pesos1)
  const d2 = calcDigito(cnpj.slice(0, 12) + d1, pesos2)
  return cnpj === cnpj.slice(0, 12) + String(d1) + String(d2)
}

/** Vazio é válido (campo opcional). CPF/CNPJ com dígito verificador errado é inválido. */
export function isValidCpfCnpj(value: string): boolean {
  const digits = onlyDigits(value)
  if (digits.length === 0) return true
  if (digits.length === 11) return validarCpf(digits)
  if (digits.length === 14) return validarCnpj(digits)
  return false
}
```

- [ ] **Step 4: Criar `src/lib/cpfCnpj.test.ts`**

```ts
import { describe, expect, it } from 'vitest'
import { isValidCpfCnpj, maskCpfCnpj } from './cpfCnpj'

describe('maskCpfCnpj', () => {
  it('aplica máscara de CPF', () => {
    expect(maskCpfCnpj('11144477735')).toBe('111.444.777-35')
  })
  it('aplica máscara de CNPJ', () => {
    expect(maskCpfCnpj('11222333000181')).toBe('11.222.333/0001-81')
  })
})

describe('isValidCpfCnpj', () => {
  it('vazio é válido', () => {
    expect(isValidCpfCnpj('')).toBe(true)
  })
  it('aceita CPF válido', () => {
    expect(isValidCpfCnpj('111.444.777-35')).toBe(true)
  })
  it('rejeita CPF com dígito verificador errado', () => {
    expect(isValidCpfCnpj('111.444.777-99')).toBe(false)
  })
  it('rejeita CPF com todos os dígitos iguais', () => {
    expect(isValidCpfCnpj('111.111.111-11')).toBe(false)
  })
  it('aceita CNPJ válido', () => {
    expect(isValidCpfCnpj('11.222.333/0001-81')).toBe(true)
  })
  it('rejeita CNPJ com dígito verificador errado', () => {
    expect(isValidCpfCnpj('11.222.333/0001-00')).toBe(false)
  })
})
```

- [ ] **Step 5: Rodar `npx vitest run src/lib/format.test.ts src/lib/cpfCnpj.test.ts`**

Expected: todos os testes passam.

- [ ] **Step 6: Commit**

```bash
git add src/lib/format.ts src/lib/format.test.ts src/lib/cpfCnpj.ts src/lib/cpfCnpj.test.ts
git commit -m "feat: helpers de pluralizacao, payback, data por extenso e mascara/validacao de cpf-cnpj"
```

---

### Task 4: `calcularPesoEstimado`

**Files:**
- Modify: `src/lib/calc/dimensionamento.ts`
- Modify: `src/lib/calc/dimensionamento.test.ts`

**Interfaces:**
- Consumes: `PesoEstimado` (Tarefa 2, Step 7).
- Produces: `calcularPesoEstimado(qtdModulos, areaM2, pesoKgModulo): PesoEstimado`. Usado pela Tarefa 11.

- [ ] **Step 1: Ler `src/lib/calc/dimensionamento.ts` e adicionar a função no fim do arquivo**

```ts
import type { PesoEstimado } from '@/types/firestore'

/** Peso estimado da instalação: qtd × peso do módulo cadastrado × 1,15 (margem para
 * estrutura/cabos), ou 13,5 kg/m² sobre a área quando o módulo não tem peso cadastrado
 * (marcado como `estimativa: true` nesse caso). */
export function calcularPesoEstimado(qtdModulos: number, areaM2: number, pesoKgModulo: number | null): PesoEstimado {
  const totalKg = pesoKgModulo != null ? qtdModulos * pesoKgModulo * 1.15 : areaM2 * 13.5
  return {
    totalKg,
    kgPorM2: areaM2 > 0 ? totalKg / areaM2 : 0,
    estimativa: pesoKgModulo == null,
  }
}
```

(Se o arquivo já importar algo de `@/types/firestore`, juntar num só `import type { ... }`.)

- [ ] **Step 2: Testes em `src/lib/calc/dimensionamento.test.ts`**

```ts
describe('calcularPesoEstimado', () => {
  it('usa o peso do módulo quando cadastrado, com margem de 1,15', () => {
    const r = calcularPesoEstimado(10, 24, 22)
    expect(r.totalKg).toBeCloseTo(10 * 22 * 1.15)
    expect(r.estimativa).toBe(false)
  })
  it('cai para 13,5 kg/m² quando o módulo não tem peso cadastrado', () => {
    const r = calcularPesoEstimado(10, 24, null)
    expect(r.totalKg).toBeCloseTo(24 * 13.5)
    expect(r.estimativa).toBe(true)
  })
  it('kgPorM2 é 0 quando a área é 0', () => {
    const r = calcularPesoEstimado(0, 0, null)
    expect(r.kgPorM2).toBe(0)
  })
})
```

- [ ] **Step 3: `npx vitest run src/lib/calc/dimensionamento.test.ts`**

Expected: passa.

- [ ] **Step 4: Commit**

```bash
git add src/lib/calc/dimensionamento.ts src/lib/calc/dimensionamento.test.ts
git commit -m "feat: calculo de peso estimado da instalacao"
```

---

### Task 5: Pluralização de unidade no catálogo

**Files:**
- Modify: `src/features/catalog/catalogDisplay.ts`
- Modify: `src/features/catalog/catalogDisplay.test.ts`
- Modify: `src/lib/data/proposals.ts` (`itemVazio`)
- Modify: `src/features/proposals/editor/steps/MateriaisStep.tsx`

**Interfaces:**
- Consumes: `plural` (Tarefa 3).
- Produces: `unidadeDisplay(item)` passa a devolver singular; novo `unidadeItemExibicao(quantidade, unidadeArmazenada)`. Usado pelas Tarefas 14 e 15.

- [ ] **Step 1: `unidadeDisplay` devolve singular**

Em `src/features/catalog/catalogDisplay.ts`, substituir:

```ts
/** Palavra de unidade usada ao lado da quantidade num item de proposta (ex.: "6 unidades", "30 metros"). */
export function unidadeDisplay(item: CatalogItem): string {
  switch (item.categoria) {
    case 'cabo':
      return 'metros'
    case 'mc4':
      return 'pares'
    case 'estrutura':
      return item.unidade === 'pacote' ? 'pacotes' : item.unidade === 'barra' ? 'barras' : 'unidades'
    case 'outro':
      return item.unidade || 'unidades'
    default:
      return 'unidades'
  }
}
```

por:

```ts
/** Palavra de unidade (singular) gravada em `ProposalItem.unidade` ao adicionar o item —
 * a forma plural correta é resolvida na exibição por `unidadeItemExibicao`, conforme a
 * quantidade atual do item. */
export function unidadeDisplay(item: CatalogItem): string {
  switch (item.categoria) {
    case 'cabo':
      return 'metro'
    case 'mc4':
      return 'par'
    case 'estrutura':
      return item.unidade === 'pacote' ? 'pacote' : item.unidade === 'barra' ? 'barra' : 'unidade'
    case 'outro':
      return item.unidade || 'unidade'
    default:
      return 'unidade'
  }
}

const PLURAL_UNIDADE: Record<string, string> = {
  unidade: 'unidades',
  metro: 'metros',
  par: 'pares',
  pacote: 'pacotes',
  barra: 'barras',
  módulo: 'módulos',
}

const SINGULAR_POR_PLURAL_LEGADO: Record<string, string> = {
  unidades: 'unidade',
  metros: 'metro',
  pares: 'par',
  pacotes: 'pacote',
  barras: 'barra',
  módulos: 'módulo',
}

/** Pluraliza a unidade de um item de proposta conforme a quantidade atual. Cobre tanto
 * itens novos (unidade já salva no singular) quanto documentos antigos (unidade salva no
 * plural, de antes desta correção) — nesse caso normaliza para singular antes de decidir.
 * Texto livre de fora dessas tabelas (categoria "outro") volta como está, sem tentar
 * pluralizar. */
export function unidadeItemExibicao(quantidade: number, unidadeArmazenada: string): string {
  const singular = SINGULAR_POR_PLURAL_LEGADO[unidadeArmazenada] ?? unidadeArmazenada
  const pluralForm = PLURAL_UNIDADE[singular]
  if (!pluralForm) return unidadeArmazenada
  return plural(quantidade, singular, pluralForm)
}
```

Adicionar `import { plural } from '@/lib/format'` no topo de `catalogDisplay.ts`.

- [ ] **Step 2: Testes em `src/features/catalog/catalogDisplay.test.ts`**

Ler o arquivo primeiro para seguir o padrão de setup de `CatalogItem` fake já usado nos testes existentes. Adicionar:

```ts
describe('unidadeItemExibicao', () => {
  it('singular quando quantidade é 1', () => {
    expect(unidadeItemExibicao(1, 'unidade')).toBe('unidade')
    expect(unidadeItemExibicao(1, 'par')).toBe('par')
  })
  it('plural quando quantidade é diferente de 1', () => {
    expect(unidadeItemExibicao(6, 'unidade')).toBe('unidades')
    expect(unidadeItemExibicao(2, 'par')).toBe('pares')
    expect(unidadeItemExibicao(0, 'metro')).toBe('metros')
  })
  it('normaliza documentos antigos salvos já no plural', () => {
    expect(unidadeItemExibicao(1, 'unidades')).toBe('unidade')
    expect(unidadeItemExibicao(1, 'pares')).toBe('par')
    expect(unidadeItemExibicao(3, 'pares')).toBe('pares')
  })
  it('texto livre fora da tabela volta como está', () => {
    expect(unidadeItemExibicao(1, 'caixa')).toBe('caixa')
  })
})
```

Adicionar `unidadeItemExibicao` ao import existente de `./catalogDisplay` no topo do arquivo de teste.

- [ ] **Step 3: Atualizar defaults de item avulso**

Em `src/lib/data/proposals.ts`, função `itemVazio()` (por volta da linha 198), trocar `unidade: 'unidades'` por `unidade: 'unidade'`.

Em `src/features/proposals/editor/steps/MateriaisStep.tsx`, função `adicionarAvulso()`:

```ts
function adicionarAvulso() {
  onChange([
    ...itens,
    { id: novoItemId(), catalogId: null, descricao: 'Item avulso', especificacao: '', quantidade: 1, unidade: 'unidade', custoUnitario: 0, status: 'incluso' },
  ])
}
```

- [ ] **Step 4: Aplicar `unidadeItemExibicao` na exibição de `MateriaisStep.tsx`**

Trocar o import:

```ts
import { especificacaoCatalogItem, unidadeDisplay } from '@/features/catalog/catalogDisplay'
```

por:

```ts
import { especificacaoCatalogItem, unidadeDisplay, unidadeItemExibicao } from '@/features/catalog/catalogDisplay'
```

E trocar (por volta da linha 142):

```tsx
<label className="mb-1 block text-xs font-semibold text-muted">Quantidade ({item.unidade})</label>
```

por:

```tsx
<label className="mb-1 block text-xs font-semibold text-muted">Quantidade ({unidadeItemExibicao(item.quantidade, item.unidade)})</label>
```

- [ ] **Step 5: `npx vitest run src/features/catalog/catalogDisplay.test.ts` e `npx tsc -b`**

Expected: testes passam; `tsc -b` sem novos erros nestes arquivos (os erros restantes de outros arquivos continuam esperados até as próximas tarefas).

- [ ] **Step 6: Commit**

```bash
git add src/features/catalog/catalogDisplay.ts src/features/catalog/catalogDisplay.test.ts src/lib/data/proposals.ts src/features/proposals/editor/steps/MateriaisStep.tsx
git commit -m "fix: pluralizacao correta da unidade dos itens (1 unidade, nao 1 unidades)"
```

---

### Task 6: `pesoKg` no catálogo de módulo

**Files:**
- Modify: `src/features/catalog/catalogSchema.ts`
- Modify: `src/features/catalog/catalogDisplay.ts` (`PADROES.modulo`)
- Modify: `src/features/catalog/CatalogItemSheet.tsx`
- Modify: `src/features/catalog/catalogSchema.test.ts`

**Interfaces:**
- Consumes: `CatalogItemModulo.pesoKg` (Tarefa 2).
- Produces: campo editável no catálogo, consumido pela Tarefa 11 (peso estimado).

- [ ] **Step 1: Zod schema**

Em `src/features/catalog/catalogSchema.ts`, dentro de `moduloSchema`, adicionar depois de `garantiaPerformanceAnos`:

```ts
  garantiaPerformanceAnos: z.number().int().nonnegative().nullable(),
  pesoKg: z.number().positive('Informe um peso maior que zero').nullable(),
  ...base,
```

- [ ] **Step 2: Default do formulário**

Em `src/features/catalog/catalogDisplay.ts`, dentro de `PADROES`, campo `modulo`:

```ts
  modulo: { categoria: 'modulo', unidade: 'un', marca: '', potenciaWp: 0, areaM2: null, larguraM: null, tecnologia: null, garantiaProdutoAnos: null, garantiaPerformanceAnos: null, pesoKg: null, custoUnitario: 0, ativo: true },
```

- [ ] **Step 3: Campo no formulário**

Em `src/features/catalog/CatalogItemSheet.tsx`, dentro do bloco `{form.categoria === 'modulo' && (...)}`, depois da linha da largura/tecnologia:

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
            <DecimalInput label="Peso do módulo (kg)" suffix="kg" hint="Opcional — usado para estimar o peso da instalação no telhado" value={form.pesoKg} onChange={(v) => set('pesoKg', v)} />
```

(Só a última linha é nova — as anteriores continuam como estão, servem de âncora.)

- [ ] **Step 4: Teste do schema**

Em `src/features/catalog/catalogSchema.test.ts`, no bloco de testes de `moduloSchema`/`catalogItemInputSchema` para módulo, adicionar um caso cobrindo `pesoKg: null` (válido) e `pesoKg: 22.5` (válido) seguindo o padrão dos testes vizinhos já existentes para `areaM2`/`larguraM`.

- [ ] **Step 5: `npx vitest run src/features/catalog/catalogSchema.test.ts` e `npx tsc -b`**

Expected: passam.

- [ ] **Step 6: Commit**

```bash
git add src/features/catalog/catalogSchema.ts src/features/catalog/catalogDisplay.ts src/features/catalog/CatalogItemSheet.tsx src/features/catalog/catalogSchema.test.ts
git commit -m "feat: campo opcional de peso do modulo no catalogo"
```

---

### Task 7: Novos campos de `ProposalEntrada` no editor

**Files:**
- Modify: `src/lib/data/proposals.ts` (`criarPropostaVazia`, `normalizarProposal`)
- Modify: `src/features/proposals/editor/steps/ConsumoStep.tsx`

**Interfaces:**
- Consumes: tipos da Tarefa 2.
- Produces: `entrada` completa disponível no draft do editor, consumida pela Tarefa 12.

- [ ] **Step 1: Defaults em `criarPropostaVazia()`**

Em `src/lib/data/proposals.ts`, dentro do objeto `entrada` retornado por `criarPropostaVazia`:

```ts
    entrada: {
      consumoMedioKwh: null,
      consumoMensalKwh: null,
      contaAtual: null,
      tarifaKwh: 0.99,
      ligacao: 'mono',
      tipoTelhado: '',
      observacoes: '',
      tipoImovel: '',
      alturaInstalacao: '',
      inclinacaoGraus: null,
      orientacaoTelhado: '',
      distribuidora: 'Equatorial Goiás',
      unidadeConsumidora: '',
      coordenadas: { lat: null, lng: null },
    },
```

- [ ] **Step 2: Normalização de proposta antiga**

Em `src/lib/data/proposals.ts`, extrair um `ENTRADA_VAZIA` (mesmo shape do `entrada` acima, sem os campos que já existiam antes) e mesclar em `normalizarProposal`:

```ts
const ENTRADA_VAZIA_NOVOS_CAMPOS = {
  tipoImovel: '' as const,
  alturaInstalacao: '' as const,
  inclinacaoGraus: null,
  orientacaoTelhado: '' as const,
  distribuidora: 'Equatorial Goiás',
  unidadeConsumidora: '',
  coordenadas: { lat: null, lng: null },
}

/** Propostas salvas antes do campo `materiais` existir não o têm em `servicos` — preenche com o
 * padrão (0) ao ler, sem tocar no Firestore, para não gerar NaN nos cálculos de custo/margem.
 * O mesmo vale para os campos de instalação de `entrada`, adicionados depois. */
function normalizarProposal(raw: Proposal): Proposal {
  return {
    ...raw,
    servicos: { ...SERVICOS_VAZIOS, ...raw.servicos },
    entrada: { ...ENTRADA_VAZIA_NOVOS_CAMPOS, ...raw.entrada },
    condicoesPagamento: raw.condicoesPagamento ?? 'A combinar',
  }
}
```

- [ ] **Step 3: Seção "Dados da instalação" em `ConsumoStep.tsx`**

Trocar o import de `Segmented` para incluir `Select`, e adicionar `useState` (já importado) para controlar a seção recolhível. No topo do arquivo:

```tsx
import { useState } from 'react'
import { Input } from '@/components/ui/Input'
import { MoneyInput } from '@/components/ui/MoneyInput'
import { Segmented } from '@/components/ui/Segmented'
import { Select } from '@/components/ui/Select'
import { ChevronDown } from 'lucide-react'
import { sugerirTarifa } from '@/lib/calc/consumo'
import { TIPO_TELHADO_LABELS } from '@/features/catalog/catalogLabels'
import type { AlturaInstalacao, Ligacao, OrientacaoTelhado, ProposalEntrada, TipoImovel } from '@/types/firestore'
```

Trocar o campo de tipo de telhado (hoje um `Input` livre, linha 110):

```tsx
<Input label="Tipo de telhado" value={entrada.tipoTelhado} onChange={(e) => set('tipoTelhado', e.target.value)} placeholder="Cerâmico, metálico, laje…" />
```

por um select com as opções fixas (reaproveitando `TIPO_TELHADO_LABELS`, já usado no catálogo):

```tsx
<Select
  label="Tipo de telhado"
  value={entrada.tipoTelhado}
  onChange={(e) => set('tipoTelhado', e.target.value as ProposalEntrada['tipoTelhado'])}
  options={[{ value: '', label: 'Não informado' }, ...Object.entries(TIPO_TELHADO_LABELS).map(([value, label]) => ({ value, label }))]}
/>
```

Adicionar, logo antes do bloco de "Observações" (linha 112), a seção recolhível com os campos novos:

```tsx
      <DadosInstalacaoSection entrada={entrada} set={set} />

      <div>
        <label className="mb-1.5 block text-sm font-semibold text-graphite">Observações</label>
```

E, no fim do arquivo (fora do componente `ConsumoStep`), o componente da seção:

```tsx
const TIPO_IMOVEL_LABELS: Record<TipoImovel, string> = {
  residencial: 'Residencial',
  comercial: 'Comercial',
  rural: 'Rural',
  industrial: 'Industrial',
}

const ALTURA_LABELS: Record<AlturaInstalacao, string> = {
  ate_5m: 'Até 5 m',
  '5_12m': '5 a 12 m',
  acima_12m: 'Acima de 12 m',
}

const ORIENTACAO_LABELS: Record<OrientacaoTelhado, string> = {
  norte: 'Norte',
  nordeste: 'Nordeste',
  noroeste: 'Noroeste',
  leste: 'Leste',
  oeste: 'Oeste',
  sul: 'Sul',
}

function DadosInstalacaoSection({
  entrada,
  set,
}: {
  entrada: ProposalEntrada
  set: <K extends keyof ProposalEntrada>(key: K, value: ProposalEntrada[K]) => void
}) {
  const [aberta, setAberta] = useState(false)

  return (
    <div className="rounded-card border border-line-soft">
      <button
        type="button"
        onClick={() => setAberta((v) => !v)}
        className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-bold text-graphite"
      >
        Dados da instalação
        <ChevronDown className={`h-4 w-4 text-muted transition-transform ${aberta ? 'rotate-180' : ''}`} aria-hidden />
      </button>
      {aberta && (
        <div className="flex flex-col gap-4 border-t border-line-soft p-4">
          <p className="text-xs text-muted">Tudo opcional — ajuda a compor a ficha técnica da proposta, mas nada aqui bloqueia salvar.</p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Select
              label="Tipo de imóvel"
              value={entrada.tipoImovel}
              onChange={(e) => set('tipoImovel', e.target.value as ProposalEntrada['tipoImovel'])}
              options={[{ value: '', label: 'Não informado' }, ...Object.entries(TIPO_IMOVEL_LABELS).map(([value, label]) => ({ value, label }))]}
            />
            <Select
              label="Altura da instalação"
              value={entrada.alturaInstalacao}
              onChange={(e) => set('alturaInstalacao', e.target.value as ProposalEntrada['alturaInstalacao'])}
              options={[{ value: '', label: 'Não informado' }, ...Object.entries(ALTURA_LABELS).map(([value, label]) => ({ value, label }))]}
            />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="Inclinação"
              type="number"
              suffix="°"
              value={entrada.inclinacaoGraus ?? ''}
              onChange={(e) => set('inclinacaoGraus', e.target.value === '' ? null : Number(e.target.value))}
            />
            <Select
              label="Orientação do telhado"
              value={entrada.orientacaoTelhado}
              onChange={(e) => set('orientacaoTelhado', e.target.value as ProposalEntrada['orientacaoTelhado'])}
              options={[{ value: '', label: 'Não informado' }, ...Object.entries(ORIENTACAO_LABELS).map(([value, label]) => ({ value, label }))]}
            />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input label="Distribuidora" value={entrada.distribuidora} onChange={(e) => set('distribuidora', e.target.value)} />
            <Input label="Unidade consumidora" value={entrada.unidadeConsumidora} onChange={(e) => set('unidadeConsumidora', e.target.value)} />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="Latitude"
              type="number"
              value={entrada.coordenadas.lat ?? ''}
              onChange={(e) => set('coordenadas', { ...entrada.coordenadas, lat: e.target.value === '' ? null : Number(e.target.value) })}
            />
            <Input
              label="Longitude"
              type="number"
              value={entrada.coordenadas.lng ?? ''}
              onChange={(e) => set('coordenadas', { ...entrada.coordenadas, lng: e.target.value === '' ? null : Number(e.target.value) })}
            />
          </div>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 4: `npx tsc -b`**

Expected: erros de `ConsumoStep.tsx`/`proposals.ts` resolvidos; erros restantes nos arquivos ainda não tocados continuam esperados.

- [ ] **Step 5: Commit**

```bash
git add src/lib/data/proposals.ts src/features/proposals/editor/steps/ConsumoStep.tsx
git commit -m "feat: campos opcionais de dados da instalacao no passo Consumo"
```

---

### Task 8: Novos campos de `Client`

**Files:**
- Modify: `src/features/clients/ClientSheet.tsx`

**Interfaces:**
- Consumes: `Client.cpfCnpj`/`cep` (Tarefa 2), `maskCpfCnpj`/`isValidCpfCnpj` (Tarefa 3).
- Produces: cliente completo, consumido pela Tarefa 11 (`getClient`) e Tarefa 12.

- [ ] **Step 1: Atualizar `VAZIO` e imports**

```ts
import { maskCpfCnpj, isValidCpfCnpj } from '@/lib/cpfCnpj'

const VAZIO: ClientInput = { nome: '', telefone: '', email: '', cidade: '', endereco: '', observacoes: '', cpfCnpj: '', cep: '' }
```

- [ ] **Step 2: Campos no formulário**

Depois do bloco `Cidade`/`Endereço` (linhas 79-82), adicionar:

```tsx
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Input
              label="CPF/CNPJ"
              hint="Opcional"
              value={form.cpfCnpj}
              onChange={(e) => set('cpfCnpj', maskCpfCnpj(e.target.value))}
            />
            {form.cpfCnpj && !isValidCpfCnpj(form.cpfCnpj) && <p className="mt-1 text-xs font-semibold text-danger">CPF/CNPJ inválido — confira os números.</p>}
          </div>
          <Input label="CEP" hint="Opcional" value={form.cep} onChange={(e) => set('cep', maskCep(e.target.value))} placeholder="00000-000" />
        </div>
```

- [ ] **Step 3: Máscara de CEP inline**

`maskCep` não existe ainda — adicionar como função local no topo de `ClientSheet.tsx` (não precisa de arquivo próprio, é usada só aqui):

```ts
function maskCep(value: string): string {
  return onlyDigits(value).slice(0, 8).replace(/(\d{5})(\d)/, '$1-$2')
}
```

Adicionar `import { onlyDigits } from '@/lib/format'` no topo do arquivo.

CPF/CNPJ inválido **não bloqueia** salvar (só mostra o aviso inline) — não adicionar nenhuma checagem em `handleSalvar`.

- [ ] **Step 4: `npx tsc -b`**

Expected: erros de `ClientSheet.tsx` resolvidos.

- [ ] **Step 5: Commit**

```bash
git add src/features/clients/ClientSheet.tsx
git commit -m "feat: campos opcionais de cpf-cnpj e cep no cadastro de cliente"
```

---

### Task 9: Novos campos de `CompanySettings`

**Files:**
- Modify: `src/lib/data/settings.ts`
- Modify: `src/features/settings/CompanyForm.tsx`

**Interfaces:**
- Consumes: tipos da Tarefa 2.
- Produces: `CompanySettings` completo e normalizado, consumido pela Tarefa 12.

- [ ] **Step 1: `DEFAULT_COMPANY` com os novos campos**

Em `src/lib/data/settings.ts`, substituir:

```ts
export const DEFAULT_COMPANY: CompanySettings = {
  nome: 'TS Solar',
  parceria: { nome: 'TechSolar', cnpj: '33.146.037/0001-81' },
  cnpj: '',
  cidade: 'Goiânia, GO',
  whatsapp: '',
  instagram: '',
  email: '',
  logoUrl: '/logo.png',
  validadeDias: 15,
  prazoInstalacao: 'até 45 dias após a aprovação da Equatorial Goiás',
  garantias: { paineis: '25 anos', inversor: '10 anos', instalacao: '' },
  servicosInclusos: ['Projeto elétrico', 'Instalação completa', 'ART', 'Homologação junto à Equatorial Goiás'],
  exclusoes: 'Não inclui reforço de padrão de entrada, poda de árvores ou obras civis não previstas no orçamento.',
}
```

por:

```ts
export const DEFAULT_COMPANY: CompanySettings = {
  nome: 'TS Solar',
  parceria: { nome: 'TechSolar', cnpj: '33.146.037/0001-81' },
  cnpj: '',
  cidade: 'Goiânia, GO',
  whatsapp: '',
  instagram: '',
  email: '',
  logoUrl: '/logo.png',
  validadeDias: 15,
  prazoInstalacao: 'até 45 dias após a aprovação da Equatorial Goiás',
  garantias: { paineis: '25 anos de garantia de performance', inversor: '10 anos', instalacao: '' },
  servicosInclusos: ['Projeto elétrico', 'Instalação completa', 'ART', 'Homologação junto à Equatorial Goiás'],
  exclusoes: [
    'Reforços estruturais na edificação, quando necessários',
    'Obras civis não previstas neste orçamento',
    'Adequação do padrão de entrada às normas da distribuidora',
    'Poda de árvores ou remoção de obstáculos de sombreamento',
    'Material adicional exigido pela distribuidora fora das normas vigentes',
  ],
  observacaoPreliminar:
    'Orçamento preliminar, sujeito a confirmação após a vistoria técnica. O medidor bidirecional é de responsabilidade da distribuidora, conforme a REN 687/2015 da ANEEL.',
  garantiaDemaisEquipamentos: '1 ano',
  responsavelTecnico: { nome: '', titulo: '', crea: '' },
}
```

`garantias.paineis` muda o texto padrão de `'25 anos'` para `'25 anos de garantia de performance'`, conforme o ajuste de texto do spec — só o **default de fábrica**; se a empresa já tiver salvo um valor customizado no Firestore, ele continua sendo respeitado (não é sobrescrito, só o default para configurações novas/reset muda).

- [ ] **Step 2: Normalização ao ler (merge com defaults + migração de `exclusoes`)**

Substituir:

```ts
export async function getCompanySettings(): Promise<CompanySettings> {
  const snap = await getDoc(companyRef)
  if (!snap.exists()) {
    await setDoc(companyRef, DEFAULT_COMPANY)
    return DEFAULT_COMPANY
  }
  return snap.data() as CompanySettings
}
```

```ts
export function subscribeCompanySettings(onData: (settings: CompanySettings) => void) {
  return onSnapshot(companyRef, (snap) => {
    if (snap.exists()) onData(snap.data() as CompanySettings)
  })
}
```

por (adicionando a função `normalizarCompanySettings` acima de ambas):

```ts
/** Documentos salvos antes destes campos existirem (ou com `exclusoes` no formato antigo,
 * texto único em vez de lista) ficam com os campos ausentes — mescla com o padrão ao ler,
 * sem tocar no Firestore. Mesmo padrão de `getCalcSettings`. */
function normalizarCompanySettings(raw: Partial<CompanySettings> & Record<string, unknown>): CompanySettings {
  const exclusoesBrutas = raw.exclusoes
  const exclusoes = Array.isArray(exclusoesBrutas)
    ? exclusoesBrutas
    : typeof exclusoesBrutas === 'string' && exclusoesBrutas
      ? [exclusoesBrutas]
      : DEFAULT_COMPANY.exclusoes
  return { ...DEFAULT_COMPANY, ...raw, exclusoes } as CompanySettings
}

export async function getCompanySettings(): Promise<CompanySettings> {
  const snap = await getDoc(companyRef)
  if (!snap.exists()) {
    await setDoc(companyRef, DEFAULT_COMPANY)
    return DEFAULT_COMPANY
  }
  return normalizarCompanySettings(snap.data())
}
```

```ts
export function subscribeCompanySettings(onData: (settings: CompanySettings) => void) {
  return onSnapshot(companyRef, (snap) => {
    if (snap.exists()) onData(normalizarCompanySettings(snap.data()))
  })
}
```

- [ ] **Step 3: `CompanyForm.tsx` — novos campos**

Trocar o bloco de garantias (linhas 93-109) — adicionar mais uma linha com "Demais equipamentos" logo abaixo do grid de 3 colunas existente:

```tsx
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Input
          label="Garantia dos painéis"
          value={form.garantias.paineis}
          onChange={(e) => set('garantias', { ...form.garantias, paineis: e.target.value })}
        />
        <Input
          label="Garantia do inversor"
          value={form.garantias.inversor}
          onChange={(e) => set('garantias', { ...form.garantias, inversor: e.target.value })}
        />
        <Input
          label="Garantia da instalação"
          value={form.garantias.instalacao}
          onChange={(e) => set('garantias', { ...form.garantias, instalacao: e.target.value })}
        />
      </div>
      <Input label="Garantia dos demais equipamentos e serviços" value={form.garantiaDemaisEquipamentos} onChange={(e) => set('garantiaDemaisEquipamentos', e.target.value)} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Input label="Nome do responsável técnico" value={form.responsavelTecnico.nome} onChange={(e) => set('responsavelTecnico', { ...form.responsavelTecnico, nome: e.target.value })} />
        <Input label="Título" value={form.responsavelTecnico.titulo} onChange={(e) => set('responsavelTecnico', { ...form.responsavelTecnico, titulo: e.target.value })} placeholder="Engenheiro eletricista" />
        <Input label="CREA" value={form.responsavelTecnico.crea} onChange={(e) => set('responsavelTecnico', { ...form.responsavelTecnico, crea: e.target.value })} />
      </div>
```

Trocar o bloco de "Exclusões" (linhas 142-150), de textarea único para lista editável — mesmo padrão de "Serviços inclusos" já existente no mesmo arquivo:

```tsx
      <div>
        <p className="mb-2 text-sm font-semibold text-graphite">Exclusões (o que não está incluso, exibido na proposta)</p>
        <div className="flex flex-col gap-2">
          {form.exclusoes.map((exclusao, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="flex-1 rounded-field border border-line bg-ivory px-3 py-2 text-sm text-graphite">{exclusao}</span>
              <button
                type="button"
                onClick={() => removerExclusao(i)}
                className="flex h-9 w-9 items-center justify-center rounded-field text-muted hover:bg-danger-soft hover:text-danger"
                aria-label={`Remover ${exclusao}`}
              >
                <Trash2 className="h-4 w-4" aria-hidden />
              </button>
            </div>
          ))}
          <div className="flex items-center gap-2">
            <input
              value={novaExclusao}
              onChange={(e) => setNovaExclusao(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), adicionarExclusao())}
              placeholder="Adicionar item de exclusão"
              className="h-10 flex-1 rounded-field border border-[#D9D3C7] bg-surface px-3 text-sm outline-none focus:ring-2 focus:ring-sun"
            />
            <Button type="button" variant="secondary" onClick={adicionarExclusao} className="h-10 px-3">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-semibold text-graphite">Observação preliminar</label>
        <textarea
          value={form.observacaoPreliminar}
          onChange={(e) => set('observacaoPreliminar', e.target.value)}
          rows={2}
          className="w-full rounded-field border border-[#D9D3C7] bg-surface p-3 text-sm text-graphite outline-none focus:ring-2 focus:ring-sun"
        />
      </div>
```

Adicionar o estado e as funções `adicionarExclusao`/`removerExclusao`, seguindo exatamente o padrão de `novoServico`/`adicionarServico`/`removerServico` já existente:

```ts
  const [novaExclusao, setNovaExclusao] = useState('')

  function adicionarExclusao() {
    if (!novaExclusao.trim()) return
    set('exclusoes', [...form.exclusoes, novaExclusao.trim()])
    setNovaExclusao('')
  }

  function removerExclusao(index: number) {
    set(
      'exclusoes',
      form.exclusoes.filter((_, i) => i !== index),
    )
  }
```

- [ ] **Step 4: `npx tsc -b`**

Expected: erros de `settings.ts`/`CompanyForm.tsx` resolvidos.

- [ ] **Step 5: Commit**

```bash
git add src/lib/data/settings.ts src/features/settings/CompanyForm.tsx
git commit -m "feat: responsavel tecnico, garantia dos demais equipamentos e exclusoes em lista"
```

---

### Task 10: `Proposal.condicoesPagamento` no editor

**Files:**
- Modify: `src/lib/data/proposals.ts` (`criarPropostaVazia`)
- Modify: `src/features/proposals/editor/steps/PrecoStep.tsx`
- Modify: `src/features/proposals/editor/ProposalEditorPage.tsx` (`EditorDraft`, `draftFromProposal`)

**Interfaces:**
- Consumes: `Proposal.condicoesPagamento` (Tarefa 2, Step 6). A normalização de propostas antigas (`normalizarProposal`) já foi feita na Tarefa 7, Step 2 — aqui só falta o default em `criarPropostaVazia` (propostas novas) e a UI.
- Produces: `condicoesPagamento` editável, consumido pela Tarefa 12.

- [ ] **Step 1: `criarPropostaVazia()` ganha o campo no topo do objeto `Proposal`**

Em `src/lib/data/proposals.ts`, `criarPropostaVazia()` retorna um `Proposal` completo — o tipo agora exige `condicoesPagamento` (Tarefa 2, Step 6). Adicionar, ao lado de `precificacao` no objeto retornado:

```ts
    precificacao: { modo: 'margem', margem: 0.25, comissao: 0, precoFinal: 0 },
    condicoesPagamento: 'A combinar',
    resultados: null,
```

- [ ] **Step 2: `EditorDraft` ganha o campo**

Em `src/features/proposals/editor/ProposalEditorPage.tsx`:

```ts
interface EditorDraft {
  clientId: string
  clienteNome: string
  entrada: ProposalEntrada
  sistema: ProposalSistema
  itens: ProposalItem[]
  servicos: ProposalServicos
  precificacao: ProposalPrecificacao
  condicoesPagamento: string
}

function draftFromProposal(p: Proposal): EditorDraft {
  return {
    clientId: p.clientId,
    clienteNome: p.clienteNome,
    entrada: p.entrada,
    sistema: p.sistema,
    itens: p.itens,
    servicos: p.servicos,
    precificacao: p.precificacao,
    condicoesPagamento: p.condicoesPagamento,
  }
}
```

E no `useDebouncedEffect` do autosave, dentro de `saveProposalFields(id, {...})`, adicionar `condicoesPagamento: draft.condicoesPagamento,`.

- [ ] **Step 3: Campo em `PrecoStep.tsx`**

Props do componente ganham `condicoesPagamento`/`onChangeCondicoesPagamento`:

```tsx
interface PrecoStepProps {
  precificacao: ProposalPrecificacao
  onChange: (precificacao: ProposalPrecificacao) => void
  resultados: ProposalResultados | null
  precoFinal: number
  calc: CalcSettings
  contaAtual: number | null
  condicoesPagamento: string
  onChangeCondicoesPagamento: (v: string) => void
}

export function PrecoStep({ precificacao, onChange, resultados, precoFinal, calc, contaAtual, condicoesPagamento, onChangeCondicoesPagamento }: PrecoStepProps) {
```

Adicionar o campo no fim do JSX, depois do parágrafo "Parcelas simuladas...":

```tsx
      <div>
        <label className="mb-1.5 block text-sm font-semibold text-graphite">Condições de pagamento (texto livre da proposta)</label>
        <textarea
          value={condicoesPagamento}
          onChange={(e) => onChangeCondicoesPagamento(e.target.value)}
          rows={2}
          className="w-full rounded-field border border-[#D9D3C7] bg-surface p-3 text-sm text-graphite outline-none focus:ring-2 focus:ring-sun"
        />
      </div>
```

- [ ] **Step 4: Passar as novas props no `ProposalEditorPage.tsx`**

No local onde `<PrecoStep ...>` é renderizado, adicionar `condicoesPagamento={draft.condicoesPagamento}` e `onChangeCondicoesPagamento={(v) => setDraft({ ...draft, condicoesPagamento: v })}`.

- [ ] **Step 5: `npx tsc -b`**

Expected: erros de `PrecoStep.tsx`/`ProposalEditorPage.tsx` relacionados a `condicoesPagamento` resolvidos (outros erros de `ProposalEditorPage.tsx` relacionados a `toPublicSnapshot`/`publicarProposta` continuam esperados até a Tarefa 11/12).

- [ ] **Step 6: Commit**

```bash
git add src/features/proposals/editor/steps/PrecoStep.tsx src/features/proposals/editor/ProposalEditorPage.tsx
git commit -m "feat: condicoes de pagamento como texto livre da proposta"
```

---

### Task 11: `getClient`, peso estimado nos resultados, `publicarProposta` atualizado

**Files:**
- Modify: `src/lib/data/clients.ts`
- Modify: `src/lib/calc/proposalResultados.ts`
- Modify: `src/lib/calc/proposalResultados.test.ts`
- Modify: `src/lib/data/proposals.ts` (`publicarProposta`)
- Modify: `src/features/proposals/editor/ProposalEditorPage.tsx`

**Interfaces:**
- Consumes: `calcularPesoEstimado` (Tarefa 4), `CatalogItemModulo.pesoKg` (Tarefa 6).
- Produces: `getClient(id)`; `ProposalResultados.pesoEstimado` preenchido; `publicarProposta(id, inversorPotenciaKw, pesoKgModulo)`. Consumido pela Tarefa 12.

- [ ] **Step 1: `getClient` em `clients.ts`**

Adicionar, seguindo o padrão de `getProposal` em `proposals.ts` (mesmo `getDoc` direto):

```ts
import { addDoc, collection, deleteDoc, doc, getDoc, onSnapshot, orderBy, query, serverTimestamp, updateDoc } from 'firebase/firestore'

// ...

export async function getClient(id: string): Promise<Client | null> {
  const snap = await getDoc(doc(db, 'clients', id))
  return snap.exists() ? ({ id: snap.id, ...snap.data() } as Client) : null
}
```

(Só adicionar `getDoc` ao import existente do `firebase/firestore` — os demais imports já estão lá.)

- [ ] **Step 2: `calcularResultadosProposta` recebe `pesoKgModulo`**

Em `src/lib/calc/proposalResultados.ts`:

```ts
import { calcularPesoEstimado, calcularRelacaoCcCa } from './dimensionamento'

export interface CalcularResultadosPropostaInput {
  entrada: ProposalEntrada
  sistema: ProposalSistema
  servicos: ProposalServicos
  precificacao: ProposalPrecificacao
  inversorPotenciaKw: number
  pesoKgModulo: number | null
  calc: CalcSettings
  anoCalendarioInicial: number
}
```

Dentro da função, desestruturar `pesoKgModulo` de `input` e, no objeto `resultados` retornado, adicionar (depois de `geracaoMensalKwh`):

```ts
      geracaoMensalKwh: geracaoMensalAno1,
      pesoEstimado: calcularPesoEstimado(sistema.qtdModulos, sistema.areaM2 ?? 0, pesoKgModulo),
```

- [ ] **Step 3: Teste em `proposalResultados.test.ts`**

Ler o arquivo primeiro (já existe 1 teste — provavelmente monta um `CalcularResultadosPropostaInput` completo). Adicionar `pesoKgModulo: null` (ou um valor) no input de teste existente para não quebrar a assinatura, e um `expect(resultados.pesoEstimado).toBeDefined()` para confirmar que o campo é propagado.

- [ ] **Step 4: `publicarProposta` recebe `pesoKgModulo`**

Em `src/lib/data/proposals.ts`:

```ts
export async function publicarProposta(id: string, inversorPotenciaKw: number, pesoKgModulo: number | null): Promise<PublicarPropostaResultado> {
```

E na chamada de `calcularResultadosProposta` dentro dela, adicionar `pesoKgModulo,` no objeto passado.

- [ ] **Step 5: `ProposalEditorPage.tsx` — lookup do módulo e repasse**

Ao lado de `inversorSelecionado` (linha 116), adicionar:

```ts
  const moduloSelecionado = useMemo(() => catalogo.find((c) => c.id === draft?.sistema.moduloId) ?? null, [catalogo, draft?.sistema.moduloId])
  const pesoKgModulo = moduloSelecionado && moduloSelecionado.categoria === 'modulo' ? moduloSelecionado.pesoKg : null
```

Na chamada de `calcularResultadosProposta` (dentro do `useMemo` de `resultados`), adicionar `pesoKgModulo,` ao objeto.

Em `handleGerarProposta`, trocar:

```ts
      await publicarProposta(id, inversorSelecionado && inversorSelecionado.categoria === 'inversor' ? inversorSelecionado.potenciaKw : 0)
```

por:

```ts
      await publicarProposta(id, inversorSelecionado && inversorSelecionado.categoria === 'inversor' ? inversorSelecionado.potenciaKw : 0, pesoKgModulo)
```

- [ ] **Step 6: `npx vitest run src/lib/calc/proposalResultados.test.ts` e `npx tsc -b`**

Expected: teste passa; erros restantes de `tsc -b` (em `toPublicSnapshot.ts` e nos 3 pontos que o chamam) continuam esperados até a Tarefa 12.

- [ ] **Step 7: Commit**

```bash
git add src/lib/data/clients.ts src/lib/calc/proposalResultados.ts src/lib/calc/proposalResultados.test.ts src/lib/data/proposals.ts src/features/proposals/editor/ProposalEditorPage.tsx
git commit -m "feat: busca cliente por id e propaga peso estimado do modulo ate os resultados"
```

---

### Task 12: `toPublicSnapshot` — reescrita e os 3 pontos de chamada

**Files:**
- Modify: `src/lib/calc/toPublicSnapshot.ts`
- Modify: `src/lib/calc/toPublicSnapshot.test.ts`
- Modify: `src/lib/data/proposals.ts` (`publicarProposta`)
- Modify: `src/features/proposals/editor/ProposalEditorPage.tsx` (`previewPublico`)
- Modify: `src/features/proposals/list/ProposalsListPage.tsx` (`handleBaixarPdf`)

**Interfaces:**
- Consumes: `getClient` (Tarefa 11), `simularPagamento` (já existe em `src/lib/calc/pagamento.ts`), todos os campos novos das Tarefas 2/7/8/9/10/11.
- Produces: `PublicProposal` completo — consumido pelas Tarefas 14 e 15 (`ProposalView.tsx`/`ProposalPdf.tsx`).

- [ ] **Step 1: Reescrever `toPublicSnapshot.ts`**

```ts
import { simularPagamento } from './pagamento'
import type { Client, CompanySettings, PublicProposal, Proposal } from '@/types/firestore'

export interface ToPublicSnapshotParams {
  proposal: Proposal
  company: CompanySettings
  client: Client | null
  taxaCartaoMensal: number
  parcelasCartao: number
  taxaFinanciamentoMensal: number
  parcelasFinanciamento: number
}

/**
 * Converte uma proposta (documento privado, com custo/margem/comissão) no snapshot
 * público que o cliente vê em `/p/:publicId`.
 *
 * REGRA DE OURO: esta função só pode copiar campos desta allowlist. Nunca adicione
 * `precificacao.margem`, `precificacao.comissao`, `precificacao.modo`, `custoUnitario`
 * dos itens, `custoTotal` ou `lucroEstimado` aqui — há um teste (`toPublicSnapshot.test.ts`)
 * que falha caso esses campos apareçam no snapshot.
 */
export function toPublicSnapshot(params: ToPublicSnapshotParams): PublicProposal {
  const { proposal, company, client, taxaCartaoMensal, parcelasCartao, taxaFinanciamentoMensal, parcelasFinanciamento } = params

  if (!proposal.resultados) {
    throw new Error('Proposta sem resultados calculados — calcule antes de gerar o snapshot público.')
  }

  const precoFinal = proposal.precificacao.precoFinal
  const pagamento = simularPagamento(precoFinal, taxaCartaoMensal, parcelasCartao, taxaFinanciamentoMensal, parcelasFinanciamento, proposal.entrada.contaAtual)

  return {
    publicId: proposal.publicId,
    numero: proposal.numero,
    versao: proposal.versao,
    status: proposal.status,
    clienteNome: proposal.clienteNome,
    cliente: {
      cpfCnpj: client?.cpfCnpj ?? '',
      telefone: client?.telefone ?? '',
      endereco: client?.endereco ?? '',
      cidade: client?.cidade ?? '',
    },
    criadoEm: proposal.criadoEm,
    atualizadoEm: proposal.atualizadoEm,
    validaAte: proposal.validaAte,
    entrada: {
      consumoMedioKwh: proposal.entrada.consumoMedioKwh,
      consumoMensalKwh: proposal.entrada.consumoMensalKwh,
      contaAtual: proposal.entrada.contaAtual,
      ligacao: proposal.entrada.ligacao,
      tipoImovel: proposal.entrada.tipoImovel,
      tipoTelhado: proposal.entrada.tipoTelhado,
      alturaInstalacao: proposal.entrada.alturaInstalacao,
      inclinacaoGraus: proposal.entrada.inclinacaoGraus,
      orientacaoTelhado: proposal.entrada.orientacaoTelhado,
      distribuidora: proposal.entrada.distribuidora,
      unidadeConsumidora: proposal.entrada.unidadeConsumidora,
      coordenadas: proposal.entrada.coordenadas,
    },
    sistema: { ...proposal.sistema },
    itens: proposal.itens.map((item) => ({
      id: item.id,
      descricao: item.descricao,
      especificacao: item.especificacao,
      quantidade: item.quantidade,
      unidade: item.unidade,
      status: item.status,
    })),
    resultados: {
      precoPorWp: proposal.resultados.precoPorWp,
      geracaoMediaMensalKwh: proposal.resultados.geracaoMediaMensalKwh,
      economiaAno1Conservador: proposal.resultados.economiaAno1Conservador,
      economiaAno1Otimista: proposal.resultados.economiaAno1Otimista,
      economia25AnosConservador: proposal.resultados.economia25AnosConservador,
      economia25AnosOtimista: proposal.resultados.economia25AnosOtimista,
      paybackMesesConservador: proposal.resultados.paybackMesesConservador,
      paybackMesesOtimista: proposal.resultados.paybackMesesOtimista,
      custoKwhGerado: proposal.resultados.custoKwhGerado,
      relacaoCcCa: proposal.resultados.relacaoCcCa,
      contaAntesMediaMensal: proposal.resultados.contaAntesMediaMensal,
      contaDepoisMediaMensal: proposal.resultados.contaDepoisMediaMensal,
      percentualEconomiaMensal: proposal.resultados.percentualEconomiaMensal,
      geracaoMensalKwh: proposal.resultados.geracaoMensalKwh,
      pesoEstimado: proposal.resultados.pesoEstimado,
    },
    precoFinal,
    condicoesPagamento: proposal.condicoesPagamento,
    pagamento: {
      cartao: { parcelas: parcelasCartao, valor: pagamento.parcelaCartao },
      financiamento: { parcelas: parcelasFinanciamento, valor: pagamento.parcelaFinanciamento },
    },
    empresa: {
      nome: company.nome,
      parceria: company.parceria,
      cnpj: company.cnpj,
      cidade: company.cidade,
      whatsapp: company.whatsapp,
      instagram: company.instagram,
      logoUrl: company.logoUrl,
    },
    validadeDias: company.validadeDias,
    prazoInstalacao: company.prazoInstalacao,
    garantias: company.garantias,
    garantiaDemaisEquipamentos: company.garantiaDemaisEquipamentos,
    servicosInclusos: company.servicosInclusos,
    exclusoes: company.exclusoes,
    observacaoPreliminar: company.observacaoPreliminar,
    responsavelTecnico: company.responsavelTecnico,
  }
}
```

- [ ] **Step 2: Atualizar `toPublicSnapshot.test.ts`**

Ler o arquivo (já lido nesta sessão — usa `buildProposal()`/`buildCompany()`). Ajustar:

- `buildProposal()`: adicionar `condicoesPagamento: 'A combinar'` e os novos campos de `entrada` (`tipoImovel: ''`, `tipoTelhado: ''`, `alturaInstalacao: ''`, `inclinacaoGraus: null`, `orientacaoTelhado: ''`, `distribuidora: 'Equatorial Goiás'`, `unidadeConsumidora: ''`, `coordenadas: { lat: null, lng: null }`), e `resultados.pesoEstimado: { totalKg: 324, kgPorM2: 13.5, estimativa: true }`.
- `buildCompany()`: trocar `exclusoes: 'Não inclui reforço de padrão de entrada.'` por `exclusoes: ['Não inclui reforço de padrão de entrada.']`, e adicionar `observacaoPreliminar: 'Orçamento preliminar.'`, `garantiaDemaisEquipamentos: '1 ano'`, `responsavelTecnico: { nome: 'Fulano', titulo: 'Engenheiro', crea: '123' }`.
- Adicionar uma função `buildClient(): Client` mínima (nome, cpfCnpj, telefone, endereco, cidade, email, observacoes, cep, criadoEm — usar os mesmos valores sentinela de estilo do arquivo).
- Os dois `it(...)` passam a chamar:
  ```ts
  const snapshot = toPublicSnapshot({
    proposal: buildProposal(),
    company: buildCompany(),
    client: buildClient(),
    taxaCartaoMensal: 0.0099,
    parcelasCartao: 12,
    taxaFinanciamentoMensal: 0.0149,
    parcelasFinanciamento: 60,
  })
  ```
- O segundo teste (`'mantém os dados que o cliente precisa ver'`) ganha mais um `expect`: `expect(snapshot.cliente.cpfCnpj).toBe('111.444.777-35')` (ou o valor usado em `buildClient`).
- `FORBIDDEN_KEYS` continua igual — `pagamento`/`condicoesPagamento`/`cliente` não são proibidos (não são custo interno).

- [ ] **Step 3: `publicarProposta` — buscar `client` e `calc`, repassar**

Em `src/lib/data/proposals.ts`, `publicarProposta` já busca `calc` via `Promise.all`. Adicionar a busca do cliente:

```ts
export async function publicarProposta(id: string, inversorPotenciaKw: number, pesoKgModulo: number | null): Promise<PublicarPropostaResultado> {
  const [proposalSnap, calc, company] = await Promise.all([getDoc(doc(db, 'proposals', id)), getCalcSettings(), getCompanySettings()])

  if (!proposalSnap.exists()) throw new Error('Proposta não encontrada.')
  const proposal = normalizarProposal({ id: proposalSnap.id, ...proposalSnap.data() } as Proposal)
  const client = await getClient(proposal.clientId)
```

(mover o `getClient` para depois de `proposal` estar disponível, já que precisa de `proposal.clientId`). E na chamada final de `toPublicSnapshot`:

```ts
  const publicSnapshot = toPublicSnapshot({
    proposal: propostaAtualizada,
    company,
    client,
    taxaCartaoMensal: calc.taxaCartaoMensal,
    parcelasCartao: calc.parcelasCartao,
    taxaFinanciamentoMensal: calc.taxaFinanciamentoMensal,
    parcelasFinanciamento: calc.parcelasFinanciamento,
  })
```

Adicionar `getClient` ao import de `./clients` no topo do arquivo.

- [ ] **Step 4: `ProposalEditorPage.tsx` — preview**

O `useMemo` de `previewPublico` (linha ~156) já tem `calc`/`company`/`clients` disponíveis em state. Trocar:

```ts
  const previewPublico: PublicProposal | null = useMemo(() => {
    if (!proposal || !draft || !company || !calc || !resultados) return null
    const propostaTemp: Proposal = { ...proposal, ...draft, precificacao: { ...draft.precificacao, precoFinal }, resultados }
    try {
      return toPublicSnapshot({ proposal: propostaTemp, company })
    } catch {
      return null
    }
  }, [proposal, draft, company, calc, resultados, precoFinal])
```

por:

```ts
  const previewPublico: PublicProposal | null = useMemo(() => {
    if (!proposal || !draft || !company || !calc || !resultados) return null
    const propostaTemp: Proposal = { ...proposal, ...draft, precificacao: { ...draft.precificacao, precoFinal }, resultados }
    const clienteSelecionado = clients.find((c) => c.id === draft.clientId) ?? null
    try {
      return toPublicSnapshot({
        proposal: propostaTemp,
        company,
        client: clienteSelecionado,
        taxaCartaoMensal: calc.taxaCartaoMensal,
        parcelasCartao: calc.parcelasCartao,
        taxaFinanciamentoMensal: calc.taxaFinanciamentoMensal,
        parcelasFinanciamento: calc.parcelasFinanciamento,
      })
    } catch {
      return null
    }
  }, [proposal, draft, company, calc, resultados, precoFinal, clients])
```

- [ ] **Step 5: `ProposalsListPage.tsx` — "Baixar PDF"**

Hoje (depois da mudança desta manhã) o handler só busca `company`. Trocar:

```ts
  const [company, setCompany] = useState<CompanySettings | null>(null)

  useEffect(() => subscribeProposals(setPropostas), [])
  useEffect(() => {
    getCompanySettings().then(setCompany)
  }, [])
```

por (volta a buscar `calc` também):

```ts
  const [calc, setCalc] = useState<CalcSettings | null>(null)
  const [company, setCompany] = useState<CompanySettings | null>(null)

  useEffect(() => subscribeProposals(setPropostas), [])
  useEffect(() => {
    getCalcSettings().then(setCalc)
    getCompanySettings().then(setCompany)
  }, [])
```

E o handler:

```ts
  async function handleBaixarPdf(p: Proposal) {
    if (!company || !p.resultados) return
    const { downloadProposalPdf } = await import('@/features/pdf/downloadProposalPdf')
    const snapshot = toPublicSnapshot({ proposal: p, company })
    await downloadProposalPdf(snapshot)
  }
```

por:

```ts
  async function handleBaixarPdf(p: Proposal) {
    if (!calc || !company || !p.resultados) return
    const cliente = await getClient(p.clientId)
    const { downloadProposalPdf } = await import('@/features/pdf/downloadProposalPdf')
    const snapshot = toPublicSnapshot({
      proposal: p,
      company,
      client: cliente,
      taxaCartaoMensal: calc.taxaCartaoMensal,
      parcelasCartao: calc.parcelasCartao,
      taxaFinanciamentoMensal: calc.taxaFinanciamentoMensal,
      parcelasFinanciamento: calc.parcelasFinanciamento,
    })
    await downloadProposalPdf(snapshot)
  }
```

Atualizar os imports: `getCalcSettings` volta a entrar em `import { getCalcSettings, getCompanySettings } from '@/lib/data/settings'`, `CalcSettings` volta ao `import type {...} from '@/types/firestore'`, e adicionar `import { getClient } from '@/lib/data/clients'`.

- [ ] **Step 6: `npx vitest run src/lib/calc/toPublicSnapshot.test.ts` e `npx tsc -b`**

Expected: teste passa; `tsc -b` sem erros em nenhum dos 5 arquivos desta tarefa. Erros restantes (se houver) só em `ProposalView.tsx`/`ProposalPdf.tsx`, resolvidos nas Tarefas 14/15.

- [ ] **Step 7: Commit**

```bash
git add src/lib/calc/toPublicSnapshot.ts src/lib/calc/toPublicSnapshot.test.ts src/lib/data/proposals.ts src/features/proposals/editor/ProposalEditorPage.tsx src/features/proposals/list/ProposalsListPage.tsx
git commit -m "feat: toPublicSnapshot ganha cliente, condicoes de pagamento e ficha tecnica completa"
```

---

### Task 13: QR Code e gráfico do PDF

**Files:**
- Modify: `package.json` (dependência `qrcode`)
- Modify: `src/features/pdf/downloadProposalPdf.tsx`
- Create: `src/features/pdf/ProposalPdfChart.tsx`

**Interfaces:**
- Produces: `downloadProposalPdf` gera `qrCodeDataUrl` e passa para `<ProposalPdf>`; `<ProposalPdfChart meses consumo geracao />`. Consumido pela Tarefa 15.

- [ ] **Step 1: Instalar dependência**

```bash
npm install qrcode
npm install -D @types/qrcode
```

- [ ] **Step 2: `downloadProposalPdf.tsx` gera o QR Code**

```tsx
import { pdf } from '@react-pdf/renderer'
import QRCode from 'qrcode'
import type { PublicProposal } from '@/types/firestore'
import { ProposalPdf } from './ProposalPdf'

function publicUrl(publicId: string): string {
  const base = import.meta.env.VITE_PUBLIC_BASE_URL || window.location.origin
  return `${base}/p/${publicId}`
}

export async function downloadProposalPdf(proposal: PublicProposal): Promise<void> {
  const qrCodeDataUrl = await QRCode.toDataURL(publicUrl(proposal.publicId), { margin: 1, width: 160 })
  const blob = await pdf(<ProposalPdf proposal={proposal} qrCodeDataUrl={qrCodeDataUrl} />).toBlob()
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `Proposta-${proposal.numero}-v${proposal.versao}.pdf`
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}
```

(A função `publicUrl` some de `ProposalPdf.tsx` na Tarefa 15 — aqui ela nasce, já com o `VITE_PUBLIC_BASE_URL`, para poder gerar o QR Code com a mesma URL que o rodapé do PDF vai mostrar.)

- [ ] **Step 3: `ProposalPdfChart.tsx`**

```tsx
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
          return (
            <View key={mes}>
              <Rect x={xConsumo} y={ALTURA_BARRAS - alturaConsumo} width={LARGURA_BARRA} height={alturaConsumo} fill={cores.barNeutral} rx={2} />
              <Rect x={xGeracao} y={ALTURA_BARRAS - alturaGeracao} width={LARGURA_BARRA} height={alturaGeracao} fill={cores.sun} rx={2} />
              <Text x={xMes + LARGURA_MES / 2} y={ALTURA_BARRAS + 12} textAnchor="middle" style={{ fontSize: 6, fill: cores.muted }}>
                {mes}
              </Text>
            </View>
          )
        })}
        <Rect x={0} y={ALTURA_BARRAS} width={LARGURA} height={1} fill="#E6E1D7" />
      </Svg>
    </View>
  )
}
```

Nota: `<View>` dentro de `<Svg>` não é um elemento SVG válido em react-pdf — trocar por `<React.Fragment key={mes}>` (ou usar `key` diretamente no primeiro `<Rect>` e não agrupar). Usar:

```tsx
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
```

(usar esta segunda versão — um array de elementos SVG irmãos, sem `View` como filho de `Svg` — e remover o bloco anterior com `<View key={mes}>`.)

- [ ] **Step 4: `npx tsc -b`**

Expected: `downloadProposalPdf.tsx` e `ProposalPdfChart.tsx` compilam. `ProposalPdf.tsx` ainda não recebe `qrCodeDataUrl` como prop — erro esperado até a Tarefa 15.

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json src/features/pdf/downloadProposalPdf.tsx src/features/pdf/ProposalPdfChart.tsx
git commit -m "feat: geracao de qr code e componente de grafico para o pdf"
```

---

### Task 14: `ProposalView.tsx` — novas seções e ajustes de texto

**Files:**
- Modify: `src/features/public/ProposalView.tsx`

**Interfaces:**
- Consumes: `PublicProposal` completo (Tarefa 12), `formatPayback`/`plural` (Tarefa 3), `unidadeItemExibicao` (Tarefa 5).

- [ ] **Step 1: Imports**

```tsx
import { AlertTriangle, Download, MessageCircle } from 'lucide-react'
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { BrandLogo } from '@/components/ui/SunLogo'
import { StatusItemChip } from '@/components/ui/Chip'
import { formatBRL, formatDataPorExtenso, formatDateBR, formatKwh, formatKwp, formatNumber, formatPayback, formatPercent } from '@/lib/format'
import { unidadeItemExibicao } from '@/features/catalog/catalogDisplay'
import type { PublicProposal } from '@/types/firestore'
```

- [ ] **Step 2: Cabeçalho — dados do cliente (seção 5a do spec)**

Depois do bloco `{/* 1. Topo */}` (fecha na linha 48) e antes de `{preview && (...)}`, adicionar:

```tsx
        <ClienteHeaderInfo proposal={proposal} />
```

E, fora do componente `ProposalView`, o componente auxiliar:

```tsx
function ClienteHeaderInfo({ proposal }: { proposal: PublicProposal }) {
  const linhas = [
    proposal.clienteNome,
    proposal.cliente.cpfCnpj,
    proposal.cliente.telefone,
    proposal.cliente.endereco,
    [proposal.cliente.cidade, proposal.entrada.unidadeConsumidora ? `UC ${proposal.entrada.unidadeConsumidora}` : ''].filter(Boolean).join(' · '),
  ].filter(Boolean)

  if (linhas.length === 0) return null

  return (
    <p className="mb-6 text-xs text-muted">{linhas.join(' · ')}</p>
  )
}
```

- [ ] **Step 3: "Ficha técnica da instalação" (seção 5b) — depois do hero, antes do grid do gráfico**

Depois do fechamento de `</section>` do hero (linha 86) e antes de `<div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-3">` (linha 88):

```tsx
        <FichaTecnicaCard proposal={proposal} />
```

Componente auxiliar (rótulos reaproveitam os labels já existentes em `catalogLabels.ts` quando fizer sentido — `TIPO_TELHADO_LABELS`):

```tsx
const TIPO_IMOVEL_LABELS: Record<string, string> = { residencial: 'Residencial', comercial: 'Comercial', rural: 'Rural', industrial: 'Industrial' }
const ALTURA_LABELS: Record<string, string> = { ate_5m: 'Até 5 m', '5_12m': '5 a 12 m', acima_12m: 'Acima de 12 m' }
const ORIENTACAO_LABELS: Record<string, string> = { norte: 'Norte', nordeste: 'Nordeste', noroeste: 'Noroeste', leste: 'Leste', oeste: 'Oeste', sul: 'Sul' }

function FichaTecnicaCard({ proposal }: { proposal: PublicProposal }) {
  const { entrada, sistema, resultados } = proposal
  const campos: { label: string; valor: string }[] = []

  if (entrada.tipoImovel) campos.push({ label: 'Tipo de imóvel', valor: TIPO_IMOVEL_LABELS[entrada.tipoImovel] ?? entrada.tipoImovel })
  if (entrada.tipoTelhado) campos.push({ label: 'Tipo de telhado', valor: TIPO_TELHADO_LABELS[entrada.tipoTelhado] ?? entrada.tipoTelhado })
  if (entrada.alturaInstalacao) campos.push({ label: 'Altura', valor: ALTURA_LABELS[entrada.alturaInstalacao] ?? entrada.alturaInstalacao })
  if (entrada.inclinacaoGraus != null) campos.push({ label: 'Inclinação', valor: `${entrada.inclinacaoGraus}°` })
  if (entrada.orientacaoTelhado) campos.push({ label: 'Orientação', valor: ORIENTACAO_LABELS[entrada.orientacaoTelhado] ?? entrada.orientacaoTelhado })
  if (entrada.distribuidora) campos.push({ label: 'Distribuidora', valor: entrada.distribuidora })
  if (entrada.unidadeConsumidora) campos.push({ label: 'Unidade consumidora', valor: entrada.unidadeConsumidora })
  if (entrada.coordenadas.lat != null && entrada.coordenadas.lng != null) campos.push({ label: 'Coordenadas', valor: `${entrada.coordenadas.lat}, ${entrada.coordenadas.lng}` })
  if (sistema.areaM2 != null) campos.push({ label: 'Área necessária', valor: `${formatNumber(sistema.areaM2, 1)} m²` })
  campos.push({
    label: 'Peso estimado',
    valor: `${formatNumber(resultados.pesoEstimado.totalKg, 0)} kg (${formatNumber(resultados.pesoEstimado.kgPorM2, 1)} kg/m²)${resultados.pesoEstimado.estimativa ? ' — estimativa' : ''}`,
  })

  if (campos.length === 0) return null

  return (
    <section className="mb-8 rounded-card bg-surface p-5 shadow-card">
      <h2 className="mb-4 text-base font-bold text-graphite">Ficha técnica da instalação</h2>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {campos.map((c) => (
          <div key={c.label}>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">{c.label}</p>
            <p className="text-sm font-semibold text-graphite">{c.valor}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
```

Adicionar `import { TIPO_TELHADO_LABELS } from '@/features/catalog/catalogLabels'` no topo do arquivo.

- [ ] **Step 4: Nota da taxa mínima (seção 5c) — dentro do hero, depois dos 4 stats**

Depois do `</div>` que fecha o grid de `HeroStat` (linha 85), dentro da `<section className="mb-8 rounded-hero...">`:

```tsx
          <p className="mt-4 text-[11px] text-muted-dark">Mesmo com o sistema, permanece a cobrança da taxa mínima de disponibilidade da rede.</p>
```

- [ ] **Step 5: Equipamentos — pluralizar unidade**

Trocar:

```tsx
                    <p className="truncate text-xs text-muted">
                      {item.quantidade} {item.unidade} {item.especificacao && `· ${item.especificacao}`}
                    </p>
```

por:

```tsx
                    <p className="truncate text-xs text-muted">
                      {item.quantidade} {unidadeItemExibicao(item.quantidade, item.unidade)} {item.especificacao && `· ${item.especificacao}`}
                    </p>
```

- [ ] **Step 6: Payback — usar `formatPayback`**

Em `CenarioCard`, trocar:

```tsx
      <p className="mt-2 text-sm font-semibold text-graphite">
        Payback: {paybackMeses ? `${Math.floor(paybackMeses / 12)} anos e ${paybackMeses % 12} meses` : 'fora do horizonte de 25 anos'}
      </p>
```

por:

```tsx
      <p className="mt-2 text-sm font-semibold text-graphite">Payback: {formatPayback(paybackMeses)}</p>
```

- [ ] **Step 7: "Não incluso" vira lista + observação, garantias ganha "Demais equipamentos" (seções 5d/5e)**

Trocar o bloco de "Incluso, garantias, prazo, exclusões" inteiro:

```tsx
        {/* 8. Incluso, garantias, prazo, exclusões */}
        <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-3">
          <InfoCard titulo="O que está incluso">
            <ul className="flex flex-col gap-1.5">
              {proposal.servicosInclusos.map((s, i) => (
                <li key={i} className="text-sm text-graphite">
                  · {s}
                </li>
              ))}
            </ul>
          </InfoCard>
          <InfoCard titulo="Garantias">
            <p className="text-sm text-graphite">Painéis: {proposal.garantias.paineis}</p>
            <p className="text-sm text-graphite">Inversor: {proposal.garantias.inversor}</p>
            {proposal.garantias.instalacao && <p className="text-sm text-graphite">Instalação: {proposal.garantias.instalacao}</p>}
            <p className="mt-3 text-sm text-graphite">Prazo: {proposal.prazoInstalacao}</p>
          </InfoCard>
          <InfoCard titulo="Não incluso">
            <p className="text-sm text-graphite">{proposal.exclusoes}</p>
          </InfoCard>
        </div>
```

por:

```tsx
        {/* 8. Incluso, garantias, prazo, exclusões */}
        <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-3">
          <InfoCard titulo="O que está incluso">
            <ul className="flex flex-col gap-1.5">
              {proposal.servicosInclusos.map((s, i) => (
                <li key={i} className="text-sm text-graphite">
                  · {s}
                </li>
              ))}
            </ul>
          </InfoCard>
          <InfoCard titulo="Garantias">
            <p className="text-sm text-graphite">Painéis: {proposal.garantias.paineis}</p>
            <p className="text-sm text-graphite">Inversor: {proposal.garantias.inversor}</p>
            {proposal.garantias.instalacao && <p className="text-sm text-graphite">Instalação: {proposal.garantias.instalacao}</p>}
            <p className="text-sm text-graphite">Demais equipamentos e serviços: {proposal.garantiaDemaisEquipamentos}</p>
            <p className="mt-3 text-sm text-graphite">Prazo: {proposal.prazoInstalacao}</p>
          </InfoCard>
          <InfoCard titulo="Não incluso">
            <ul className="flex flex-col gap-1.5">
              {proposal.exclusoes.map((e, i) => (
                <li key={i} className="text-sm text-graphite">
                  · {e}
                </li>
              ))}
            </ul>
            {proposal.observacaoPreliminar && <p className="mt-3 text-xs text-muted">{proposal.observacaoPreliminar}</p>}
          </InfoCard>
        </div>
```

- [ ] **Step 8: "Condições de pagamento" (seção 5f) — nova seção antes do grid de garantias**

Antes do `<div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-3">` da Step 7 (incluso/garantias/não-incluso), adicionar:

```tsx
        <CondicoesPagamentoCard proposal={proposal} />
```

Componente auxiliar:

```tsx
function CondicoesPagamentoCard({ proposal }: { proposal: PublicProposal }) {
  return (
    <section className="mb-8 rounded-card bg-surface p-5 shadow-card">
      <h2 className="mb-4 text-base font-bold text-graphite">Condições de pagamento</h2>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-field bg-chip p-3">
          <p className="text-[11px] font-bold uppercase text-muted">À vista</p>
          <p className="tabular-nums text-lg font-extrabold text-graphite">{formatBRL(proposal.precoFinal, false)}</p>
        </div>
        <div className="rounded-field bg-chip p-3">
          <p className="text-[11px] font-bold uppercase text-muted">Cartão {proposal.pagamento.cartao.parcelas}x</p>
          <p className="tabular-nums text-lg font-extrabold text-graphite">{formatBRL(proposal.pagamento.cartao.valor)}</p>
        </div>
        <div className="rounded-field bg-chip p-3">
          <p className="text-[11px] font-bold uppercase text-muted">Financiamento {proposal.pagamento.financiamento.parcelas}x</p>
          <p className="tabular-nums text-lg font-extrabold text-graphite">{formatBRL(proposal.pagamento.financiamento.valor)}</p>
        </div>
      </div>
      {proposal.condicoesPagamento && <p className="mt-3 text-xs text-muted">{proposal.condicoesPagamento}</p>}
    </section>
  )
}
```

- [ ] **Step 9: Fechamento do documento (seção 5g) — antes do rodapé fixo**

Antes de `{/* 10. Rodapé */}` (logo antes de `<footer ...>`), adicionar:

```tsx
        <FechamentoDocumento proposal={proposal} />
```

Componente auxiliar:

```tsx
function FechamentoDocumento({ proposal }: { proposal: PublicProposal }) {
  const cidade = proposal.empresa.cidade.split(',')[0].trim()
  const { nome, titulo, crea } = proposal.responsavelTecnico
  return (
    <div className="mb-8 border-t border-line pt-6">
      <p className="text-sm text-graphite">
        {cidade}, {formatDataPorExtenso(proposal.atualizadoEm.toDate())}
      </p>
      {nome && (
        <div className="mt-6">
          <p className="text-sm font-semibold text-graphite">{nome}</p>
          <p className="text-xs text-muted">
            {[titulo, crea ? `CREA ${crea}` : ''].filter(Boolean).join(' · ')}
          </p>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 10: Ajustes de texto — "retorno garantido" → "retorno estimado", garantia dos painéis**

Buscar `retorno garantido` em `ProposalView.tsx` (e no restante do repo, `grep -rn "retorno garantido" src/`) e trocar por `retorno estimado` onde aparecer como texto fixo. (Se a busca não encontrar nada em `ProposalView.tsx`/`ProposalPdf.tsx`, confirmar que não existe mesmo antes de seguir — não inventar um lugar para o texto.)

A garantia "25 anos de garantia de performance" já vem de `company.garantias.paineis` (Tarefa 9, `DEFAULT_COMPANY`) — não há texto fixo "20 anos" a trocar em `ProposalView.tsx` (a tela só exibe `proposal.garantias.paineis`, dado configurável). Confirmar com `grep -n "20 anos" src/features/public/ProposalView.tsx src/features/pdf/ProposalPdf.tsx` que não há ocorrência fixa; se houver, trocar por `25 anos de garantia de performance`.

- [ ] **Step 11: `npx tsc -b`**

Expected: `ProposalView.tsx` compila sem erros.

- [ ] **Step 12: Commit**

```bash
git add src/features/public/ProposalView.tsx
git commit -m "feat: novas secoes da proposta publica (ficha tecnica, pagamento, fechamento) e ajustes de texto"
```

---

### Task 15: `ProposalPdf.tsx` — espelha as novas seções, gráfico, QR Code

**Files:**
- Modify: `src/features/pdf/ProposalPdf.tsx`
- Modify: `src/features/pdf/downloadProposalPdf.tsx` (passa a prop `url` além de `qrCodeDataUrl`)
- Modify: `.env.example`

**Interfaces:**
- Consumes: tudo da Tarefa 14 (mesma fonte de dados, `PublicProposal`), `ProposalPdfChart` (Tarefa 13), `qrCodeDataUrl` prop (Tarefa 13).

- [ ] **Step 1: Imports e nova prop**

```tsx
import { Circle, Document, Image, Line, Link, Page, StyleSheet, Svg, Text, View } from '@react-pdf/renderer'
import { formatBRL, formatDataPorExtenso, formatDateBR, formatKwh, formatKwp, formatNumber, formatPayback, formatPercent } from '@/lib/format'
import { unidadeItemExibicao } from '@/features/catalog/catalogDisplay'
import { TIPO_TELHADO_LABELS } from '@/features/catalog/catalogLabels'
import type { PublicProposal } from '@/types/firestore'
import { registrarFontesPdf } from './fonts'
import { ProposalPdfChart } from './ProposalPdfChart'
```

Trocar a assinatura do componente e remover `publicUrl` local (agora vem pronta via prop, calculada em `downloadProposalPdf.tsx` na Tarefa 13 — o PDF só precisa saber a URL final para o rodapé e o link, então recebe `publicUrl` já pronta também como prop, evitando duplicar a leitura de `VITE_PUBLIC_BASE_URL` em dois lugares):

```tsx
export function ProposalPdf({ proposal, qrCodeDataUrl, url }: { proposal: PublicProposal; qrCodeDataUrl: string; url: string }) {
```

Remover a função `publicUrl` inteira (ela já foi recriada em `downloadProposalPdf.tsx` na Tarefa 13) e a linha `const url = publicUrl(proposal.publicId)` do corpo do componente.

Voltar em `downloadProposalPdf.tsx` (Tarefa 13) e ajustar a chamada para passar `url` também:

```tsx
  const url = publicUrl(proposal.publicId)
  const qrCodeDataUrl = await QRCode.toDataURL(url, { margin: 1, width: 160 })
  const blob = await pdf(<ProposalPdf proposal={proposal} qrCodeDataUrl={qrCodeDataUrl} url={url} />).toBlob()
```

- [ ] **Step 2: Gráfico — inserir card entre o hero e os cards de cenário**

Depois do fechamento do `</View>` do hero (`wrap={false}`, linha ~128) e antes do `<View style={styles.row}>` dos cards de cenário (linha 130), adicionar:

```tsx
        <View style={styles.card} wrap={false}>
          <Text style={styles.sectionTitle}>Consumo × geração, mês a mês</Text>
          <ProposalPdfChart
            meses={['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']}
            consumo={(proposal.entrada.consumoMensalKwh ?? new Array(12).fill(proposal.entrada.consumoMedioKwh ?? 0)).map((v) => Math.round(v ?? 0))}
            geracao={proposal.resultados.geracaoMensalKwh.map((v) => Math.round(v))}
          />
        </View>
```

- [ ] **Step 3: Cabeçalho — dados do cliente**

Depois do `</View>` que fecha `styles.spaceBetween` (linha 97) e antes do `<View style={styles.hero}>`, adicionar:

```tsx
        {(() => {
          const linhas = [
            proposal.clienteNome,
            proposal.cliente.cpfCnpj,
            proposal.cliente.telefone,
            proposal.cliente.endereco,
            [proposal.cliente.cidade, proposal.entrada.unidadeConsumidora ? `UC ${proposal.entrada.unidadeConsumidora}` : ''].filter(Boolean).join(' · '),
          ].filter(Boolean)
          return linhas.length > 0 ? <Text style={{ fontSize: 8, color: cores.muted, marginTop: 8 }}>{linhas.join(' · ')}</Text> : null
        })()}
```

- [ ] **Step 4: Ficha técnica da instalação**

Depois do `</View>` que fecha o hero e depois do card do gráfico (Step 2 acima), antes do `<View style={styles.row}>` dos cards de cenário:

```tsx
        <View style={styles.card} wrap={false}>
          <Text style={styles.sectionTitle}>Ficha técnica da instalação</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
            {fichaTecnicaCampos(proposal).map((c) => (
              <View key={c.label} style={{ width: '50%', marginBottom: 6 }}>
                <Text style={{ fontSize: 7, color: cores.muted, textTransform: 'uppercase' }}>{c.label}</Text>
                <Text style={{ fontSize: 9, fontWeight: 700 }}>{c.valor}</Text>
              </View>
            ))}
          </View>
        </View>
```

E, fora do componente `ProposalPdf`, a função auxiliar (mesma lógica da Tarefa 14, Step 3, mas devolvendo array em vez de JSX):

```tsx
const TIPO_IMOVEL_LABELS: Record<string, string> = { residencial: 'Residencial', comercial: 'Comercial', rural: 'Rural', industrial: 'Industrial' }
const ALTURA_LABELS: Record<string, string> = { ate_5m: 'Até 5 m', '5_12m': '5 a 12 m', acima_12m: 'Acima de 12 m' }
const ORIENTACAO_LABELS: Record<string, string> = { norte: 'Norte', nordeste: 'Nordeste', noroeste: 'Noroeste', leste: 'Leste', oeste: 'Oeste', sul: 'Sul' }

function fichaTecnicaCampos(proposal: PublicProposal): { label: string; valor: string }[] {
  const { entrada, sistema, resultados } = proposal
  const campos: { label: string; valor: string }[] = []
  if (entrada.tipoImovel) campos.push({ label: 'Tipo de imóvel', valor: TIPO_IMOVEL_LABELS[entrada.tipoImovel] ?? entrada.tipoImovel })
  if (entrada.tipoTelhado) campos.push({ label: 'Tipo de telhado', valor: TIPO_TELHADO_LABELS[entrada.tipoTelhado] ?? entrada.tipoTelhado })
  if (entrada.alturaInstalacao) campos.push({ label: 'Altura', valor: ALTURA_LABELS[entrada.alturaInstalacao] ?? entrada.alturaInstalacao })
  if (entrada.inclinacaoGraus != null) campos.push({ label: 'Inclinação', valor: `${entrada.inclinacaoGraus}°` })
  if (entrada.orientacaoTelhado) campos.push({ label: 'Orientação', valor: ORIENTACAO_LABELS[entrada.orientacaoTelhado] ?? entrada.orientacaoTelhado })
  if (entrada.distribuidora) campos.push({ label: 'Distribuidora', valor: entrada.distribuidora })
  if (entrada.unidadeConsumidora) campos.push({ label: 'Unidade consumidora', valor: entrada.unidadeConsumidora })
  if (entrada.coordenadas.lat != null && entrada.coordenadas.lng != null) campos.push({ label: 'Coordenadas', valor: `${entrada.coordenadas.lat}, ${entrada.coordenadas.lng}` })
  if (sistema.areaM2 != null) campos.push({ label: 'Área necessária', valor: `${formatNumber(sistema.areaM2, 1)} m²` })
  campos.push({
    label: 'Peso estimado',
    valor: `${formatNumber(resultados.pesoEstimado.totalKg, 0)} kg (${formatNumber(resultados.pesoEstimado.kgPorM2, 1)} kg/m²)${resultados.pesoEstimado.estimativa ? ' — estimativa' : ''}`,
  })
  return campos
}
```

- [ ] **Step 5: Nota da taxa mínima**

Dentro do `<View style={styles.hero} wrap={false}>`, depois do `</View>` que fecha o grid de `statBox` (linha 127):

```tsx
          <Text style={[styles.heroText, { fontSize: 7, marginTop: 8 }]}>
            Mesmo com o sistema, permanece a cobrança da taxa mínima de disponibilidade da rede.
          </Text>
```

- [ ] **Step 6: Equipamentos — pluralizar, payback em anos e meses**

Trocar:

```tsx
                <Text style={{ fontSize: 8, color: cores.muted }}>
                  {item.quantidade} {item.unidade} {item.especificacao ? `· ${item.especificacao}` : ''}
                </Text>
```

por:

```tsx
                <Text style={{ fontSize: 8, color: cores.muted }}>
                  {item.quantidade} {unidadeItemExibicao(item.quantidade, item.unidade)} {item.especificacao ? `· ${item.especificacao}` : ''}
                </Text>
```

Trocar as duas linhas de payback (cenário conservador e otimista):

```tsx
            <Text style={{ fontSize: 9, fontWeight: 700 }}>
              Payback: {proposal.resultados.paybackMesesConservador ? `${Math.floor(proposal.resultados.paybackMesesConservador / 12)} anos` : 'fora do horizonte'}
            </Text>
```

```tsx
            <Text style={{ fontSize: 9, fontWeight: 700 }}>
              Payback: {proposal.resultados.paybackMesesOtimista ? `${Math.floor(proposal.resultados.paybackMesesOtimista / 12)} anos` : 'fora do horizonte'}
            </Text>
```

por (respectivamente):

```tsx
            <Text style={{ fontSize: 9, fontWeight: 700 }}>Payback: {formatPayback(proposal.resultados.paybackMesesConservador)}</Text>
```

```tsx
            <Text style={{ fontSize: 9, fontWeight: 700 }}>Payback: {formatPayback(proposal.resultados.paybackMesesOtimista)}</Text>
```

- [ ] **Step 7: Condições de pagamento — nova seção antes de Incluso/garantias**

Antes do `<View style={styles.row}>` que contém os cards de Investimento/Incluso-e-garantias, adicionar:

```tsx
        <View style={styles.card} wrap={false}>
          <Text style={styles.sectionTitle}>Condições de pagamento</Text>
          <View style={[styles.row, { marginTop: 4 }]}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <Text style={{ fontSize: 8, color: cores.muted }}>À vista</Text>
              <Text style={{ fontSize: 12, fontWeight: 800 }}>{formatBRL(proposal.precoFinal, false)}</Text>
            </View>
            <View style={{ flex: 1, marginRight: 8 }}>
              <Text style={{ fontSize: 8, color: cores.muted }}>Cartão {proposal.pagamento.cartao.parcelas}x</Text>
              <Text style={{ fontSize: 12, fontWeight: 800 }}>{formatBRL(proposal.pagamento.cartao.valor)}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 8, color: cores.muted }}>Financiamento {proposal.pagamento.financiamento.parcelas}x</Text>
              <Text style={{ fontSize: 12, fontWeight: 800 }}>{formatBRL(proposal.pagamento.financiamento.valor)}</Text>
            </View>
          </View>
          {proposal.condicoesPagamento && <Text style={{ fontSize: 8, color: cores.muted, marginTop: 6 }}>{proposal.condicoesPagamento}</Text>}
        </View>
```

E simplificar o card de "Investimento" (que hoje só mostra preço à vista, já correto desde a mudança desta manhã) — não precisa mudar, continua como está.

- [ ] **Step 8: Garantias ganha "Demais equipamentos", "Não incluso" vira lista + observação**

Trocar:

```tsx
            <Text style={{ fontSize: 9, marginTop: 6 }}>Painéis: {proposal.garantias.paineis} · Inversor: {proposal.garantias.inversor}</Text>
            <Text style={{ fontSize: 9, marginTop: 2 }}>Prazo: {proposal.prazoInstalacao}</Text>
```

por:

```tsx
            <Text style={{ fontSize: 9, marginTop: 6 }}>Painéis: {proposal.garantias.paineis} · Inversor: {proposal.garantias.inversor}</Text>
            <Text style={{ fontSize: 9, marginTop: 2 }}>Demais equipamentos e serviços: {proposal.garantiaDemaisEquipamentos}</Text>
            <Text style={{ fontSize: 9, marginTop: 2 }}>Prazo: {proposal.prazoInstalacao}</Text>
```

Trocar:

```tsx
        <View style={styles.card} wrap={false}>
          <Text style={styles.sectionTitle}>Não incluso</Text>
          <Text style={{ fontSize: 9 }}>{proposal.exclusoes}</Text>
        </View>
```

por:

```tsx
        <View style={styles.card} wrap={false}>
          <Text style={styles.sectionTitle}>Não incluso</Text>
          {proposal.exclusoes.map((e, i) => (
            <Text key={i} style={{ fontSize: 9, marginBottom: 2 }}>
              · {e}
            </Text>
          ))}
          {proposal.observacaoPreliminar && <Text style={{ fontSize: 7, color: cores.muted, marginTop: 6 }}>{proposal.observacaoPreliminar}</Text>}
        </View>
```

- [ ] **Step 9: Fechamento do documento + QR Code — última seção, antes do rodapé fixo**

Antes do bloco `<Text style={styles.footer} ...>` (rodapé fixo), adicionar:

```tsx
        <View style={[styles.row, { marginTop: 8, alignItems: 'flex-end' }]} wrap={false}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 9 }}>
              {proposal.empresa.cidade.split(',')[0].trim()}, {formatDataPorExtenso(proposal.atualizadoEm.toDate())}
            </Text>
            {proposal.responsavelTecnico.nome && (
              <View style={{ marginTop: 24 }}>
                <View style={{ width: 180, borderTopWidth: 1, borderTopColor: cores.line, marginBottom: 4 }} />
                <Text style={{ fontSize: 9, fontWeight: 700 }}>{proposal.responsavelTecnico.nome}</Text>
                <Text style={{ fontSize: 8, color: cores.muted }}>
                  {[proposal.responsavelTecnico.titulo, proposal.responsavelTecnico.crea ? `CREA ${proposal.responsavelTecnico.crea}` : ''].filter(Boolean).join(' · ')}
                </Text>
              </View>
            )}
          </View>
          <View style={{ alignItems: 'center' }}>
            <Image src={qrCodeDataUrl} style={{ width: 64, height: 64 }} />
            <Text style={{ fontSize: 6, color: cores.muted, marginTop: 2, maxWidth: 80, textAlign: 'center' }}>Aponte a câmera para abrir a proposta no celular</Text>
          </View>
        </View>
```

- [ ] **Step 10: `npx tsc -b`**

Expected: `ProposalPdf.tsx` e `downloadProposalPdf.tsx` compilam sem erros. Este é o ponto em que o `tsc -b` inteiro do projeto deve voltar a ficar limpo (todas as tarefas anteriores já resolveram seus próprios arquivos).

- [ ] **Step 11: `.env.example`**

Adicionar, ao fim do arquivo:

```
# URL pública usada no rodapé do PDF e no QR Code — opcional, cai em window.location.origin quando vazia
VITE_PUBLIC_BASE_URL=
```

- [ ] **Step 12: Commit**

```bash
git add src/features/pdf/ProposalPdf.tsx src/features/pdf/downloadProposalPdf.tsx .env.example
git commit -m "feat: pdf ganha grafico, qr code, ficha tecnica, condicoes de pagamento e fechamento do documento"
```

---

### Task 16: Verificação final

**Files:** nenhum arquivo de produto — só scripts/verificação.

- [ ] **Step 1: `npx tsc -b` no projeto inteiro**

Expected: 0 erros.

- [ ] **Step 2: `npx vitest run`**

Expected: todos os testes passam (os existentes + os novos das Tarefas 3, 4, 5, 6, 11, 12).

- [ ] **Step 3: `npx oxlint`**

Expected: 0 warnings, 0 errors.

- [ ] **Step 4: Gerar um PDF de exemplo e verificar as ligaduras "fi"**

Escrever um script pontual (`scripts/gerar-pdf-teste.mjs` ou rodar via um teste Vitest temporário que não fica no repo) que monta um `PublicProposal` fake com um item cuja `descricao`/`especificacao` contenha as palavras "Perfil", "fibrocimento", "eficiência", "configuração" e "financiamento", renderiza com `pdf(<ProposalPdf proposal={...} qrCodeDataUrl={...} url={...} />).toBuffer()`, salva em `/tmp/proposta-teste.pdf` (ou na scratchpad), e roda:

```bash
pdftotext -layout /tmp/proposta-teste.pdf -
```

Expected: as 5 palavras aparecem inteiras no texto extraído. Se alguma ainda vier cortada, essa é a única situação em que se busca fontes TTF reais como segundo passo (conforme a Tarefa 1 previu) — não deveria ser necessário, já que a causa raiz é a hifenização, não o formato da fonte.

Apagar o script/arquivo temporário depois de confirmar (não faz parte do repo).

- [ ] **Step 5: Rodar o app e testar manualmente**

Usar a skill `run` (ou `npm run dev` já em background) para abrir uma proposta existente no navegador, conferir visualmente: ficha técnica, condições de pagamento, não-incluso em lista, fechamento com QR Code, gráfico no PDF baixado, pluralização de quantidade 1 vs. outras.

- [ ] **Step 6: Reportar resumo**

Resumir para o usuário: o que foi corrigido, quais campos novos existem e onde preenchê-los, e pedir que reveja o PDF de uma proposta real antes de considerar encerrado.
