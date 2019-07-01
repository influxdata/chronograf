import React from 'react'
import AlertsTableRow from 'src/alerts/components/AlertsTableRow'
import {Link} from 'react-router'

import {shallow} from 'enzyme'

// Types
import {TimeZones} from 'src/types'

const alertsTableRowProps = {
  sourceID: '3',
  name: 'No Dog Can Be',
  level: 'OK',
  time: Date.now().toString(),
  host: 'Ada Island',
  value: '1337',
  timeZone: TimeZones.UTC,
}

const setup = (override = {}) => {
  const props = {
    ...alertsTableRowProps,
    ...override,
  }
  const wrapper = shallow(<AlertsTableRow {...props} />)
  return {
    props,
    wrapper,
  }
}

describe('Components.Shared.ProvidersTableRowNew', () => {
  it('should render all valid data with the passed in data', () => {
    const time = Date.now().toString()

    const {wrapper} = setup({time})

    const nameCell = wrapper.find({'data-test': 'nameCell'})
    const levelCell = wrapper.find({'data-test': 'levelCell'})
    const timeCell = wrapper.find({'data-test': 'timeCell'})
    const hostCell = wrapper.find({'data-test': 'hostCell'})
    const valueCell = wrapper.find({'data-test': 'valueCell'})

    expect(nameCell.text()).toBe('No Dog Can Be')
    expect(levelCell.text()).toBe('')
    expect(timeCell.text()).toBe(new Date(Number(time)).toISOString())
    expect(hostCell.find(Link).exists()).toBe(true)
    expect(valueCell.text()).toBe('1337')
  })

  it('should render any invalid data as an mdash', () => {
    const props = {
      sourceID: '3',
      name: null,
      level: null,
      time: null,
      host: null,
      value: null,
    }
    const {wrapper} = setup(props)

    const nameCell = wrapper.find({'data-test': 'nameCell'})
    const levelCell = wrapper.find({'data-test': 'levelCell'})
    const timeCell = wrapper.find({'data-test': 'timeCell'})
    const hostCell = wrapper.find({'data-test': 'hostCell'})
    const valueCell = wrapper.find({'data-test': 'valueCell'})

    expect(nameCell.text()).toBe('–')
    expect(levelCell.text()).toBe('–')
    expect(timeCell.text()).toBe('–')
    expect(hostCell.find(Link).exists()).toBe(false)
    expect(valueCell.text()).toBe('–')
  })
})
