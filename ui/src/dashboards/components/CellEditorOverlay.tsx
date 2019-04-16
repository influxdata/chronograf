// Libraries
import React, {Component} from 'react'
import _ from 'lodash'
import {Subscribe} from 'unstated'

// Components
import {ErrorHandling} from 'src/shared/decorators/errors'
import TimeMachine from 'src/shared/components/TimeMachine/TimeMachine'
import CEOHeader from 'src/dashboards/components/CEOHeader'

// Utils
import {getDeep} from 'src/utils/wrappers'
import {TimeMachineContainer} from 'src/shared/utils/TimeMachineContainer'
import {initialStateFromCell} from 'src/shared/utils/timeMachine'

// Actions
import {editCellQueryStatus} from 'src/dashboards/actions'

// Constants
import {getCellTypeColors} from 'src/dashboards/constants/cellEditor'
import {IS_STATIC_LEGEND} from 'src/shared/constants'
import {STATIC_LEGEND} from 'src/dashboards/constants/cellEditor'

// Types
import * as QueriesModels from 'src/types/queries'
import * as SourcesModels from 'src/types/sources'
import {NotificationAction, TimeRange, CellType} from 'src/types'
import {Template} from 'src/types/tempVars'
import {
  Cell,
  Legend,
  CellQuery,
  NewDefaultCell,
  QueryType,
  DecimalPlaces,
  FieldOption,
  ThresholdType,
  TableOptions,
  NoteVisibility,
  Axes,
} from 'src/types/dashboards'
import {Links, ScriptStatus} from 'src/types/flux'
import {ColorString, ColorNumber} from 'src/types/colors'
import {createTimeRangeTemplates} from 'src/shared/utils/templates'

interface ConnectedProps {
  queryType: QueryType
  queryDrafts: CellQuery[]
  script: string
  draftScript: string
  onChangeScript: (script: string) => void
  type: CellType
  axes: Axes | null
  tableOptions: TableOptions
  fieldOptions: FieldOption[]
  timeFormat: string
  decimalPlaces: DecimalPlaces
  note: string
  noteVisibility: NoteVisibility
  thresholdsListColors: ColorNumber[]
  thresholdsListType: ThresholdType
  gaugeColors: ColorNumber[]
  lineColors: ColorString[]
  onResetTimeMachine: TimeMachineContainer['reset']
  ceoTimeRange: TimeRange
}

interface PassedProps {
  fluxLinks: Links
  sources: SourcesModels.Source[]
  notify: NotificationAction
  editQueryStatus: typeof editCellQueryStatus
  onCancel: () => void
  onSave: (cell: Cell | NewDefaultCell) => void
  source: SourcesModels.Source
  dashboardID: number
  queryStatus: QueriesModels.QueryStatus
  dashboardTemplates: Template[]
  cell: Cell | NewDefaultCell
  dashboardTimeRange: TimeRange
}

type Props = PassedProps & ConnectedProps

interface State {
  isStaticLegend: boolean
  scriptStatus: ScriptStatus
  draftCellName: string
}

@ErrorHandling
class CellEditorOverlay extends Component<Props, State> {
  private overlayRef: React.RefObject<HTMLDivElement> = React.createRef()

  public constructor(props: Props) {
    super(props)

    const legend = getDeep<Legend | null>(props, 'cell.legend', null)

    this.state = {
      isStaticLegend: IS_STATIC_LEGEND(legend),
      scriptStatus: {type: 'none', text: ''},
      draftCellName: props.cell.name,
    }
  }

  public componentDidMount() {
    const {cell, dashboardTimeRange, onResetTimeMachine} = this.props

    const initialState = {
      ...initialStateFromCell(cell),
      timeRange: dashboardTimeRange,
    }

    onResetTimeMachine(initialState)

    this.handleResetFocus()
  }

  public render() {
    const {
      cell,
      editQueryStatus,
      fluxLinks,
      notify,
      source,
      sources,
      queryStatus,
    } = this.props

    const {isStaticLegend} = this.state

    return (
      <div
        className="deceo--overlay"
        onKeyDown={this.handleKeyDown}
        tabIndex={0}
        ref={this.overlayRef}
      >
        <TimeMachine
          notify={notify}
          source={source}
          isInCEO={true}
          sources={sources}
          fluxLinks={fluxLinks}
          templates={this.ceoTemplates}
          editQueryStatus={editQueryStatus}
          onResetFocus={this.handleResetFocus}
          onToggleStaticLegend={this.handleToggleStaticLegend}
          isStaticLegend={isStaticLegend}
          queryStatus={queryStatus}
          onUpdateScriptStatus={this.handleUpdateScriptStatus}
        >
          {(activeEditorTab, onSetActiveEditorTab) => (
            <CEOHeader
              title={_.get(cell, 'name', '')}
              renameCell={this.handleRenameCell}
              onSave={this.handleSaveCell}
              onCancel={this.handleCancel}
              activeEditorTab={activeEditorTab}
              onSetActiveEditorTab={onSetActiveEditorTab}
              isSaveable={this.isSaveable}
            />
          )}
        </TimeMachine>
      </div>
    )
  }

