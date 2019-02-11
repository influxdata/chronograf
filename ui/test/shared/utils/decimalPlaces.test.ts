import {isTruncatedNumber, toFixed} from 'src/shared/utils/decimalPlaces'

describe('decimalPlaces', () => {
  const digits = (d: number) => ({isEnforced: true, digits: d})
  describe('.toFixed', () => {
    it('can skip fixing nonFinite digits', () => {
      expect(toFixed(20.123456789, digits(Infinity))).toBe('20.123456789')
      expect(toFixed(20.123456789, digits(-Infinity))).toBe('20.123456789')
      expect(toFixed(20.123456789, digits(NaN))).toBe('20.123456789')
    })

    it('caps fixed digits to 20 decimal places', () => {
      const value = 0.000000000931322574615478515625
      expect(toFixed(value, digits(25))).toBe('0.00000000093132257462')
    })

    it('treats negative decimal places as 0', () => {
      expect(toFixed(1234.56, digits(-1))).toBe('1235')
      expect(toFixed(1234.12, digits(-1))).toBe('1234')
    })
  })

  describe('.isTruncatedNumber', () => {
    it('can return false for non finite numbers', () => {
      expect(isTruncatedNumber(Infinity, digits(0))).toBe(false)
      expect(isTruncatedNumber(-Infinity, digits(0))).toBe(false)
      expect(isTruncatedNumber(-NaN, digits(0))).toBe(false)
    })
  })
})
