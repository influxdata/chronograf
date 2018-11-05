import React from 'react'
import {shallow} from 'enzyme'

import WizardFullScreen from 'src/reusable_ui/components/wizard/WizardFullScreen'
import WizardController from 'src/reusable_ui/components/wizard/WizardController'

describe('WizardFullScreen', () => {
  let wrapper

  const wrapperSetup = (override = {}) => {
    const props = {
      children: null,
      skipLinkText: undefined,
      handleSkip: undefined,
      isUsingAuth: false,
      isJumpingAllowed: true,
      ...override,
    }

    return shallow(<WizardFullScreen {...props} />)
  }

  beforeEach(() => {
    jest.resetAllMocks()
    wrapper = wrapperSetup()
  })

  it('mounts without exploding', () => {
    expect(wrapper).toHaveLength(1)
  })

  it('renders no WizardController component', () => {
    expect(wrapper.find(WizardController)).toHaveLength(0)
  })

  it('matches snapshot with minimal props', () => {
    expect(wrapper).toMatchSnapshot()
  })

  describe('with children', () => {
    it('renders one WizardController component', () => {
      wrapper = wrapperSetup({children: {}})
      expect(wrapper.find(WizardController)).toHaveLength(1)
    })

    it('matches snapshot with children props', () => {
      expect(wrapper).toMatchSnapshot()
    })
  })
})
