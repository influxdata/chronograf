import React, {PureComponent} from 'react'

import FluxGraph from 'src/flux/components/FluxGraph'
import TimeMachineTables from 'src/flux/components/TimeMachineTables'
import RadioButtons from 'src/reusable_ui/components/radio_buttons/RadioButtons'

import {ErrorHandling} from 'src/shared/decorators/errors'

import {FluxTable} from 'src/types'

interface Props {
  data: FluxTable[]
  yieldName: string
}

enum VisType {
  Table = 'Table View',
  Line = 'Line Graph',
}

interface State {
  visType: VisType
}

@ErrorHandling
class YieldNodeVis extends PureComponent<Props, State> {
  constructor(props) {
    super(props)

    this.state = {visType: VisType.Table}
  }

  public render() {
    const {yieldName} = this.props
    const {visType} = this.state

    return (
      <>
        <div className="yield-node--controls">
          <RadioButtons
            buttons={[VisType.Table, VisType.Line]}
            activeButton={visType}
            onChange={this.selectVisType}
          />
          <div className="yield-node--name">{`"${yieldName}"`}</div>
        </div>
        <div className="yield-node--visualization">{this.vis}</div>
      </>
    )
  }

  private get vis(): JSX.Element {
    const {visType} = this.state
    const {data} = this.props

    if (visType === VisType.Line) {
      return (
        <div className="yield-node--graph">
          <FluxGraph data={data} />
        </div>
      )
    }

    return <TimeMachineTables data={data} />
  }

  private selectVisType = (visType: VisType): void => {
    this.setState({visType})
  }
}

export default YieldNodeVis
