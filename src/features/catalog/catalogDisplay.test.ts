import { describe, expect, it } from 'vitest'
import type { Timestamp } from 'firebase/firestore'
import type { CatalogItem } from '@/types/firestore'
import { defaultCatalogItemInput, especificacaoCatalogItem, gerarNomeCatalogItem, unidadeDisplay } from './catalogDisplay'

const TS = {} as Timestamp

function comBase<T extends object>(item: T): T & { id: string; nome: string; criadoEm: Timestamp; atualizadoEm: Timestamp } {
  return { id: 'x', nome: '', criadoEm: TS, atualizadoEm: TS, ...item }
}

describe('gerarNomeCatalogItem', () => {
  it('módulo', () => {
    const input = { ...defaultCatalogItemInput('modulo'), marca: 'Astroenergy', potenciaWp: 725 }
    expect(gerarNomeCatalogItem(input)).toBe('Módulo Astroenergy 725 Wp')
  })

  it('inversor com potência decimal', () => {
    const input = { ...defaultCatalogItemInput('inversor'), marca: 'SOFAR', potenciaKw: 4 }
    expect(gerarNomeCatalogItem(input)).toBe('Inversor SOFAR 4 kW')
    expect(gerarNomeCatalogItem({ ...input, potenciaKw: 2.25 })).toBe('Inversor SOFAR 2,25 kW')
  })

  it('estrutura', () => {
    const input = { ...defaultCatalogItemInput('estrutura'), tipoTelhado: 'ceramico' as const }
    expect(gerarNomeCatalogItem(input)).toBe('Estrutura para telhado cerâmico')
  })

  it('cabo', () => {
    const input = { ...defaultCatalogItemInput('cabo'), tipo: 'cc_solar' as const, bitolaMm2: 6 as const }
    expect(gerarNomeCatalogItem(input)).toBe('Cabo solar CC 6 mm²')
  })

  it('outro usa a descrição literal', () => {
    const input = { ...defaultCatalogItemInput('outro'), descricao: 'Parafuso autobrocante 25mm' }
    expect(gerarNomeCatalogItem(input)).toBe('Parafuso autobrocante 25mm')
  })
})

describe('especificacaoCatalogItem', () => {
  it('módulo com garantia de performance', () => {
    const item: CatalogItem = comBase({
      categoria: 'modulo',
      unidade: 'un',
      marca: 'Astroenergy',
      potenciaWp: 725,
      areaM2: null,
      garantiaProdutoAnos: 12,
      garantiaPerformanceAnos: 30,
      custoUnitario: 900,
      ativo: true,
    })
    expect(especificacaoCatalogItem(item)).toBe('garantia de performance de 30 anos')
  })

  it('cabo mostra a bitola', () => {
    const item: CatalogItem = comBase({
      categoria: 'cabo',
      unidade: 'm',
      tipo: 'cc_solar',
      bitolaMm2: 6,
      custoUnitario: 4,
      ativo: true,
    })
    expect(especificacaoCatalogItem(item)).toBe('6 mm²')
  })
})

describe('unidadeDisplay', () => {
  it('cabo é medido em metros', () => {
    const item: CatalogItem = comBase({ categoria: 'cabo', unidade: 'm', tipo: 'ca', bitolaMm2: 4, custoUnitario: 3, ativo: true })
    expect(unidadeDisplay(item)).toBe('metros')
  })

  it('mc4 é medido em pares', () => {
    const item: CatalogItem = comBase({ categoria: 'mc4', unidade: 'par', marca: '', custoUnitario: 10, ativo: true })
    expect(unidadeDisplay(item)).toBe('pares')
  })

  it("'outro' usa a unidade livre cadastrada", () => {
    const item: CatalogItem = comBase({ categoria: 'outro', unidade: 'kits', descricao: 'Kit de fixação', custoUnitario: 50, ativo: true })
    expect(unidadeDisplay(item)).toBe('kits')
  })
})
