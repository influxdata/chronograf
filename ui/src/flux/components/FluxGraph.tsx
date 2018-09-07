import React, {PureComponent} from 'react'
import {connect} from 'react-redux'

import {fluxTablesToDygraph} from 'src/shared/parsing/flux/dygraph'

import Dygraph from 'src/shared/components/Dygraph'
import {FluxTable} from 'src/types'
import {DEFAULT_LINE_COLORS} from 'src/shared/constants/graphColorPalettes'
import {setHoverTime as setHoverTimeAction} from 'src/dashboards/actions'

interface Props {
  data: FluxTable[]
  setHoverTime: (time: number) => void
}

class FluxGraph extends PureComponent<Props> {
  public render() {
    const dygraphData = fluxTablesToDygraph(this.props.data)
    const {timeSeries, labels, dygraphSeries} = dygraphData
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
}

const mdtp = {
  setHoverTime: setHoverTimeAction,
}

export default connect(null, mdtp)(FluxGraph)
