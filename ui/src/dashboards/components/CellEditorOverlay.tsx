import * as React from 'react'
import * as _ from 'lodash'
import * as uuidv4 from 'uuid/v4'

import ResizeContainer from 'shared/components/ResizeContainer'
import QueryMaker from 'dashboards/components/QueryMaker'
import Visualization from 'dashboards/components/Visualization'
import OverlayControls from 'dashboards/components/OverlayControls'
import DisplayOptions from 'dashboards/components/DisplayOptions'

import * as queryModifiers from 'utils/queryTransitions'

import defaultQueryConfig from 'utils/defaultQueryConfig'
import {buildQuery} from 'utils/influxql'
import {getQueryConfig} from 'shared/apis'

import {
  removeUnselectedTemplateValues,
  TYPE_QUERY_CONFIG,
} from 'dashboards/constants'
import {OVERLAY_TECHNOLOGY} from 'shared/constants/classNames'
import {MINIMUM_HEIGHTS, INITIAL_HEIGHTS} from 'data_explorer/constants'
import {AUTO_GROUP_BY} from 'shared/constants'

import {
  Axes,
  AutoRefresh,
  Cell,
  DashboardID,
  GraphType,
  QueryConfig,
  QueryStatus,
  Source,
  Template,
  TimeRange,
} from 'src/types'

export interface CEOProps {
  cell: Cell
  source: Source
  sources: Source[]
  templates: Template[]
  timeRange: TimeRange
  autoRefresh: AutoRefresh
  queryStatus: QueryStatus
  dashboardID: DashboardID
  onCancel: () => void
  onSave: (cell: Cell) => void
  editQueryStatus: () => void
}

export interface CEOState {
  cellWorkingName: string
  cellWorkingType: GraphType
  queriesWorkingDraft: QueryConfig[]
  activeQueryIndex: number
  isDisplayOptionsTabActive: boolean
  axes: Axes
}

class CellEditorOverlay extends React.Component<CEOProps, CEOState> {
  constructor(props: CEOProps) {
    super(props)

    const {cell: {name, type, queries, axes}, sources} = props

    let source = _.get(queries, ['0', 'source'], null)
    source = sources.find(s => s.links.self === source) || props.source

    const queriesWorkingDraft = _.cloneDeep(
      queries.map(({queryConfig}) => ({
        ...queryConfig,
        id: uuidv4(),
        source,
      }))
    )

    this.state = {
      cellWorkingName: name,
      cellWorkingType: type,
      queriesWorkingDraft,
      activeQueryIndex: 0,
      isDisplayOptionsTabActive: false,
      axes,
    }
  }

  private queryStateReducer = queryModifier => (queryID, ...payload) => {
    const {queriesWorkingDraft} = this.state
    const query = queriesWorkingDraft.find(q => q.id === queryID)

    const nextQuery = queryModifier(query, ...payload)

    const nextQueries = queriesWorkingDraft.map(
      q =>
        q.id === query.id
          ? {...nextQuery, source: this.nextSource(q, nextQuery)}
          : q
    )

    this.setState({queriesWorkingDraft: nextQueries})
  }

  private handleSetYAxisBoundMin = min => {
    const {axes} = this.state
    const {y: {bounds: [, max]}} = axes

    this.setState({
      axes: {...axes, y: {...axes.y, bounds: [min, max]}},
    })
  }

  private handleSetYAxisBoundMax = max => {
    const {axes} = this.state
    const {y: {bounds: [min]}} = axes

    this.setState({
      axes: {...axes, y: {...axes.y, bounds: [min, max]}},
    })
  }

  private handleSetLabel = label => {
    const {axes} = this.state

    this.setState({axes: {...axes, y: {...axes.y, label}}})
  }

  private handleSetPrefixSuffix = e => {
    const {axes} = this.state
    const {prefix, suffix} = e.target.form

    this.setState({
      axes: {
        ...axes,
        y: {
          ...axes.y,
          prefix: prefix.value,
          suffix: suffix.value,
        },
      },
    })
  }

