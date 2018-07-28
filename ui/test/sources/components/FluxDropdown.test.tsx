import React from 'react'
import {shallow} from 'enzyme'

import {FluxDropdown} from 'src/sources/components/FluxDropdown'
import {source, service} from 'test/fixtures'

const setup = (propsOverride = {}) => {
  const props = {
    source,
    services: [],
    setActiveFlux: jest.fn(),
    deleteFlux: jest.fn(),
    // react-router props
    router: null,
    location: null,
    params: null,
    route: null,
    routes: [],
    routeParams: null,
    ...propsOverride,
  }

  const wrapper = shallow(<FluxDropdown {...props} />)

  return {
    props,
    wrapper,
  }
}

describe('Sources.Components.FluxDropdown', () => {
  describe('when there are no services', () => {
    it('renders a link', () => {
      const {wrapper} = setup()

      const dropdown = wrapper.find({'data-test': 'dropdown'})
      const link = wrapper.find({'data-test': 'link'})

      expect(dropdown.length).toBe(0)
      expect(link.length).toBe(1)
    })
  })

  describe('when there are services', () => {
    it('renders the Dropdown component', () => {
      const services = [service]
      const {wrapper} = setup({services})

      const dropdown = wrapper.find({'data-test': 'dropdown'})
      const link = wrapper.find({'data-test': 'link'})

      expect(dropdown.length).toBe(1)
      expect(link.length).toBe(0)
    })
  })
})
