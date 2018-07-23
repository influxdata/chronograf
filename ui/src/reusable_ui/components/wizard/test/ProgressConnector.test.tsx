import React from 'react'
import {shallow} from 'enzyme'

import ProgressConnector from 'src/reusable_ui/components/wizard/ProgressConnector'
import {ConnectorState} from 'src/types/wizard'

describe('Progress Connector', () => {
  let wrapper

  const expectedWithoutStatus = `progress-connector progress-connector--${
    ConnectorState.None
  }`

  const expectedWithStatusSome = `progress-connector progress-connector--${
    ConnectorState.Some
  }`

  const expectedWithStatusAll = `progress-connector progress-connector--${
    ConnectorState.Full
  }`

  describe('without Props', () => {
    const props = {
      status: undefined,
    }

    beforeEach(() => (wrapper = shallow(<ProgressConnector {...props} />)))

    it('mounts without exploding', () => {
      expect(wrapper).toHaveLength(1)
    })

    it('defaults to enum state "none" when no props provided', () => {
      expect(wrapper.find('span').props().className).toBe(expectedWithoutStatus)
    })
  })

  describe('with status: some', () => {
    const props = {
      status: ConnectorState.Some,
    }

    beforeEach(() => (wrapper = shallow(<ProgressConnector {...props} />)))

    it('defaults to enum state "some" when no props provided', () => {
      expect(wrapper.find('span').props().className).toBe(
        expectedWithStatusSome
      )
    })
  })

  describe('with status: all', () => {
    const props = {
      status: ConnectorState.Full,
    }

    beforeEach(() => (wrapper = shallow(<ProgressConnector {...props} />)))

    it('defaults to enum state "all" when no props provided', () => {
      expect(wrapper.find('span').props().className).toBe(expectedWithStatusAll)
    })
  })
})
