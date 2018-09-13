import React, {PureComponent} from 'react'

import FluxGraph from 'src/flux/components/FluxGraph'
import TimeMachineTables from 'src/flux/components/TimeMachineTables'
import {Radio} from 'src/reusable_ui'

import {ErrorHandling} from 'src/shared/decorators/errors'

import {FluxTable} from 'src/types'
import {VisualizationOptions} from 'src/types/dataExplorer'
import {DataType} from 'src/shared/constants'
import {getCellTypeColors} from 'src/dashboards/constants/cellEditor'
import {CellType} from 'src/types/dashboards'

interface Props {
  data: FluxTable[]
  yieldName: string
  visualizationOptions: VisualizationOptions
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
          <Radio>
            <Radio.Button
              id={`yield-node-${VisType.Table}`}
              value={VisType.Table}
              active={visType === VisType.Table}
              titleText="View data in a table"
              onClick={this.selectVisType}
            >
              Table
            </Radio.Button>
            <Radio.Button
              id={`yield-node-${VisType.Line}`}
              value={VisType.Line}
              active={visType === VisType.Line}
              titleText="View data as a Line Graph"
              onClick={this.selectVisType}
            >
              Line Graph
            </Radio.Button>
          </Radio>
          <div className="yield-node--name">{`"${yieldName}"`}</div>
        </div>
        <div className="yield-node--visualization">{this.vis}</div>
      </>
    )
  }

  private get vis(): JSX.Element {
    const {visType} = this.state
    const {data, visualizationOptions} = this.props

    const {
      tableOptions,
      timeFormat,
      decimalPlaces,
      fieldOptions,
      thresholdsListColors,
      gaugeColors,
      lineColors,
    } = visualizationOptions

    if (visType === VisType.Line) {
      return (
        <div className="yield-node--graph">
          <FluxGraph data={data} />
        </div>
      )
    }

    const colors = getCellTypeColors({
      cellType: CellType.Table,
      gaugeColors,
      thresholdsListColors,
      lineColors,
    })

    return (
      <TimeMachineTables
        data={data}
        dataType={DataType.flux}
        tableOptions={tableOptions}
        timeFormat={timeFormat}
        decimalPlaces={decimalPlaces}
        fieldOptions={fieldOptions}
        colors={colors}
      />
    )
  }

  private selectVisType = (visType: VisType): void => {
    this.setState({visType})
  }
}

export default YieldNodeVis
