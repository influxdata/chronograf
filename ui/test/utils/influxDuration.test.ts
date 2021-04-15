import {
  parseDuration,
  InfluxDuration,
  durationComparator,
} from 'src/utils/influxDuration'
describe('InfluxDuration', () => {
  describe('parseDuration', () => {
    ;[
      {
        str: '',
        duration: [0, 0, 0, 0, 0, 0, 0, 0] as InfluxDuration,
      },
      {
        str: '1w',
        duration: [1, 0, 0, 0, 0, 0, 0, 0] as InfluxDuration,
      },
      {
        str: '1d',
        duration: [0, 1, 0, 0, 0, 0, 0, 0] as InfluxDuration,
      },
      {
        str: '1h',
        duration: [0, 0, 1, 0, 0, 0, 0, 0] as InfluxDuration,
      },
      {
        str: '1m',
        duration: [0, 0, 0, 1, 0, 0, 0, 0] as InfluxDuration,
      },
      {
        str: '1s',
        duration: [0, 0, 0, 0, 1, 0, 0, 0] as InfluxDuration,
      },
      {
        str: '1ms',
        duration: [0, 0, 0, 0, 0, 1, 0, 0] as InfluxDuration,
      },
      {
        str: '1µs',
        duration: [0, 0, 0, 0, 0, 0, 1, 0] as InfluxDuration,
      },
      {
        str: '1u',
        duration: [0, 0, 0, 0, 0, 0, 1, 0] as InfluxDuration,
      },
      {
        str: '1ns',
        duration: [0, 0, 0, 0, 0, 0, 0, 1] as InfluxDuration,
      },
      {
        str: '11w22d33h44m55s66ms77u88ns',
        duration: [11, 22, 33, 44, 55, 66, 77, 88] as InfluxDuration,
      },
    ].forEach(({str, duration}) => {
      it(`parses '${str}'`, () => {
        const retVal = parseDuration(str)
        expect(retVal).toEqual(duration)
      })
    })
  })
  describe('durationComparator', () => {
    const units = ['w', 'd', 'h', 'm', 's', 'ms', 'u', 'ns']
    it('compares simple durations', () => {
      units.forEach(unit => {
        const x = parseDuration(`1${unit}`)
        const y = parseDuration(`2${unit}`)
        expect(durationComparator(x, x)).toEqual(0)
        expect(durationComparator(x, y)).toBeLessThan(0)
        expect(durationComparator(y, x)).toBeGreaterThan(0)
      })
    })
    it('compares 3-unit durations', () => {
      units.slice(0, 5).forEach(unit => {
        const x = parseDuration(`1${unit}2u3ns`)
        const y = parseDuration(`1${unit}2u14ns`)
        expect(durationComparator(x, x)).toEqual(0)
        expect(durationComparator(x, y)).toBeLessThan(0)
        expect(durationComparator(y, x)).toBeGreaterThan(0)
      })
    })
  })
})
