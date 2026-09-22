import { describe, expect, it } from 'vitest'
import type { Timestamp } from 'firebase/firestore'
import type { CatalogItem } from '@/types/firestore'
import { defaultCatalogItemInput, especificacaoCatalogItem, gerarNomeCatalogItem, unidadeDisplay, calcularCustoPorMetro, normalizarCatalogItem } from './catalogDisplay'

const TS = {} as Timestamp

function comBase<T extends object>(item: T): T & { id: string; nome: string; criadoEm: Timestamp; atualizadoEm: Timestamp } {
  return { id: 'x', nome: '', criadoEm: TS, atualizadoEm: TS, ...item }
}

describe('gerarNomeCatalogItem', () => {
  it('módulo', () => {
    const input = { ...defaultCatalogItemInput('modulo'), marca: 'Astroenergy', potenciaWp: 725 }
    expect(gerarNomeCatalogItem(input)).toBe('Módulo Astroenergy 725 Wp')
  })

  it('módulo com tecnologia', () => {
    const input = { ...defaultCatalogItemInput('modulo'), marca: 'Leapton', potenciaWp: 620, tecnologia: 'bifacial' as const }
    expect(gerarNomeCatalogItem(input)).toBe('Módulo Leapton 620 Wp bifacial')
  })

  it('módulo sem tecnologia não tem sufixo', () => {
    const input = { ...defaultCatalogItemInput('modulo'), marca: 'Astroenergy', potenciaWp: 725 }
    expect(gerarNomeCatalogItem(input)).toBe('Módulo Astroenergy 725 Wp')
  })

  it('inversor com potência decimal', () => {
    const input = { ...defaultCatalogItemInput('inversor'), marca: 'SOFAR', potenciaKw: 4 }
    expect(gerarNomeCatalogItem(input)).toBe('Inversor SOFAR 4 kW')
    expect(gerarNomeCatalogItem({ ...input, potenciaKw: 2.25 })).toBe('Inversor SOFAR 2,25 kW')
  })

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
      larguraM: null,
      tecnologia: null,
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
      cor: 'preto',
      apresentacao: 'metro',
      metrosPorRolo: null,
      custoPorMetro: 4,
      custoUnitario: 4,
      ativo: true,
    })
    expect(especificacaoCatalogItem(item)).toBe('6 mm²')
  })

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
})

describe('unidadeDisplay', () => {
  it('cabo é medido em metros', () => {
    const item: CatalogItem = comBase({ categoria: 'cabo', unidade: 'm', tipo: 'ca', bitolaMm2: 4, cor: 'preto', apresentacao: 'metro', metrosPorRolo: null, custoPorMetro: 3, custoUnitario: 3, ativo: true })
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

  it('componente de estrutura vendido em barra', () => {
    const item: CatalogItem = comBase({ categoria: 'estrutura', unidade: 'barra', marca: '', tipoPeca: 'perfil', tipoTelhado: null, medida: '2,4 m', formaVenda: 'barra', pecasPorPacote: null, custoUnitario: 30, ativo: true })
    expect(unidadeDisplay(item)).toBe('barras')
  })

  it('componente de estrutura vendido em pacote', () => {
    const item: CatalogItem = comBase({ categoria: 'estrutura', unidade: 'pacote', marca: '', tipoPeca: 'grampo_terminal', tipoTelhado: null, medida: '', formaVenda: 'pacote', pecasPorPacote: 4, custoUnitario: 8, ativo: true })
    expect(unidadeDisplay(item)).toBe('pacotes')
  })
})

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
