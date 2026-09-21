import { describe, expect, it } from 'vitest'
import { formatDecimalBR } from './format'

describe('formatDecimalBR', () => {
  it('trims trailing zeros', () => {
    expect(formatDecimalBR(4)).toBe('4')
  })

  it('keeps meaningful decimals with a comma', () => {
    expect(formatDecimalBR(2.25)).toBe('2,25')
  })

  it('caps at the given number of decimals', () => {
    expect(formatDecimalBR(2.256, 2)).toBe('2,26')
  })
})
