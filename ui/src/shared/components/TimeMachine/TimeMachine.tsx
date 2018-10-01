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
import FluxQueryBuilder from 'src/flux/components/FluxQueryBuilder'

// Utils
import {getConfig} from 'src/dashboards/utils/cellGetters'
import {getDeep} from 'src/utils/wrappers'
import {bodyNodes} from 'src/flux/helpers'
import {
  addNode,
  parseError,
  deleteBody,
  appendJoin,
  toggleYield,
  deleteFuncNode,
  getBodyToScript,
  scriptUpToYield,
  changeArg,
} from 'src/flux/helpers/scriptBuilder'
import {AutoRefresher} from 'src/utils/AutoRefresher'
import buildQueries from 'src/utils/buildQueriesForGraphs'
import {TimeMachineContainer} from 'src/shared/utils/TimeMachineContainer'
import {analyzeQueryFailed} from 'src/shared/copy/notifications'

// Actions
import {validateSuccess} from 'src/shared/copy/notifications'
import {getSuggestions, getAST} from 'src/flux/apis'
import {updateSourceLink as updateSourceLinkAction} from 'src/data_explorer/actions/queries'

// Constants
import {HANDLE_HORIZONTAL} from 'src/shared/constants'
import {CEOTabs} from 'src/dashboards/constants'
import {builder, emptyAST} from 'src/flux/constants'

// Types
import {QueryUpdateState} from 'src/shared/actions/queries'
import {
  TimeRange,
  QueryConfig,
  Template,
  Source,
  CellQuery,
  NotificationAction,
  FluxTable,
  QueryStatus,
  Status,
  Query,
  QueryType,
} from 'src/types'
import {SourceOption} from 'src/types/sources'
import {
  Suggestion,
  FlatBody,
  Links,
  InputArg,
  Context,
  DeleteFuncNodeArgs,
  ScriptStatus,
} from 'src/types/flux'

interface ConnectedProps {
  script: string
  queryDrafts: CellQuery[]
  onChangeScript: (script: string, stateToUpdate: QueryUpdateState) => void
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
  updateScriptStatus?: (status: ScriptStatus) => void
}

interface Body extends FlatBody {
  id: string
}

interface State {
  body: Body[]
  script: string
  lastScript: string
  ast: object
  data: FluxTable[]
  status: ScriptStatus
  selectedSource: Source
  activeQueryIndex: number
  activeEditorTab: CEOTabs
  isViewingRawData: boolean
  suggestions: Suggestion[]
  autoRefresher: AutoRefresher
  autoRefreshDuration: number // milliseconds
}

type ScriptFunc = (script: string) => void

export const FluxContext = React.createContext(undefined)

type Props = PassedProps & ConnectedProps

class TimeMachine extends PureComponent<Props, State> {
  private debouncedASTResponse: ScriptFunc
  private validAST: boolean = true

  constructor(props: Props) {
    super(props)

    this.state = {
      activeQueryIndex: 0,
      activeEditorTab: CEOTabs.Queries,
      selectedSource: null,
      data: [],
      body: [],
      ast: null,
      suggestions: [],
      status: {
        type: 'none',
        text: '',
      },
      script: this.props.script,
      lastScript: '',
      autoRefresher: new AutoRefresher(),
      autoRefreshDuration: 0,
      isViewingRawData: false,
    }

    this.debouncedASTResponse = _.debounce(script => {
      this.getASTResponse(script, false)
    }, 500)
  }