  private handleAddQuery = () => {
    const {queriesWorkingDraft} = this.state
    const newIndex = queriesWorkingDraft.length

    this.setState({
      queriesWorkingDraft: [
        ...queriesWorkingDraft,
        defaultQueryConfig({id: uuidv4()}),
      ],
    })
    this.handleSetActiveQueryIndex(newIndex)
  }

  private handleDeleteQuery = index => {
    const nextQueries = this.state.queriesWorkingDraft.filter(
      (__, i) => i !== index
    )
    this.setState({queriesWorkingDraft: nextQueries})
  }

  private handleSaveCell = () => {
    const {
      queriesWorkingDraft,
      cellWorkingType: type,
      cellWorkingName: name,
      axes,
    } = this.state

    const {cell} = this.props

    const queries = queriesWorkingDraft.map(q => {
      const timeRange = q.range || {upper: null, lower: ':dashboardTime:'}
      const query = q.rawText || buildQuery(TYPE_QUERY_CONFIG, timeRange, q)

      return {
        queryConfig: q,
        query,
        source: _.get(q, ['source', 'links', 'self'], null),
      }
    })

    this.props.onSave({
      ...cell,
      name,
      type,
      queries,
      axes,
    })
  }

  private handleSelectGraphType = (graphType: GraphType) => () => {
    this.setState({cellWorkingType: graphType})
  }

  private handleClickDisplayOptionsTab = isDisplayOptionsTabActive => () => {
    this.setState({isDisplayOptionsTabActive})
  }

  private handleSetActiveQueryIndex = activeQueryIndex => {
    this.setState({activeQueryIndex})
  }

  private handleSetBase = base => () => {
    const {axes} = this.state

    this.setState({
      axes: {
        ...axes,
        y: {
          ...axes.y,
          base,
        },
      },
    })
  }

  private handleCellRename = newName => {
    this.setState({cellWorkingName: newName})
  }

  private handleSetScale = scale => () => {
    const {axes} = this.state

    this.setState({
      axes: {
        ...axes,
        y: {
          ...axes.y,
          scale,
        },
      },
    })
  }

  private handleSetQuerySource = source => {
    const queriesWorkingDraft = this.state.queriesWorkingDraft.map(q => ({
      ..._.cloneDeep(q),
      source,
    }))

    this.setState({queriesWorkingDraft})
  }

  private getActiveQuery = () => {
    const {queriesWorkingDraft, activeQueryIndex} = this.state
    const activeQuery = queriesWorkingDraft[activeQueryIndex]
    const defaultQuery = queriesWorkingDraft[0]

    return activeQuery || defaultQuery
  }

  private handleEditRawText = async (url, id, text) => {
    const templates = removeUnselectedTemplateValues(this.props.templates)

    // use this as the handler passed into fetchTimeSeries to update a query status
    try {
      const {data} = await getQueryConfig(url, [{query: text, id}], templates)
      const config = data.queries.find(q => q.id === id)
      const nextQueries = this.state.queriesWorkingDraft.map(
        q => (q.id === id ? {...config.queryConfig, source: q.source} : q)
      )
      this.setState({queriesWorkingDraft: nextQueries})
    } catch (error) {
      console.error(error)
    }
  }

  private formatSources = () =>
    this.props.sources.map(s => ({
      ...s,
      text: `${s.name} @ ${s.url}`,
    }))

  private findSelectedSource = () => {
    const {source} = this.props
    const sources = this.formatSources()
    const query = _.get(this.state.queriesWorkingDraft, 0, false)

    if (!query || !query.source) {
      const defaultSource = sources.find(s => s.id === source.id)
      return (defaultSource && defaultSource.text) || 'No sources'
    }

    const selected = sources.find(s => s.id === query.source.id)
    return (selected && selected.text) || 'No sources'
  }

  private getSource = () => {
    const {source, sources} = this.props
    const query = _.get(this.state.queriesWorkingDraft, 0, false)

    if (!query || !query.source) {
      return source
    }

    const querySource = sources.find(s => s.id === query.source.id)
    return querySource || source
  }

