import {shallow} from 'enzyme'
import React from 'react'
import Gauge from 'src/shared/components/Gauge'
import GaugeChart from 'src/shared/components/GaugeChart'
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
}

const setup = (overrides = {}) => {
  const props = {
    ...defaultProps,
    ...overrides,
  }

  return shallow(<GaugeChart {...props} />)
}

describe('GaugeChart', () => {
  describe('rendering influxQL response', () => {
    describe('when data is empty', () => {
      it('renders the correct number', () => {
        const wrapper = setup()

        expect(wrapper.find(Gauge).exists()).toBe(true)
        expect(wrapper.find(Gauge).props().gaugePosition).toBe(0)
      })
    })

    describe('when data has a value', () => {
      it('renders the correct number', () => {
        const wrapper = setup({data: createInfluxQLDataValue(2)})

        expect(wrapper.find(Gauge).exists()).toBe(true)
        expect(wrapper.find(Gauge).props().gaugePosition).toBe(2)
      })
    })
  })

  describe('rendering flux response', () => {
    describe('when data is empty', () => {
      it('renders the correct number', () => {
        const wrapper = setup({datatype: DataType.flux, data: []})

        expect(wrapper.find(Gauge).exists()).toBe(true)
        expect(wrapper.find(Gauge).props().gaugePosition).toBe(0)
      })
    })

    describe('when data has a value', () => {
      it('renders the correct number', async () => {
        const data = createFluxDataValue('67.3901637395223')
        const mockFluxToSingleStat = jest.fn(
          fluxValueToSingleStat('67.3901637395223')
        )

        const wrapper = await setup({
          data,
          dataType: DataType.flux,
          fluxTablesToSingleStat: mockFluxToSingleStat,
        })

        expect(mockFluxToSingleStat).toHaveBeenCalledWith(data)
        expect(mockFluxToSingleStat).toHaveReturned()
        wrapper.update()
        expect(wrapper.find(Gauge).exists()).toBe(true)
        expect(wrapper.find(Gauge).props().gaugePosition).toBe(67.3901637395223)
      })
    })
  })
})
