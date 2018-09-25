import React, {PureComponent} from 'react'

import FluxGraph from 'src/flux/components/FluxGraph'
import TimeMachineTables from 'src/flux/components/TimeMachineTables'
import {Radio} from 'src/reusable_ui'

import {ErrorHandling} from 'src/shared/decorators/errors'

import {FluxTable} from 'src/types'
import {DataType} from 'src/shared/constants'
import {getCellTypeColors} from 'src/dashboards/constants/cellEditor'
import {
  CellType,
  Axes,
  TableOptions,
  FieldOption,
  DecimalPlaces,
} from 'src/types/dashboards'
import {ColorNumber, ColorString} from 'src/types/colors'

interface Props {
  data: FluxTable[]
  yieldName: string
  axes: Axes | null
  tableOptions: TableOptions
  fieldOptions: FieldOption[]
  timeFormat: string
  decimalPlaces: DecimalPlaces
  thresholdsListColors: ColorNumber[]
  gaugeColors: ColorNumber[]
  lineColors: ColorString[]
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
    const {
      data,
      tableOptions,
      timeFormat,
      decimalPlaces,
      fieldOptions,
      thresholdsListColors,
      gaugeColors,
      lineColors,
    } = this.props

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
