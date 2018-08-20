import React, {SFC} from 'react'
import {connect} from 'react-redux'

import RefreshingGraph from 'src/shared/components/RefreshingGraph'
import buildQueries from 'src/utils/buildQueriesForGraphs'

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
  autoRefresh: number
  templates: Template[]
  timeRange: TimeRange
  queryConfigs: QueryConfig[]
  editQueryStatus: () => void
  tableOptions: TableOptions
  timeFormat: string
  decimalPlaces: DecimalPlaces
  fieldOptions: FieldOption[]
  resizerTopHeight: number
  thresholdsListColors: ColorNumber[]
  gaugeColors: ColorNumber[]
  lineColors: ColorString[]
  staticLegend: boolean
  isInCEO: boolean
  note: string
  noteVisibility: CellNoteVisibility
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
  autoRefresh,
  gaugeColors,
  fieldOptions,
  queryConfigs,
  staticLegend,
  tableOptions,
  decimalPlaces,
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
          queries={buildQueries(queryConfigs, timeRange)}
          templates={templates}
          autoRefresh={autoRefresh}
          editQueryStatus={editQueryStatus}
          resizerTopHeight={resizerTopHeight}
          staticLegend={staticLegend}
          timeFormat={timeFormat}
          decimalPlaces={decimalPlaces}
          fieldOptions={fieldOptions}
          isInCEO={isInCEO}
          cellNote={note}
          cellNoteVisibility={noteVisibility}
        />
      </div>
    </div>
  )
}

const mapStateToProps = ({
  cellEditorOverlay: {
    thresholdsListColors,
    gaugeColors,
    lineColors,
    cell: {
      type,
      axes,
      tableOptions,
      fieldOptions,
      timeFormat,
      decimalPlaces,
      note,
      noteVisibility,
    },
  },
}) => ({
  gaugeColors,
  thresholdsListColors,
  lineColors,
  type,
  axes,
  tableOptions,
  fieldOptions,
  timeFormat,
  decimalPlaces,
  note,
  noteVisibility,
})

export default connect(mapStateToProps, null)(DashVisualization)
