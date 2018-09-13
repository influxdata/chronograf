import {shallow} from 'enzyme'
import React from 'react'
import Gauge from 'src/shared/components/Gauge'
import GaugeChart from 'src/shared/components/GaugeChart'
import {DataType} from 'src/shared/constants'

const data = [
  {
    response: {
      results: [
        {
          series: [
            {
              values: [[1, 2]],
              columns: ['time', 'value'],
            },
          ],
        },
      ],
    },
  },
]

const defaultProps = {
  data: [],
  isFetchingInitially: false,
  cellID: '',
  prefix: '',
  suffix: '',
  decimalPlaces: {
    digits: 10,
    isEnforced: false,
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
  describe('render', () => {
    describe('when data is empty', () => {
      it('renders the correct number', () => {
        const wrapper = setup()

        expect(wrapper.find(Gauge).exists()).toBe(true)
        expect(wrapper.find(Gauge).props().gaugePosition).toBe(0)
      })
    })

    describe('when data has a value', () => {
      it('renders the correct number', () => {
        const wrapper = setup({data})

        expect(wrapper.find(Gauge).exists()).toBe(true)
        expect(wrapper.find(Gauge).props().gaugePosition).toBe(2)
      })
    })
  })
})
