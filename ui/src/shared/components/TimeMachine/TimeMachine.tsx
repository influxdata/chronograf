// Libraries
import React, {PureComponent} from 'react'
import _ from 'lodash'
import {Subscribe} from 'unstated'

// Components
import Threesizer from 'src/shared/components/threesizer/Threesizer'
import InfluxQLQueryMaker from 'src/shared/components/TimeMachine/InfluxQLQueryMaker'
import DisplayOptions from 'src/dashboards/components/DisplayOptions'
import TimeMachineBottom from 'src/shared/components/TimeMachine/TimeMachineBottom'
import TimeMachineControls from 'src/shared/components/TimeMachine/TimeMachineControls'
import TimeMachineVisualization from 'src/shared/components/TimeMachine/TimeMachineVisualization'
import FluxQueryMaker from 'src/shared/components/TimeMachine/FluxQueryMaker'

// Utils
import {getConfig} from 'src/dashboards/utils/cellGetters'
import {getDeep} from 'src/utils/wrappers'
import {AutoRefresher} from 'src/utils/AutoRefresher'
import buildQueries from 'src/utils/buildQueriesForGraphs'
import {TimeMachineContainer} from 'src/shared/utils/TimeMachineContainer'
import {analyzeQueryFailed} from 'src/shared/copy/notifications'

// Actions
import {updateSourceLink as updateSourceLinkAction} from 'src/data_explorer/actions/queries'

// Constants
import {HANDLE_HORIZONTAL} from 'src/shared/constants'
import {CEOTabs} from 'src/dashboards/constants'

// Types
import {
  TimeRange,
  QueryConfig,
  Template,
  Source,
  CellQuery,
  NotificationAction,
  QueryStatus,
  Status,
  Query,
  QueryType,
  QueryUpdateState,
} from 'src/types'
import {SourceOption} from 'src/types/sources'
import {Links, ScriptStatus} from 'src/types/flux'

interface ConnectedProps {
  script: string
  draftScript: string
  queryDrafts: CellQuery[]
  onChangeScript: (script: string) => void
  onChangeDraftScript: (draftScript: string) => void
  onUpdateQueryDrafts: TimeMachineContainer['handleUpdateQueryDrafts']
  onAddQuery: () => void
  onDeleteQuery: (queryID: string) => void
  timeRange: TimeRange
  onUpdateTimeRange: (timeRange: TimeRange) => void
}

interface PassedProps {
  fluxLinks: Links
  source: Source
  sources: Source[]
  isInCEO: boolean
  templates: Template[]
  isStaticLegend: boolean
  onResetFocus: () => void
  updateSourceLink?: typeof updateSourceLinkAction
  notify: NotificationAction
  editQueryStatus: (
    queryID: string,
    status: Status,
    stateToUpdate: QueryUpdateState
  ) => void
  onToggleStaticLegend: (isStaticLegend: boolean) => void
  children: (
    activeEditorTab: CEOTabs,
    onSetActiveEditorTab: (activeEditorTab: CEOTabs) => void
  ) => JSX.Element
  manualRefresh?: number
  queryStatus: QueryStatus
  onUpdateScriptStatus?: (status: ScriptStatus) => void
}

interface State {
  selectedSource: Source
  activeQueryIndex: number
  activeEditorTab: CEOTabs
  isViewingRawData: boolean
  autoRefresher: AutoRefresher
  autoRefreshDuration: number // milliseconds
}

type Props = PassedProps & ConnectedProps

class TimeMachine extends PureComponent<Props, State> {
  constructor(props: Props) {
    super(props)

    this.state = {
      activeQueryIndex: 0,
      activeEditorTab: CEOTabs.Queries,
      selectedSource: null,
      autoRefresher: new AutoRefresher(),
      autoRefreshDuration: 0,
      isViewingRawData: false,
    }
  }

  public async componentDidMount() {
    const {autoRefresher, autoRefreshDuration} = this.state

    autoRefresher.poll(autoRefreshDuration)
  }

  public componentWillUnmount() {
    const {autoRefresher} = this.state

    autoRefresher.stopPolling()
  }

