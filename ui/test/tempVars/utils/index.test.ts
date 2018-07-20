import {resolveValues} from 'src/tempVars/utils'

import {TemplateType, TemplateValueType} from 'src/types'

describe('template value resolution', () => {
  describe('query backed templates', () => {
    test('uses supplied value for localSelectedValue if exists', () => {
      const template = {
        id: '0',
        tempVar: ':a:',
        label: '',
        query: {},
        type: TemplateType.CSV,
        values: [
          {
            value: 'a',
            type: TemplateValueType.CSV,
            selected: false,
            localSelected: false,
          },
          {
            value: 'b',
            type: TemplateValueType.CSV,
            selected: true,
            localSelected: false,
          },
          {
            value: 'c',
            type: TemplateValueType.CSV,
            selected: false,
            localSelected: false,
          },
        ],
      }

      const result = resolveValues(template, ['a', 'b', 'c'], 'c')

      expect(result).toEqual([
        {
          value: 'a',
          type: TemplateValueType.CSV,
          selected: false,
          localSelected: false,
        },
        {
          value: 'b',
          type: TemplateValueType.CSV,
          selected: true,
          localSelected: false,
        },
        {
          value: 'c',
          type: TemplateValueType.CSV,
          selected: false,
          localSelected: true,
        },
      ])
    })

    test('uses existing localSelectedValue if none supplied', () => {
      const template = {
        id: '0',
        tempVar: ':a:',
        label: '',
        query: {},
        type: TemplateType.CSV,
        values: [
          {
            value: 'a',
            type: TemplateValueType.CSV,
            selected: false,
            localSelected: false,
          },
          {
            value: 'b',
            type: TemplateValueType.CSV,
            selected: true,
            localSelected: true,
          },
          {
            value: 'c',
            type: TemplateValueType.CSV,
            selected: false,
            localSelected: false,
          },
        ],
      }

      const result = resolveValues(template, ['a', 'b', 'c'])

      expect(result).toEqual([
        {
          value: 'a',
          type: TemplateValueType.CSV,
          selected: false,
          localSelected: false,
        },
        {
          value: 'b',
          type: TemplateValueType.CSV,
          selected: true,
          localSelected: true,
        },
        {
          value: 'c',
          type: TemplateValueType.CSV,
          selected: false,
          localSelected: false,
        },
      ])
    })

    test('defaults to selected value if no localSelectedValue and no supplied value', () => {
      const template = {
        id: '0',
        tempVar: ':a:',
        label: '',
        query: {},
        type: TemplateType.CSV,
        values: [
          {
            value: 'a',
            type: TemplateValueType.CSV,
            selected: false,
            localSelected: false,
          },
          {
            value: 'b',
            type: TemplateValueType.CSV,
            selected: true,
            localSelected: false,
          },
          {
            value: 'c',
            type: TemplateValueType.CSV,
            selected: false,
            localSelected: false,
          },
        ],
      }

      const result = resolveValues(template, ['a', 'b', 'c'])

      expect(result).toEqual([
        {
          value: 'a',
          type: TemplateValueType.CSV,
          selected: false,
          localSelected: false,
        },
        {
          value: 'b',
          type: TemplateValueType.CSV,
          selected: true,
          localSelected: true,
        },
        {
          value: 'c',
          type: TemplateValueType.CSV,
          selected: false,
          localSelected: false,
        },
      ])
    })
  })

  describe('Map templates', () => {
    test('maintains current selections', () => {
      const template = {
        id: '',
        label: '',
        query: {},
        tempVar: ':a:',
        type: TemplateType.Map,
        values: [
          {
            type: TemplateValueType.Map,
            key: 'k1',
            value: 'v1',
            selected: true,
            localSelected: false,
          },
          {
            type: TemplateValueType.Map,
            key: 'k2',
            value: 'v2',
            selected: false,
            localSelected: true,
          },
        ],
      }

      const expected = [
        {
          type: TemplateValueType.Map,
          key: 'k1',
          value: 'v1',
          selected: true,
          localSelected: false,
        },
        {
          type: TemplateValueType.Map,
          key: 'k2',
          value: 'v2',
          selected: false,
          localSelected: true,
        },
      ]

      expect(resolveValues(template)).toEqual(expected)
    })

    test('uses supplied selected value when exists', () => {
      const template = {
        id: '',
        label: '',
        query: {},
        tempVar: ':a:',
        type: TemplateType.Map,
        values: [
          {
            type: TemplateValueType.Map,
            key: 'k1',
            value: 'v1',
            selected: true,
            localSelected: false,
          },
          {
            type: TemplateValueType.Map,
            key: 'k2',
            value: 'v2',
            selected: false,
            localSelected: true,
          },
        ],
      }

      const expected = [
        {
          type: TemplateValueType.Map,
          key: 'k1',
          value: 'v1',
          selected: true,
          localSelected: true,
        },
        {
          type: TemplateValueType.Map,
          key: 'k2',
          value: 'v2',
          selected: false,
          localSelected: false,
        },
      ]

      expect(resolveValues(template, null, 'k1')).toEqual(expected)
    })
  })

  describe('CSV templates', () => {
    test('maintains current selections', () => {
      const template = {
        id: '',
        label: '',
        query: {},
        tempVar: ':a:',
        type: TemplateType.CSV,
        values: [
          {
            type: TemplateValueType.CSV,
            value: 'v1',
            selected: true,
            localSelected: false,
          },
          {
            type: TemplateValueType.CSV,
            value: 'v2',
            selected: false,
            localSelected: true,
          },
        ],
      }

      const expected = [
        {
          type: TemplateValueType.CSV,
          value: 'v1',
          selected: true,
          localSelected: false,
        },
        {
          type: TemplateValueType.CSV,
          value: 'v2',
          selected: false,
          localSelected: true,
        },
      ]

      expect(resolveValues(template)).toEqual(expected)
    })

    test('uses supplied selected value when exists', () => {
      const template = {
        id: '',
        label: '',
        query: {},
        tempVar: ':a:',
        type: TemplateType.CSV,
        values: [
          {
            type: TemplateValueType.CSV,
            value: 'v1',
            selected: true,
            localSelected: false,
          },
          {
            type: TemplateValueType.CSV,
            value: 'v2',
            selected: false,
            localSelected: true,
          },
        ],
      }

      const expected = [
        {
          type: TemplateValueType.CSV,
          value: 'v1',
          selected: true,
          localSelected: true,
        },
        {
          type: TemplateValueType.CSV,
          value: 'v2',
          selected: false,
          localSelected: false,
        },
      ]

      expect(resolveValues(template, null, 'v1')).toEqual(expected)
    })
  })

  describe('Text templates', () => {
    test('maintains current selection', () => {
      const template = {
        id: '',
        label: '',
        query: {},
        tempVar: ':a:',
        type: TemplateType.Text,
        values: [
          {
            type: TemplateValueType.Constant,
            value: 'v1',
            selected: true,
            localSelected: false,
          },
        ],
      }

      const expected = [
        {
          type: TemplateValueType.Constant,
          value: 'v1',
          selected: true,
          localSelected: true,
        },
      ]

      expect(resolveValues(template)).toEqual(expected)
    })

    test('uses supplied selected value when exists', () => {
      const template = {
        id: '',
        label: '',
        query: {},
        tempVar: ':a:',
        type: TemplateType.Text,
        values: [
          {
            type: TemplateValueType.Constant,
            value: 'v1',
            selected: true,
            localSelected: false,
          },
        ],
      }

      const expected = [
        {
          type: TemplateValueType.Constant,
          value: 'v2',
          selected: false,
          localSelected: true,
        },
      ]

      expect(resolveValues(template, null, 'v2')).toEqual(expected)
    })

    test('returns blank value if no existing values and no supplied value', () => {
      const template = {
        id: '',
        label: '',
        query: {},
        tempVar: ':a:',
        type: TemplateType.Text,
        values: [],
      }

      const expected = [
        {
          type: TemplateValueType.Constant,
          value: '',
          selected: false,
          localSelected: true,
        },
      ]

      expect(resolveValues(template)).toEqual(expected)
    })
  })
})
