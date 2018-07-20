import React from 'react'
import moment from 'moment'
import {mount} from 'enzyme'
import {dateFormat} from 'src/shared/utils/time'
import CalendarSelector from 'src/shared/components/calendar_selector/CalendarSelector'

const setup = (overrides = {}) => {
  const props = {
    timeRange: {upper: 'now()', lower: '2017-10-24'},
    onApplyTimeRange: () => {},
    ...overrides,
  }

  return mount(<CalendarSelector {...props} />)
}

describe('shared.Components.CalendarSelector', () => {
  describe('rendering', () => {
    // it('renders correct time when now is selected', () => {
    //   const wrapper = setup()

    //   expect(wrapper.exists()).toBe(true)

    //   expect(wrapper.dive().text()).toContain(moment().format('MMM Do HH:mm'))
    // })

    it('renders current time when no time is provided', () => {
      const wrapper = setup({timeRange: {lower: '', upper: ''}})

      expect(wrapper.exists()).toBe(true)

      const input = wrapper.find({'data-test': 'calendar-input-lower'})

      console.debug(input)
      console.debug(input.text())

      const now = moment().format(dateFormat)

      expect(input.props().value).toEqual(now)
    })
  })
})
