import React, {SFC} from 'react'

import RefreshingGraph from 'src/shared/components/RefreshingGraph'

import {AutoRefresher} from 'src/utils/AutoRefresher'

import {getCellTypeColors} from 'src/dashboards/constants/cellEditor'
import {QueryUpdateState} from 'src/shared/actions/queries'

import {
  TimeRange,
  Query,
  Axes,
  Template,
  Source,
  Status,
  Service,
} from 'src/types'
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
  service: Service
  templates: Template[]
  timeRange: TimeRange
  autoRefresher: AutoRefresher
  queries: Query[]
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
  service,
  queries,
  templates,
  timeRange,
  lineColors,
  timeFormat,
  gaugeColors,
  fieldOptions,
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
          service={service}
          colors={colors}
          axes={axes}
          type={type}
          tableOptions={tableOptions}
          autoRefresher={autoRefresher}
          queries={queries}
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