  private nextSource = (prevQuery, nextQuery) => {
    if (nextQuery.source) {
      return nextQuery.source
    }

    return prevQuery.source
  }

  public componentWillReceiveProps(nextProps: CEOProps) {
    const {status, queryID} = this.props.queryStatus
    const nextStatus = nextProps.queryStatus
    if (nextStatus.status && nextStatus.queryID) {
      if (nextStatus.queryID !== queryID || nextStatus.status !== status) {
        const nextQueries = this.state.queriesWorkingDraft.map(
          q => (q.id === queryID ? {...q, status: nextStatus.status} : q)
        )
        this.setState({queriesWorkingDraft: nextQueries})
      }
    }
  }

  public render() {
    const {
      onCancel,
      templates,
      timeRange,
      autoRefresh,
      editQueryStatus,
    } = this.props

    const {
      axes,
      activeQueryIndex,
      cellWorkingName,
      cellWorkingType,
      isDisplayOptionsTabActive,
      queriesWorkingDraft,
    } = this.state

    const queryActions = {
      editRawTextAsync: this.handleEditRawText,
      ..._.mapValues(queryModifiers, qm => this.queryStateReducer(qm)),
    }

    const isQuerySavable = query =>
      (!!query.measurement && !!query.database && !!query.fields.length) ||
      !!query.rawText

    return (
      <div className={OVERLAY_TECHNOLOGY}>
        <ResizeContainer
          containerClass="resizer--full-size"
          minTopHeight={MINIMUM_HEIGHTS.visualization}
          minBottomHeight={MINIMUM_HEIGHTS.queryMaker}
          initialTopHeight={INITIAL_HEIGHTS.visualization}
          initialBottomHeight={INITIAL_HEIGHTS.queryMaker}
        >
          <Visualization
            axes={axes}
            type={cellWorkingType}
            name={cellWorkingName}
            timeRange={timeRange}
            templates={templates}
            autoRefresh={autoRefresh}
            queryConfigs={queriesWorkingDraft}
            editQueryStatus={editQueryStatus}
            onCellRename={this.handleCellRename}
          />
          <CEOBottom>
            <OverlayControls
              onCancel={onCancel}
              queries={queriesWorkingDraft}
              sources={this.formatSources}
              onSave={this.handleSaveCell}
              selected={this.findSelectedSource()}
              onSetQuerySource={this.handleSetQuerySource}
              isSavable={queriesWorkingDraft.every(isQuerySavable)}
              isDisplayOptionsTabActive={isDisplayOptionsTabActive}
              onClickDisplayOptions={this.handleClickDisplayOptionsTab}
            />
            {isDisplayOptionsTabActive ? (
              <DisplayOptions
                axes={axes}
                onSetBase={this.handleSetBase}
                onSetLabel={this.handleSetLabel}
                onSetScale={this.handleSetScale}
                queryConfigs={queriesWorkingDraft}
                selectedGraphType={cellWorkingType}
                onSetPrefixSuffix={this.handleSetPrefixSuffix}
                onSelectGraphType={this.handleSelectGraphType}
                onSetYAxisBoundMin={this.handleSetYAxisBoundMin}
                onSetYAxisBoundMax={this.handleSetYAxisBoundMax}
              />
            ) : (
              <QueryMaker
                source={this.getSource()}
                templates={templates}
                queries={queriesWorkingDraft}
                actions={queryActions}
                autoRefresh={autoRefresh}
                timeRange={timeRange}
                onDeleteQuery={this.handleDeleteQuery}
                onAddQuery={this.handleAddQuery}
                activeQueryIndex={activeQueryIndex}
                activeQuery={this.getActiveQuery()}
                setActiveQueryIndex={this.handleSetActiveQueryIndex}
                initialGroupByTime={AUTO_GROUP_BY}
              />
            )}
          </CEOBottom>
        </ResizeContainer>
      </div>
    )
  }
}

const CEOBottom = ({children}) => (
  <div className="overlay-technology--editor">{children}</div>
)

export default CellEditorOverlay
