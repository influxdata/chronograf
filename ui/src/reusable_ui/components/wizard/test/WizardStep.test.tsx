import React from 'react'
import {shallow} from 'enzyme'

import WizardStep from 'src/reusable_ui/components/wizard/WizardStep'
import WizardButtonBar from 'src/reusable_ui/components/wizard/WizardButtonBar'

describe('WizardStep', () => {
  let wrapper

  const wrapperSetup = (override = {}) => {
    const props = {
      title: 'my wizard step',
      isComplete: () => true,
      isErrored: undefined,
      isSkippableStep: undefined,
      onPrevious: undefined,
      onNext: undefined,
      increment: undefined,
      decrement: undefined,
      tipText: undefined,
      nextLabel: undefined,
      previousLabel: undefined,
      lastStep: undefined,
      ...override,
    }

    const mockChild = 'this is a text'

    return shallow(<WizardStep {...props}>{mockChild}</WizardStep>)
  }

  beforeEach(() => {
    wrapper = wrapperSetup()
  })

  it('mounts without exploding', () => {
    expect(wrapper).toHaveLength(1)
  })

  it('mounts a button bar', () => {
    expect(wrapper.find(WizardButtonBar)).toHaveLength(1)
  })

  it('matches snapshot', () => {
    expect(wrapper).toMatchSnapshot()
  })

  describe('WizardStep handleClickPrevious', () => {
    const newProps = {
      onPrevious: jest.fn(),
      decrement: jest.fn(),
    }

    beforeEach(() => {
      jest.resetAllMocks()
      wrapper = wrapperSetup(newProps)
    })

    it('calls onPrevious on handleClickPrevious', () => {
      const spy = jest.spyOn(newProps, 'onPrevious')

      expect(spy).not.toHaveBeenCalled()
      wrapper.instance().handleClickPrevious()
      expect(spy).toHaveBeenCalled()
    })

    it('calls decrement on handleClickPrevious', async () => {
      const spy = jest.spyOn(newProps, 'decrement')

      expect(spy).not.toHaveBeenCalled()
      await wrapper.instance().handleClickPrevious()
      expect(spy).toHaveBeenCalled()
    })
  })
})
