import React, {PureComponent} from 'react'
import {connect} from 'react-redux'
import _ from 'lodash'

import {TimeSeriesToDyGraphReturnType} from 'src/utils/timeSeriesTransformers'
import {fluxTablesToDygraph} from 'src/shared/parsing/flux/dygraph'

import Dygraph from 'src/shared/components/Dygraph'
import {FluxTable} from 'src/types'
import {DEFAULT_LINE_COLORS} from 'src/shared/constants/graphColorPalettes'
import {setHoverTime as setHoverTimeAction} from 'src/dashboards/actions'

interface Props {
  data: FluxTable[]
  setHoverTime: (time: number) => void
}

interface State {
  timeSeries?: TimeSeriesToDyGraphReturnType
}

class FluxGraph extends PureComponent<Props, State> {
  constructor(props: Props) {
    super(props)

    this.state = {}
  }

  public async componentDidMount() {
    await this.parseData()
  }

  public async componentDidUpdate(prevProps) {
    const prevData = _.get(prevProps, 'data', [])
    const newData = _.get(this.props, 'data', [])

    const didDataUpdate =
      prevData.length !== newData.length ||
      _.get(prevData, '0.id') !== _.get(newData, '0.id')

    if (didDataUpdate) {
      await this.parseData()
    }
  }

  public render() {
    if (!this.state.timeSeries) {
      return <h3 className="graph-spinner" />
    }

    const {timeSeries, labels, dygraphSeries} = this.state.timeSeries
    return (
      <Dygraph
        labels={labels}
        staticLegend={false}
        timeSeries={timeSeries}
        colors={DEFAULT_LINE_COLORS}
        dygraphSeries={dygraphSeries}
        options={this.options}
        handleSetHoverTime={this.props.setHoverTime}
      />
    )
  }

  private get options() {
    return {
      axisLineColor: '#383846',
      gridLineColor: '#383846',
    }
  }

  private parseData = async () => {
    const timeSeries = await fluxTablesToDygraph(this.props.data)
    this.setState({timeSeries})
  }
}

const mdtp = {
  setHoverTime: setHoverTimeAction,
}

export default connect(null, mdtp)(FluxGraph)
