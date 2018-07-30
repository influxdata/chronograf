import React from 'react'
import {shallow} from 'enzyme'

import ImportDashboardMappings from 'src/dashboards/components/ImportDashboardMappings'
import {source, cell, query} from 'test/fixtures'

const setup = (override = {}) => {
  const props = {
    cells: null,
    source,
    sources: [source],
    importedSources: {},
    onSubmit: () => {},
    ...override,
  }

  const wrapper = shallow(<ImportDashboardMappings {...props} />)

  return {wrapper, props}
}

describe('Dashboards.Components.ImportDashboardMappings', () => {
  describe('if there are no cells', () => {
    it('should display no mapping required', () => {
      const {wrapper} = setup()
      const table = wrapper.find('table')
      const noMapping = wrapper.find({'data-test': 'no-mapping'})

      expect(table.length).toBe(0)
      expect(noMapping.length).toBe(1)
    })
  })

  describe('if there are cells and no importedSources', () => {
    it('should display a table with rows', () => {
      const queryWithSource = {...query, source: '/chronograf/v1/sources/1'}
      const cellWithSource = {...cell, queries: [queryWithSource]}
      const cells = [cellWithSource]
      const {wrapper} = setup({cells})

      const table = wrapper.find('table')
      const tableBody = table.find('tbody')
      const bodyRows = tableBody.find('tr')
      const noMapping = wrapper.find({'data-test': 'no-mapping'})

      expect(table.length).toBe(1)
      expect(bodyRows.length).toBeGreaterThan(0)
      expect(noMapping.length).toBe(0)
    })
  })

  describe('if there are cells and imported sources', () => {
    it('should display a table with rows correlating with source names', () => {
      const sourceLink = '/chronograf/v1/sources/1'
      const queryWithSource = {...query, source: sourceLink}
      const cellWithSource = {...cell, queries: [queryWithSource]}
      const cells = [cellWithSource]
      const importedSourceName = 'Old Source'
      const sourceID = 1
      const importedSources = {
        [sourceID]: {name: importedSourceName, link: sourceLink},
      }
      const {wrapper} = setup({cells, importedSources})

      const table = wrapper.find('table')
      const tableBody = table.find('tbody')
      const bodyRows = tableBody.find('tr')
      const noMapping = wrapper.find({'data-test': 'no-mapping'})
      const sourceLabel = bodyRows.find({'data-test': 'source-label'})

      expect(table.length).toBe(1)
      expect(bodyRows.length).toBe(1)
      expect(sourceLabel.length).toBe(1)
      expect(sourceLabel.contains(importedSourceName)).toBe(true)
      expect(sourceLabel.contains(sourceID.toString())).toBe(true)
      expect(noMapping.length).toBe(0)
    })
  })
})
