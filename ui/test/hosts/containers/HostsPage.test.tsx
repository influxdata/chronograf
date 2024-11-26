import React from 'react'
import {shallow} from 'enzyme'

import {HostsPage} from 'src/hosts/containers/HostsPage'
import HostsTable from 'src/hosts/components/HostsTable'
import PageHeader from 'src/reusable_ui/components/page_layout/PageHeader'
import Title from 'src/reusable_ui/components/page_layout/PageHeaderTitle'

import {source, authLinks} from 'test/resources'

jest.mock('src/hosts/apis', () => require('mocks/hosts/apis'))
jest.mock('src/shared/apis/env', () => require('mocks/shared/apis/env'))

import {getCpuAndLoadForHosts} from 'src/hosts/apis'
const {parseHostsObject} = jest.requireActual('src/hosts/apis')

const setup = (override = {}) => {
  const props = {
    source,
    links: authLinks,
    autoRefresh: 0,
    manualRefresh: 0,
    onChooseAutoRefresh: jest.fn(),
    onManualRefresh: jest.fn(),
    notify: jest.fn(),
    ...override,
  }

  const wrapper = shallow(<HostsPage {...props} />)
  return {wrapper, props}
}

describe('Hosts.Containers.HostsPage', () => {
  describe('rendering', () => {
    it('renders all children components', () => {
      const {wrapper} = setup()
      const hostsTable = wrapper.find(HostsTable)

      expect(hostsTable.exists()).toBe(true)

      const pageTitle = wrapper
        .find(PageHeader)
        .dive()
        .find(Title)
        .dive()
        .find('h1')
        .first()
        .text()

      expect(pageTitle).toBe('Host List')
    })

    describe('hosts', () => {
      it('renders hosts when response has hosts', done => {
        const {wrapper} = setup()

        process.nextTick(() => {
          wrapper.update()
          const hostsTable = wrapper.find(HostsTable)
          expect(hostsTable.prop('hosts').length).toBe(1)
          expect(getCpuAndLoadForHosts).toHaveBeenCalledTimes(2)
          done()
        })
      })
    })
  })
})

describe('Parsing HostsObject', () => {
  let cpu_load_hosts

  beforeEach(() => {
    cpu_load_hosts = {
      results: [
        {
          statement_id: 0,
          series: [
            {
              name: 'cpu',
              columns: ['key', 'value'],
              values: [['host', 'my-host1']],
            },
            {
              name: 'db_query',
              columns: ['key', 'value'],
              values: [['host', 'my-host2']],
            },
          ],
        },
        {
          statement_id: 1,
          series: [
            {
              name: 'cpu',
              tags: {host: 'my-host1'},
              columns: ['time', 'mean'],
              values: [[1718874564091, 2.2943182130124]],
            },
            {
              name: 'cpu',
              tags: {host: 'my-host2'},
              columns: ['time', 'mean'],
              values: [[1718874564092, 4.2943182130124]],
            },
          ],
        },
        {
          statement_id: 2,
          series: [
            {
              name: 'system',
              tags: {host: 'my-host1'},
              columns: ['time', 'mean'],
              values: [[1718874564111, 1.5699999999999]],
            },
            {
              name: 'system',
              tags: {host: 'my-host2'},
              columns: ['time', 'mean'],
              values: [[1718874564112, 2.5699999999999]],
            },
          ],
        },
        {
          statement_id: 3,
          series: [
            {
              name: 'system',
              tags: {host: 'my-host1'},
              columns: ['time', 'deltaUptime'],
              values: [
                [1718874540001, 753231],
                [1718874600001, 60],
                [1718874660001, 60],
                [1718874720001, 60],
                [1718874780001, 60],
                [1718874840001, 60],
                [1718874900001, 60],
                [1718874960001, 60],
                [1718875020001, 60],
                [1718875080001, 60],
                [1718875140001, 60],
              ],
            },
            {
              name: 'system',
              tags: {host: 'my-host2'},
              columns: ['time', 'deltaUptime'],
              values: [
                [2718874540002, 753232],
                [2718874600002, 60],
                [2718874660002, 60],
                [2718874720002, 60],
                [2718874780002, 60],
                [2718874840002, 60],
                [2718874900002, 60],
                [2718874960002, 60],
                [2718875020002, 60],
                [2718875080002, 60],
                [2718875140002, 70],
              ],
            },
          ],
        },
        {statement_id: 4},
        {statement_id: 5},
        {statement_id: 6},
      ],
      uuid: '123456789',
    }
  })

  it('parse', () => {
    const hosts = parseHostsObject(cpu_load_hosts)
    expect(hosts['my-host1']).toStrictEqual({
      name: 'my-host1',
      cpu: 2.29,
      load: 1.57,
      deltaUptime: 60,
      apps: [],
    })
    expect(hosts['my-host2']).toStrictEqual({
      name: 'my-host2',
      cpu: 4.29,
      load: 2.57,
      deltaUptime: 70,
      apps: [],
    })
    expect(hosts['my-host3']).toBeUndefined()
  })
  it('missing in cpu', () => {
    cpu_load_hosts.results[1].series = [cpu_load_hosts.results[1].series[0]]
    const hosts = parseHostsObject(cpu_load_hosts)
    expect(hosts['my-host1']).toBeDefined()
    expect(hosts['my-host1']).toStrictEqual({
      name: 'my-host1',
      cpu: 2.29,
      load: 1.57,
      deltaUptime: 60,
      apps: [],
    })
    expect(hosts['my-host2']).toStrictEqual({
      name: 'my-host2',
      cpu: 0,
      load: 2.57,
      deltaUptime: 70,
      apps: [],
    })
    expect(hosts['my-host3']).toBeUndefined()
  })
  it('missing in host', () => {
    const series = cpu_load_hosts.results[0].series[0]
    cpu_load_hosts.results[0].series = [series]
    const hosts = parseHostsObject(cpu_load_hosts)
    expect(hosts['my-host1']).toBeDefined()
    expect(hosts['my-host1']).toStrictEqual({
      name: 'my-host1',
      cpu: 2.29,
      load: 1.57,
      deltaUptime: 60,
      apps: [],
    })
    expect(hosts['my-host2']).toStrictEqual({
      name: 'my-host2',
      cpu: 4.29,
      load: 2.57,
      deltaUptime: 70,
      apps: [],
    })
    expect(hosts['my-host3']).toBeUndefined()
  })
})
