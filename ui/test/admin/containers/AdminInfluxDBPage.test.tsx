import React from 'react'
import {shallow} from 'enzyme'

import {AdminInfluxDBPage} from 'src/admin/containers/influxdb/AdminInfluxDBPage'
import PageHeader from 'src/reusable_ui/components/page_layout/PageHeader'
import Title from 'src/reusable_ui/components/page_layout/PageHeaderTitle'
import {source} from 'test/resources'
import {notify as notifyActionCreator} from 'src/shared/actions/notifications'

describe('AdminInfluxDBPage', () => {
  it('should render the appropriate header text', () => {
    const props = {
      source,
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
    }

    const wrapper = shallow(<AdminInfluxDBPage {...props} />)

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
