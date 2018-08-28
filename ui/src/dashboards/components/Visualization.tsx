import React, {SFC} from 'react'
// import {connect} from 'react-redux'

import RefreshingGraph from 'src/shared/components/RefreshingGraph'

import buildQueries from 'src/utils/buildQueriesForGraphs'
import {AutoRefresher} from 'src/utils/AutoRefresher'

import {getCellTypeColors} from 'src/dashboards/constants/cellEditor'

import {TimeRange, QueryConfig, Axes, Template, Source} from 'src/types'
import {
  TableOptions,
  DecimalPlaces,
  FieldOption,
  CellType,
  CellNoteVisibility,
} from 'src/types/dashboards'
import {ColorString, ColorNumber} from 'src/types/colors'

interface Props {
  axes: Axes
  type: CellType
  source: Source
  templates: Template[]
  timeRange: TimeRange
  autoRefresher: AutoRefresher
  queryConfigs: QueryConfig[]
  editQueryStatus: () => void
  tableOptions: TableOptions
  timeFormat: string
  decimalPlaces: DecimalPlaces
  fieldOptions: FieldOption[]
  resizerTopHeight?: number
  thresholdsListColors: ColorNumber[]
  gaugeColors: ColorNumber[]
  lineColors: ColorString[]
  staticLegend: boolean
  isInCEO: boolean
  note: string
  noteVisibility: CellNoteVisibility
  manualRefresh: number
}

const DashVisualization: SFC<Props> = ({
  axes,
  type,
  note,
  source,
  isInCEO,
  templates,
  timeRange,
  lineColors,
  timeFormat,
  gaugeColors,
  fieldOptions,
  queryConfigs,
  staticLegend,
  tableOptions,
  manualRefresh,
  decimalPlaces,
  autoRefresher,
  noteVisibility,
  editQueryStatus,
  resizerTopHeight,
  thresholdsListColors,
}) => {
  const colors: ColorString[] = getCellTypeColors({
    cellType: type,
    gaugeColors,
    thresholdsListColors,
    lineColors,
  })

  return (
    <div className="deceo--visualization">
      <div className="graph-container">
        <RefreshingGraph
          source={source}
          colors={colors}
          axes={axes}
          type={type}
          tableOptions={tableOptions}
          autoRefresher={autoRefresher}
          queries={buildQueries(queryConfigs, timeRange)}
          templates={templates}
          editQueryStatus={editQueryStatus}
          resizerTopHeight={resizerTopHeight}
          staticLegend={staticLegend}
          timeFormat={timeFormat}
          decimalPlaces={decimalPlaces}
          fieldOptions={fieldOptions}
          isInCEO={isInCEO}
          cellNote={note}
          cellNoteVisibility={noteVisibility}
          timeRange={timeRange}
          manualRefresh={manualRefresh}
        />
      </div>
    </div>
  )
}

export default DashVisualization
