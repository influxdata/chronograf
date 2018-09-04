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

// Actions
import {
  updateDecimalPlaces,
  updateGaugeColors,
  updateAxes,
  updateTableOptions,
  updateFieldOptions,
  updateTimeFormat,
  updateVisType,
  updateNote,
  updateNoteVisibility,
  updateThresholdsListColors,
  updateThresholdsListType,
} from 'src/shared/actions/visualizations'

// Constants
import {HANDLE_VERTICAL} from 'src/shared/constants'
import {QueryUpdateState} from 'src/shared/actions/queries'
import {DEFAULT_AXES} from 'src/dashboards/constants/cellEditor'

// Types
import {
  CellType,
  FieldOption,
  ThresholdType,
  DecimalPlaces,
  NewDefaultCell,
  CellNoteVisibility,
  TableOptions as TableOptionsInterface,
} from 'src/types/dashboards'
import {buildDefaultYLabel} from 'src/shared/presenters'
import {ErrorHandling} from 'src/shared/decorators/errors'
import {Axes, Cell, QueryConfig} from 'src/types'
import {ColorNumber} from 'src/types/colors'
import {VisualizationOptions} from 'src/shared/components/TimeMachine/TimeMachine'

interface Props extends VisualizationOptions {
  cell: Cell | NewDefaultCell
  queryConfigs: QueryConfig[]
  staticLegend: boolean
  stateToUpdate: QueryUpdateState
  onResetFocus: () => void
  onToggleStaticLegend: (isStaticLegend: boolean) => void
  onUpdateDecimalPlaces: typeof updateDecimalPlaces
  onUpdateGaugeColors: typeof updateGaugeColors
  onUpdateAxes: typeof updateAxes
  onUpdateTableOptions: typeof updateTableOptions
  onUpdateFieldOptions: typeof updateFieldOptions
  onUpdateTimeFormat: typeof updateTimeFormat
  onUpdateVisType: typeof updateVisType
  onUpdateNote: typeof updateNote
  onUpdateNoteVisibility: typeof updateNoteVisibility
  onUpdateThresholdsListColors: typeof updateThresholdsListColors
  onUpdateThresholdsListType: typeof updateThresholdsListType
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
    return [
      {
        name: 'Visualization Type',
        headerButtons: [],
        menuOptions: [],
        render: () => (
          <GraphTypeSelector
            type={this.visType}
            onUpdateVisType={this.handleUpdateVisType}
          />
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
        render: () => (
          <CellNoteEditor
            note={this.note}
            noteVisibility={this.noteVisibility}
            onUpdateNote={this.handleUpdateNote}
            onUpdateNoteVisibility={this.handleUpdateNoteVisibility}
          />
        ),
        headerOrientation: HANDLE_VERTICAL,
      },
    ]
  }

  private renderOptions = (): JSX.Element => {
    const {
      staticLegend,
      onToggleStaticLegend,
      onResetFocus,
      queryConfigs,
    } = this.props

    const {defaultYLabel} = this.state

    switch (this.visType) {
      case CellType.Gauge:
        return (
          <GaugeOptions
            onResetFocus={onResetFocus}
            axes={this.axes}
            decimalPlaces={this.decimalPlaces}
            gaugeColors={this.gaugeColors}
            onUpdateAxes={this.handleUpdateAxes}
            onUpdateDecimalPlaces={this.handleUpdateDecimalPlaces}
            onUpdateGaugeColors={this.handleUpdateGaugeColors}
          />
        )
      case CellType.Note:
        return <NoteOptions />
      case CellType.SingleStat:
        return (
          <SingleStatOptions
            onResetFocus={onResetFocus}
            axes={this.axes}
            decimalPlaces={this.decimalPlaces}
            onUpdateAxes={this.handleUpdateAxes}
            thresholdsListType={this.thresholdListType}
            thresholdsListColors={this.thresholdListColors}
            onUpdateDecimalPlaces={this.handleUpdateDecimalPlaces}
            onUpdateThresholdsListType={this.handleUpdateThresholdsListType}
            onUpdateThresholdsListColors={this.handleUpdateThresholdsListColors}
          />
        )
      case CellType.Table:
        return (
          <TableOptions
            onResetFocus={onResetFocus}
            queryConfigs={queryConfigs}
            timeFormat={this.timeFormat}
            tableOptions={this.tableOptions}
            fieldOptions={this.fieldOptions}
            decimalPlaces={this.decimalPlaces}
            thresholdsListType={this.thresholdListType}
            thresholdsListColors={this.thresholdListColors}
            onUpdateDecimalPlaces={this.handleUpdateDecimalPlaces}
            onUpdateFieldOptions={this.handleUpdateFieldOptions}
            onUpdateTableOptions={this.handleUpdateTableOptions}
            onUpdateTimeFormat={this.handleUpdateTimeFormat}
            onUpdateThresholdsListColors={this.handleUpdateThresholdsListColors}
            onUpdateThresholdsListType={this.handleUpdateThresholdsListType}
          />
        )
      default:
        return (
          <AxesOptions
            axes={this.axes}
            type={this.visType}
            staticLegend={staticLegend}
            defaultYLabel={defaultYLabel}
            decimalPlaces={this.decimalPlaces}
            onUpdateAxes={this.handleUpdateAxes}
            onToggleStaticLegend={onToggleStaticLegend}
            onUpdateDecimalPlaces={this.handleUpdateDecimalPlaces}
          />
        )
    }
  }

