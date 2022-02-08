import {
  genFlux,
  FUNCTIONS,
} from 'src/shared/components/TimeMachine/fluxQueryBuilder/util/constants'

describe('fluxQueryBuilder/util/constants', () => {
  describe('genFlux', () => {
    test('no-period', () => {
      const actual = genFlux('mean', 'none')
      const expected = `|> mean()`

      expect(actual).toBe(expected)
    })
    test('unknown fn', () => {
      const actual = genFlux('whatever', 'none')
      const expected = `|> whatever()`

      expect(actual).toBe(expected)
    })
    test('derivative', () => {
      const actual = FUNCTIONS.find(x => x.name === 'derivative')?.flux('200d')
      const expected = `|> derivative(unit: 1s, nonNegative: false)`

      expect(actual).toBe(expected)
    })
    test('non-negative derivative', () => {
      const actual = FUNCTIONS.find(
        x => x.name === 'nonnegative derivative'
      )?.flux('200d')
      const expected = `|> derivative(unit: 1s, nonNegative: true)`

      expect(actual).toBe(expected)
    })
    const simpleFns = [
      'unique',
      'spread',
      'sort',
      'count',
      'distinct',
      'sort',
      'skew',
      'increase',
    ]
    FUNCTIONS.filter(x => !x.name.includes('derivative')).forEach(x => {
      test(x.name, () => {
        if (simpleFns.includes(x.name)) {
          expect(x.flux('1s')).toBe(`|> ${x.name}()`)
          expect(x.flux('1h', true)).toBe(`|> ${x.name}()`)
          expect(x.flux('1d', false)).toBe(`|> ${x.name}()`)
        } else {
          expect(x.flux('1s')).toBe(
            `|> aggregateWindow(every: 1s, fn: ${x.name}, createEmpty: false)`
          )
          expect(x.flux('1h', true)).toBe(
            `|> aggregateWindow(every: 1h, fn: ${x.name}, createEmpty: true)`
          )
          expect(x.flux('1d', false)).toBe(
            `|> aggregateWindow(every: 1d, fn: ${x.name}, createEmpty: false)`
          )
        }
      })
    })
  })
})
