// Libraries
import React, {Component} from 'react'
import _ from 'lodash'

// Components
import {ErrorHandling} from 'src/shared/decorators/errors'
import TimeMachine from 'src/shared/components/TimeMachine/TimeMachine'
import CEOHeader from 'src/dashboards/components/CEOHeader'

// Utils
import {getDeep} from 'src/utils/wrappers'
import {buildQuery} from 'src/utils/influxql'
import {getTimeRange} from 'src/dashboards/utils/cellGetters'

// Actions
import {
  QueryConfigActions,
  addQueryAsync,
  deleteQueryAsync,
  updateEditorTimeRange as updateEditorTimeRangeAction,
} from 'src/shared/actions/queries'
import {editCellQueryStatus} from 'src/dashboards/actions'

// Constants
import {TYPE_QUERY_CONFIG} from 'src/dashboards/constants'
import {getCellTypeColors} from 'src/dashboards/constants/cellEditor'
import {IS_STATIC_LEGEND} from 'src/shared/constants'

// Types
import * as ColorsModels from 'src/types/colors'
import * as DashboardsModels from 'src/types/dashboards'
import * as QueriesModels from 'src/types/queries'
import * as SourcesModels from 'src/types/sources'
import {Service, NotificationAction} from 'src/types'
import {Template} from 'src/types/tempVars'
import {NewDefaultCell} from 'src/types/dashboards'
import {UpdateScript} from 'src/flux/actions'
import {Links} from 'src/types/flux'

const staticLegend: DashboardsModels.Legend = {
  type: 'static',
  orientation: 'bottom',
}

interface VisualizationOptions {
  type: DashboardsModels.CellType
  axes: DashboardsModels.Axes | null
  tableOptions: DashboardsModels.TableOptions
  fieldOptions: DashboardsModels.FieldOption[]
  timeFormat: string
  decimalPlaces: DashboardsModels.DecimalPlaces
  note: string
  noteVisibility: DashboardsModels.CellNoteVisibility
  thresholdsListColors: ColorsModels.ColorNumber[]
  gaugeColors: ColorsModels.ColorNumber[]
  lineColors: ColorsModels.ColorString[]
}

interface Props {
  fluxLinks: Links
  script: string
  sources: SourcesModels.Source[]
  services: Service[]
  notify: NotificationAction
  editQueryStatus: typeof editCellQueryStatus
  onCancel: () => void
  onSave: (cell: DashboardsModels.Cell | NewDefaultCell) => void
  source: SourcesModels.Source
  dashboardID: number
  queryStatus: QueriesModels.QueryStatus
  templates: Template[]
  timeRange: QueriesModels.TimeRange
  thresholdsListType: string
  thresholdsListColors: ColorsModels.ColorNumber[]
  gaugeColors: ColorsModels.ColorNumber[]
  lineColors: ColorsModels.ColorString[]
  cell: DashboardsModels.Cell | NewDefaultCell
  queryDrafts: DashboardsModels.CellQuery[]
  renameCell: (name: string) => void
  updateQueryDrafts: (queryDrafts: DashboardsModels.CellQuery[]) => void
  queryConfigActions: QueryConfigActions
  addQuery: typeof addQueryAsync
  deleteQuery: typeof deleteQueryAsync
  updateScript: UpdateScript
  updateEditorTimeRange: typeof updateEditorTimeRangeAction
}

interface State {
  isStaticLegend: boolean
}

@ErrorHandling
class CellEditorOverlay extends Component<Props, State> {
  private overlayRef: React.RefObject<HTMLDivElement> = React.createRef()

  public constructor(props: Props) {
    super(props)

    const {cell} = props
    const legend = getDeep<DashboardsModels.Legend | null>(cell, 'legend', null)

    this.state = {
      isStaticLegend: IS_STATIC_LEGEND(legend),
    }
  }

  public componentDidMount() {
    this.handleResetFocus()
  }

  public render() {
    const {
      addQuery,
      cell,
      deleteQuery,
      editQueryStatus,
      fluxLinks,
      notify,
      onCancel,
      queryDrafts,
      renameCell,
      script,
      services,
      source,
      sources,
      templates,
      timeRange,
      updateEditorTimeRange,
      updateQueryDrafts,
      updateScript,
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
          fluxLinks={fluxLinks}
          notify={notify}
          script={script}
          queryDrafts={queryDrafts}
          updateScript={updateScript}
          editQueryStatus={editQueryStatus}
          templates={templates}
          timeRange={timeRange}
          source={source}
          onResetFocus={this.handleResetFocus}
          isInCEO={true}
          sources={sources}
          services={services}
          updateQueryDrafts={updateQueryDrafts}
          onToggleStaticLegend={this.handleToggleStaticLegend}
          isStaticLegend={isStaticLegend}
          queryConfigActions={this.props.queryConfigActions}
          addQuery={addQuery}
          deleteQuery={deleteQuery}
          updateEditorTimeRange={updateEditorTimeRange}
          visualizationOptions={this.visualizationOptions}
          queryStatus={queryStatus}
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
    )
  }

  private get isSaveable(): boolean {
    const {queryDrafts} = this.props
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

  private get visualizationOptions(): VisualizationOptions {
    const {cell, thresholdsListColors, gaugeColors, lineColors} = this.props

    const {
      type,
      tableOptions,
      fieldOptions,
      timeFormat,
      decimalPlaces,
      note,
      noteVisibility,
    } = cell
    const axes = _.get(cell, 'axes')

    return {
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
    }
  }

  private handleSaveCell = () => {
    const {isStaticLegend} = this.state
    const {
      queryDrafts,
      thresholdsListColors,
      gaugeColors,
      lineColors,
      cell,
    } = this.props

    const queries: DashboardsModels.CellQuery[] = queryDrafts.map(q => {
      const queryConfig = getDeep<QueriesModels.QueryConfig | null>(
        q,
        'queryConfig',
        null
      )
      const timeRange = getTimeRange(queryConfig)
      const source = getDeep<string | null>(
        queryConfig,
        'source.links.self',
        null
      )
      return {
        ...q,
        query:
          queryConfig.rawText ||
          buildQuery(TYPE_QUERY_CONFIG, timeRange, queryConfig),
        source,
      }
    })

    const colors = getCellTypeColors({
      cellType: cell.type,
      gaugeColors,
      thresholdsListColors,
      lineColors,
    })

    const newCell: DashboardsModels.Cell | NewDefaultCell = {
      ...cell,
      queries,
      colors,
      legend: isStaticLegend ? staticLegend : {},
    }

    this.props.onSave(newCell)
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
