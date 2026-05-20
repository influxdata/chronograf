import React from 'react'
import {shallow} from 'enzyme'
import {CheckSources} from 'src/CheckSources'
import MockChild from 'mocks/MockChild'
import PageSpinner from 'src/shared/components/PageSpinner'

import {source} from 'test/resources'

jest.mock('src/sources/apis', () => require('mocks/sources/apis'))
const getSources = jest.fn(() => Promise.resolve)

const setup = (override?) => {
  const props = {
    getSources,
    sources: [source],
    params: {
      sourceID: source.id,
    },
    router: {},
    location: {
      pathname: 'sources',
    },
    auth: {
      isUsingAuth: false,
      me: {},
    },
    notify: () => {},
    errorThrown: () => {},
    ...override,
  }

  const wrapper = shallow(
    <CheckSources {...props}>
      <MockChild />
    </CheckSources>
  )

  return {
    wrapper,
    props,
  }
}

describe('CheckSources', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('rendering', () => {
    it('renders', async () => {
      const {wrapper} = setup()
      expect(wrapper.exists()).toBe(true)
    })

    it('renders a spinner when the component is fetching', () => {
      const {wrapper} = setup()
      const spinner = wrapper.find(PageSpinner)

      expect(spinner.exists()).toBe(true)
    })

    it('renders its children when it is done fetching', done => {
      const {wrapper} = setup()

      // ensure that assertion runs after async behavior of getSources
      process.nextTick(() => {
        wrapper.update()
        const child = wrapper.find(MockChild)
        expect(child.exists()).toBe(true)
        done()
      })
    })
  })

  describe('reader route restrictions', () => {
    const readerAuth = {
      isUsingAuth: true,
      me: {
        role: 'reader',
        organizations: [{id: 'org1'}],
        currentOrganization: {id: 'org1'},
        superAdmin: false,
      },
    }

    it('redirects reader to dashboards when visiting non-dashboard source route', async () => {
      const push = jest.fn()
      const {wrapper, props} = setup({
        router: {push},
      })

      await (wrapper.instance() as any).UNSAFE_componentWillUpdate(
        {
          ...props,
          router: {push},
          params: {sourceID: source.id},
          location: {pathname: `/sources/${source.id}/manage-sources`},
          auth: readerAuth,
        },
        {isFetching: false}
      )

      expect(push).toHaveBeenCalledWith(`/sources/${source.id}/dashboards`)
    })

    it('does not redirect reader when already on dashboards route', async () => {
      const push = jest.fn()
      const {wrapper, props} = setup({
        router: {push},
      })

      await (wrapper.instance() as any).UNSAFE_componentWillUpdate(
        {
          ...props,
          router: {push},
          params: {sourceID: source.id},
          location: {pathname: `/sources/${source.id}/dashboards`},
          auth: readerAuth,
        },
        {isFetching: false}
      )

      expect(push).not.toHaveBeenCalled()
    })
  })
})
