import {buildFindMeasurementQuery} from 'src/logs/utils'
import {Namespace} from 'src/types'

describe('queryBuilder', () => {
  describe('buildFindMeasurementQuery', () => {
    it('can build a query for a given namespace', () => {
      const namespace: Namespace = {
        database: 'my db',
        retentionPolicy: 'autogen',
      }
      const actual = buildFindMeasurementQuery(namespace, 'test-123_abc')
      const expected =
        'SHOW MEASUREMENTS ON "my db" WITH measurement = "test-123_abc"'

      expect(expected).toEqual(actual)
    })
  })
})
