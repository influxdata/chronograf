import React, {PureComponent} from 'react'
import _ from 'lodash'
import {Subscribe} from 'unstated'

import {ErrorHandling} from 'src/shared/decorators/errors'
import YieldNodeVis from 'src/flux/components/YieldNodeVis'
import TimeSeries from 'src/shared/components/time_series/TimeSeries'
import {TimeMachineContainer} from 'src/shared/utils/TimeMachineContainer'

import {FluxTable, Service, Source, TimeRange, Query, Axes} from 'src/types'
import {Func} from 'src/types/flux'

import {
  FieldOption,
  DecimalPlaces,
  NoteVisibility,
  ThresholdType,
  TableOptions as TableOptionsInterface,
} from 'src/types/dashboards'
import {ColorNumber, ColorString} from 'src/types/colors'

interface ConnectedProps {
  axes: Axes | null
  tableOptions: TableOptionsInterface
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
  service: Service
  source: Source
  timeRange: TimeRange
  data: FluxTable[]
  index: number
  bodyID: string
  func: Func
  declarationID?: string
  script: string
  queries: Query[]
}

type Props = ConnectedProps & PassedProps

interface State {
  data: FluxTable[]
}

@ErrorHandling
class YieldFuncNode extends PureComponent<Props, State> {
  private timeSeries: React.RefObject<TimeSeries> = React.createRef()

  public componentDidUpdate(prevProps: Props) {
    if (!this.timeSeries.current) {
      return
    }

    if (this.haveVisOptionsChanged(prevProps)) {
      this.timeSeries.current.forceUpdate()
    }
  }

  public render() {
    const {
      func,
      source,
      service,
      timeRange,
      queries,
      axes,
      tableOptions,
      fieldOptions,
      timeFormat,
      decimalPlaces,
      thresholdsListColors,
      gaugeColors,
      lineColors,
    } = this.props

    const yieldName = _.get(func, 'args.0.value', 'result')

    return (
      <div className="yield-node">
        <div className="func-node--connector" />
        <TimeSeries
          source={source}
          service={service}
          queries={queries}
          timeRange={timeRange}
        >
          {({timeSeriesFlux}) => (
            <YieldNodeVis
              data={timeSeriesFlux}
              yieldName={yieldName}
              axes={axes}
              tableOptions={tableOptions}
              fieldOptions={fieldOptions}
              timeFormat={timeFormat}
              decimalPlaces={decimalPlaces}
              thresholdsListColors={thresholdsListColors}
              gaugeColors={gaugeColors}
              lineColors={lineColors}
            />
          )}
        </TimeSeries>
      </div>
    )
  }

  private haveVisOptionsChanged(prevProps: Props): boolean {
    const visProps: string[] = [
      'axes',
      'lineColors',
      'gaugeColors',
      'thresholdsListColors',
      'thresholdsListType',
      'tableOptions',
      'fieldOptions',
      'decimalPlaces',
      'timeFormat',
    ]

    const prevVisValues = _.pick(prevProps, visProps)
    const curVisValues = _.pick(this.props, visProps)
    return !_.isEqual(prevVisValues, curVisValues)
  }
}

const ConnectedYieldFuncNode = (props: PassedProps) => {
  return (
    <Subscribe to={[TimeMachineContainer]}>
      {(timeMachineContainer: TimeMachineContainer) => (
        <YieldFuncNode
          {...props}
          axes={timeMachineContainer.state.axes}
          tableOptions={timeMachineContainer.state.tableOptions}
          fieldOptions={timeMachineContainer.state.fieldOptions}
          timeFormat={timeMachineContainer.state.timeFormat}
          decimalPlaces={timeMachineContainer.state.decimalPlaces}
          note={timeMachineContainer.state.note}
          noteVisibility={timeMachineContainer.state.noteVisibility}
          thresholdsListColors={timeMachineContainer.state.thresholdsListColors}
          thresholdsListType={timeMachineContainer.state.thresholdsListType}
          gaugeColors={timeMachineContainer.state.gaugeColors}
          lineColors={timeMachineContainer.state.lineColors}
        />
      )}
    </Subscribe>
  )
}

export default ConnectedYieldFuncNode
