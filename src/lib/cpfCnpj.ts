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