  public async componentDidMount() {
    const {fluxLinks, script} = this.props
    const {autoRefresher, autoRefreshDuration} = this.state

    autoRefresher.poll(autoRefreshDuration)

    try {
      const suggestions = await getSuggestions(fluxLinks.suggestions)
      this.setState({suggestions})
    } catch (error) {
      console.error('Could not get function suggestions: ', error)
    }

    if (this.isFluxSourceSelected) {
      try {
        this.debouncedASTResponse(script)
      } catch (error) {
        console.error('Could not retrieve AST for script', error)
      }
    }
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
          toggleFlux={this.toggleFlux}
          sources={this.formattedSources}
          isFluxSourceSelected={this.isFluxSourceSelected}
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
      if (this.isFluxSourceSelected) {
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

  private get isFluxSourceSelected(): boolean {
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
    const {suggestions, body, status, script} = this.state
    const {notify} = this.props

    return (
      <FluxContext.Provider value={this.getContext}>
        <FluxQueryBuilder
          body={body}
          script={script}
          status={status}
          notify={notify}
          source={this.source}
          suggestions={suggestions}
          onValidate={this.handleValidate}
          onAppendFrom={this.handleAppendFrom}
          onAppendJoin={this.handleAppendJoin}
          onChangeScript={this.handleChangeScript}
          onSubmitScript={this.handleSubmitScript}
          onDeleteBody={this.handleDeleteBody}
        />
      </FluxContext.Provider>
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

    if (this.isFluxSourceSelected) {
      if (!this.validAST) {
        return []
      }

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
    const type = this.isFluxSourceSelected ? QueryType.Flux : QueryType.InfluxQL
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

  // --------------- FLUX ----------------
  private get getContext(): Context {
    const {timeRange} = this.props
    return {
      onAddNode: this.handleAddNode,
      onChangeArg: this.handleChangeArg,
      onSubmitScript: this.handleSubmitScript,
      onChangeScript: this.handleChangeScript,
      onDeleteFuncNode: this.handleDeleteFuncNode,
      onGenerateScript: this.handleGenerateScript,
      onToggleYield: this.handleToggleYield,
      data: this.state.data,
      scriptUpToYield: this.handleScriptUpToYield,
      source: this.source,
      queries: this.queriesForVis,
      timeRange,
    }
  }

  private updateScript(script: string) {
    this.props.onChangeScript(script, this.stateToUpdate)
  }

  private getASTResponse = async (
    script: string,
    update: boolean = true,
    force: boolean = true
  ): Promise<void> => {
    if (script.trim() === this.state.lastScript.trim() && !force) {
      return
    }

    const {fluxLinks, updateScriptStatus, isInCEO} = this.props
    this.setState({script, lastScript: script})

    if (!script) {
      this.updateScript(script)
      this.setState({ast: emptyAST, body: []})
      this.validAST = true
    }

    try {
      const ast = await getAST({url: fluxLinks.ast, body: script})

      if (update) {
        this.updateScript(script)
      }

      const body = bodyNodes(ast, this.state.suggestions)
      const status = {type: 'success', text: ''}

      this.setState({ast, body, status})
      if (isInCEO) {
        updateScriptStatus(status)
      }

      this.validAST = true
    } catch (error) {
      const status = parseError(error)

      this.setState({status})
      if (isInCEO) {
        updateScriptStatus(status)
      }

      this.validAST = false
    }
  }

  private handleSubmitScript = () => {
    this.getASTResponse(this.state.script, true, false)
  }

  private handleGenerateScript = (): void => {
    this.getASTResponse(this.bodyToScript)
  }

  private handleChangeArg = (input: InputArg): void => {
    const {body} = this.state
    const newBody = changeArg(input, body)

    this.setState({body: newBody}, () => {
      if (input.generate) {
        this.handleGenerateScript()
      }
    })
  }

  private get bodyToScript(): string {
    return getBodyToScript(this.state.body)
  }

  private handleAppendFrom = (): void => {
    const {script} = this.props
    let newScript = script.trim()
    const from = builder.NEW_FROM

    if (!newScript) {
      this.getASTResponse(from)
      return
    }

    newScript = `${script.trim()}\n\n${from}\n\n`
    this.getASTResponse(newScript)
  }

  private handleAppendJoin = (): void => {
    const {script} = this.props
    const newScript = appendJoin(script)

    this.getASTResponse(newScript)
  }

  private handleChangeScript = async (script: string): Promise<void> => {
    await this.getASTResponse(script, false)
    this.updateScript(script)
  }

  private handleAddNode = (
    name: string,
    bodyID: string,
    declarationID: string
  ): void => {
    const script = addNode(name, bodyID, declarationID, this.state.body)

    this.getASTResponse(script)
  }

  private handleDeleteBody = (bodyID: string): void => {
    const script = deleteBody(bodyID, this.state.body)
    this.getASTResponse(script)
  }

  private handleScriptUpToYield = (
    bodyID: string,
    declarationID: string,
    funcNodeIndex: number,
    isYieldable: boolean
  ): string => {
    return scriptUpToYield(
      bodyID,
      declarationID,
      funcNodeIndex,
      isYieldable,
      this.state.body
    )
  }

  private handleToggleYield = (
    bodyID: string,
    declarationID: string,
    funcNodeIndex: number
  ): void => {
    const script = toggleYield(
      bodyID,
      declarationID,
      funcNodeIndex,
      this.state.body
    )

    this.getASTResponse(script)
  }

  private handleDeleteFuncNode = (ids: DeleteFuncNodeArgs): void => {
    const script = deleteFuncNode(ids, this.state.body)

    this.getASTResponse(script)
  }

  private handleValidate = async () => {
    const {fluxLinks, notify, script, updateScriptStatus, isInCEO} = this.props

    try {
      const ast = await getAST({url: fluxLinks.ast, body: script})
      const body = bodyNodes(ast, this.state.suggestions)
      const status = {type: 'success', text: ''}
      notify(validateSuccess())

      this.setState({ast, body, status})
      if (isInCEO) {
        updateScriptStatus(status)
      }
    } catch (error) {
      const status = parseError(error)
      this.setState({status})

      if (isInCEO) {
        updateScriptStatus(status)
      }
      return console.error('Could not parse AST', error)
    }
  }

  private handleToggleIsViewingRawData = (): void => {
    this.setState({isViewingRawData: !this.state.isViewingRawData})
  }

  private toggleFlux = (): void => {
    if (this.isFluxSourceSelected) {
      this.updateQueryDraftsSource(null, QueryType.InfluxQL)
    } else {
      this.updateQueryDraftsSource(null, QueryType.Flux)
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
