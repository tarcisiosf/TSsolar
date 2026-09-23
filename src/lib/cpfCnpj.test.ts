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
