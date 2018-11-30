import {shallow} from 'enzyme'
import React from 'react'
import SingleStat from 'src/shared/components/SingleStat'
import {DataType} from 'src/shared/constants'

import {
  createInfluxQLDataValue,
  fluxValueToSingleStat,
  createFluxDataValue,
} from 'test/shared/components/helpers'

const defaultProps = {
  data: [],
  isFetchingInitially: false,
  cellID: '',
  prefix: '',
  suffix: '',
  decimalPlaces: {
    digits: 2,
    isEnforced: true,
  },
  dataType: DataType.influxQL,
  cellHeight: 10,
  colors: [],
  lineGraph: false,
}

const setup = (overrides = {}) => {
  const props = {
    ...defaultProps,
    ...overrides,
  }

  return shallow(<SingleStat {...props} />)
}

describe('SingleStat', () => {
  const StatSelector = '.single-stat--text'

  describe('rendering influxQL response', () => {
    describe('when data is empty', () => {
      it('renders the correct number', () => {
        const wrapper = setup()

        expect(wrapper.find(StatSelector)).toHaveLength(1)
        expect(wrapper.find(StatSelector).text()).toBe('0')
      })
    })

    describe('when data has a value', () => {
      it('renders the correct number', () => {
        const wrapper = setup({data: createInfluxQLDataValue(2)})

        expect(wrapper.find(StatSelector).exists()).toBe(true)
        expect(wrapper.find(StatSelector).text()).toBe('2')
      })
    })
  })

  describe('rendering flux response', () => {
    describe('when data is empty', () => {
      it('renders the correct number', () => {
        const wrapper = setup({datatype: DataType.flux, data: []})

        expect(wrapper.find(StatSelector).exists()).toBe(true)
        expect(wrapper.find(StatSelector).text()).toBe('0')
      })
    })

    describe('when data has a value', () => {
      it('renders the correct number', async () => {
        const data = createFluxDataValue('9000.123456790235')
        const mockFluxToSingleStat = jest.fn(
          fluxValueToSingleStat('9000.123456790235')
        )

        const wrapper = await setup({
          data,
          dataType: DataType.flux,
          fluxTablesToSingleStat: mockFluxToSingleStat,
          prefix: 'Over ',
          suffix: ' battle power!',
        })

        expect(mockFluxToSingleStat).toBeCalledWith(data)
        await expect(mockFluxToSingleStat).toReturn()
        await wrapper.update()
        expect(wrapper.find(StatSelector).exists()).toBe(true)
        expect(wrapper.find(StatSelector).text()).toBe(
          'Over 9,000.12 battle power!'
        )
      })
    })
  })
})
