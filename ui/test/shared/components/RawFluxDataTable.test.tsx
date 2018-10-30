import React from 'react'
import {mount} from 'enzyme'

import RawFluxDataTable from 'src/shared/components/TimeMachine/RawFluxDataTable'

import {MULTI_SCHEMA_RESPONSE} from 'test/shared/parsing/flux/constants'

describe('RawFluxDataTable', () => {
  test('it can render a simple grid from a flux response', () => {
    const wrapper = mount(
      <RawFluxDataTable
        csv={MULTI_SCHEMA_RESPONSE}
        width={10000}
        height={10000}
      />
    )

    const cells = wrapper.find('.raw-flux-data-table--cell')

    expect(cells.at(0).text()).toEqual('#datatype')
    expect(cells.at(14).text()).toEqual('#group')
    expect(cells.at(41).text()).toEqual('')
    expect(cells.at(59).text()).toEqual('1677-09-21T00:12:43.145224192Z')
  })
})