  public componentDidUpdate(__, prevState) {
    const {autoRefresher, autoRefreshDuration} = this.state

    if (autoRefreshDuration !== prevState.autoRefreshDuration) {
      autoRefresher.poll(autoRefreshDuration)
    }
  }

  public render() {
    const {timeRange, templates, script} = this.props
    const {autoRefreshDuration, isViewingRawData} = this.state

    const horizontalDivisions = [
      {
        name: '',
        handleDisplay: 'none',
        headerButtons: [],
        menuOptions: [],
        render: this.renderVisualization,
        headerOrientation: HANDLE_HORIZONTAL,
        size: 0.33,
      },
      {
        name: '',
        handlePixels: 8,
        headerButtons: [],
        menuOptions: [],
        render: this.renderEditorBottom,
        headerOrientation: HANDLE_HORIZONTAL,
        size: 0.67,
      },
    ]

    return (
      <div className="deceo">
        {this.pageHeader}
        <TimeMachineControls
          queries={this.queriesWorkingDraft}
          templates={templates}
          source={this.source}
          toggleFluxOn={this.toggleFluxOn}
          toggleFluxOff={this.toggleFluxOff}
          sources={this.formattedSources}
          isFluxSelected={this.isFluxSelected}
          isViewingRawData={isViewingRawData}
          script={script}
          sourceSupportsFlux={this.sourceSupportsFlux}
          toggleIsViewingRawData={this.handleToggleIsViewingRawData}
          autoRefreshDuration={autoRefreshDuration}
          onChangeAutoRefreshDuration={this.handleChangeAutoRefreshDuration}
          onChangeSource={this.handleChangeSource}
          onSelectDynamicSource={this.handleSelectDynamicSource}
          isDynamicSourceSelected={this.useDynamicSource}
          timeRange={timeRange}
          updateEditorTimeRange={this.handleUpdateEditorTimeRange}
        />
        <div className="deceo--container">
          <Threesizer
            orientation={HANDLE_HORIZONTAL}
            divisions={horizontalDivisions}
          />
        </div>
      </div>
    )
  }

  private renderVisualization = () => {
    const {templates, isStaticLegend, manualRefresh} = this.props
    const {autoRefresher, isViewingRawData} = this.state

    return (
      <TimeMachineVisualization
        source={this.source}
        autoRefresher={autoRefresher}
        queries={this.queriesForVis}
        templates={templates}
        onEditQueryStatus={this.handleEditQueryStatus}
        staticLegend={isStaticLegend}
        manualRefresh={manualRefresh}
        editorLocation={this.stateToUpdate}
        showRawFluxData={isViewingRawData}
      />
    )
  }

  private renderEditorBottom = (): JSX.Element => {
    return <TimeMachineBottom>{this.editorTab}</TimeMachineBottom>
  }

  private get editorTab() {
    const {onResetFocus, isStaticLegend, onToggleStaticLegend} = this.props
    const {activeEditorTab} = this.state

    if (activeEditorTab === CEOTabs.Queries) {
      if (this.isFluxSelected) {
        return this.fluxBuilder
      }

      return this.influxQLBuilder
    }

    return (
      <DisplayOptions
        queryConfigs={this.queriesWorkingDraft}
        onToggleStaticLegend={onToggleStaticLegend}
        staticLegend={isStaticLegend}
        onResetFocus={onResetFocus}
        stateToUpdate={this.stateToUpdate}
      />
    )
  }

  private get pageHeader(): JSX.Element {
    const {children} = this.props
    const {activeEditorTab} = this.state

    return children(activeEditorTab, this.handleSetActiveEditorTab)
  }

  private get source(): Source {
    const {source, sources, queryDrafts} = this.props
    const {selectedSource} = this.state
    // return current source
    if (this.useDynamicSource) {
      return source
    }

    if (selectedSource) {
      return selectedSource
    }

    const queryDraft = _.get(queryDrafts, 0)
    const querySource = _.get(queryDraft, 'source')

    if (!queryDraft || !querySource) {
      return source
    }

    const foundSource = sources.find(s => s.links.self === querySource)
    if (foundSource) {
      return foundSource
    }

    return source
  }

