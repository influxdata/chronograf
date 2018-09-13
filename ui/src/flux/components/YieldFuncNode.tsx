import React, {PureComponent} from 'react'
import _ from 'lodash'

import {ErrorHandling} from 'src/shared/decorators/errors'
import YieldNodeVis from 'src/flux/components/YieldNodeVis'
import TimeSeries from 'src/shared/components/time_series/TimeSeries'

import {FluxTable, Service, Source, TimeRange, Query} from 'src/types'
import {Func} from 'src/types/flux'
import {VisualizationOptions} from 'src/types/dataExplorer'

interface Props {
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
  visualizationOptions: VisualizationOptions
}

interface State {
  data: FluxTable[]
}

@ErrorHandling
class YieldFuncNode extends PureComponent<Props, State> {
  private timeSeries: React.RefObject<TimeSeries> = React.createRef()

  public componentDidUpdate(prevProps) {
    if (!this.timeSeries.current) {
      return
    }

    if (this.haveVisOptionsChanged(prevProps.visualizationOptions)) {
      this.timeSeries.current.forceUpdate()
    }
  }

  public render() {
    const {
      func,
      visualizationOptions,
      source,
      service,
      timeRange,
      queries,
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
              visualizationOptions={visualizationOptions}
            />
          )}
        </TimeSeries>
      </div>
    )
  }

  private haveVisOptionsChanged(
    visualizationOptions: VisualizationOptions
  ): boolean {
    const visProps: string[] = [
      'axes',
      'colors',
      'tableOptions',
      'fieldOptions',
      'decimalPlaces',
      'timeFormat',
    ]

    const prevVisValues = _.pick(visualizationOptions, visProps)
    const curVisValues = _.pick(this.props.visualizationOptions, visProps)
    return !_.isEqual(prevVisValues, curVisValues)
  }
}

export default YieldFuncNode
