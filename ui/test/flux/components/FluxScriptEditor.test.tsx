import React from 'react'
import FluxScriptEditor from 'src/flux/components/FluxScriptEditor'
import {shallow} from 'enzyme'

const setup = (override?) => {
  const props = {
    script: '',
    onChangeScript: () => {},
    ...override,
  }

  const wrapper = shallow(<FluxScriptEditor {...props} />)

  return {
    wrapper,
    props,
  }
}

describe('Flux.Components.FluxScriptEditor', () => {
  describe('rendering', () => {
    it('renders without error', () => {
      const {wrapper} = setup()
      expect(wrapper.exists()).toBe(true)
    })
  })
})
