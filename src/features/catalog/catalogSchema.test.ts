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
})