  private get queriesWorkingDraft(): QueryConfig[] {
    const {queryDrafts, queryStatus} = this.props

    if (!queryDrafts || !queryDrafts.length) {
      return []
    }

    return queryDrafts.map(q => {
      if (queryStatus.queryID === q.id) {
        return {
          ...q.queryConfig,
          source: this.source,
          status: queryStatus.status,
        }
      }

      return {
        ...q.queryConfig,
        source: this.source,
      }
    })
  }

  private get formattedSources(): SourceOption[] {
    const {sources} = this.props
    return sources.map(s => ({
      ...s,
      text: `${s.name} @ ${s.url}`,
    }))
  }

  private get isFluxSelected(): boolean {
    const {queryDrafts} = this.props
    return (
      !!(getDeep<string>(queryDrafts, '0.type', '') === QueryType.Flux) &&
      this.sourceSupportsFlux
    )
  }

  private get sourceSupportsFlux(): boolean {
    return !!getDeep<string>(this.source, 'links.flux', null)
  }

  private get fluxBuilder(): JSX.Element {
    const {
      script,
      onChangeScript,
      onChangeDraftScript,
      fluxLinks,
      onUpdateScriptStatus,
      notify,
    } = this.props

    return (
      <FluxQueryMaker
        notify={notify}
        source={this.source}
        script={script}
        onChangeScript={onChangeScript}
        onChangeDraftScript={onChangeDraftScript}
        links={fluxLinks}
        onUpdateStatus={onUpdateScriptStatus}
      />
    )
  }

  private get influxQLBuilder(): JSX.Element {
    const {templates} = this.props
    const {activeQueryIndex} = this.state

    return (
      <InfluxQLQueryMaker
        source={this.source}
        templates={templates}
        queries={this.queriesWorkingDraft}
        onDeleteQuery={this.handleDeleteQuery}
        onAddQuery={this.handleAddQuery}
        activeQueryIndex={activeQueryIndex}
        activeQuery={this.activeQuery}
        setActiveQueryIndex={this.handleSetActiveQueryIndex}
        onEditRawText={this.handleEditRawText}
      />
    )
  }

  private get stateToUpdate(): QueryUpdateState {
    const {isInCEO} = this.props

    return isInCEO ? QueryUpdateState.CEO : QueryUpdateState.DE
  }

  private get queriesForVis(): Query[] {
    const {script, timeRange, queryDrafts} = this.props
    const id = _.get(queryDrafts, 'id', '')

    if (this.isFluxSelected) {
      // there will only be one flux query
      const fluxQuery: Query[] = [
        {text: script, id, queryConfig: null, type: QueryType.Flux},
      ]
      return fluxQuery
    }

    return buildQueries(this.queriesWorkingDraft, timeRange)
  }

  private get activeQuery(): QueryConfig {
    const {activeQueryIndex} = this.state

    const queriesWorkingDraft = this.queriesWorkingDraft
    const activeQuery = _.get(
      queriesWorkingDraft,
      activeQueryIndex,
      queriesWorkingDraft[0]
    )

    return activeQuery
  }

  private handleUpdateEditorTimeRange = (timeRange: TimeRange) => {
    const {onUpdateTimeRange} = this.props

    onUpdateTimeRange(timeRange)
  }

  private handleEditQueryStatus = (queryID: string, status: Status) => {
    const {editQueryStatus} = this.props

    editQueryStatus(queryID, status, this.stateToUpdate)
  }

  private get useDynamicSource(): boolean {
    const {queryDrafts} = this.props

    return getDeep(queryDrafts, '0.source', '') === ''
  }

  private handleEditRawText = async (text: string): Promise<void> => {
    const {templates, onUpdateQueryDrafts, queryDrafts, notify} = this.props
    const activeID = this.activeQuery.id
    const url: string = _.get(this.source, 'links.queries', '')

    let newQueryConfig

    try {
      newQueryConfig = await getConfig(url, activeID, text, templates)
    } catch {
      notify(analyzeQueryFailed)
      return
    }

    const updatedQueryDrafts = queryDrafts.map(query => {
      if (query.queryConfig.id !== activeID) {
        return query
      }

      return {
        ...query,
        text,
        query: text,
        queryConfig: {
          ...newQueryConfig,
          rawText: text,
          status: {loading: true},
        },
      }
    })

    onUpdateQueryDrafts(updatedQueryDrafts)
  }

