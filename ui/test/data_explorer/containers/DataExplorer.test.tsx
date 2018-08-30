import React from 'react'
import {DataExplorer} from 'src/data_explorer/containers/DataExplorer'
import {shallow} from 'enzyme'
import {source, query, timeRange} from 'test/resources'

const queryConfigActions = {
  chooseNamespace: jest.fn(),
  chooseMeasurement: jest.fn(),
  chooseTag: jest.fn(),
  groupByTag: jest.fn(),
  addQuery: jest.fn(),
  toggleField: jest.fn(),
  groupByTime: jest.fn(),
  toggleTagAcceptance: jest.fn(),
  applyFuncsToField: jest.fn(),
  editRawTextAsync: jest.fn(),
  addInitialField: jest.fn(),
  editQueryStatus: jest.fn(),
  deleteQuery: jest.fn(),
  fill: jest.fn(),
  removeFuncs: jest.fn(),
  editRawText: jest.fn(),
  setTimeRange: jest.fn(),
  updateRawQuery: jest.fn(),
  updateQueryConfig: jest.fn(),
  timeShift: jest.fn(),
}

const setup = () => {
  const props = {
    source,
    sources: [source],
    services: [],
    queryConfigs: [query],
    queryConfigActions,
    autoRefresh: 1000,
    handleChooseAutoRefresh: () => {},
    setTimeRange: () => {},
    timeRange,
    manualRefresh: 0,
    dashboards: [],
    onManualRefresh: () => {},
    errorThrownAction: () => {},
    writeLineProtocol: () => {},
    handleGetDashboards: () => [],
    addDashboardCell: jest.fn(() => Promise.resolve()),
    updateQueryDrafts: jest.fn(() => Promise.resolve()),
    loadDE: jest.fn(() => Promise.resolve()),
    addQuery: jest.fn(() => Promise.resolve()),
    deleteQuery: jest.fn(() => Promise.resolve()),
    queryDrafts: [],
    editQueryStatus: jest.fn(() => Promise.resolve()),
    queryStatus: null,
    fluxLinks: null,
    script: '',
    updateScript: jest.fn(),
    fetchServicesAsync: jest.fn(),
    notify: jest.fn(),
    sourceLink: '',
    updateSourceLink: jest.fn(),
  }

  const wrapper = shallow(<DataExplorer {...props} />)
  return {
    wrapper,
  }
}

describe('DataExplorer.Containers.DataExplorer', () => {
  describe('rendering', () => {
    it('renders without errors', () => {
      const {wrapper} = setup()
      expect(wrapper.exists()).toBe(true)
    })
  })
})
