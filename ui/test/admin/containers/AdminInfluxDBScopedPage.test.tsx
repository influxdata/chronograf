import React from 'react'
import {shallow} from 'enzyme'

import {AdminInfluxDBScopedPage} from 'src/admin/containers/influxdb/AdminInfluxDBScopedPage'
import PageHeader from 'src/reusable_ui/components/page_layout/PageHeader'
import Title from 'src/reusable_ui/components/page_layout/PageHeaderTitle'
import {source} from 'test/resources'
import {notify as notifyActionCreator} from 'src/shared/actions/notifications'

describe('AdminInfluxDBScopedPage', () => {
  it('should render the appropriate header text', () => {
    const props = {
      source,
      activeTab: 'databases' as const,
      addUser: () => {},
      loadUsers: async () => {},
      loadRoles: async () => {},
      loadPermissions: async () => {},
      loadDBsAndRPs: async () => {},
      notify: notifyActionCreator,
      params: {tab: ''},
      users: [],
      roles: [],
      permissions: [],
      children: null,
    }

    const wrapper = shallow(<AdminInfluxDBScopedPage {...props} />)

    const pageTitle = wrapper
      .find(PageHeader)
      .dive()
      .find(Title)
      .dive()
      .find('h1')
      .first()
      .text()

    expect(pageTitle).toBe('InfluxDB Admin')
  })
})