  private updateQueryDraftsSource(selectedSource: Source, type: string) {
    const {queryDrafts, onUpdateQueryDrafts} = this.props

    const queries: CellQuery[] = queryDrafts.map(q => {
      const queryConfig = _.get(q, 'queryConfig')
      return {
        ...q,
        queryConfig: {...queryConfig, source: selectedSource},
        source: getDeep<string>(selectedSource, 'links.self', ''),
        type,
      }
    }) as CellQuery[]

    onUpdateQueryDrafts(queries)
  }

  private handleChangeSource = (
    selectedSource: Source,
    type: QueryType
  ): void => {
    const {updateSourceLink} = this.props

    if (updateSourceLink) {
      updateSourceLink(getDeep<string>(selectedSource, 'links.self', ''))
    }

    this.updateQueryDraftsSource(selectedSource, type)
    this.setState({selectedSource})
  }

  private handleSelectDynamicSource = (): void => {
    const type = this.isFluxSelected ? QueryType.Flux : QueryType.InfluxQL
    this.updateQueryDraftsSource(null, type)
  }

  private handleAddQuery = () => {
    const {queryDrafts, onAddQuery} = this.props
    const newIndex = queryDrafts.length

    onAddQuery()
    this.handleSetActiveQueryIndex(newIndex)
  }

  private handleDeleteQuery = (index: number) => {
    const {queryDrafts, onDeleteQuery} = this.props
    const queryToDelete = queryDrafts.find((__, i) => i === index)
    const activeQueryId = this.activeQuery.id
    const activeQueryIndex = queryDrafts.findIndex(
      query => query.id === activeQueryId
    )
    let newIndex: number
    if (index === activeQueryIndex) {
      if (index - 1 >= 0) {
        newIndex = index - 1
      } else if (index - 1 < 0 && queryDrafts.length > 1) {
        newIndex = index
      } else {
        newIndex = null
      }
    } else if (activeQueryIndex < index) {
      newIndex = activeQueryIndex
    } else {
      newIndex = activeQueryIndex - 1
    }

    this.handleSetActiveQueryIndex(newIndex)

    onDeleteQuery(queryToDelete.id)
  }

  private handleChangeAutoRefreshDuration = (autoRefreshDuration: number) => {
    this.setState({autoRefreshDuration})
  }

  private handleSetActiveQueryIndex = (activeQueryIndex): void => {
    this.setState({activeQueryIndex})
  }

  private handleSetActiveEditorTab = (tabName: CEOTabs): void => {
    this.setState({activeEditorTab: tabName})
  }

  private handleToggleIsViewingRawData = (): void => {
    this.setState({isViewingRawData: !this.state.isViewingRawData})
  }

  private toggleFluxOn = (): void => {
    if (!this.isFluxSelected) {
      const newQueryType = QueryType.Flux
      const source = this.useDynamicSource ? null : this.source
      this.updateQueryDraftsSource(source, newQueryType)
    }
  }

  private toggleFluxOff = (): void => {
    if (this.isFluxSelected) {
      const newQueryType = QueryType.InfluxQL
      const source = this.useDynamicSource ? null : this.source
      this.updateQueryDraftsSource(source, newQueryType)
    }
  }
}

const ConnectedTimeMachine = (props: PassedProps) => {
  return (
    <Subscribe to={[TimeMachineContainer]}>
      {(container: TimeMachineContainer) => {
        const {state} = container

        return (
          <TimeMachine
            {...props}
            script={state.script}
            queryDrafts={state.queryDrafts}
            timeRange={state.timeRange}
            onUpdateTimeRange={container.handleUpdateTimeRange}
            onChangeScript={container.handleChangeScript}
            onChangeDraftScript={container.handleUpdateDraftScript}
            onUpdateQueryDrafts={container.handleUpdateQueryDrafts}
            onAddQuery={container.handleAddQuery}
            onDeleteQuery={container.handleDeleteQuery}
          />
        )
      }}
    </Subscribe>
  )
}

export default ConnectedTimeMachine
