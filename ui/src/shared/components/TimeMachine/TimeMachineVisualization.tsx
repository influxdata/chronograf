import React, {SFC} from 'react'
import {Subscribe} from 'unstated'

import RefreshingGraph from 'src/shared/components/RefreshingGraph'

import {TimeMachineContainer} from 'src/shared/utils/TimeMachineContainer'
import {getCellTypeColors} from 'src/dashboards/constants/cellEditor'

import {
  CellType,
  Axes,
  TimeRange,
  Source,
  Service,
  Query,
  Template,
  Status,
} from 'src/types'
import {ColorString, ColorNumber} from 'src/types/colors'
import {QueryUpdateState} from 'src/shared/actions/queries'
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
  onUpdateFieldOptions: TimeMachineContainer['handleUpdateFieldOptions']
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
  service: Service
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

const TimeMachineVisualization: SFC<Props> = props => {
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
            service={props.service}
            colors={colors}
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
            thresholdsListColors={props.thresholdsListColors}
            thresholdsListType={props.thresholdsListType}
            gaugeColors={props.gaugeColors}
            lineColors={props.lineColors}
            cellNote={props.note}
            cellNoteVisibility={props.noteVisibility}
            onUpdateFieldOptions={props.onUpdateFieldOptions}
          />
        </div>
      </div>
    </div>
  )
}

const ConnectedTimeMachineVisualization = (props: PassedProps) => (
  <Subscribe to={[TimeMachineContainer]}>
    {(container: TimeMachineContainer) => {
      const {state} = container

      return (
        <TimeMachineVisualization
          {...props}
          timeRange={state.timeRange}
          type={state.type}
          axes={state.axes}
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
        />
      )
    }}
  </Subscribe>
)

export default ConnectedTimeMachineVisualization
