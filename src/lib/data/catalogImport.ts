import { doc, getDoc, serverTimestamp, writeBatch } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { comCamposDerivados } from './catalog'
import type { CatalogItemInput } from './catalog'
import type { KitInput } from './kits'

interface ItemImportado {
  id: string
  input: CatalogItemInput
  /** Nome exato quando o gerado automaticamente não serve (ex.: classe de tensão do cabo). */
  nome?: string
}

const ITENS: ItemImportado[] = [
  {
    id: 'import-modulo-leapton-620-bifacial',
    input: { categoria: 'modulo', unidade: 'un', marca: 'Leapton', potenciaWp: 620, areaM2: null, larguraM: null, tecnologia: 'bifacial', garantiaProdutoAnos: null, garantiaPerformanceAnos: null, pesoKg: null, custoUnitario: 0, ativo: true },
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

  // Orçamentos Ourolux 0593207-98 (inversor) e 0593233-98 (micro), 09/10/2026.
  // Os PDFs trazem só o total, sem preço por item — o custo de cada item fica em 0 até ser preenchido.
  {
    id: 'import-modulo-ronma-730-bifacial',
    input: { categoria: 'modulo', unidade: 'un', marca: 'Ronma', potenciaWp: 730, areaM2: null, larguraM: null, tecnologia: 'bifacial', garantiaProdutoAnos: null, garantiaPerformanceAnos: null, pesoKg: null, custoUnitario: 0, ativo: true },
  },
  {
    id: 'import-inversor-sofar-15kw-tri',
    input: { categoria: 'inversor', unidade: 'un', marca: 'Sofar', tipo: 'string', potenciaKw: 15, fase: 'tri', monitoramentoWifi: false, garantiaAnos: null, mppts: null, custoUnitario: 0, ativo: true },
  },
  {
    id: 'import-micro-growatt-neo-2500m-x2',
    input: { categoria: 'inversor', unidade: 'un', marca: 'Growatt', tipo: 'micro', potenciaKw: 2.5, fase: 'mono', monitoramentoWifi: false, garantiaAnos: null, mppts: 4, custoUnitario: 0, ativo: true },
  },
  {
    id: 'import-cabo-6mm-preto-100m',
    nome: 'Cabo solar CC 6 mm² 1,5 kV preto · rolo 100 m',
    input: { categoria: 'cabo', unidade: 'm', tipo: 'cc_solar', bitolaMm2: 6, cor: 'preto', apresentacao: 'rolo', metrosPorRolo: 100, custoUnitario: 0, ativo: true },
  },
  {
    id: 'import-cabo-6mm-vermelho-100m',
    nome: 'Cabo solar CC 6 mm² 1,5 kV vermelho · rolo 100 m',
    input: { categoria: 'cabo', unidade: 'm', tipo: 'cc_solar', bitolaMm2: 6, cor: 'vermelho', apresentacao: 'rolo', metrosPorRolo: 100, custoUnitario: 0, ativo: true },
  },
  {
    id: 'import-cabo-4mm-preto-100m',
    input: { categoria: 'cabo', unidade: 'm', tipo: 'cc_solar', bitolaMm2: 4, cor: 'preto', apresentacao: 'rolo', metrosPorRolo: 100, custoUnitario: 0, ativo: true },
  },
  {
    id: 'import-cabo-4mm-vermelho-100m',
    input: { categoria: 'cabo', unidade: 'm', tipo: 'cc_solar', bitolaMm2: 4, cor: 'vermelho', apresentacao: 'rolo', metrosPorRolo: 100, custoUnitario: 0, ativo: true },
  },
  {
    id: 'import-estrutura-mini-trilho-320mm-baixo',
    input: { categoria: 'estrutura', unidade: 'pacote', marca: '', tipoPeca: 'mini_trilho', tipoTelhado: 'metalico', medida: '320 mm baixo', formaVenda: 'pacote', pecasPorPacote: 4, custoUnitario: 0, ativo: true },
  },
  {
    id: 'import-estrutura-mini-trilho-320mm-alto',
    input: { categoria: 'estrutura', unidade: 'pacote', marca: '', tipoPeca: 'mini_trilho', tipoTelhado: 'metalico', medida: '320 mm alto', formaVenda: 'pacote', pecasPorPacote: 4, custoUnitario: 0, ativo: true },
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

/** Quantidades exatamente como nos orçamentos Ourolux (27 módulos, 19,71 kWp). Ao usar o kit numa
 * proposta, módulos, microinversores e peças de estrutura com regra própria são recalculados pelo
 * tamanho do sistema; o resto usa estes números. */
const ITENS_KIT_OUROLUX_SOFAR_15KW = [
  { catalogId: 'import-modulo-ronma-730-bifacial', quantidadePadrao: 27 },
  { catalogId: 'import-inversor-sofar-15kw-tri', quantidadePadrao: 1 },
  { catalogId: 'import-cabo-6mm-preto-100m', quantidadePadrao: 100 },
  { catalogId: 'import-cabo-6mm-vermelho-100m', quantidadePadrao: 100 },
  { catalogId: 'import-estrutura-mini-trilho-320mm-baixo', quantidadePadrao: 16 },
  { catalogId: 'import-estrutura-grampo-intermediario-35mm', quantidadePadrao: 13 },
  { catalogId: 'import-estrutura-grampo-terminal-30-35mm', quantidadePadrao: 3 },
  { catalogId: 'import-mc4-par-ip67', quantidadePadrao: 12 },
]

const ITENS_KIT_OUROLUX_MICRO_GROWATT = [
  { catalogId: 'import-modulo-ronma-730-bifacial', quantidadePadrao: 27 },
  { catalogId: 'import-micro-growatt-neo-2500m-x2', quantidadePadrao: 7 },
  { catalogId: 'import-cabo-4mm-preto-100m', quantidadePadrao: 100 },
  { catalogId: 'import-cabo-4mm-vermelho-100m', quantidadePadrao: 100 },
  { catalogId: 'import-estrutura-grampo-intermediario-35mm', quantidadePadrao: 13 },
  { catalogId: 'import-estrutura-grampo-terminal-30-35mm', quantidadePadrao: 3 },
  { catalogId: 'import-estrutura-mini-trilho-320mm-alto', quantidadePadrao: 16 },
  { catalogId: 'import-mc4-par-ip67', quantidadePadrao: 56 },
]

const KITS: { id: string; input: KitInput }[] = [
  {
    id: 'kit-ourolux-sofar-15kw-metalico',
    input: {
      nome: 'Kit Sofar 15 kW trifásico · metálico (19,71 kWp)',
      descricao:
        'Ourolux 0593207-98 (09/10/2026) — total R$ 25.584,41. 27 módulos Ronma 730 W bifaciais (RM-730W-210R/156TB, moldura 33 mm), inversor Sofar 15 kW 3×220 V, cabo solar 6 mm² 1,5 kV (rolos de 100 m), mini trilho baixo 320 mm, grampos e conectores MC4.',
      itens: ITENS_KIT_OUROLUX_SOFAR_15KW,
      ativo: true,
    },
  },
  {
    id: 'kit-ourolux-micro-growatt-metalico',
    input: {
      nome: 'Kit microinversor Growatt · metálico (19,71 kWp)',
      descricao:
        'Ourolux 0593233-98 (09/10/2026) — total R$ 27.899,63. 27 módulos Ronma 730 W bifaciais (RM-730W-210R/156TB, moldura 33 mm), 7 microinversores Growatt NEO 2500M-X2 (2,5 kW, 1×220 V, 4 MPPT), cabo solar 4 mm² 1 kV (rolos de 100 m), mini trilho alto 320 mm, grampos e conectores MC4.',
      itens: ITENS_KIT_OUROLUX_MICRO_GROWATT,
      ativo: true,
    },
  },
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

  for (const { id, input, nome } of ITENS) {
    const ref = doc(db, 'catalog', id)
    const existente = await getDoc(ref)
    if (existente.exists()) continue
    const patch = comCamposDerivados(input)
    if (nome) patch.nome = nome
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
