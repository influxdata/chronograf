import {csvToMap, mapToCSV} from 'src/tempVars/utils'

import {TemplateValueType} from 'src/types'

describe('MapVars', () => {
  const mapDefaults = {
    type: TemplateValueType.Map,
    value: '',
    key: '',
    selected: false,
    localSelected: false,
  }

  describe('csvToMap', () => {
    it('can parse key values', () => {
      const csv = 'a,1\nb,2\nc,3\n'

      const {values: actual} = csvToMap(csv)
      expect(actual).toEqual([
        {
          ...mapDefaults,
          key: 'a',
          value: '1',
        },
        {
          ...mapDefaults,
          key: 'b',
          value: '2',
        },
        {
          ...mapDefaults,
          key: 'c',
          value: '3',
        },
      ])
    })

    it('records invalid keys', () => {
      const csv = 'a,1,2\nb,2\nc,3\n'

      const {values: actual, errors} = csvToMap(csv)
      expect(actual).toEqual([
        {
          ...mapDefaults,
          key: 'b',
          value: '2',
        },
        {
          ...mapDefaults,
          key: 'c',
          value: '3',
        },
      ])

      expect(errors).toEqual(['a'])
    })

    it('can parse single quoted values', () => {
      const csv = `a,'1'\nb,'2'\nc,'3'\n`

      const {values: actual} = csvToMap(csv)
      expect(actual).toEqual([
        {
          ...mapDefaults,
          key: 'a',
          value: `'1'`,
        },
        {
          ...mapDefaults,
          key: 'b',
          value: `'2'`,
        },
        {
          ...mapDefaults,
          key: 'c',
          value: `'3'`,
        },
      ])
    })

    it('can parse single quoted values with commas and spaces', () => {
      const csv = `a,"'1, 2'"\nb,"'2, 3'"\nc,"'3, 4'"\n`

      const {values: actual} = csvToMap(csv)
      expect(actual).toEqual([
        {
          ...mapDefaults,
          key: 'a',
          value: `'1, 2'`,
        },
        {
          ...mapDefaults,
          key: 'b',
          value: `'2, 3'`,
        },
        {
          ...mapDefaults,
          key: 'c',
          value: `'3, 4'`,
        },
      ])
    })

    it('can parse double quoted values', () => {
      const csv = `a,"1"\nb,"2"\nc,"3"\n`

      const {values: actual} = csvToMap(csv)
      expect(actual).toEqual([
        {
          ...mapDefaults,
          key: 'a',
          value: '1',
        },
        {
          ...mapDefaults,
          key: 'b',
          value: '2',
        },
        {
          ...mapDefaults,
          key: 'c',
          value: '3',
        },
      ])
    })

    it('can parse double quoted values with commas', () => {
      const csv = `a,"1, 2"\nb,"2, 3"\nc,"3, 4"\n`

      const {values: actual} = csvToMap(csv)

      expect(actual).toEqual([
        {
          ...mapDefaults,
          key: 'a',
          value: '1, 2',
        },
        {
          ...mapDefaults,
          key: 'b',
          value: '2, 3',
        },
        {
          ...mapDefaults,
          key: 'c',
          value: '3, 4',
        },
      ])
    })
  })

  describe('mapToCSV', () => {
    it('can create a CSV', () => {
      const actual = mapToCSV([
        {
          ...mapDefaults,
          key: 'a',
          value: '1',
        },
        {
          ...mapDefaults,
          key: 'b',
          value: '2',
        },
        {
          ...mapDefaults,
          key: 'c',
          value: '3',
        },
      ])

      const expected = 'a,"1"\nb,"2"\nc,"3"'

      expect(actual).toEqual(expected)
    })
  })

  it('can double quote single quoted values', () => {
    const actual = mapToCSV([
      {
        ...mapDefaults,
        key: 'a',
        value: `'1, 2'`,
      },
      {
        ...mapDefaults,
        key: 'b',
        value: `'2, 3'`,
      },
      {
        ...mapDefaults,
        key: 'c',
        value: `'3, 4'`,
      },
    ])

    const expected = `a,"'1, 2'"\nb,"'2, 3'"\nc,"'3, 4'"`

    expect(actual).toEqual(expected)
  })

  it('can double quote keys with CSV values', () => {
    const actual = mapToCSV([
      {
        ...mapDefaults,
        key: 'a',
        value: '1, 2',
      },
      {
        ...mapDefaults,
        key: 'b',
        value: '2, 3',
      },
      {
        ...mapDefaults,
        key: 'c',
        value: '3, 4',
      },
    ])

    const expected = `a,"1, 2"\nb,"2, 3"\nc,"3, 4"`

    expect(actual).toEqual(expected)
  })
})
