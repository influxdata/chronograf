import React from 'react'
import {shallow} from 'enzyme'

import CardSelectCard from 'src/reusable_ui/components/card_select/CardSelectCard'

describe('Card Select Card', () => {
  let wrapper

  const wrapperSetup = (override = {}) => {
    const props = {
      id: null,
      label: null,
      image: null,
      checked: null,
      disabled: null,
      ...override,
    }

    return shallow(<CardSelectCard {...props} />)
  }

  beforeEach(() => {
    jest.resetAllMocks()
    wrapper = wrapperSetup()
  })

  it('mounts without exploding', () => {
    expect(wrapper).toHaveLength(1)
  })

  // it('matches snapshot with minimal props', () => {
  //   expect(wrapper).toMatchSnapshot()
  // })
})
