import {isValidExtent} from 'src/logs/utils/timeBounds'

describe('Logs.Utils.TimeBounds', () => {
  describe('isValidExtent', () => {
    const extents = [1, 3]
    const period = 4

    it('can invalidate a timeOption less than the extent', () => {
      const timeOption = 0
      const actual = isValidExtent(timeOption, extents, period)

      expect(actual).toEqual(false)
    })

    it('can invalidate a timeOption greater than the extent', () => {
      const timeOption = 4
      const actual = isValidExtent(timeOption, extents, period)

      expect(actual).toEqual(false)
    })

    it('can validate an in bounds timeOption', () => {
      const timeOption = 2
      const actual = isValidExtent(timeOption, extents, period)

      expect(actual).toEqual(true)
    })

    it('can invalidate an extent larger than the period', () => {
      const timeOption = 2
      const actual = isValidExtent(timeOption, [0, 200], 1)

      expect(actual).toEqual(false)
    })
  })
})
