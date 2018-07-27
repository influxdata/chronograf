// Tests to make:
// Successful render of component
// Click dropdown and see items in list
// Selected item appears in button

// for fun (and profit)
// component throws error when no children

import React from 'react'
import {shallow, mount} from 'enzyme'

import Dropdown from 'src/reusable_ui/components/dropdowns/Dropdown'

describe('Dropdown', () => {
  let wrapper

  const wrapperSetup = (override = {}) => {
    const props = {
      selectedItemKey: 'jimmy',
      onChange: () => {},
      children: null,
      ...override,
    }

    return mount(<Dropdown {...props} />)
  }

  const childSetup = (override = {}) => {
    const props = {
      itemKey: 'jimmy',
      value: 'jimmy',
      children: 'jimmy',
      ...override,
    }

    return <Dropdown.Item {...props} />
  }

  it('renders successfully', () => {
    const childA = childSetup()

    const childB = childSetup({
      children: 'johnny',
      itemKey: 'johnny',
      value: 'johnny',
    })

    wrapper = wrapperSetup({
      children: [childA, childB],
    })

    expect(wrapper).toHaveLength(1)
  })

  it('throws error when no children are present', () => {
    expect(() => {
      wrapperSetup({children: null})
    }).toThrow()
  })

  // it('throws error when empty children', () => {
  //   expect(() => {
  //     wrapperSetup({children: []})
  //   }).toThrow()
  // })
})