  private get ceoTemplates() {
    const {dashboardTemplates, ceoTimeRange} = this.props
    const {dashboardTime, upperDashboardTime} = createTimeRangeTemplates(
      ceoTimeRange
    )
    return [...dashboardTemplates, dashboardTime, upperDashboardTime]

    return dashboardTemplates
  }

  private get isSaveable(): boolean {
    const {queryDrafts, type} = this.props

    if (type === 'note' || this.isFluxQuery) {
      return true
    }

    return queryDrafts.every(queryDraft => {
      const queryConfig = getDeep<QueriesModels.QueryConfig | null>(
        queryDraft,
        'queryConfig',
        null
      )

      return (
        (!!queryConfig.measurement &&
          !!queryConfig.database &&
          !!queryConfig.fields.length) ||
        !!queryConfig.rawText
      )
    })
  }

  private get isFluxQuery(): boolean {
    const {queryType} = this.props

    return queryType === QueryType.Flux
  }

  private handleUpdateScriptStatus = (scriptStatus: ScriptStatus): void => {
    this.setState({scriptStatus})
  }

  private handleRenameCell = (draftCellName: string): void => {
    this.setState({draftCellName})
  }

  private collectCell = (): Cell | NewDefaultCell => {
    const {
      cell,
      draftScript,
      queryDrafts,
      type,
      axes,
      tableOptions,
      fieldOptions,
      timeFormat,
      decimalPlaces,
      note,
      noteVisibility,
      thresholdsListColors,
      gaugeColors,
      lineColors,
    } = this.props
    const {isStaticLegend, draftCellName} = this.state

    let queries: CellQuery[] = queryDrafts

    if (this.isFluxQuery) {
      queries = [
        {
          query: draftScript,
          queryConfig: null,
          source: getDeep<string>(queryDrafts, '0.source', ''),
          type: QueryType.Flux,
        },
      ]
    }

    const colors = getCellTypeColors({
      cellType: type,
      gaugeColors,
      thresholdsListColors,
      lineColors,
    })

    const newCell = {
      ...cell,
      name: draftCellName,
      queries,
      colors,
      axes,
      tableOptions,
      fieldOptions,
      timeFormat,
      decimalPlaces,
      note,
      noteVisibility,
      type,
      legend: isStaticLegend ? STATIC_LEGEND : {},
    }

    return newCell
  }

  private handleSaveCell = () => {
    const {onSave, onResetTimeMachine} = this.props
    const cell = this.collectCell()

    onSave(cell)
    onResetTimeMachine()
  }

  private handleCancel = () => {
    const {onCancel, onResetTimeMachine} = this.props

    onCancel()
    onResetTimeMachine()
  }

  private handleKeyDown = e => {
    switch (e.key) {
      case 'Enter':
        if (!e.metaKey) {
          return
        } else if (e.target === this.overlayRef) {
          this.handleSaveCell()
        } else {
          e.target.blur()
          setTimeout(this.handleSaveCell, 50)
        }
        break
      case 'Escape':
        if (e.target === this.overlayRef) {
          this.props.onCancel()
        } else {
          const targetIsDropdown = e.target.classList[0] === 'dropdown'
          const targetIsButton = e.target.tagName === 'BUTTON'

          if (targetIsDropdown || targetIsButton) {
            return this.props.onCancel()
          }

          e.target.blur()
          this.handleResetFocus()
        }
        break
    }
  }

  private handleToggleStaticLegend = (isStaticLegend: boolean): void => {
    this.setState({isStaticLegend})
  }

  private handleResetFocus = () => {
    if (this.overlayRef.current) {
      this.overlayRef.current.focus()
    }
  }
}

const ConnectedCellEditorOverlay = (props: PassedProps) => {
  return (
    <Subscribe to={[TimeMachineContainer]}>
      {(container: TimeMachineContainer) => {
        const {state} = container
        return (
          <CellEditorOverlay
            {...props}
            queryType={state.queryType}
            queryDrafts={state.queryDrafts}
            script={state.script}
            draftScript={state.draftScript}
            onChangeScript={container.handleChangeScript}
            type={state.type}
            axes={state.axes}
            tableOptions={state.tableOptions}
            fieldOptions={state.fieldOptions}
            timeFormat={state.timeFormat}
            decimalPlaces={state.decimalPlaces}
            note={state.note}
            noteVisibility={state.noteVisibility}
            thresholdsListColors={state.thresholdsListColors}
            thresholdsListType={state.thresholdsListType}
            gaugeColors={state.gaugeColors}
            lineColors={state.lineColors}
            onResetTimeMachine={container.reset}
            ceoTimeRange={state.timeRange}
          />
        )
      }}
    </Subscribe>
  )
}

export default ConnectedCellEditorOverlay
