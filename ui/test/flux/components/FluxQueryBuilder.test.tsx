import React from 'react'
import {shallow} from 'enzyme'
import FluxQueryBuilder from 'src/flux/components/FluxQueryBuilder'
import {service} from 'test/resources'

const setup = () => {
  const props = {
    script: '',
    body: [],
    data: [],
    service,
    suggestions: [],
    onSubmitScript: () => {},
    onChangeScript: () => {},
    onValidate: () => {},
    onAppendFrom: () => {},
    onAppendJoin: () => {},
    onDeleteBody: () => {},
    status: {type: '', text: ''},
  }

  const wrapper = shallow(<FluxQueryBuilder {...props} />)

  return {
    wrapper,
  }
}

describe('Flux.Components.FluxQueryBuilder', () => {
  describe('rendering', () => {
    it('renders', () => {
      const {wrapper} = setup()

      expect(wrapper.exists()).toBe(true)
    })
  })
})
