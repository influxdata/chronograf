import {genFlux} from 'src/shared/constants/queryBuilder'

describe('queryBuilder', () => {
  describe('genFlux', () => {
    test('derivative', () => {
      const actual = genFlux('derivative', '200d')
      const expected = `|> derivative(unit: 1s, nonNegative: false)`

      expect(actual).toBe(expected)
    })

    test('non-negative derivative', () => {
      const actual = genFlux('nonnegative derivative', '200d')
      const expected = `|> derivative(unit: 1s, nonNegative: true)`

      expect(actual).toBe(expected)
    })
  })
})
