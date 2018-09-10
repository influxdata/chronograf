// Libraries
import React, {PureComponent} from 'react'
import _ from 'lodash'

// Components
import Threesizer from 'src/shared/components/threesizer/Threesizer'
import Visualization from 'src/dashboards/components/Visualization'
import InfluxQLQueryMaker from 'src/shared/components/TimeMachine/InfluxQLQueryMaker'
import DisplayOptions from 'src/dashboards/components/DisplayOptions'
import TimeMachineBottom from 'src/shared/components/TimeMachine/TimeMachineBottom'
import TimeMachineControls from 'src/shared/components/TimeMachine/TimeMachineControls'
import KeyboardShortcuts from 'src/shared/components/KeyboardShortcuts'
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
} from 'src/flux/helpers/scriptBuilder'
import {AutoRefresher} from 'src/utils/AutoRefresher'
import buildQueries from 'src/utils/buildQueriesForGraphs'

// Actions
import {
  validateSuccess,
  fluxTimeSeriesError,
  fluxResponseTruncatedError,
} from 'src/shared/copy/notifications'
import {getSuggestions, getAST, getTimeSeries} from 'src/flux/apis'
import {updateSourceLink as updateSourceLinkAction} from 'src/data_explorer/actions/queries'

// Constants
import {HANDLE_HORIZONTAL} from 'src/shared/constants'
import {AUTO_GROUP_BY, PREDEFINED_TEMP_VARS} from 'src/shared/constants'
import {CEOTabs} from 'src/dashboards/constants'
import {builder, emptyAST} from 'src/flux/constants'

// Types
import {QueryConfigActions, QueryUpdateState} from 'src/shared/actions/queries'
import {
  TimeRange,
  QueryConfig,
  Template,
  Source,
  Service,
  CellQuery,
  NotificationAction,
  FluxTable,
  QueryStatus,
  Status,
  Query,
} from 'src/types'
import {SourceOption} from 'src/types/sources'
import {
  Suggestion,
  FlatBody,
  Links,
  InputArg,
  Context,
  DeleteFuncNodeArgs,
  Func,
  ScriptStatus,
  VisType,
} from 'src/types/flux'
import {
  Axes,
  CellType,
  FieldOption,
  TableOptions,
  ThresholdType,
  DecimalPlaces,
  NoteVisibility,
} from 'src/types/dashboards'
import {ColorNumber, ColorString} from 'src/types/colors'

export interface VisualizationOptions {
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
}

interface Props {
  fluxLinks: Links
  source: Source
  service?: Service
  script: string
  sources: Source[]
  isInCEO: boolean
  services: Service[]
  timeRange: TimeRange
  templates: Template[]
  isStaticLegend: boolean
  queryDrafts: CellQuery[]
  onResetFocus: () => void
  updateSourceLink?: typeof updateSourceLinkAction
  updateScript: (script: string, stateToUpdate: QueryUpdateState) => void
  queryConfigActions: QueryConfigActions
  notify: NotificationAction
  editQueryStatus: (
    queryID: string,
    status: Status,
    stateToUpdate: QueryUpdateState
  ) => void
  updateQueryDrafts: (
    queryDrafts: CellQuery[],
    stateToUpdate: QueryUpdateState
  ) => void
  onToggleStaticLegend: (isStaticLegend: boolean) => void
  children: (
    activeEditorTab: CEOTabs,
    onSetActiveEditorTab: (activeEditorTab: CEOTabs) => void
  ) => JSX.Element
  addQuery: (stateToUpdate: QueryUpdateState) => void
  deleteQuery: (queryID: string, stateToUpdate: QueryUpdateState) => void
  updateEditorTimeRange: (
    timeRange: TimeRange,
    stateToUpdate: QueryUpdateState
  ) => void
  visualizationOptions: VisualizationOptions
  manualRefresh?: number
  queryStatus: QueryStatus
  updateScriptStatus?: (status: ScriptStatus) => void
  updateService?: (service: Service) => void
}

interface Body extends FlatBody {
  id: string
}

