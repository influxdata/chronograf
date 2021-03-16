import React, {FunctionComponent} from 'react'

import RefreshingGraph from 'src/shared/components/RefreshingGraph'

import {
  TimeMachineContainer,
  TimeMachineContextConsumer,
} from 'src/shared/utils/TimeMachineContext'
import {getCellTypeColors} from 'src/dashboards/constants/cellEditor'

import {
  CellType,
  Axes,
  TimeRange,
  Source,
  Query,
  Template,
  Status,
  QueryType,
  QueryUpdateState,
} from 'src/types'
import {ColorString, ColorNumber} from 'src/types/colors'
import {
  TableOptions,
  FieldOption,
  DecimalPlaces,
  NoteVisibility,
  ThresholdType,
} from 'src/types/dashboards'
import {AutoRefresher} from 'src/utils/AutoRefresher'

interface ConnectedProps {
  timeRange: TimeRange
  queryType: QueryType
  onUpdateFieldOptions: (fieldOptions: FieldOption[]) => Promise<void>
  onUpdateVisType: (type: CellType) => Promise<void>
  type: CellType
  axes: Axes | null
  tableOptions: TableOptions
  fieldOptions: FieldOption[]
  timeFormat: string
  decimalPlaces: DecimalPlaces
  note: string
  noteVisibility: NoteVisibility
  thresholdsListColors: ColorNumber[]
  thresholdsListType: ThresholdType
  gaugeColors: ColorNumber[]
  lineColors: ColorString[]
}

interface PassedProps {
  source: Source
  autoRefresher: AutoRefresher
  queries: Query[]
  templates: Template[]
  onEditQueryStatus: (queryID: string, status: Status) => void
  staticLegend: boolean
  manualRefresh: number
  editorLocation?: QueryUpdateState
  showRawFluxData?: boolean
}

type Props = PassedProps & ConnectedProps

const TimeMachineVisualization: FunctionComponent<Props> = props => {
  const colors: ColorString[] = getCellTypeColors({
    cellType: props.type,
    gaugeColors: props.gaugeColors,
    thresholdsListColors: props.thresholdsListColors,
    lineColors: props.lineColors,
  })

  return (
    <div className="deceo--top">
      <div className="deceo--visualization">
        <div className="graph-container">
          <RefreshingGraph
            source={props.source}
            colors={colors}
            queryType={props.queryType}
            autoRefresher={props.autoRefresher}
            queries={props.queries}
            templates={props.templates}
            editQueryStatus={props.onEditQueryStatus}
            staticLegend={props.staticLegend}
            timeRange={props.timeRange}
            manualRefresh={props.manualRefresh}
            editorLocation={props.editorLocation}
            showRawFluxData={props.showRawFluxData}
            type={props.type}
            axes={props.axes}
            tableOptions={props.tableOptions}
            fieldOptions={props.fieldOptions}
            timeFormat={props.timeFormat}
            decimalPlaces={props.decimalPlaces}
            gaugeColors={props.gaugeColors}
            lineColors={props.lineColors}
            cellNote={props.note}
            cellNoteVisibility={props.noteVisibility}
            onUpdateFieldOptions={props.onUpdateFieldOptions}
            onUpdateVisType={props.onUpdateVisType}
          />
        </div>
      </div>
    </div>
  )
}

const ConnectedTimeMachineVisualization = (props: PassedProps) => (
  <TimeMachineContextConsumer>
    {(container: TimeMachineContainer) => {
      const {state} = container

      return (
        <TimeMachineVisualization
          {...props}
          timeRange={state.timeRange}
          type={state.type}
          axes={state.axes}
          queryType={state.queryType}
          tableOptions={state.tableOptions}
          fieldOptions={state.fieldOptions}
          timeFormat={state.timeFormat}
          decimalPlaces={state.decimalPlaces}
          thresholdsListColors={state.thresholdsListColors}
          thresholdsListType={state.thresholdsListType}
          gaugeColors={state.gaugeColors}
          lineColors={state.lineColors}
          note={state.note}
          noteVisibility={state.noteVisibility}
          onUpdateFieldOptions={container.handleUpdateFieldOptions}
          onUpdateVisType={container.handleUpdateType}
        />
      )
    }}
  </TimeMachineContextConsumer>
)

export default ConnectedTimeMachineVisualization
