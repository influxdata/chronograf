// Libraries
import React, {Component} from 'react'
import {connect} from 'react-redux'
import _ from 'lodash'

// Components
import GraphTypeSelector from 'src/dashboards/components/GraphTypeSelector'
import GaugeOptions from 'src/dashboards/components/GaugeOptions'
import SingleStatOptions from 'src/dashboards/components/SingleStatOptions'
import AxesOptions from 'src/dashboards/components/AxesOptions'
import TableOptions from 'src/dashboards/components/TableOptions'
import NoteOptions from 'src/dashboards/components/NoteOptions'
import CellNoteEditor from 'src/shared/components/TimeMachine/CellNoteEditor'
import Threesizer from 'src/shared/components/threesizer/Threesizer'

// Constants
import {HANDLE_VERTICAL} from 'src/shared/constants'

// Types
import {CellType} from 'src/types/dashboards'
import {buildDefaultYLabel} from 'src/shared/presenters'
import {ErrorHandling} from 'src/shared/decorators/errors'
import {Axes, Cell, QueryConfig} from 'src/types'

interface Props {
  cell: Cell
  Axes: Axes
  queryConfigs: QueryConfig[]
  staticLegend: boolean
  onResetFocus: () => void
  onToggleStaticLegend: (isStaticLegend: boolean) => void
}

interface State {
  defaultYLabel: string
}

@ErrorHandling
class DisplayOptions extends Component<Props, State> {
  constructor(props) {
    super(props)

    this.state = {
      defaultYLabel: this.defaultYLabel,
    }
  }

  public componentDidUpdate(prevProps) {
    const {queryConfigs} = prevProps

    if (!_.isEqual(queryConfigs[0], this.props.queryConfigs[0])) {
      this.setState({defaultYLabel: this.defaultYLabel})
    }
  }

  public render() {
    return (
      <Threesizer
        orientation={HANDLE_VERTICAL}
        divisions={this.threesizerDivisions}
      />
    )
  }

  private get threesizerDivisions() {
    const {cell} = this.props

    return [
      {
        name: 'Visualization Type',
        headerButtons: [],
        menuOptions: [],
        render: (__, pixels: number) => (
          <GraphTypeSelector parentPixels={pixels} />
        ),
        headerOrientation: HANDLE_VERTICAL,
      },
      {
        name: 'Customize',
        headerButtons: [],
        menuOptions: [],
        render: this.renderOptions,
        headerOrientation: HANDLE_VERTICAL,
      },
      {
        name: 'Add a Note',
        headerButtons: [],
        menuOptions: [],
        render: () => <CellNoteEditor note={cell.note} />,
        headerOrientation: HANDLE_VERTICAL,
      },
    ]
  }

  private renderOptions = (): JSX.Element => {
    const {
      cell,
      staticLegend,
      onToggleStaticLegend,
      onResetFocus,
      queryConfigs,
    } = this.props

    const {defaultYLabel} = this.state

    switch (cell.type) {
      case CellType.Gauge:
        return <GaugeOptions onResetFocus={onResetFocus} />
      case CellType.Note:
        return <NoteOptions />
      case CellType.SingleStat:
        return <SingleStatOptions onResetFocus={onResetFocus} />
      case CellType.Table:
        return (
          <TableOptions
            onResetFocus={onResetFocus}
            queryConfigs={queryConfigs}
          />
        )
      default:
        return (
          <AxesOptions
            staticLegend={staticLegend}
            defaultYLabel={defaultYLabel}
            decimalPlaces={cell.decimalPlaces}
            onToggleStaticLegend={onToggleStaticLegend}
          />
        )
    }
  }

  private get defaultYLabel(): string {
    const {queryConfigs} = this.props
    if (queryConfigs.length) {
      return buildDefaultYLabel(queryConfigs[0])
    }

    return ''
  }
}

const mstp = ({cellEditorOverlay}) => ({
  cell: cellEditorOverlay.cell,
  axes: cellEditorOverlay.cell.axes,
})

export default connect(mstp, null)(DisplayOptions)