interface State {
  body: Body[]
  script: string
  ast: object
  visType: VisType
  data: FluxTable[]
  status: ScriptStatus
  selectedSource: Source
  activeQueryIndex: number
  activeEditorTab: CEOTabs
  selectedService: Service
  useDynamicSource: boolean
  suggestions: Suggestion[]
  autoRefresher: AutoRefresher
  autoRefreshDuration: number // milliseconds
}

type ScriptFunc = (script: string) => void

export const FluxContext = React.createContext(undefined)

class TimeMachine extends PureComponent<Props, State> {
  private debouncedASTResponse: ScriptFunc

  constructor(props: Props) {
    super(props)

    const {queryDrafts} = props

    const useDynamicSource = getDeep(queryDrafts, '0.source', '') === ''

    this.state = {
      activeQueryIndex: 0,
      activeEditorTab: CEOTabs.Queries,
      selectedService: null,
      selectedSource: null,
      useDynamicSource,
      data: [],
      body: [],
      ast: null,
      suggestions: [],
      status: {
        type: 'none',
        text: '',
      },
      script: '',
      autoRefresher: new AutoRefresher(),
      autoRefreshDuration: 0,
      visType: VisType.Graph,
    }

    this.debouncedASTResponse = _.debounce(script => {
      this.getASTResponse(script, false)
    }, 250)
  }

