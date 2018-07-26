import React from 'react'
import {shallow} from 'enzyme'

import WizardStep from 'src/reusable_ui/components/wizard/WizardStep'
import FancyScrollbar from 'src/shared/components/FancyScrollbar'
import WizardButtonBar from 'src/reusable_ui/components/wizard/WizardButtonBar'

describe('WizardStep', () => {
  let wrapper

  const wrapperSetup = (override = {}) => {
    const props = {
      title: 'my wizard step',
      isComplete: () => true,
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

  it('mounts a fancy scrollbar', () => {
    expect(wrapper.find(FancyScrollbar)).toHaveLength(1)
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

      expect(spy).not.toBeCalled()
      wrapper.instance().handleClickPrevious()
      expect(spy).toBeCalled()
    })

    it('calls decrement on handleClickPrevious', async () => {
      const spy = jest.spyOn(newProps, 'decrement')

      expect(spy).not.toBeCalled()
      await wrapper.instance().handleClickPrevious()
      expect(spy).toBeCalled()
    })
  })

  describe('WizardStep handleClickNext', () => {
    const newProps = {
      onNext: jest.fn(),
      increment: jest.fn(),
    }

    beforeEach(() => {
      jest.resetAllMocks()
      wrapper = wrapperSetup(newProps)
    })

    it('calls onNext on handleClickNext', () => {
      const spy = jest.spyOn(newProps, 'onNext')

      expect(spy).not.toBeCalled()
      wrapper.instance().handleClickNext()
      expect(spy).toBeCalled()
    })

    it('calls increment on handleClickNext', async () => {
      const spy = jest.spyOn(newProps, 'increment')

      expect(spy).not.toBeCalled()
      await wrapper.instance().handleClickNext()
      expect(spy).toBeCalled()
    })
  })
})