  private get stateToUpdate(): QueryUpdateState {
    return this.props.stateToUpdate
  }

  private get visType(): CellType {
    const {type} = this.props
    return type
  }

  private get axes(): Axes {
    const {axes} = this.props
    return axes || DEFAULT_AXES
  }

  private get decimalPlaces(): DecimalPlaces {
    const {decimalPlaces} = this.props
    return decimalPlaces
  }

  private get gaugeColors(): ColorNumber[] {
    const {gaugeColors} = this.props
    return gaugeColors
  }

  private get tableOptions(): TableOptionsInterface {
    const {tableOptions} = this.props
    return tableOptions
  }

  private get fieldOptions(): FieldOption[] {
    const {fieldOptions} = this.props
    return fieldOptions
  }

  private get timeFormat(): string {
    const {timeFormat} = this.props
    return timeFormat
  }

  private get note(): string {
    const {note} = this.props
    return note || ''
  }

  private get noteVisibility(): CellNoteVisibility {
    const {noteVisibility} = this.props
    return noteVisibility
  }

  private get thresholdListColors(): ColorNumber[] {
    const {thresholdsListColors} = this.props
    return thresholdsListColors
  }

  private get thresholdListType(): ThresholdType {
    const {thresholdsListType} = this.props
    return thresholdsListType
  }

  private get defaultYLabel(): string {
    const {queryConfigs} = this.props
    if (queryConfigs.length) {
      return buildDefaultYLabel(queryConfigs[0])
    }

    return ''
  }

  private handleUpdateAxes = (axes: Axes): void => {
    const {onUpdateAxes} = this.props

    onUpdateAxes(axes, this.stateToUpdate)
  }

  private handleUpdateDecimalPlaces = (decimalPlaces: DecimalPlaces): void => {
    const {onUpdateDecimalPlaces} = this.props

    onUpdateDecimalPlaces(decimalPlaces, this.stateToUpdate)
  }

  private handleUpdateGaugeColors = (gaugeColors: ColorNumber[]): void => {
    const {onUpdateGaugeColors} = this.props

    onUpdateGaugeColors(gaugeColors, this.stateToUpdate)
  }

  private handleUpdateTimeFormat = (timeFormat: string): void => {
    const {onUpdateTimeFormat} = this.props

    onUpdateTimeFormat(timeFormat, this.stateToUpdate)
  }

  private handleUpdateTableOptions = (
    tableOptions: TableOptionsInterface
  ): void => {
    const {onUpdateTableOptions} = this.props

    onUpdateTableOptions(tableOptions, this.stateToUpdate)
  }

  private handleUpdateFieldOptions = (fieldOptions: FieldOption[]): void => {
    const {onUpdateFieldOptions} = this.props

    onUpdateFieldOptions(fieldOptions, this.stateToUpdate)
  }

  private handleUpdateVisType = (type: CellType): void => {
    const {onUpdateVisType} = this.props

    onUpdateVisType(type, this.stateToUpdate)
  }

  private handleUpdateNote = (note: string): void => {
    const {onUpdateNote} = this.props

    onUpdateNote(note, this.stateToUpdate)
  }

  private handleUpdateNoteVisibility = (
    visibility: CellNoteVisibility
  ): void => {
    const {onUpdateNoteVisibility} = this.props

    onUpdateNoteVisibility(visibility, this.stateToUpdate)
  }

  private handleUpdateThresholdsListColors = (colors: ColorNumber[]): void => {
    const {onUpdateThresholdsListColors} = this.props

    onUpdateThresholdsListColors(colors, this.stateToUpdate)
  }

  private handleUpdateThresholdsListType = (type: ThresholdType): void => {
    const {onUpdateThresholdsListType} = this.props

    onUpdateThresholdsListType(type, this.stateToUpdate)
  }
}

const mdtp = {
  onUpdateGaugeColors: updateGaugeColors,
  onUpdateAxes: updateAxes,
  onUpdateDecimalPlaces: updateDecimalPlaces,
  onUpdateTableOptions: updateTableOptions,
  onUpdateFieldOptions: updateFieldOptions,
  onUpdateTimeFormat: updateTimeFormat,
  onUpdateVisType: updateVisType,
  onUpdateNote: updateNote,
  onUpdateNoteVisibility: updateNoteVisibility,
  onUpdateThresholdsListColors: updateThresholdsListColors,
  onUpdateThresholdsListType: updateThresholdsListType,
}

export default connect(null, mdtp)(DisplayOptions)
