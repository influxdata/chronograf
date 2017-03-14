import React, {PropTypes} from 'react'

import ResizeContainer from 'src/shared/components/ResizeContainer';
import QueryBuilder from 'src/data_explorer/components/QueryBuilder';
import Visualization from 'src/data_explorer/components/Visualization';

const autoRefresh = 60000

const timeRange = {
  upper: 'now()',
  lower: '5m',
}

const queries = []
/*
  <ResizeContainer>
    <Visualization
      autoRefresh={autoRefresh}
      timeRange={timeRange}
      queryConfigs={queries}
      activeQueryID={activeQueryID}
      activeQueryIndex={0}
    />
  </ResizeContainer>
*/
const activeQueryID = null

const CellEditorOverlay = () => (
  <div className="overlay_technology">
    <QueryBuilder
      queries={queries}
      autoRefresh={autoRefresh}
      timeRange={timeRange}
      setActiveQuery={(x) => console.log(x)}
      activeQueryID={activeQueryID}
    />
  </div>
)

export default CellEditorOverlay
