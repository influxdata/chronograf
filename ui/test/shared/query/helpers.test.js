import {timeRangeType, shiftTimeRange} from 'shared/query/helpers'
import {
  INVALID,
  ABSOLUTE,
  INFLUXQL,
  RELATIVE_LOWER,
  RELATIVE_UPPER,
} from 'shared/constants/timeRange'
const format = INFLUXQL

describe('Shared.Query.Helpers', () => {
  describe('timeRangeTypes', () => {
    it('returns invalid if no upper and lower', () => {
      const upper = null
      const lower = null

      const timeRange = {lower, upper}

      expect(timeRangeType(timeRange)).toBe(INVALID)
    })

    it('can detect absolute type', () => {
      const tenMinutes = 600000
      const upper = Date.now()
      const lower = upper - tenMinutes

      const timeRange = {lower, upper, format}

      expect(timeRangeType(timeRange)).toBe(ABSOLUTE)
    })

    it('can detect exclusive relative lower', () => {
      const lower = 'now() - 15m'
      const upper = null

      const timeRange = {lower, upper, format}

      expect(timeRangeType(timeRange)).toBe(RELATIVE_LOWER)
    })

    it('can detect relative upper', () => {
      const upper = 'now()'
      const oneMinute = 60000
      const lower = Date.now() - oneMinute

      const timeRange = {lower, upper, format}

      expect(timeRangeType(timeRange)).toBe(RELATIVE_UPPER)
    })

    it('can detect absolute type with variables', () => {
      const upper = ':upperDashboardTime:'
      const lower = ':dashboardTime:'

      const timeRange = {lower, upper, format}

      expect(timeRangeType(timeRange)).toBe(ABSOLUTE)
    })

    it('can detect exclusive relative lower with variable', () => {
      const lower = ':dashboardTime:'
      const upper = null

      const timeRange = {lower, upper, format}

      expect(timeRangeType(timeRange)).toBe(RELATIVE_LOWER)
    })

    it('can detect relative upper with variable', () => {
      const upper = 'now()'
      const lower = ':dashboardTime:'

      const timeRange = {lower, upper, format}

      expect(timeRangeType(timeRange)).toBe(RELATIVE_UPPER)
    })
  })

  describe('timeRangeShift', () => {
    it('can calculate the shift for absolute timeRanges', () => {
      const upper = Date.now()
      const oneMinute = 60000
      const lower = Date.now() - oneMinute
      const shift = {quantity: 7, unit: 'd'}
      const timeRange = {upper, lower}

      const type = timeRangeType(timeRange)
      const actual = shiftTimeRange(timeRange, shift)
      const expected = {
        lower: `${lower} - 7d`,
        upper: `${upper} - 7d`,
        type: 'shifted',
      }

      expect(type).toBe(ABSOLUTE)
      expect(actual).toEqual(expected)
    })

    it('can calculate the shift for relative lower timeRanges', () => {
      const shift = {quantity: 7, unit: 'd'}
      const lower = 'now() - 15m'
      const timeRange = {lower, upper: null}

      const type = timeRangeType(timeRange)
      const actual = shiftTimeRange(timeRange, shift)
      const expected = {
        lower: `${lower} - 7d`,
        upper: `now() - 7d`,
        type: 'shifted',
      }

      expect(type).toBe(RELATIVE_LOWER)
      expect(actual).toEqual(expected)
    })

    it('can calculate the shift for relative upper timeRanges', () => {
      const upper = Date.now()
      const oneMinute = 60000
      const lower = Date.now() - oneMinute
      const shift = {quantity: 7, unit: 'd'}
      const timeRange = {upper, lower}

      const type = timeRangeType(timeRange)
      const actual = shiftTimeRange(timeRange, shift)
      const expected = {
        lower: `${lower} - 7d`,
        upper: `${upper} - 7d`,
        type: 'shifted',
      }

      expect(type).toBe(ABSOLUTE)
      expect(actual).toEqual(expected)
    })

    it('can calculate the shift for absolute timeRanges with variables', () => {
      const upper = ':upperDashboardTime:'
      const lower = ':dashboardTime:'
      const shift = {quantity: 7, unit: 'd'}
      const timeRange = {upper, lower}

      const type = timeRangeType(timeRange)
      const actual = shiftTimeRange(timeRange, shift)
      const expected = {
        lower: `${lower} - 7d`,
        upper: `${upper} - 7d`,
        type: 'shifted',
      }

      expect(type).toBe(ABSOLUTE)
      expect(actual).toEqual(expected)
    })

    it('can calculate the shift for relative lower timeRanges with variables', () => {
      const shift = {quantity: 7, unit: 'd'}
      const lower = ':dashboardTime:'
      const timeRange = {lower, upper: null}

      const type = timeRangeType(timeRange)
      const actual = shiftTimeRange(timeRange, shift)
      const expected = {
        lower: `${lower} - 7d`,
        upper: `now() - 7d`,
        type: 'shifted',
      }

      expect(type).toBe(RELATIVE_LOWER)
      expect(actual).toEqual(expected)
    })
  })
})
