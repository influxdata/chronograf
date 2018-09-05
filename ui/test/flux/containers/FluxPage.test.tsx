import React from 'react'
import {shallow} from 'enzyme'
import {FluxPage} from 'src/flux/containers/FluxPage'
import {source} from 'test/resources'
import Threesizer from 'src/shared/components/threesizer/Threesizer'

jest.mock('src/flux/apis', () => require('mocks/flux/apis'))

const setup = () => {
  const props = {
    links: {
      self: '',
      suggestions: '',
      ast: '',
    },
    service: null,
    services: [],
    source,
    sources: [source],
    script: '',
    notify: () => {},
    params: {
      sourceID: '',
    },
    updateScript: (script: string) => {
      return {
        type: 'UPDATE_SCRIPT',
        payload: {
          script,
        },
      }
    },
    onGoToEditFlux: () => {},
    onChangeService: () => {},
  }

  const wrapper = shallow(<FluxPage {...props} />)

  return {
    wrapper,
  }
}

describe('Flux.Containers.FluxPage', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('rendering', () => {
    it('renders the page', async () => {
      const {wrapper} = setup()

      expect(wrapper.exists()).toBe(true)
    })

    it('renders the <Threesizer/>', () => {
      const {wrapper} = setup()

      const threesizer = wrapper.find(Threesizer)

      expect(threesizer.exists()).toBe(true)
    })
  })
})
