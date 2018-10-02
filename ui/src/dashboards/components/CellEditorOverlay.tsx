// Libraries
import React, {Component} from 'react'
import _ from 'lodash'
import {Provider} from 'unstated'

// Components
import {ErrorHandling} from 'src/shared/decorators/errors'
import TimeMachine from 'src/shared/components/TimeMachine/TimeMachine'
import CEOHeader from 'src/dashboards/components/CEOHeader'

// Utils
import {getDeep} from 'src/utils/wrappers'
import {TimeMachineContainer} from 'src/shared/utils/TimeMachineContainer'
import {intialStateFromCell} from 'src/shared/utils/timeMachine'

// Actions
import {editCellQueryStatus} from 'src/dashboards/actions'

// Constants
import {getCellTypeColors} from 'src/dashboards/constants/cellEditor'
import {IS_STATIC_LEGEND} from 'src/shared/constants'
import {STATIC_LEGEND} from 'src/dashboards/constants/cellEditor'

// Types
import * as QueriesModels from 'src/types/queries'
import * as SourcesModels from 'src/types/sources'
import {NotificationAction, TimeRange} from 'src/types'
import {Template} from 'src/types/tempVars'
import {
  Cell,
  Legend,
  CellQuery,
  NewDefaultCell,
  QueryType,
} from 'src/types/dashboards'
import {Links, ScriptStatus} from 'src/types/flux'

interface Props {
  fluxLinks: Links
  sources: SourcesModels.Source[]
  notify: NotificationAction
  editQueryStatus: typeof editCellQueryStatus
  onCancel: () => void
  onSave: (cell: Cell | NewDefaultCell) => void
  source: SourcesModels.Source
  dashboardID: number
  queryStatus: QueriesModels.QueryStatus
  templates: Template[]
  cell: Cell | NewDefaultCell
  dashboardTimeRange: TimeRange
}

interface State {
  isStaticLegend: boolean
  status: ScriptStatus
  draftCellName: string
}

@ErrorHandling
class CellEditorOverlay extends Component<Props, State> {
  private overlayRef: React.RefObject<HTMLDivElement> = React.createRef()
  private timeMachineContainer: TimeMachineContainer

  public constructor(props: Props) {
    super(props)

    this.timeMachineContainer = new TimeMachineContainer({
      ...intialStateFromCell(props.cell),
      timeRange: props.dashboardTimeRange,
    })

    const legend = getDeep<Legend | null>(props, 'cell.legend', null)

    this.state = {
      isStaticLegend: IS_STATIC_LEGEND(legend),
      status: {type: 'none', text: ''},
      draftCellName: props.cell.name,
    }
  }

  public componentDidMount() {
    this.handleResetFocus()
  }

  public render() {
    const {
      cell,
      editQueryStatus,
      fluxLinks,
      notify,
      onCancel,
      source,
      sources,
      templates,
      queryStatus,
    } = this.props

    const {isStaticLegend} = this.state

    return (
      <Provider inject={[this.timeMachineContainer]}>
        <div
          className="deceo--overlay"
          onKeyDown={this.handleKeyDown}
          tabIndex={0}
          ref={this.overlayRef}
        >
          <TimeMachine
            fluxLinks={fluxLinks}
            notify={notify}
            editQueryStatus={editQueryStatus}
            templates={templates}
            source={source}
            onResetFocus={this.handleResetFocus}
            isInCEO={true}
            sources={sources}
            onToggleStaticLegend={this.handleToggleStaticLegend}
            isStaticLegend={isStaticLegend}
            queryStatus={queryStatus}
            updateScriptStatus={this.updateScriptStatus}
          >
            {(activeEditorTab, onSetActiveEditorTab) => (
              <CEOHeader
                title={_.get(cell, 'name', '')}
                renameCell={this.handleRenameCell}
                onSave={this.handleSaveCell}
                onCancel={onCancel}
                activeEditorTab={activeEditorTab}
                onSetActiveEditorTab={onSetActiveEditorTab}
                isSaveable={this.isSaveable}
              />
            )}
          </TimeMachine>
        </div>
      </Provider>
    )
  }

  private get isSaveable(): boolean {
    const {queryDrafts, type} = this.timeMachineContainer.state
    const {status} = this.state

    if (type === 'note') {
      return true
    }

    if (this.isFluxSource) {
      return _.get(status, 'type', '') === 'success'
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

  private get isFluxSource(): boolean {
    const {queryDrafts} = this.timeMachineContainer.state

    if (getDeep<string>(queryDrafts, '0.type', '') === QueryType.Flux) {
      return true
    }
    return false
  }

  private updateScriptStatus = (status: ScriptStatus): void => {
    this.setState({status})
  }

  private handleRenameCell = (draftCellName: string): void => {
    this.setState({draftCellName})
  }

  private collectCell = (): Cell | NewDefaultCell => {
    const {cell} = this.props
    const {isStaticLegend, draftCellName} = this.state
    const {
      script,
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
    } = this.timeMachineContainer.state

    let queries: CellQuery[] = queryDrafts

    if (this.isFluxSource) {
      queries = [
        {
          query: script,
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
    const {onSave} = this.props
    const cell = this.collectCell()

    onSave(cell)
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

export default CellEditorOverlay
