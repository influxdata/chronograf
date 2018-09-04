import React from 'react'
import {shallow} from 'enzyme'

import {DashboardsPage, Props} from 'src/dashboards/containers/DashboardsPage'
import DashboardsTable from 'src/dashboards/components/DashboardsTable'
import DashboardsContents from 'src/dashboards/components/DashboardsPageContents'
import {Page} from 'src/reusable_ui'

import {source} from 'test/resources'

describe('DashboadsPage', () => {
  test('it displays a loading state initially', () => {
    const props = {
      dashboards: [],
      handleGetDashboards: () => new Promise(() => {}),
      source,
      sources: [source],
    } as Props

    const wrapper = shallow(<DashboardsPage {...props} />)

    const text = wrapper
      .find(Page)
      .dive()
      .find(Page.Contents)
      .dive()
      .find(DashboardsContents)
      .dive()
      .find(DashboardsTable)
      .dive()
      .find('.generic-empty-state h4')
      .text()

    expect(text).toEqual('Loading dashboards...')
  })
})
