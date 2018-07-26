import React, {PureComponent} from 'react'
import {connect} from 'react-redux'

import {fluxTablesToDygraph} from 'src/shared/parsing/flux/dygraph'

import Dygraph from 'src/shared/components/Dygraph'
import {FluxTable, CellType} from 'src/types'
import {DygraphSeries, DygraphValue} from 'src/types'
import {DEFAULT_LINE_COLORS} from 'src/shared/constants/graphColorPalettes'
import {setHoverTime as setHoverTimeAction} from 'src/dashboards/actions'

interface PropsFromDispatch {
  setHoverTime: (time: number) => void
}

interface ClassProps {
  data: FluxTable[]
}

type Props = ClassProps & PropsFromDispatch

class FluxGraph extends PureComponent<Props> {
  public render() {
    const containerStyle = {
      width: 'calc(100% - 32px)',
      height: 'calc(100% - 16px)',
      position: 'absolute',
    }

    return (
      <div className="yield-node--graph">
        <Dygraph
          type={CellType.Table}
          labels={this.labels}
          staticLegend={false}
          timeSeries={this.timeSeries}
          colors={DEFAULT_LINE_COLORS}
          dygraphSeries={this.dygraphSeries}
          options={this.options}
          containerStyle={containerStyle}
          handleSetHoverTime={this.props.setHoverTime}
        />
      </div>
    )
  }

  private get options() {
    return {
      axisLineColor: '#383846',
      gridLineColor: '#383846',
    }
  }

  // [time, v1, v2, null, v3]
  // time: [v1, v2, null, v3]
  private get timeSeries(): DygraphValue[][] {
    return fluxTablesToDygraph(this.props.data)
  }

  private get labels(): string[] {
    const {data} = this.props
    const names = data.map(d => d.name)

    return ['time', ...names]
  }

  private get dygraphSeries(): DygraphSeries {
    return {}
  }
}

const mdtp = {
  setHoverTime: setHoverTimeAction,
}

export default connect<{}, PropsFromDispatch, ClassProps>(null, mdtp)(FluxGraph)
