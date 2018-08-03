import React from 'react'
import {shallow} from 'enzyme'

import CardSelectList from 'src/reusable_ui/components/card_select/CardSelectList'
import CardSelectCard from 'src/reusable_ui/components/card_select/CardSelectCard'

describe('Card Select Card', () => {
  let wrapper

  const wrapperSetup = (override = {}) => {
    const props = {
      children: undefined,
      legend: 'legend',
      ...override,
    }

    return shallow(<CardSelectList {...props} />)
  }

  const childSetup = (override = {}) => {
    const props = {
      id: 'card_id',
      label: 'Card Label',
      image: undefined,
      checked: undefined,
      disabled: undefined,
      ...override,
    }

    return shallow(<CardSelectCard {...props} />)
  }

  const cardChildren = [childSetup(), childSetup()]

  beforeEach(() => {
    wrapper = wrapperSetup({children: cardChildren})
  })

  it('mounts without exploding', () => {
    expect(wrapper).toHaveLength(1)
  })

  it('renders one fieldset', () => {
    expect(wrapper.find('fieldset')).toHaveLength(1)
  })

  it('renders one legend', () => {
    expect(wrapper.find('legend')).toHaveLength(1)
  })

  it('matches snapshot with two children', () => {
    expect(wrapper).toMatchSnapshot()
  })
})
