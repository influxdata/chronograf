import React from 'react'
import {shallow} from 'enzyme'

import CardSelectList from 'src/reusable_ui/components/card_select/CardSelectList'
import CardSelectCard from 'src/reusable_ui/components/card_select/CardSelectCard'

describe('Card Select Card', () => {
  let wrapper

  const wrapperSetup = (override = {}) => {
    const props = {
      children: null,
      legend: null,
      ...override,
    }

    return shallow(<CardSelectList {...props} />)
  }

  const childSetup = (override = {}) => {
    const props = {
      id: null,
      label: null,
      image: null,
      checked: null,
      ...override,
    }

    return shallow(<CardSelectCard {...props} />)
  }

  const cardChildren = [childSetup(), childSetup()]

  beforeEach(() => {
    jest.resetAllMocks()
    wrapper = wrapperSetup({children: cardChildren})
  })

  it('mounts without exploding', () => {
    expect(wrapper).toHaveLength(1)
  })

  // it('matches snapshot with minimal props', () => {
  //   expect(wrapper).toMatchSnapshot()
  // })
})
