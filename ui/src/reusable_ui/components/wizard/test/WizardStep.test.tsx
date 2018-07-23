import React from 'react'
import {shallow} from 'enzyme'

import WizardStep from 'src/reusable_ui/components/wizard/WizardStep'
import FancyScrollbar from 'src/shared/components/FancyScrollbar'
import WizardButtonBar from 'src/reusable_ui/components/wizard/WizardButtonBar'

describe('WizardStep', () => {
  let wrapper

  const mockChild = 'this is a text'

  const decrement = jest.fn()

  const increment = jest.fn()

  const props = {
    title: 'my wizard step',
    isComplete: () => true,
    onPrevious: jest.fn(),
    onNext: jest.fn(),
    increment: undefined,
    decrement: undefined,
    tipText: undefined,
    nextLabel: undefined,
    previousLabel: undefined,
    lastStep: undefined,
  }

  beforeEach(() =>
    (wrapper = shallow(<WizardStep {...props}>{mockChild}</WizardStep>)))

  it('mounts without exploding', () => {
    expect(wrapper).toHaveLength(1)
  })

  it('mounts a fancy scrollbar', () => {
    expect(wrapper.find(FancyScrollbar)).toHaveLength(1)
  })

  it('mounts a button bar', () => {
    expect(wrapper.find(WizardButtonBar)).toHaveLength(1)
  })

  it('mounts children', () => {
    expect(wrapper.find(FancyScrollbar).props().children).toBe(mockChild)
  })

  describe('WizardStep handleClickPrevious', () => {
    const newProps = {...props, decrement}

    beforeEach(() => {
      jest.resetAllMocks()
      wrapper = shallow(<WizardStep {...newProps}>{mockChild}</WizardStep>)
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
    const newProps = {...props, increment}

    beforeEach(() => {
      jest.resetAllMocks()
      wrapper = shallow(<WizardStep {...newProps}>{mockChild}</WizardStep>)
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
