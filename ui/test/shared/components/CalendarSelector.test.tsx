import React from 'react'
import moment from 'moment'
import {mount} from 'enzyme'
import {dateFormat} from 'src/shared/utils/time'
import CalendarSelector from 'src/shared/components/calendar_selector/CalendarSelector'

const setup = (overrides = {}) => {
  const props = {
    timeRange: {upper: 'now()', lower: '2017-10-24'},
    onCalendarUpdated: () => {},
    ...overrides,
  }

  return mount(<CalendarSelector {...props} />)
}

describe('shared.Components.CalendarSelector', () => {
  describe('rendering', () => {
    it('renders current time when no time is provided', () => {
      const wrapper = setup({timeRange: {lower: '', upper: ''}})

      expect(wrapper.exists()).toBe(true)

      const input: any = wrapper
        .find({'data-test': 'calendar-input-lower'})
        .instance()

      const now = moment().format(dateFormat)

      expect(input.value).toEqual(now)
    })
  })
})
