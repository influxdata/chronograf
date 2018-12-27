import {colorForSeverity, getBrighterColor} from 'src/logs/utils/colors'
import {SeverityColorValues} from 'src/logs/constants'

describe('Logs.Utils.colors', () => {
  describe('.colorForSeverity', () => {
    it('can get a color for just a color name', () => {
      const actual = colorForSeverity('comet', null)

      expect(actual).toEqual(SeverityColorValues.comet)
    })

    it('can get a color for just a severity level', () => {
      const actual = colorForSeverity(null, 'emerg')

      expect(actual).toEqual(SeverityColorValues.ruby)
    })

    it('can return a default color value', () => {
      const actual = colorForSeverity(null, null)

      expect(actual).toEqual(SeverityColorValues.star)
    })
  })

  describe('.getBrighterColor', () => {
    it('can handle an unrecognized hex color value', () => {
      const actual = getBrighterColor(0.5, 'beep')

      expect(actual).toEqual(SeverityColorValues.star)
    })

    it('can handle a null color', () => {
      const actual = getBrighterColor(0.5, null)

      expect(actual).toEqual(SeverityColorValues.star)
    })

    it('can handle an empty color value', () => {
      const actual = getBrighterColor(0.5, null)

      expect(actual).toEqual(SeverityColorValues.star)
    })

    it('can handle a color name', () => {
      const actual = getBrighterColor(0.5, 'blue')

      expect(actual).toEqual('#0000ff')
    })
  })
})
