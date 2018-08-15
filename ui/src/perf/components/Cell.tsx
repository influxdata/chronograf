import React, {PureComponent} from 'react'
import {connect} from 'react-redux'
import uuid from 'uuid'

import Dygraph from 'src/shared/components/Dygraph'

import {fetchTimeSeries} from 'src/shared/apis/query'
import {timeSeriesToDygraph} from 'src/utils/timeSeriesTransformers'
import {DEFAULT_LINE_COLORS} from 'src/shared/constants/graphColorPalettes'
import {setHoverTime} from 'src/dashboards/actions'

import {TimeSeriesResponse} from 'src/types/series'
import {TimeSeriesToDyGraphReturnType} from 'src/utils/timeSeriesTransformers'
import {Source} from 'src/types'

interface Props {
  query: string
  source: Source
  onSetHoverTime: (time: number) => void
}

interface State {
  dygraphsData: TimeSeriesToDyGraphReturnType
  isLoading: boolean
}

class Cell extends PureComponent<Props, State> {
  constructor(props) {
    super(props)

    this.state = {
      dygraphsData: null,
      isLoading: false,
    }
  }

  public componentDidMount() {
    this.setState({isLoading: true})
    this.runQuery()
  }

  public render() {
    return (
      <div className="perf-cell">
        <div className="perf-cell--header perf-test-page--draggable" />
        <div className="perf-cell--body">{this.body}</div>
      </div>
    )
  }

  private get body() {
    const {onSetHoverTime} = this.props
    const {isLoading, dygraphsData} = this.state

    if (isLoading || !dygraphsData) {
      return <div className="perf-loading">Loading...</div>
    }

    return (
      <div className="perf-cell--dygraph-container">
        <Dygraph
          labels={dygraphsData.labels}
          staticLegend={false}
          timeSeries={dygraphsData.timeSeries}
          colors={DEFAULT_LINE_COLORS}
          dygraphSeries={dygraphsData.dygraphSeries}
          options={{}}
          handleSetHoverTime={onSetHoverTime}
        />
      </div>
    )
  }

  private runQuery = async () => {
    const {source, query} = this.props

    const ARBITRARY_RESOLUTION = 300

    const responses: TimeSeriesResponse[] = await fetchTimeSeries(
      source,
      [{text: query, id: uuid.v4()}],
      ARBITRARY_RESOLUTION,
      []
    )

    const dygraphsData = timeSeriesToDygraph([{response: responses[0]}])

    this.setState({dygraphsData, isLoading: false})
  }
}

const mdtp = {
  onSetHoverTime: setHoverTime,
}

export default connect(null, mdtp)(Cell)
