import React from 'react'

import ResizeContainer, {ResizeBottom} from 'src/shared/components/ResizeContainer'
import QueryBuilder from 'src/data_explorer/components/QueryBuilder'
import Visualization from 'src/data_explorer/components/Visualization'
import OverlayControls from 'src/dashboards/components/OverlayControls'

const autoRefresh = 60000

const timeRange = {
  upper: 'now()',
  lower: '5m',
}

const queries = []
const activeQueryID = null

const CellEditorOverlay = () => (
  <div className="data-explorer overlay-technology">
    <ResizeContainer>
      <Visualization
        autoRefresh={autoRefresh}
        timeRange={timeRange}
        queryConfigs={queries}
        activeQueryID={activeQueryID}
        activeQueryIndex={0}
      />
      <ResizeBottom>
        <OverlayControls />
        <QueryBuilder
          queries={queries}
          autoRefresh={autoRefresh}
          timeRange={timeRange}
          setActiveQuery={() => {}}
          activeQueryID={activeQueryID}
        />
      </ResizeBottom>
    </ResizeContainer>
  </div>
)

export default CellEditorOverlay
