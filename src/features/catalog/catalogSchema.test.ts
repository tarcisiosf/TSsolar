import { describe, expect, it } from 'vitest'
import { validarCatalogItem } from './catalogSchema'
import { defaultCatalogItemInput } from './catalogDisplay'

describe('validarCatalogItem', () => {
  it('módulo válido não gera erros', () => {
    const erros = validarCatalogItem({ ...defaultCatalogItemInput('modulo'), marca: 'Astroenergy', potenciaWp: 725, custoUnitario: 900 })
    expect(erros).toEqual({})
  })

  it('módulo sem marca ou potência gera erros', () => {
    const erros = validarCatalogItem(defaultCatalogItemInput('modulo'))
    expect(erros.marca).toBeTruthy()
    expect(erros.potenciaWp).toBeTruthy()
  })

  it('inversor sem potência gera erro', () => {
    const erros = validarCatalogItem({ ...defaultCatalogItemInput('inversor'), marca: 'SOFAR' })
    expect(erros.potenciaKw).toBeTruthy()
  })

  it("'outro' exige descrição e unidade", () => {
    const erros = validarCatalogItem(defaultCatalogItemInput('outro'))
    expect(erros.descricao).toBeTruthy()
    expect(erros.unidade).toBeTruthy()
  })

  it('custo unitário negativo gera erro em qualquer categoria', () => {
    const erros = validarCatalogItem({ ...defaultCatalogItemInput('mc4'), custoUnitario: -1 })
    expect(erros.custoUnitario).toBeTruthy()
  })

  it('módulo aceita largura e tecnologia nulas', () => {
    const erros = validarCatalogItem({ ...defaultCatalogItemInput('modulo'), marca: 'Astroenergy', potenciaWp: 725, custoUnitario: 900 })
    expect(erros).toEqual({})
  })

  it('módulo com largura negativa gera erro', () => {
    const erros = validarCatalogItem({ ...defaultCatalogItemInput('modulo'), marca: 'Astroenergy', potenciaWp: 725, custoUnitario: 900, larguraM: -1 })
    expect(erros.larguraM).toBeTruthy()
  })

  it('inversor aceita mppts nulo ou preenchido', () => {
    const semMppts = validarCatalogItem({ ...defaultCatalogItemInput('inversor'), marca: 'Sofar', potenciaKw: 5, custoUnitario: 100 })
    expect(semMppts).toEqual({})
    const comMppts = validarCatalogItem({ ...defaultCatalogItemInput('inversor'), marca: 'Sofar', potenciaKw: 4, mppts: 1, custoUnitario: 100 })
    expect(comMppts).toEqual({})
  })

  it('cabo em rolo sem metrosPorRolo gera erro', () => {
    const erros = validarCatalogItem({ ...defaultCatalogItemInput('cabo'), apresentacao: 'rolo', metrosPorRolo: null, custoUnitario: 80 })
    expect(erros.metrosPorRolo).toBeTruthy()
  })

  it('cabo por metro não exige metrosPorRolo', () => {
    const erros = validarCatalogItem({ ...defaultCatalogItemInput('cabo'), apresentacao: 'metro', metrosPorRolo: null, custoUnitario: 3.5 })
    expect(erros.metrosPorRolo).toBeUndefined()
  })
})
