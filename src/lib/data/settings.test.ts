import { describe, expect, it, vi } from 'vitest'
import type { CompanySettings } from '@/types/firestore'
import { DEFAULT_COMPANY, normalizarCompanySettings } from './settings'

// `settings.ts` cria referências de documento (`doc(db, ...)`) no carregamento do módulo —
// mocka o Firestore para testar `normalizarCompanySettings` (função pura) sem exigir
// credenciais reais de Firebase no ambiente de teste.
vi.mock('@/lib/firebase', () => ({ db: {} }))
vi.mock('firebase/firestore', () => ({
  doc: vi.fn(),
  getDoc: vi.fn(),
  onSnapshot: vi.fn(),
  runTransaction: vi.fn(),
  setDoc: vi.fn(),
}))

type RawCompanySettings = Partial<CompanySettings> & Record<string, unknown>

describe('normalizarCompanySettings', () => {
  it('mantém exclusoes já no formato de lista inalterada', () => {
    const raw: RawCompanySettings = { exclusoes: ['Item A', 'Item B'] }
    const result = normalizarCompanySettings(raw)
    expect(result.exclusoes).toEqual(['Item A', 'Item B'])
  })

  it('envolve exclusoes em texto único (formato antigo) numa lista de 1 item', () => {
    const raw = { exclusoes: 'Não inclui reforço de padrão de entrada.' } as unknown as RawCompanySettings
    const result = normalizarCompanySettings(raw)
    expect(result.exclusoes).toEqual(['Não inclui reforço de padrão de entrada.'])
  })

  it('usa o padrão quando exclusoes é uma string vazia', () => {
    const raw = { exclusoes: '' } as unknown as RawCompanySettings
    const result = normalizarCompanySettings(raw)
    expect(result.exclusoes).toEqual(DEFAULT_COMPANY.exclusoes)
  })

  it('usa o padrão quando exclusoes está ausente', () => {
    const raw: RawCompanySettings = {}
    const result = normalizarCompanySettings(raw)
    expect(result.exclusoes).toEqual(DEFAULT_COMPANY.exclusoes)
  })
})
