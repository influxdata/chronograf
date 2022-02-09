import timeRangeWindowPeriod, {
  fluxPeriodFromRangeSeconds,
} from 'src/shared/components/TimeMachine/fluxQueryBuilder/util/timeRangeWindowPeriod'
import {timeRanges} from 'src/shared/data/timeRanges'
describe('fluxQueryBuilder/util/timeRangeWindowPeriod', () => {
  describe('fluxPeriodFromRangeSeconds', () => {
    ;[
      {
        name: 'below 360 seconds',
        seconds: 350,
        expect: '1s',
      },
      {
        name: 'unknown seconds',
        seconds: undefined,
        expect: '1s',
      },
      {
        name: 'NaN',
        seconds: Number.NaN,
        expect: '1s',
      },
      {
        name: '1 hour',
        seconds: 3600,
        expect: '10s',
      },
      {
        name: '6 hours',
        seconds: 6 * 3600,
        expect: '1m',
      },
      {
        name: '7 hours',
        seconds: 7 * 3600,
        expect: '1m10s',
      },
      {
        name: '15 days',
        seconds: 15 * 24 * 3600,
        expect: '1h',
      },
      {
        name: '379 days',
        seconds: 379 * 24 * 3600,
        expect: '1d1h16m',
      },
    ].forEach(x => {
      test(x.name || x.expect, () => {
        expect(fluxPeriodFromRangeSeconds(x.seconds)).toBe(x.expect)
      })
    })
  })
  describe('timeRangeWindowPeriod', () => {
    test('undefined', () => {
      expect(timeRangeWindowPeriod(undefined)).toBe(undefined)
    })
    timeRanges.forEach(x => {
      test(x.menuOption, () => {
        expect(x.seconds).toBeDefined()
        expect(timeRangeWindowPeriod(x)).toBe(
          fluxPeriodFromRangeSeconds(x.seconds)
        )
      })
    })
    test('custom time range', () => {
      expect(
        timeRangeWindowPeriod({
          lower: '2022-01-01T00:00:00',
          upper: '2023-01-01T00:00:00',
        })
      ).toBe('1d20m')
    })
  })
})
