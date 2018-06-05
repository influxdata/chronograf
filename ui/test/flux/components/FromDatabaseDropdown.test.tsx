import React from 'react'
import {shallow} from 'enzyme'
import FromDatabaseDropdown from 'src/flux/components/FromDatabaseDropdown'
import {service} from 'test/resources'

jest.mock('src/shared/apis/metaQuery', () => require('mocks/flux/apis'))

const setup = () => {
  const props = {
    funcID: '1',
    argKey: 'db',
    value: 'db1',
    bodyID: '2',
    declarationID: '1',
    service,
    onChangeArg: () => {},
  }

  const wrapper = shallow(<FromDatabaseDropdown {...props} />)

  return {
    wrapper,
  }
}

describe('Flux.Components.FromDatabaseDropdown', () => {
  describe('rendering', () => {
    it('renders without errors', () => {
      const {wrapper} = setup()
      expect(wrapper.exists()).toBe(true)
    })
  })
})
