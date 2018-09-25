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
import {buildQuery} from 'src/utils/influxql'
import {getTimeRange} from 'src/dashboards/utils/cellGetters'
import {TimeMachineContainer} from 'src/shared/utils/TimeMachineContainer'
import {intialStateFromCell} from 'src/shared/utils/timeMachine'

// Actions
import {editCellQueryStatus} from 'src/dashboards/actions'

// Constants
import {TYPE_QUERY_CONFIG} from 'src/dashboards/constants'
import {getCellTypeColors} from 'src/dashboards/constants/cellEditor'
import {IS_STATIC_LEGEND} from 'src/shared/constants'
import {STATIC_LEGEND} from 'src/dashboards/constants/cellEditor'

// Types
import * as QueriesModels from 'src/types/queries'
import * as SourcesModels from 'src/types/sources'
import {Service, NotificationAction, TimeRange} from 'src/types'
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
  services: Service[]
  notify: NotificationAction
  editQueryStatus: typeof editCellQueryStatus
  onCancel: () => void
  onSave: (cell: Cell | NewDefaultCell) => void
  source: SourcesModels.Source
  dashboardID: number
  queryStatus: QueriesModels.QueryStatus
  templates: Template[]
  cell: Cell | NewDefaultCell
  renameCell: (name: string) => void
  dashboardTimeRange: TimeRange
}

interface State {
  isStaticLegend: boolean
  status: ScriptStatus
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
      renameCell,
      services,
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
            services={services}
            onToggleStaticLegend={this.handleToggleStaticLegend}
            isStaticLegend={isStaticLegend}
            queryStatus={queryStatus}
            updateScriptStatus={this.updateScriptStatus}
          >
            {(activeEditorTab, onSetActiveEditorTab) => (
              <CEOHeader
                title={_.get(cell, 'name', '')}
                renameCell={renameCell}
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
    const {queryDrafts} = this.timeMachineContainer.state
    const {status} = this.state

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

  private collectCell = (): Cell | NewDefaultCell => {
    const {cell} = this.props
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
    const {isStaticLegend} = this.state

    let queries: CellQuery[]

    if (this.isFluxSource) {
      queries = [
        {
          query: script,
          queryConfig: null,
          source: getDeep<string>(queryDrafts, '0.source', ''),
          type: QueryType.Flux,
        },
      ]
    } else {
      queries = queryDrafts.map(q => {
        const queryConfig = getDeep<QueriesModels.QueryConfig | null>(
          q,
          'queryConfig',
          null
        )
        const timeRange = getTimeRange(queryConfig)
        const source = getDeep<string>(q, 'source', '')

        return {
          ...q,
          query:
            queryConfig.rawText ||
            buildQuery(TYPE_QUERY_CONFIG, timeRange, queryConfig),
          source,
          type: QueryType.InfluxQL,
        }
      })
    }

    const colors = getCellTypeColors({
      cellType: type,
      gaugeColors,
      thresholdsListColors,
      lineColors,
    })

    const newCell = {
      ...cell,
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
