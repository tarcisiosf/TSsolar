import { doc, getDoc, onSnapshot, runTransaction, setDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type { CalcSettings, CompanySettings } from '@/types/firestore'

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

export const DEFAULT_CALC: CalcSettings = {
  produtividadeKwhKwpAno: 1400,
  distribuicaoMensal: [1.042, 1.052, 0.974, 0.954, 0.9, 0.867, 0.906, 1.081, 1.061, 1.067, 1.026, 1.048],
  tarifaKwh: 0.99,
  fioBKwh: 0.28,
  fioBPercentualPorAno: { '2026': 0.6, '2027': 0.75, '2028': 0.9, '2029': 1.0 },
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

const companyRef = doc(db, 'settings', 'company')
const calcRef = doc(db, 'settings', 'calc')

/** Documentos salvos antes destes campos existirem (ou com `exclusoes` no formato antigo,
 * texto único em vez de lista) ficam com os campos ausentes — mescla com o padrão ao ler,
 * sem tocar no Firestore. Mesmo padrão de `getCalcSettings`. */
export function normalizarCompanySettings(raw: Partial<CompanySettings> & Record<string, unknown>): CompanySettings {
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

export async function getCalcSettings(): Promise<CalcSettings> {
  const snap = await getDoc(calcRef)
  if (!snap.exists()) {
    await setDoc(calcRef, DEFAULT_CALC)
    return DEFAULT_CALC
  }
  return { ...DEFAULT_CALC, ...snap.data() } as CalcSettings
}

export function subscribeCompanySettings(onData: (settings: CompanySettings) => void) {
  return onSnapshot(companyRef, (snap) => {
    if (snap.exists()) onData(normalizarCompanySettings(snap.data()))
  })
}

export function subscribeCalcSettings(onData: (settings: CalcSettings) => void) {
  return onSnapshot(calcRef, (snap) => {
    if (snap.exists()) onData({ ...DEFAULT_CALC, ...snap.data() } as CalcSettings)
  })
}

export async function saveCompanySettings(settings: CompanySettings): Promise<void> {
  await setDoc(companyRef, settings)
}

export async function saveCalcSettings(settings: CalcSettings): Promise<void> {
  await setDoc(calcRef, settings)
}

/** Atribui o próximo número de proposta (TS-AAAA-NNN) de forma atômica e já incrementa o contador. */
export async function proximoNumeroProposta(): Promise<string> {
  return runTransaction(db, async (tx) => {
    const snap = await tx.get(calcRef)
    const atual = snap.exists() ? (snap.data() as CalcSettings) : DEFAULT_CALC
    const numero = atual.proximoNumero
    tx.set(calcRef, { ...atual, proximoNumero: numero + 1 }, { merge: true })
    const ano = new Date().getFullYear()
    return `TS-${ano}-${String(numero).padStart(3, '0')}`
  })
}
