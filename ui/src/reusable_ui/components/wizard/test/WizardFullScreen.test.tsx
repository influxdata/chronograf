import React from 'react'
import {shallow} from 'enzyme'

import WizardFullScreen from 'src/reusable_ui/components/wizard/WizardFullScreen'
import WizardCloak from 'src/reusable_ui/components/wizard/WizardCloak'
import SplashPage from 'src/shared/components/SplashPage'

describe('WizardFullScreen', () => {
  let wrapper

  const wrapperSetup = (override = {}) => {
    const props = {
      children: null,
      title: undefined,
      skipLinkText: undefined,
      handleSkip: undefined,
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

  it('renders one SplashPage component', () => {
    expect(wrapper.find(SplashPage)).toHaveLength(1)
  })

  it('renders no WizardCloak component', () => {
    expect(wrapper.find(WizardCloak)).toHaveLength(0)
  })

  it('matches snapshot with minimal props', () => {
    expect(wrapper).toMatchSnapshot()
  })

  describe('with children', () => {
    it('renders one WizardCloak component', () => {
      wrapper = wrapperSetup({children: {}})
      expect(wrapper.find(WizardCloak)).toHaveLength(1)
    })

    it('matches snapshot with children props', () => {
      expect(wrapper).toMatchSnapshot()
    })
  })
})