  public async componentDidMount() {
    const {fluxLinks, script, updateService, isInCEO} = this.props
    const {autoRefresher, autoRefreshDuration} = this.state

    autoRefresher.poll(autoRefreshDuration)

    try {
      const suggestions = await getSuggestions(fluxLinks.suggestions)
      this.setState({suggestions})
    } catch (error) {
      console.error('Could not get function suggestions: ', error)
    }

    if (this.isFluxSource) {
      try {
        this.debouncedASTResponse(script)
        if (isInCEO) {
          updateService(this.service)
        }
      } catch (error) {
        console.error('Could not retrieve AST for script', error)
      }
      this.getTimeSeries()
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
    const {services, timeRange, templates, isInCEO} = this.props
    const {useDynamicSource, autoRefreshDuration} = this.state

    const horizontalDivisions = [
      {
        name: '',
        handleDisplay: 'none',
        headerButtons: [],
        menuOptions: [],
        render: () => this.visualization,
        headerOrientation: HANDLE_HORIZONTAL,
        size: 0.33,
      },
      {
        name: '',
        handlePixels: 8,
        headerButtons: [],
        menuOptions: [],
        render: () => this.editorBottom,
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
          visType={this.visType}
          source={this.source}
          toggleFlux={this.toggleFlux}
          sources={this.formattedSources}
          service={this.service}
          services={services}
          isFluxSource={this.isFluxSource}
          sourceSupportsFlux={this.sourceSupportsFlux}
          toggleVisType={this.toggleVisType}
          autoRefreshDuration={autoRefreshDuration}
          onChangeAutoRefreshDuration={this.handleChangeAutoRefreshDuration}
          onChangeService={this.handleChangeService}
          onSelectDynamicSource={this.handleSelectDynamicSource}
          isDynamicSourceSelected={useDynamicSource}
          timeRange={timeRange}
          updateEditorTimeRange={this.handleUpdateEditorTimeRange}
          isInCEO={isInCEO}
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

  private get visualization() {
    const {
      timeRange,
      templates,
      isStaticLegend,
      manualRefresh,
      visualizationOptions,
    } = this.props
    const {autoRefresher, data} = this.state

    return (
      <div className="deceo--top">
        <Visualization
          source={this.source}
          service={this.service}
          timeRange={timeRange}
          templates={templates}
          autoRefresher={autoRefresher}
          queries={this.queriesForVis}
          visType={this.visType}
          rawData={data}
          editQueryStatus={this.handleEditQueryStatus}
          staticLegend={isStaticLegend}
          manualRefresh={manualRefresh}
          editorLocation={this.stateToUpdate}
          {...visualizationOptions}
        />
      </div>
    )
  }

  private get editorBottom(): JSX.Element {
    return <TimeMachineBottom>{this.editorTab}</TimeMachineBottom>
  }

  private get editorTab() {
    const {
      onResetFocus,
      isStaticLegend,
      onToggleStaticLegend,
      visualizationOptions,
    } = this.props
    const {activeEditorTab} = this.state

    if (activeEditorTab === CEOTabs.Queries) {
      if (this.isFluxSource) {
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
        {...visualizationOptions}
      />
    )
  }

  private get visType(): VisType {
    return this.state.visType
  }

  private get pageHeader(): JSX.Element {
    const {children} = this.props
    const {activeEditorTab} = this.state

    return children(activeEditorTab, this.handleSetActiveEditorTab)
  }

  private get service(): Service {
    const {service, services, queryDrafts} = this.props
    const {selectedService} = this.state

    const queryDraft = _.get(queryDrafts, 0)
    const querySource = _.get(queryDraft, 'source', '')

    if (querySource.includes('service')) {
      const foundService = services.find(s => {
        return s.links.self === querySource
      })
      if (foundService) {
        return foundService
      }
    }

    if (service) {
      return service
    }

    return selectedService
  }

  private get source(): Source {
    const {source, sources, queryDrafts} = this.props
    const {selectedSource, useDynamicSource} = this.state
    // return current source
    if (useDynamicSource) {
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

  private get isFluxSource(): boolean {
    // TODO: Update once flux is no longer a separate service
    if (this.service) {
      return true
    }
    return false
  }

  private get sourceSupportsFlux(): boolean {
    const {services} = this.props
    const foundFluxForSource = services.find(service => {
      return service.sourceID === this.source.id
    })

    if (foundFluxForSource) {
      return true
    }
    return false
  }

  private get fluxBuilder(): JSX.Element {
    const {suggestions, body, status} = this.state
    const {script, notify} = this.props

    return (
      <FluxContext.Provider value={this.getContext}>
        <KeyboardShortcuts onControlEnter={this.getTimeSeries}>
          <FluxQueryBuilder
            body={body}
            script={script}
            status={status}
            notify={notify}
            service={this.service}
            suggestions={suggestions}
            onValidate={this.handleValidate}
            onAppendFrom={this.handleAppendFrom}
            onAppendJoin={this.handleAppendJoin}
            onChangeScript={this.handleChangeScript}
            onSubmitScript={this.handleSubmitScript}
            onDeleteBody={this.handleDeleteBody}
          />
        </KeyboardShortcuts>
      </FluxContext.Provider>
    )
  }

  private get influxQLBuilder(): JSX.Element {
    const {isInCEO, templates, timeRange} = this.props
    const {activeQueryIndex} = this.state

    return (
      <InfluxQLQueryMaker
        isInCEO={isInCEO}
        source={this.source}
        templates={templates}
        queries={this.queriesWorkingDraft}
        actions={this.queryConfigActions}
        timeRange={timeRange}
        onDeleteQuery={this.handleDeleteQuery}
        onAddQuery={this.handleAddQuery}
        activeQueryIndex={activeQueryIndex}
        activeQuery={this.activeQuery}
        setActiveQueryIndex={this.handleSetActiveQueryIndex}
        initialGroupByTime={AUTO_GROUP_BY}
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
    if (this.isFluxSource) {
      return [{text: script, id, queryConfig: null}]
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

    const queryText = _.get(activeQuery, 'rawText', '')
    const userDefinedTempVarsInQuery = this.findUserDefinedTempVarsInQuery(
      queryText,
      this.props.templates
    )

    if (!!userDefinedTempVarsInQuery.length) {
      activeQuery.isQuerySupportedByExplorer = false
    }

    return activeQuery
  }

  private handleUpdateEditorTimeRange = (timeRange: TimeRange) => {
    const {updateEditorTimeRange} = this.props

    updateEditorTimeRange(timeRange, this.stateToUpdate)
  }

  private handleEditQueryStatus = (queryID: string, status: Status) => {
    const {editQueryStatus} = this.props

    editQueryStatus(queryID, status, this.stateToUpdate)
  }

  private findUserDefinedTempVarsInQuery = (
    query: string,
    templates: Template[]
  ): Template[] => {
    return templates.filter((temp: Template) => {
      if (!query) {
        return false
      }
      const isPredefinedTempVar: boolean = !!PREDEFINED_TEMP_VARS.find(
        t => t === temp.tempVar
      )
      if (!isPredefinedTempVar) {
        return query.includes(temp.tempVar)
      }
      return false
    })
  }

  private get queryConfigActions() {
    const {queryConfigActions} = this.props

    return {...queryConfigActions, editRawTextAsync: this.handleEditRawText}
  }

  // The schema explorer is not built to handle user defined template variables
  // in the query in a clear manner. If they are being used, we indicate that in
  // the query config in order to disable the fields column down stream because
  // at this point the query string is disconnected from the schema explorer.
  private handleEditRawText = async (text: string): Promise<void> => {
    const {templates, updateQueryDrafts, queryDrafts} = this.props

    const id = this.activeQuery.id
    const url = getDeep<string>(this.source, 'links.queries', '')

    const userDefinedTempVarsInQuery = this.findUserDefinedTempVarsInQuery(
      text,
      templates
    )

    const isUsingUserDefinedTempVars: boolean = !!userDefinedTempVarsInQuery.length

    try {
      const newQueryConfig = await getConfig(url, id, text, templates)
      const nextQueries = queryDrafts.map(q => {
        const {queryConfig} = q
        if (queryConfig.id === id) {
          if (
            isUsingUserDefinedTempVars ||
            _.isEmpty(newQueryConfig.database)
          ) {
            return {
              ...q,
              queryConfig: {
                ...queryConfig,
                rawText: text,
                status: {loading: true},
                isQuerySupportedByExplorer: false,
              },
              query: text,
              text,
            }
          }

          let groupBy = newQueryConfig.groupBy
          if (text.indexOf(':interval:') >= 0) {
            groupBy = queryConfig.groupBy
          }

          return {
            ...q,
            queryConfig: {
              ...newQueryConfig,
              status: {loading: true},
              groupBy,
              isQuerySupportedByExplorer: true,
            },
            query: text,
            text,
          }
        }

        return q
      })
      updateQueryDrafts(nextQueries, this.stateToUpdate)
    } catch (error) {
      console.error(error)
    }
  }

  private updateQueryDraftsSource(selectedSource: Source) {
    const {queryDrafts, updateQueryDrafts} = this.props

    const queries: CellQuery[] = queryDrafts.map(q => {
      const queryConfig = _.get(q, 'queryConfig')
      return {
        ...q,
        queryConfig: {...queryConfig, source: selectedSource},
        source: getDeep<string>(selectedSource, 'links.self', ''),
      }
    })

    updateQueryDrafts(queries, this.stateToUpdate)
  }

  private handleChangeService = (
    selectedService: Service,
    selectedSource: Source
  ): void => {
    const {updateSourceLink, isInCEO} = this.props
    const useDynamicSource = false

    if (isInCEO) {
      this.props.updateService(selectedService)
    }

    if (updateSourceLink) {
      updateSourceLink(getDeep<string>(selectedService, 'links.self', ''))
    }

    this.updateQueryDraftsSource(selectedSource)
    this.setState({selectedService, selectedSource, useDynamicSource})
  }

  private handleSelectDynamicSource = (): void => {
    const useDynamicSource = true

    this.updateQueryDraftsSource(null)
    this.setState({useDynamicSource})
  }

  private handleAddQuery = () => {
    const {queryDrafts, addQuery} = this.props
    const newIndex = queryDrafts.length

    addQuery(this.stateToUpdate)
    this.handleSetActiveQueryIndex(newIndex)
  }

  private handleDeleteQuery = (index: number) => {
    const {queryDrafts, deleteQuery, isInCEO} = this.props
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

    const stateToUpdate = isInCEO ? QueryUpdateState.CEO : QueryUpdateState.DE
    deleteQuery(queryToDelete.id, stateToUpdate)
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
    return {
      onAddNode: this.handleAddNode,
      onChangeArg: this.handleChangeArg,
      onSubmitScript: this.handleSubmitScript,
      onChangeScript: this.handleChangeScript,
      onDeleteFuncNode: this.handleDeleteFuncNode,
      onGenerateScript: this.handleGenerateScript,
      onToggleYield: this.handleToggleYield,
      service: this.service,
      data: this.state.data,
      scriptUpToYield: this.handleScriptUpToYield,
    }
  }

  private updateScript(script: string) {
    this.props.updateScript(script, this.stateToUpdate)
  }

  private getASTResponse = async (script: string, update: boolean = true) => {
    const {fluxLinks, updateScriptStatus, isInCEO} = this.props

    if (!script) {
      this.updateScript(script)
      return this.setState({ast: emptyAST, body: []})
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
    } catch (error) {
      const status = parseError(error)

      this.setState({status})
      if (isInCEO) {
        updateScriptStatus(status)
      }
      return console.error('Could not parse AST', error)
    }
  }

  private getTimeSeries = async () => {
    const {script, fluxLinks, notify, updateScriptStatus, isInCEO} = this.props

    if (!script) {
      return
    }

    try {
      await getAST({url: fluxLinks.ast, body: script})
    } catch (error) {
      const status = parseError(error)

      this.setState({status})
      if (isInCEO) {
        updateScriptStatus(status)
      }
      return console.error('Could not parse AST', error)
    }

    try {
      const {tables, didTruncate} = await getTimeSeries(this.service, script)
      this.setState({data: tables})
      if (didTruncate) {
        notify(fluxResponseTruncatedError())
      }
    } catch (error) {
      this.setState({data: []})
      notify(fluxTimeSeriesError(error))
      console.error('Could not get timeSeries', error)
    }

    this.getASTResponse(script)
  }

  private handleSubmitScript = () => {
    this.getASTResponse(this.props.script)
  }

  private handleGenerateScript = (): void => {
    this.getASTResponse(this.bodyToScript)
  }

  private handleChangeArg = ({
    key,
    value,
    generate,
    funcID,
    declarationID = '',
    bodyID,
  }: InputArg): void => {
    const body = this.state.body.map(b => {
      if (b.id !== bodyID) {
        return b
      }

      if (declarationID) {
        const declarations = b.declarations.map(d => {
          if (d.id !== declarationID) {
            return d
          }

          const functions = this.editFuncArgs({
            funcs: d.funcs,
            funcID,
            key,
            value,
          })

          return {...d, funcs: functions}
        })

        return {...b, declarations}
      }

      const funcs = this.editFuncArgs({
        funcs: b.funcs,
        funcID,
        key,
        value,
      })

      return {...b, funcs}
    })

    this.setState({body}, () => {
      if (generate) {
        this.handleGenerateScript()
      }
    })
  }

  private editFuncArgs = ({funcs, funcID, key, value}): Func[] => {
    return funcs.map(f => {
      if (f.id !== funcID) {
        return f
      }

      const args = f.args.map(a => {
        if (a.key === key) {
          return {...a, value}
        }

        return a
      })

      return {...f, args}
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

  private handleChangeScript = (script: string): void => {
    this.debouncedASTResponse(script)
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

  private toggleVisType = (): void => {
    const newVisType =
      this.state.visType === VisType.Graph ? VisType.Table : VisType.Graph

    this.setState({visType: newVisType})
  }

  private toggleFlux = (): void => {
    const {services, updateService} = this.props

    if (this.isFluxSource) {
      this.setState({selectedService: null})
      updateService(null)
    } else {
      const foundFluxForSource = services.find(service => {
        return service.sourceID === this.source.id
      })

      if (foundFluxForSource) {
        updateService(foundFluxForSource)
      }
    }
  }
}

export default TimeMachine
