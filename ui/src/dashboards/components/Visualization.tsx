import React, {SFC} from 'react'

import RefreshingGraph from 'src/shared/components/RefreshingGraph'

import buildQueries from 'src/utils/buildQueriesForGraphs'
import {AutoRefresher} from 'src/utils/AutoRefresher'

import {getCellTypeColors} from 'src/dashboards/constants/cellEditor'
import {QueryUpdateState} from 'src/shared/actions/queries'

import {TimeRange, QueryConfig, Axes, Template, Source, Status} from 'src/types'
import {
  TableOptions,
  DecimalPlaces,
  FieldOption,
  CellType,
  NoteVisibility,
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
  editQueryStatus: (queryID: string, status: Status) => void
  tableOptions: TableOptions
  timeFormat: string
  decimalPlaces: DecimalPlaces
  fieldOptions: FieldOption[]
  resizerTopHeight?: number
  thresholdsListColors: ColorNumber[]
  gaugeColors: ColorNumber[]
  lineColors: ColorString[]
  staticLegend: boolean
  note: string
  noteVisibility: NoteVisibility
  manualRefresh: number
  editorLocation?: QueryUpdateState
}

const DashVisualization: SFC<Props> = ({
  axes,
  type,
  note,
  source,
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
  editorLocation,
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
          cellNote={note}
          cellNoteVisibility={noteVisibility}
          timeRange={timeRange}
          manualRefresh={manualRefresh}
          editorLocation={editorLocation}
        />
      </div>
    </div>
  )
}

export default DashVisualization
